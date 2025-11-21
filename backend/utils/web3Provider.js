import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

let provider = null;

export const getProvider = () => {
  if (!provider) {
    const network = process.env.ETHEREUM_NETWORK || 'sepolia';

    // Use Infura if project ID is provided, otherwise use default public provider
    if (process.env.INFURA_PROJECT_ID) {
      const infuraUrl = `https://${network}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
      provider = new ethers.JsonRpcProvider(infuraUrl);
    } else {
      // Fallback to public providers
      provider = ethers.getDefaultProvider(network);
    }

    console.log(`✅ Web3 Provider initialized for network: ${network}`);
  }

  return provider;
};

export const getSigner = () => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not configured');
  }

  const baseProvider = getProvider();
  return new ethers.Wallet(process.env.PRIVATE_KEY, baseProvider);
};
