// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SimpleSwap
 * @dev Automated Market Maker (AMM) for token swaps with liquidity pools
 */
contract SimpleSwap is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Pool {
        IERC20 tokenA;
        IERC20 tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }

    mapping(bytes32 => Pool) public pools;
    uint256 public constant FEE_DENOMINATOR = 1000;
    uint256 public swapFee = 3; // 0.3%

    event PoolCreated(address indexed tokenA, address indexed tokenB, bytes32 poolId);
    event LiquidityAdded(
        address indexed provider,
        bytes32 indexed poolId,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed provider,
        bytes32 indexed poolId,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    event Swapped(
        address indexed user,
        bytes32 indexed poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );

    /**
     * @dev Get pool ID for token pair
     */
    function getPoolId(address tokenA, address tokenB) public pure returns (bytes32) {
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        return keccak256(abi.encodePacked(token0, token1));
    }

    /**
     * @dev Create a new liquidity pool
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (bytes32) {
        require(tokenA != tokenB, "Identical tokens");
        require(amountA > 0 && amountB > 0, "Insufficient amounts");

        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        require(pool.totalLiquidity == 0, "Pool already exists");

        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        (uint256 amount0, uint256 amount1) = tokenA < tokenB
            ? (amountA, amountB)
            : (amountB, amountA);

        pool.tokenA = IERC20(token0);
        pool.tokenB = IERC20(token1);
        pool.reserveA = amount0;
        pool.reserveB = amount1;

        uint256 initialLiquidity = sqrt(amount0 * amount1);
        pool.totalLiquidity = initialLiquidity;
        pool.liquidity[msg.sender] = initialLiquidity;

        pool.tokenA.safeTransferFrom(msg.sender, address(this), amount0);
        pool.tokenB.safeTransferFrom(msg.sender, address(this), amount1);

        emit PoolCreated(token0, token1, poolId);
        emit LiquidityAdded(msg.sender, poolId, amount0, amount1, initialLiquidity);

        return poolId;
    }

    /**
     * @dev Add liquidity to existing pool
     */
    function addLiquidity(
        bytes32 poolId,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256 liquidity) {
        Pool storage pool = pools[poolId];
        require(pool.totalLiquidity > 0, "Pool does not exist");

        uint256 liquidityA = (amountA * pool.totalLiquidity) / pool.reserveA;
        uint256 liquidityB = (amountB * pool.totalLiquidity) / pool.reserveB;
        liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;

        require(liquidity > 0, "Insufficient liquidity minted");

        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidity;
        pool.liquidity[msg.sender] += liquidity;

        pool.tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        pool.tokenB.safeTransferFrom(msg.sender, address(this), amountB);

        emit LiquidityAdded(msg.sender, poolId, amountA, amountB, liquidity);
    }

    /**
     * @dev Remove liquidity from pool
     */
    function removeLiquidity(bytes32 poolId, uint256 liquidity)
        external
        nonReentrant
        returns (uint256 amountA, uint256 amountB)
    {
        Pool storage pool = pools[poolId];
        require(pool.liquidity[msg.sender] >= liquidity, "Insufficient liquidity");

        amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        amountB = (liquidity * pool.reserveB) / pool.totalLiquidity;

        require(amountA > 0 && amountB > 0, "Insufficient amounts");

        pool.liquidity[msg.sender] -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;

        pool.tokenA.safeTransfer(msg.sender, amountA);
        pool.tokenB.safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, poolId, amountA, amountB, liquidity);
    }

    /**
     * @dev Swap tokens
     */
    function swap(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.totalLiquidity > 0, "Pool does not exist");

        bool isTokenA = address(pool.tokenA) == tokenIn;
        require(
            isTokenA || address(pool.tokenB) == tokenIn,
            "Invalid token"
        );

        // Calculate output with fee
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - swapFee);
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;

        amountOut = (amountInWithFee * reserveOut) /
                   (reserveIn * FEE_DENOMINATOR + amountInWithFee);

        require(amountOut >= minAmountOut, "Slippage too high");
        require(amountOut < reserveOut, "Insufficient liquidity");

        // Update reserves
        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
            pool.tokenA.safeTransferFrom(msg.sender, address(this), amountIn);
            pool.tokenB.safeTransfer(msg.sender, amountOut);
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
            pool.tokenB.safeTransferFrom(msg.sender, address(this), amountIn);
            pool.tokenA.safeTransfer(msg.sender, amountOut);
        }

        emit Swapped(msg.sender, poolId, tokenIn, amountIn, amountOut);
    }

    /**
     * @dev Get swap quote
     */
    function getSwapQuote(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        Pool storage pool = pools[poolId];
        require(pool.totalLiquidity > 0, "Pool does not exist");

        bool isTokenA = address(pool.tokenA) == tokenIn;
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - swapFee);
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;

        amountOut = (amountInWithFee * reserveOut) /
                   (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    }

    /**
     * @dev Get pool reserves
     */
    function getReserves(bytes32 poolId)
        external
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        Pool storage pool = pools[poolId];
        return (pool.reserveA, pool.reserveB);
    }

    /**
     * @dev Get user liquidity
     */
    function getUserLiquidity(bytes32 poolId, address user)
        external
        view
        returns (uint256)
    {
        return pools[poolId].liquidity[user];
    }

    /**
     * @dev Square root helper
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}
