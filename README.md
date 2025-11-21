# 🚀 Advanced Web3 Full-Stack DApp

A state-of-the-art Web3 decentralized application featuring DeFi protocols, NFT marketplace, DAO governance, multi-chain support, and IPFS integration. Built with React, Node.js, and Solidity.

## ✨ Advanced Features

### DeFi & Trading
- **Token Staking**: Stake tokens to earn rewards with lockup periods
- **DEX (Decentralized Exchange)**: Automated Market Maker (AMM) with liquidity pools
- **Token Swaps**: Exchange tokens with minimal slippage
- **Liquidity Provision**: Add/remove liquidity and earn fees
- **Token Vesting**: Time-locked token distribution with cliff periods

### NFT & Marketplace
- **NFT Minting**: Create ERC721 NFTs with custom metadata
- **NFT Marketplace**: List, buy, sell NFTs with offers
- **IPFS Integration**: Decentralized storage for NFT metadata
- **Royalties & Fees**: Platform fee system for marketplace transactions

### DAO Governance
- **Proposal Creation**: Submit proposals for community voting
- **Voting System**: On-chain voting with governance tokens
- **Proposal States**: Track proposal lifecycle (Pending, Active, Succeeded, Defeated)
- **Quorum & Thresholds**: Configurable voting parameters

### Multi-Chain Support
- **Ethereum** (Mainnet & Sepolia)
- **Polygon** (Mainnet & Mumbai)
- **Arbitrum** (One & Sepolia)
- **Optimism** (Mainnet & Sepolia)
- **Base** (Mainnet & Sepolia)
- **Local Development** (Hardhat Network)

### Additional Features
- **ENS Integration**: Resolve Ethereum Name Service addresses
- **Batch Transactions**: Execute multiple transactions atomically
- **Real-time Data**: Live gas prices, block numbers, balances
- **Transaction History**: Search and view detailed transaction info
- **Wallet Integration**: MetaMask, WalletConnect, and more

## 🚀 Quick Start

```bash
# Install dependencies
npm run install:all

# Configure .env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Deploy contracts (optional)
cd contracts && npm run compile && npm run deploy:local

# Run the application
npm run dev
```

Access at **http://localhost:5173**

## 🎯 Key Smart Contracts

- **DAppToken**: ERC20 governance token (1B max supply)
- **TokenStaking**: Stake tokens, earn rewards
- **SimpleSwap**: AMM DEX with liquidity pools
- **NFTMarketplace**: Buy/sell NFTs with 2.5% fee
- **DAO**: On-chain governance with proposals and voting
- **TokenVesting**: Time-locked token distribution
- **BatchTransaction**: Atomic multi-transaction execution

## 📚 API Endpoints

```
# Blockchain
GET  /api/blockchain/balance/:address
GET  /api/blockchain/gas-price
GET  /api/blockchain/transaction/:hash

# IPFS
POST /api/ipfs/upload
POST /api/ipfs/upload-metadata

# DeFi
GET  /api/defi/staking/:contract/:user
POST /api/defi/swap-quote/:contract

# DAO
GET  /api/dao/proposals/:contract
GET  /api/dao/proposal/:contract/:id
```

## 📖 Full Documentation

See sections below for complete setup, deployment, and usage instructions.

## 🛠 Technology Stack

**Frontend**: React 18 • Vite • Tailwind • Wagmi • Web3Modal • Ethers.js
**Backend**: Node.js • Express • Web3.js • IPFS • Security Middleware
**Contracts**: Solidity 0.8.20 • Hardhat • OpenZeppelin

## 🔒 Security

- ReentrancyGuard on all payable functions
- SafeERC20 for token transfers
- Rate limiting and CORS
- Input validation
- Access control modifiers

## 📄 License

MIT

---

**⭐ Star this repo • 🔗 Multi-chain • 💎 DeFi • 🎨 NFTs • 🗳️ DAO**
