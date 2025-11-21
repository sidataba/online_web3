import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, sepolia, hardhat } from 'viem/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Define chains
export const chains = [mainnet, sepolia, hardhat];

// Metadata
const metadata = {
  name: 'Web3 DApp',
  description: 'Comprehensive Web3 Application',
  url: 'http://localhost:5173',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
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
