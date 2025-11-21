# Web3 Full-Stack DApp

A comprehensive Web3 decentralized application built with React, Node.js, and Ethereum smart contracts. This project demonstrates wallet connection, token transfers, NFT minting, and smart contract interactions.

## Features

- **Wallet Integration**: Connect with MetaMask and other Web3 wallets using WalletConnect
- **Dashboard**: View wallet balance, gas prices, and blockchain information in real-time
- **Token Transfer**: Send ETH to other addresses with transaction confirmation
- **NFT Minting**: Mint ERC721 NFTs with custom metadata URIs
- **Smart Contract Interaction**: Read and write to SimpleStorage contract
- **Transaction History**: Search and view detailed transaction information
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Wagmi (React Hooks for Ethereum)
- Web3Modal
- Ethers.js v6
- React Hot Toast

### Backend
- Node.js
- Express
- Ethers.js v6
- Web3.js v4
- Helmet (Security)
- Express Rate Limit

### Smart Contracts
- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts

## Project Structure

```
web3-fullstack-app/
├── backend/              # Node.js backend API
│   ├── controllers/      # API controllers
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── config/       # Web3 configuration
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Utility functions
│   └── vite.config.js
├── contracts/            # Solidity smart contracts
│   ├── MyNFT.sol         # ERC721 NFT contract
│   ├── SimpleStorage.sol # Simple storage contract
│   └── scripts/          # Deployment scripts
└── package.json
```

## Prerequisites

- Node.js v16+ and npm
- MetaMask or another Web3 wallet
- Infura account (for blockchain access)
- Basic understanding of Ethereum and Web3

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd web3-fullstack-app
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install contract dependencies
cd ../contracts
npm install
```

Or use the convenience script:

```bash
npm run install:all
```

## Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# Get your Infura Project ID from https://infura.io/
INFURA_PROJECT_ID=your_infura_project_id_here
ETHEREUM_NETWORK=sepolia

# Optional: Private key for server-side transactions
PRIVATE_KEY=your_private_key_here

CORS_ORIGIN=http://localhost:5173

# Optional: Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Frontend Configuration

Create a `.env` file in the `frontend` directory:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
# Get your WalletConnect Project ID from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

VITE_API_URL=http://localhost:5000

# Update these after deploying contracts
VITE_NFT_CONTRACT_ADDRESS=
VITE_STORAGE_CONTRACT_ADDRESS=
```

## Smart Contract Deployment

### 1. Compile contracts

```bash
cd contracts
npm run compile
```

### 2. Deploy to local network (for testing)

```bash
# Start a local Hardhat node (in one terminal)
npm run node

# Deploy contracts (in another terminal)
npm run deploy:local
```

### 3. Deploy to Sepolia testnet

Make sure you have:
- Sepolia ETH in your wallet (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Configured `INFURA_PROJECT_ID` and `PRIVATE_KEY` in backend `.env`

```bash
npm run deploy:sepolia
```

After deployment, copy the contract addresses from `contracts/deployment.json` and update your frontend `.env` file.

## Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
# From root directory
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Build

```bash
# Build frontend
npm run build

# Start backend
npm run start:backend

# Preview frontend build
npm run start:frontend
```

## Usage Guide

### 1. Connect Your Wallet

Click the "Connect Wallet" button and select MetaMask or WalletConnect.

### 2. Dashboard

View your wallet balance, current gas prices, block number, and network information.

### 3. Send ETH

- Navigate to the "Transfer" tab
- Enter recipient address and amount
- Click "Send Transaction"
- Confirm in your wallet

### 4. Mint NFT

- Navigate to the "NFT Minter" tab
- Enter your deployed NFT contract address
- Provide a metadata URI (IPFS or HTTPS)
- Click "Mint NFT" and confirm the transaction

### 5. Contract Interaction

- Navigate to the "Contract" tab
- Enter your SimpleStorage contract address
- Read the stored value or set a new value
- Transactions require wallet confirmation

### 6. Transaction History

- Navigate to the "History" tab
- Enter any transaction hash to view details
- See status, gas used, and other information

## API Endpoints

### Blockchain Information

- `GET /api/health` - API health check
- `GET /api/blockchain/balance/:address` - Get ETH balance
- `GET /api/blockchain/gas-price` - Get current gas prices
- `GET /api/blockchain/block-number` - Get latest block number

### Transactions

- `GET /api/blockchain/transaction/:hash` - Get transaction details
- `GET /api/blockchain/transaction-receipt/:hash` - Get transaction receipt
- `POST /api/blockchain/estimate-gas` - Estimate gas for transaction

### Tokens & NFTs

- `GET /api/blockchain/token-balance/:contractAddress/:walletAddress` - Get ERC20 balance
- `GET /api/blockchain/nft/:contractAddress/:tokenId` - Get NFT metadata

### Validation

- `POST /api/blockchain/validate-address` - Validate Ethereum address

## Smart Contracts

### MyNFT (ERC721)

Features:
- Mint NFTs with custom metadata
- Owner-only minting
- Configurable mint price
- Max supply limit (10,000)
- Withdraw contract funds

### SimpleStorage

Features:
- Store uint256 values
- Per-user value tracking
- Read stored values
- Event emission on changes

## Security Considerations

- Never commit `.env` files
- Keep private keys secure
- Use test networks for development
- Audit smart contracts before mainnet deployment
- Implement proper access controls
- Use rate limiting on APIs
- Validate all user inputs

## Testing

```bash
# Test smart contracts
cd contracts
npx hardhat test

# Run contract coverage
npx hardhat coverage
```

## Troubleshooting

### MetaMask Connection Issues

- Make sure MetaMask is installed and unlocked
- Check that you're on the correct network
- Try refreshing the page

### Transaction Failures

- Ensure you have enough ETH for gas fees
- Check gas price settings
- Verify contract addresses are correct

### Backend API Errors

- Verify Infura credentials
- Check network connectivity
- Review backend console logs

## Resources

- [Ethereum Documentation](https://ethereum.org/developers)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Infura](https://infura.io/)
- [WalletConnect](https://walletconnect.com/)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using React, Node.js, and Ethereum
