// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title P2PEscrow
 * @dev Secure peer-to-peer trading with escrow and dispute resolution
 */
contract P2PEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum TradeStatus {
        Created,
        Funded,
        Completed,
        Disputed,
        Cancelled,
        Refunded
    }

    struct Trade {
        uint256 id;
        address seller;
        address buyer;
        address token;
        uint256 amount;
        uint256 price; // Price in wei (ETH)
        TradeStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        bool sellerConfirmed;
        bool buyerConfirmed;
    }

    uint256 public tradeCounter;
    uint256 public platformFee = 100; // 1% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant TRADE_TIMEOUT = 7 days;

    mapping(uint256 => Trade) public trades;
    mapping(address => uint256) public pendingWithdrawals;

    event TradeCreated(
        uint256 indexed tradeId,
        address indexed seller,
        address indexed buyer,
        address token,
        uint256 amount,
        uint256 price
    );

    event TradeFunded(uint256 indexed tradeId, address indexed buyer);
    event TradeCompleted(uint256 indexed tradeId);
    event TradeDisputed(uint256 indexed tradeId, address indexed initiator);
    event TradeCancelled(uint256 indexed tradeId);
    event TradeRefunded(uint256 indexed tradeId);

    /**
     * @dev Create a new trade
     */
    function createTrade(
        address buyer,
        address token,
        uint256 amount,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(buyer != address(0) && buyer != msg.sender, "Invalid buyer");
        require(amount > 0, "Amount must be > 0");
        require(price > 0, "Price must be > 0");

        // Transfer tokens from seller to escrow
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 tradeId = tradeCounter++;
        trades[tradeId] = Trade({
            id: tradeId,
            seller: msg.sender,
            buyer: buyer,
            token: token,
            amount: amount,
            price: price,
            status: TradeStatus.Created,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + TRADE_TIMEOUT,
            sellerConfirmed: false,
            buyerConfirmed: false
        });

        emit TradeCreated(tradeId, msg.sender, buyer, token, amount, price);
        return tradeId;
    }

    /**
     * @dev Buyer funds the trade with ETH
     */
    function fundTrade(uint256 tradeId) external payable nonReentrant {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.Created, "Invalid trade status");
        require(msg.sender == trade.buyer, "Not the buyer");
        require(msg.value >= trade.price, "Insufficient payment");
        require(block.timestamp <= trade.expiresAt, "Trade expired");

        trade.status = TradeStatus.Funded;

        // Refund excess payment
        if (msg.value > trade.price) {
            payable(msg.sender).transfer(msg.value - trade.price);
        }

        emit TradeFunded(tradeId, msg.sender);
    }

    /**
     * @dev Complete trade (both parties confirm)
     */
    function completeTrade(uint256 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.Funded, "Trade not funded");
        require(
            msg.sender == trade.seller || msg.sender == trade.buyer,
            "Not authorized"
        );

        if (msg.sender == trade.seller) {
            trade.sellerConfirmed = true;
        } else {
            trade.buyerConfirmed = true;
        }

        // Complete trade if both confirmed
        if (trade.sellerConfirmed && trade.buyerConfirmed) {
            trade.status = TradeStatus.Completed;

            // Calculate fees
            uint256 fee = (trade.price * platformFee) / FEE_DENOMINATOR;
            uint256 sellerAmount = trade.price - fee;

            // Transfer tokens to buyer
            IERC20(trade.token).safeTransfer(trade.buyer, trade.amount);

            // Transfer payment to seller
            pendingWithdrawals[trade.seller] += sellerAmount;
            pendingWithdrawals[address(this)] += fee;

            emit TradeCompleted(tradeId);
        }
    }

    /**
     * @dev Dispute a trade
     */
    function disputeTrade(uint256 tradeId) external {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.Funded, "Trade not funded");
        require(
            msg.sender == trade.seller || msg.sender == trade.buyer,
            "Not authorized"
        );

        trade.status = TradeStatus.Disputed;
        emit TradeDisputed(tradeId, msg.sender);
    }

    /**
     * @dev Cancel trade (only if not funded or expired)
     */
    function cancelTrade(uint256 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(msg.sender == trade.seller, "Not the seller");
        require(
            trade.status == TradeStatus.Created ||
            block.timestamp > trade.expiresAt,
            "Cannot cancel"
        );

        trade.status = TradeStatus.Cancelled;

        // Return tokens to seller
        IERC20(trade.token).safeTransfer(trade.seller, trade.amount);

        // Refund buyer if funded
        if (trade.status == TradeStatus.Funded) {
            pendingWithdrawals[trade.buyer] += trade.price;
        }

        emit TradeCancelled(tradeId);
    }

    /**
     * @dev Refund trade (admin function for disputes)
     */
    function refundTrade(uint256 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.Disputed, "Not disputed");

        trade.status = TradeStatus.Refunded;

        // Return tokens to seller
        IERC20(trade.token).safeTransfer(trade.seller, trade.amount);

        // Refund buyer
        pendingWithdrawals[trade.buyer] += trade.price;

        emit TradeRefunded(tradeId);
    }

    /**
     * @dev Withdraw accumulated funds
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Get trade details
     */
    function getTrade(uint256 tradeId)
        external
        view
        returns (
            address seller,
            address buyer,
            address token,
            uint256 amount,
            uint256 price,
            TradeStatus status,
            uint256 createdAt,
            uint256 expiresAt,
            bool sellerConfirmed,
            bool buyerConfirmed
        )
    {
        Trade storage trade = trades[tradeId];
        return (
            trade.seller,
            trade.buyer,
            trade.token,
            trade.amount,
            trade.price,
            trade.status,
            trade.createdAt,
            trade.expiresAt,
            trade.sellerConfirmed,
            trade.buyerConfirmed
        );
    }

    /**
     * @dev Check if trade is expired
     */
    function isTradeExpired(uint256 tradeId) external view returns (bool) {
        return block.timestamp > trades[tradeId].expiresAt;
    }
}
