import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import blockchainRoutes from './routes/blockchain.js';
import ipfsRoutes from './routes/ipfs.js';
import defiRoutes from './routes/defi.js';
import daoRoutes from './routes/dao.js';
import paymentRoutes from './routes/payment.js';
import escrowRoutes from './routes/escrow.js';
import advancedRoutes from './routes/advanced.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Web3 Backend API - Advanced Features',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      blockchain: '/api/blockchain/*',
      ipfs: '/api/ipfs/*',
      defi: '/api/defi/*',
      dao: '/api/dao/*',
      payment: '/api/payment/*',
      escrow: '/api/escrow/*',
      advanced: '/api/advanced/*'
    },
    features: [
      'Token Staking',
      'DEX Swaps',
      'NFT Marketplace',
      'DAO Governance',
      'IPFS Storage',
      'Multi-chain Support',
      'Fiat Payments',
      'Crypto On-Ramps',
      'P2P Escrow Trading',
      'Account Abstraction',
      'Flash Loans',
      'Soul Bound Tokens',
      'Token Launchpad',
      'Limit Orders'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/blockchain', blockchainRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/defi', defiRoutes);
app.use('/api/dao', daoRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/advanced', advancedRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Network: ${process.env.ETHEREUM_NETWORK || 'sepolia'}`);
});

export default app;
