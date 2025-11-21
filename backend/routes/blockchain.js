import express from 'express';
import {
  getBalance,
  getGasPrice,
  getBlockNumber,
  getTransactionByHash,
  getTransactionReceipt,
  estimateGas,
  getNFTMetadata,
  getTokenBalance,
  validateAddress
} from '../controllers/web3Controller.js';

const router = express.Router();

// Blockchain information endpoints
router.get('/balance/:address', getBalance);
router.get('/gas-price', getGasPrice);
router.get('/block-number', getBlockNumber);
router.get('/transaction/:hash', getTransactionByHash);
router.get('/transaction-receipt/:hash', getTransactionReceipt);
router.post('/estimate-gas', estimateGas);
router.post('/validate-address', validateAddress);

// Token endpoints
router.get('/token-balance/:contractAddress/:walletAddress', getTokenBalance);

// NFT endpoints
router.get('/nft/:contractAddress/:tokenId', getNFTMetadata);

export default router;
