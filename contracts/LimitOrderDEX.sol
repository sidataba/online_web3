// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LimitOrderDEX
 * @dev Decentralized exchange with limit order functionality
 */
contract LimitOrderDEX is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum OrderType {
        Buy,
        Sell
    }

    enum OrderStatus {
        Active,
        Filled,
        Cancelled
    }

    struct LimitOrder {
        uint256 id;
        address trader;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 price; // Price ratio (amountOut / amountIn)
        OrderType orderType;
        OrderStatus status;
        uint256 createdAt;
        uint256 expiresAt;
    }

    uint256 public orderCounter;
    uint256 public tradingFee = 30; // 0.3% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(uint256 => LimitOrder) public orders;
    mapping(address => uint256[]) public userOrders;

    event OrderCreated(
        uint256 indexed orderId,
        address indexed trader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 price
    );

    event OrderFilled(
        uint256 indexed orderId,
        address indexed filler,
        uint256 amountIn,
        uint256 amountOut
    );

    event OrderCancelled(uint256 indexed orderId);

    /**
     * @dev Create a limit order
     */
    function createLimitOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 expiresAt
    ) external nonReentrant returns (uint256) {
        require(tokenIn != tokenOut, "Same token");
        require(amountIn > 0 && amountOut > 0, "Invalid amounts");
        require(expiresAt > block.timestamp, "Invalid expiry");

        // Transfer tokens to contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 orderId = orderCounter++;
        uint256 price = (amountOut * 1e18) / amountIn;

        orders[orderId] = LimitOrder({
            id: orderId,
            trader: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            price: price,
            orderType: OrderType.Sell, // Simplified
            status: OrderStatus.Active,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });

        userOrders[msg.sender].push(orderId);

        emit OrderCreated(orderId, msg.sender, tokenIn, tokenOut, amountIn, price);
        return orderId;
    }

    /**
     * @dev Fill a limit order
     */
    function fillOrder(uint256 orderId) external nonReentrant {
        LimitOrder storage order = orders[orderId];

        require(order.status == OrderStatus.Active, "Order not active");
        require(block.timestamp <= order.expiresAt, "Order expired");

        order.status = OrderStatus.Filled;

        // Calculate fee
        uint256 feeAmount = (order.amountOut * tradingFee) / FEE_DENOMINATOR;
        uint256 amountAfterFee = order.amountOut - feeAmount;

        // Transfer tokens
        IERC20(order.tokenOut).safeTransferFrom(msg.sender, order.trader, amountAfterFee);
        IERC20(order.tokenOut).safeTransferFrom(msg.sender, address(this), feeAmount);
        IERC20(order.tokenIn).safeTransfer(msg.sender, order.amountIn);

        emit OrderFilled(orderId, msg.sender, order.amountIn, amountAfterFee);
    }

    /**
     * @dev Cancel a limit order
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        LimitOrder storage order = orders[orderId];

        require(order.trader == msg.sender, "Not order owner");
        require(order.status == OrderStatus.Active, "Order not active");

        order.status = OrderStatus.Cancelled;

        // Return tokens to trader
        IERC20(order.tokenIn).safeTransfer(order.trader, order.amountIn);

        emit OrderCancelled(orderId);
    }

    /**
     * @dev Get orders by user
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    /**
     * @dev Get order details
     */
    function getOrder(uint256 orderId)
        external
        view
        returns (
            address trader,
            address tokenIn,
            address tokenOut,
            uint256 amountIn,
            uint256 amountOut,
            uint256 price,
            OrderStatus status,
            uint256 expiresAt
        )
    {
        LimitOrder storage order = orders[orderId];
        return (
            order.trader,
            order.tokenIn,
            order.tokenOut,
            order.amountIn,
            order.amountOut,
            order.price,
            order.status,
            order.expiresAt
        );
    }

    /**
     * @dev Check if order is fillable
     */
    function isOrderFillable(uint256 orderId) external view returns (bool) {
        LimitOrder storage order = orders[orderId];
        return (
            order.status == OrderStatus.Active &&
            block.timestamp <= order.expiresAt
        );
    }
}
