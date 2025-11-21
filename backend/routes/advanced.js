import express from 'express';
import {
  getFlashLoanLiquidity,
  getUserSBTs,
  getTokenSale,
  getUserLimitOrders,
  getLimitOrder
} from '../controllers/advancedController.js';

const router = express.Router();

// Flash Loan routes
router.get('/flashloan/liquidity/:contractAddress/:tokenAddress', getFlashLoanLiquidity);

// Soul Bound Token routes
router.get('/sbt/user/:contractAddress/:userAddress', getUserSBTs);

// Token Launchpad routes
router.get('/launchpad/sale/:contractAddress/:saleId', getTokenSale);

// Limit Order routes
router.get('/limitorder/user/:contractAddress/:userAddress', getUserLimitOrders);
router.get('/limitorder/:contractAddress/:orderId', getLimitOrder);

export default router;
