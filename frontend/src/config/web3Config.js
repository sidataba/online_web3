import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import {
  mainnet,
  sepolia,
  hardhat,
  polygon,
  polygonMumbai,
  arbitrum,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
  base,
  baseSepolia
} from 'viem/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Define chains - Production and Testnets
export const chains = [
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  sepolia,
  polygonMumbai,
  arbitrumSepolia,
  optimismSepolia,
  baseSepolia,
  hardhat
];

// Metadata
const metadata = {
  name: 'Web3 DApp - Advanced Features',
  description: 'Comprehensive Web3 Application with DeFi, NFT Marketplace, DAO, and Multi-chain Support',
  url: 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Chain names for display
export const chainNames = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  11155111: 'Sepolia',
  80001: 'Mumbai',
  421614: 'Arbitrum Sepolia',
  11155420: 'Optimism Sepolia',
  84532: 'Base Sepolia',
  1337: 'Hardhat'
};

// Wagmi config
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata
});

// Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b82f6'
  }
});

export { projectId };
