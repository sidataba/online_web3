import express from 'express';
import {
  getEscrowTrade,
  getPendingWithdrawals,
  checkTradeExpired
} from '../controllers/escrowController.js';

const router = express.Router();

router.get('/trade/:contractAddress/:tradeId', getEscrowTrade);
router.get('/withdrawals/:contractAddress/:userAddress', getPendingWithdrawals);
router.get('/expired/:contractAddress/:tradeId', checkTradeExpired);

export default router;
