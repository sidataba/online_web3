import { ethers } from 'ethers';
import { AppError } from '../middleware/errorHandler.js';
import { getProvider } from '../utils/web3Provider.js';

// Flash Loan ABI
const FLASH_LOAN_ABI = [
  'function getAvailableLiquidity(address) view returns (uint256)',
  'function flashLoan(address, address, uint256, bytes) external'
];

// SBT ABI
const SBT_ABI = [
  'function isValid(uint256) view returns (bool)',
  'function tokensOfOwner(address) view returns (uint256[])',
  'function getTokenData(uint256) view returns (string, string, uint256, uint256, bool, bool)'
];

// Launchpad ABI
const LAUNCHPAD_ABI = [
  'function getSale(uint256) view returns (address, address, uint256, uint256, uint256, uint256, uint256, uint256, uint8)',
  'function getUserPurchase(uint256, address) view returns (uint256)'
];

// Limit Order ABI
const LIMIT_ORDER_ABI = [
  'function getOrder(uint256) view returns (address, address, address, uint256, uint256, uint256, uint8, uint256)',
  'function getUserOrders(address) view returns (uint256[])',
  'function isOrderFillable(uint256) view returns (bool)'
];

/**
 * Get flash loan liquidity
 */
export const getFlashLoanLiquidity = async (req, res, next) => {
  try {
    const { contractAddress, tokenAddress } = req.params;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(tokenAddress)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, FLASH_LOAN_ABI, provider);

    const liquidity = await contract.getAvailableLiquidity(tokenAddress);

    res.json({
      contractAddress,
      tokenAddress,
      liquidity: ethers.formatEther(liquidity),
      liquidityRaw: liquidity.toString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Soul Bound Tokens for user
 */
export const getUserSBTs = async (req, res, next) => {
  try {
    const { contractAddress, userAddress } = req.params;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(userAddress)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, SBT_ABI, provider);

    const tokenIds = await contract.tokensOfOwner(userAddress);

    const tokens = [];
    for (const tokenId of tokenIds) {
      try {
        const [category, metadata, issuedAt, expiresAt, revoked, valid] =
          await contract.getTokenData(tokenId);

        tokens.push({
          tokenId: tokenId.toString(),
          category,
          metadata,
          issuedAt: issuedAt.toString(),
          expiresAt: expiresAt.toString(),
          revoked,
          valid
        });
      } catch (error) {
        console.error(`Error fetching token ${tokenId}:`, error);
      }
    }

    res.json({
      userAddress,
      tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get token sale details
 */
export const getTokenSale = async (req, res, next) => {
  try {
    const { contractAddress, saleId } = req.params;

    if (!ethers.isAddress(contractAddress)) {
      throw new AppError('Invalid contract address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, LAUNCHPAD_ABI, provider);

    const [
      tokenAddress,
      creator,
      tokenPrice,
      tokensAvailable,
      tokensSold,
      totalRaised,
      startTime,
      endTime,
      status
    ] = await contract.getSale(saleId);

    const statusMap = ['Pending', 'Active', 'Ended', 'Cancelled'];

    res.json({
      saleId,
      tokenAddress,
      creator,
      tokenPrice: ethers.formatEther(tokenPrice),
      tokensAvailable: ethers.formatEther(tokensAvailable),
      tokensSold: ethers.formatEther(tokensSold),
      totalRaised: ethers.formatEther(totalRaised),
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      status: statusMap[status] || 'Unknown'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's limit orders
 */
export const getUserLimitOrders = async (req, res, next) => {
  try {
    const { contractAddress, userAddress } = req.params;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(userAddress)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, LIMIT_ORDER_ABI, provider);

    const orderIds = await contract.getUserOrders(userAddress);

    const orders = [];
    for (const orderId of orderIds) {
      try {
        const [
          trader,
          tokenIn,
          tokenOut,
          amountIn,
          amountOut,
          price,
          status,
          expiresAt
        ] = await contract.getOrder(orderId);

        const fillable = await contract.isOrderFillable(orderId);
        const statusMap = ['Active', 'Filled', 'Cancelled'];

        orders.push({
          orderId: orderId.toString(),
          trader,
          tokenIn,
          tokenOut,
          amountIn: ethers.formatEther(amountIn),
          amountOut: ethers.formatEther(amountOut),
          price: ethers.formatEther(price),
          status: statusMap[status],
          expiresAt: expiresAt.toString(),
          fillable
        });
      } catch (error) {
        console.error(`Error fetching order ${orderId}:`, error);
      }
    }

    res.json({
      userAddress,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single limit order
 */
export const getLimitOrder = async (req, res, next) => {
  try {
    const { contractAddress, orderId } = req.params;

    if (!ethers.isAddress(contractAddress)) {
      throw new AppError('Invalid contract address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, LIMIT_ORDER_ABI, provider);

    const [
      trader,
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
      price,
      status,
      expiresAt
    ] = await contract.getOrder(orderId);

    const fillable = await contract.isOrderFillable(orderId);
    const statusMap = ['Active', 'Filled', 'Cancelled'];

    res.json({
      orderId,
      trader,
      tokenIn,
      tokenOut,
      amountIn: ethers.formatEther(amountIn),
      amountOut: ethers.formatEther(amountOut),
      price: ethers.formatEther(price),
      status: statusMap[status],
      expiresAt: expiresAt.toString(),
      fillable
    });
  } catch (error) {
    next(error);
  }
};
