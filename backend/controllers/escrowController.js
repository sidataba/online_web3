import { ethers } from 'ethers';
import { AppError } from '../middleware/errorHandler.js';
import { getProvider } from '../utils/web3Provider.js';

// Escrow Contract ABI
const ESCROW_ABI = [
  'function createTrade(address buyer, address token, uint256 amount, uint256 price) returns (uint256)',
  'function fundTrade(uint256 tradeId) payable',
  'function completeTrade(uint256 tradeId)',
  'function disputeTrade(uint256 tradeId)',
  'function cancelTrade(uint256 tradeId)',
  'function getTrade(uint256) view returns (address, address, address, uint256, uint256, uint8, uint256, uint256, bool, bool)',
  'function withdraw()',
  'function pendingWithdrawals(address) view returns (uint256)',
  'function isTradeExpired(uint256) view returns (bool)'
];

/**
 * Get escrow trade details
 */
export const getEscrowTrade = async (req, res, next) => {
  try {
    const { contractAddress, tradeId } = req.params;

    if (!ethers.isAddress(contractAddress)) {
      throw new AppError('Invalid contract address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, ESCROW_ABI, provider);

    const trade = await contract.getTrade(tradeId);

    const statusMap = ['Created', 'Funded', 'Completed', 'Disputed', 'Cancelled', 'Refunded'];

    res.json({
      tradeId,
      seller: trade[0],
      buyer: trade[1],
      token: trade[2],
      amount: ethers.formatEther(trade[3]),
      price: ethers.formatEther(trade[4]),
      status: statusMap[trade[5]] || 'Unknown',
      createdAt: trade[6].toString(),
      expiresAt: trade[7].toString(),
      sellerConfirmed: trade[8],
      buyerConfirmed: trade[9]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending withdrawals
 */
export const getPendingWithdrawals = async (req, res, next) => {
  try {
    const { contractAddress, userAddress } = req.params;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(userAddress)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, ESCROW_ABI, provider);

    const pending = await contract.pendingWithdrawals(userAddress);

    res.json({
      userAddress,
      pendingAmount: ethers.formatEther(pending),
      pendingAmountRaw: pending.toString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if trade is expired
 */
export const checkTradeExpired = async (req, res, next) => {
  try {
    const { contractAddress, tradeId } = req.params;

    if (!ethers.isAddress(contractAddress)) {
      throw new AppError('Invalid contract address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, ESCROW_ABI, provider);

    const expired = await contract.isTradeExpired(tradeId);

    res.json({
      tradeId,
      expired
    });
  } catch (error) {
    next(error);
  }
};
