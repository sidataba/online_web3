// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenLaunchpad
 * @dev ICO/IDO platform for launching new tokens
 */
contract TokenLaunchpad is ReentrancyGuard, Ownable {
    enum SaleStatus {
        Pending,
        Active,
        Ended,
        Cancelled
    }

    struct TokenSale {
        address tokenAddress;
        address creator;
        uint256 tokenPrice; // Price in wei per token
        uint256 tokensAvailable;
        uint256 tokensSold;
        uint256 minPurchase;
        uint256 maxPurchase;
        uint256 startTime;
        uint256 endTime;
        uint256 softCap;
        uint256 hardCap;
        uint256 totalRaised;
        SaleStatus status;
        bool fundsWithdrawn;
    }

    uint256 public saleCounter;
    uint256 public platformFee = 200; // 2% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(uint256 => TokenSale) public sales;
    mapping(uint256 => mapping(address => uint256)) public purchases;

    event SaleCreated(
        uint256 indexed saleId,
        address indexed tokenAddress,
        address indexed creator,
        uint256 tokenPrice
    );

    event TokensPurchased(
        uint256 indexed saleId,
        address indexed buyer,
        uint256 amount,
        uint256 cost
    );

    event SaleEnded(uint256 indexed saleId, uint256 totalRaised);
    event FundsWithdrawn(uint256 indexed saleId, address indexed creator, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Create a new token sale
     */
    function createSale(
        address tokenAddress,
        uint256 tokenPrice,
        uint256 tokensAvailable,
        uint256 minPurchase,
        uint256 maxPurchase,
        uint256 startTime,
        uint256 endTime,
        uint256 softCap,
        uint256 hardCap
    ) external returns (uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenPrice > 0, "Price must be > 0");
        require(tokensAvailable > 0, "Tokens must be > 0");
        require(startTime < endTime, "Invalid time range");
        require(hardCap > softCap, "Hard cap must be > soft cap");

        // Transfer tokens to launchpad
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokensAvailable);

        uint256 saleId = saleCounter++;

        sales[saleId] = TokenSale({
            tokenAddress: tokenAddress,
            creator: msg.sender,
            tokenPrice: tokenPrice,
            tokensAvailable: tokensAvailable,
            tokensSold: 0,
            minPurchase: minPurchase,
            maxPurchase: maxPurchase,
            startTime: startTime,
            endTime: endTime,
            softCap: softCap,
            hardCap: hardCap,
            totalRaised: 0,
            status: SaleStatus.Pending,
            fundsWithdrawn: false
        });

        emit SaleCreated(saleId, tokenAddress, msg.sender, tokenPrice);
        return saleId;
    }

    /**
     * @dev Purchase tokens
     */
    function purchaseTokens(uint256 saleId) external payable nonReentrant {
        TokenSale storage sale = sales[saleId];

        require(sale.status == SaleStatus.Active || block.timestamp >= sale.startTime, "Sale not active");
        require(block.timestamp < sale.endTime, "Sale ended");
        require(msg.value >= sale.minPurchase, "Below minimum purchase");
        require(purchases[saleId][msg.sender] + msg.value <= sale.maxPurchase, "Exceeds max purchase");

        uint256 tokenAmount = (msg.value * 1e18) / sale.tokenPrice;
        require(tokenAmount <= sale.tokensAvailable - sale.tokensSold, "Insufficient tokens");

        sale.status = SaleStatus.Active;
        sale.tokensSold += tokenAmount;
        sale.totalRaised += msg.value;
        purchases[saleId][msg.sender] += msg.value;

        // Transfer tokens to buyer
        IERC20(sale.tokenAddress).transfer(msg.sender, tokenAmount);

        emit TokensPurchased(saleId, msg.sender, tokenAmount, msg.value);

        // Check if hard cap reached
        if (sale.totalRaised >= sale.hardCap) {
            sale.status = SaleStatus.Ended;
            emit SaleEnded(saleId, sale.totalRaised);
        }
    }

    /**
     * @dev End sale
     */
    function endSale(uint256 saleId) external {
        TokenSale storage sale = sales[saleId];
        require(msg.sender == sale.creator || msg.sender == owner(), "Not authorized");
        require(sale.status == SaleStatus.Active, "Sale not active");
        require(block.timestamp >= sale.endTime || sale.totalRaised >= sale.hardCap, "Cannot end yet");

        sale.status = SaleStatus.Ended;

        // Return unsold tokens to creator
        uint256 unsoldTokens = sale.tokensAvailable - sale.tokensSold;
        if (unsoldTokens > 0) {
            IERC20(sale.tokenAddress).transfer(sale.creator, unsoldTokens);
        }

        emit SaleEnded(saleId, sale.totalRaised);
    }

    /**
     * @dev Withdraw raised funds
     */
    function withdrawFunds(uint256 saleId) external nonReentrant {
        TokenSale storage sale = sales[saleId];
        require(msg.sender == sale.creator, "Not creator");
        require(sale.status == SaleStatus.Ended, "Sale not ended");
        require(!sale.fundsWithdrawn, "Already withdrawn");
        require(sale.totalRaised >= sale.softCap, "Soft cap not reached");

        sale.fundsWithdrawn = true;

        uint256 fee = (sale.totalRaised * platformFee) / FEE_DENOMINATOR;
        uint256 creatorAmount = sale.totalRaised - fee;

        payable(sale.creator).transfer(creatorAmount);
        payable(owner()).transfer(fee);

        emit FundsWithdrawn(saleId, sale.creator, creatorAmount);
    }

    /**
     * @dev Get sale details
     */
    function getSale(uint256 saleId)
        external
        view
        returns (
            address tokenAddress,
            address creator,
            uint256 tokenPrice,
            uint256 tokensAvailable,
            uint256 tokensSold,
            uint256 totalRaised,
            uint256 startTime,
            uint256 endTime,
            SaleStatus status
        )
    {
        TokenSale storage sale = sales[saleId];
        return (
            sale.tokenAddress,
            sale.creator,
            sale.tokenPrice,
            sale.tokensAvailable,
            sale.tokensSold,
            sale.totalRaised,
            sale.startTime,
            sale.endTime,
            sale.status
        );
    }

    /**
     * @dev Get user purchase amount
     */
    function getUserPurchase(uint256 saleId, address user) external view returns (uint256) {
        return purchases[saleId][user];
    }
}
