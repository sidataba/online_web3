import express from 'express';
import {
  getStakingInfo,
  getPoolInfo,
  getSwapQuote,
  getUserLiquidity
} from '../controllers/defiController.js';

const router = express.Router();

// Staking routes
router.get('/staking/:contractAddress/:userAddress', getStakingInfo);

// Swap/DEX routes
router.get('/pool/:contractAddress/:poolId', getPoolInfo);
router.post('/swap-quote/:contractAddress', getSwapQuote);
router.get('/liquidity/:contractAddress/:poolId/:userAddress', getUserLiquidity);

export default router;
