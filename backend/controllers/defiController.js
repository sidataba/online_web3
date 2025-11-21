import { ethers } from 'ethers';
import { AppError } from '../middleware/errorHandler.js';
import { getProvider } from '../utils/web3Provider.js';

// Staking Contract ABI (simplified)
const STAKING_ABI = [
  'function stakes(address) view returns (uint256 amount, uint256 timestamp, uint256 rewardDebt)',
  'function totalStaked() view returns (uint256)',
  'function calculateReward(address) view returns (uint256)',
  'function getStakeInfo(address) view returns (uint256, uint256, uint256, uint256)'
];

// Swap Contract ABI (simplified)
const SWAP_ABI = [
  'function getReserves(bytes32) view returns (uint256, uint256)',
  'function getSwapQuote(bytes32, address, uint256) view returns (uint256)',
  'function getUserLiquidity(bytes32, address) view returns (uint256)'
];

/**
 * Get staking info for an address
 */
export const getStakingInfo = async (req, res, next) => {
  try {
    const { contractAddress, userAddress } = req.params;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(userAddress)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, STAKING_ABI, provider);

    const [amount, timestamp, pendingReward, unlockTime] = await contract.getStakeInfo(userAddress);

    res.json({
      contractAddress,
      userAddress,
      stakedAmount: ethers.formatEther(amount),
      stakedAmountRaw: amount.toString(),
      stakingTimestamp: timestamp.toString(),
      pendingReward: ethers.formatEther(pendingReward),
      unlockTime: unlockTime.toString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get swap pool info
 */
export const getPoolInfo = async (req, res, next) => {
  try {
    const { contractAddress, poolId } = req.params;

    if (!ethers.isAddress(contractAddress)) {
      throw new AppError('Invalid contract address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, SWAP_ABI, provider);

    const [reserveA, reserveB] = await contract.getReserves(poolId);

    res.json({
      contractAddress,
      poolId,
      reserveA: ethers.formatEther(reserveA),
      reserveB: ethers.formatEther(reserveB),
      reserveARaw: reserveA.toString(),
      reserveBRaw: reserveB.toString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get swap quote
 */
export const getSwapQuote = async (req, res, next) => {
  try {
    const { contractAddress } = req.params;
    const { poolId, tokenIn, amountIn } = req.body;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(tokenIn)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, SWAP_ABI, provider);

    const amountInWei = ethers.parseEther(amountIn.toString());
    const amountOut = await contract.getSwapQuote(poolId, tokenIn, amountInWei);

    res.json({
      poolId,
      tokenIn,
      amountIn,
      amountOut: ethers.formatEther(amountOut),
      amountOutRaw: amountOut.toString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user liquidity
 */
export const getUserLiquidity = async (req, res, next) => {
  try {
    const { contractAddress, poolId, userAddress } = req.params;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(userAddress)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, SWAP_ABI, provider);

    const liquidity = await contract.getUserLiquidity(poolId, userAddress);

    res.json({
      contractAddress,
      poolId,
      userAddress,
      liquidity: liquidity.toString()
    });
  } catch (error) {
    next(error);
  }
};
