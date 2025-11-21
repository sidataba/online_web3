import { ethers } from 'ethers';
import { AppError } from '../middleware/errorHandler.js';
import { getProvider } from '../utils/web3Provider.js';

// Get ETH balance for an address
export const getBalance = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      throw new AppError('Invalid Ethereum address', 400);
    }

    const provider = getProvider();
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);

    res.json({
      address,
      balance: balanceInEth,
      balanceWei: balance.toString(),
      unit: 'ETH'
    });
  } catch (error) {
    next(error);
  }
};

// Get current gas price
export const getGasPrice = async (req, res, next) => {
  try {
    const provider = getProvider();
    const feeData = await provider.getFeeData();

    res.json({
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
      maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null,
      unit: 'gwei'
    });
  } catch (error) {
    next(error);
  }
};

// Get current block number
export const getBlockNumber = async (req, res, next) => {
  try {
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();

    res.json({
      blockNumber,
      network: process.env.ETHEREUM_NETWORK || 'sepolia'
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction by hash
export const getTransactionByHash = async (req, res, next) => {
  try {
    const { hash } = req.params;

    const provider = getProvider();
    const transaction = await provider.getTransaction(hash);

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({
      hash: transaction.hash,
      from: transaction.from,
      to: transaction.to,
      value: ethers.formatEther(transaction.value),
      gasLimit: transaction.gasLimit.toString(),
      gasPrice: transaction.gasPrice ? ethers.formatUnits(transaction.gasPrice, 'gwei') : null,
      nonce: transaction.nonce,
      blockNumber: transaction.blockNumber,
      blockHash: transaction.blockHash,
      chainId: transaction.chainId
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction receipt
export const getTransactionReceipt = async (req, res, next) => {
  try {
    const { hash } = req.params;

    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(hash);

    if (!receipt) {
      throw new AppError('Transaction receipt not found', 404);
    }

    res.json({
      hash: receipt.hash,
      from: receipt.from,
      to: receipt.to,
      status: receipt.status === 1 ? 'success' : 'failed',
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      gasUsed: receipt.gasUsed.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      contractAddress: receipt.contractAddress,
      logs: receipt.logs.length
    });
  } catch (error) {
    next(error);
  }
};

// Estimate gas for a transaction
export const estimateGas = async (req, res, next) => {
  try {
    const { from, to, value, data } = req.body;

    if (!ethers.isAddress(to)) {
      throw new AppError('Invalid recipient address', 400);
    }

    const provider = getProvider();
    const transaction = {
      from: from || ethers.ZeroAddress,
      to,
      value: value ? ethers.parseEther(value.toString()) : 0,
      data: data || '0x'
    };

    const gasEstimate = await provider.estimateGas(transaction);

    res.json({
      gasEstimate: gasEstimate.toString(),
      gasEstimateGwei: ethers.formatUnits(gasEstimate, 'gwei')
    });
  } catch (error) {
    next(error);
  }
};

// Validate Ethereum address
export const validateAddress = async (req, res, next) => {
  try {
    const { address } = req.body;

    if (!address) {
      throw new AppError('Address is required', 400);
    }

    const isValid = ethers.isAddress(address);
    let checksumAddress = null;

    if (isValid) {
      checksumAddress = ethers.getAddress(address);
    }

    res.json({
      valid: isValid,
      address: isValid ? checksumAddress : null
    });
  } catch (error) {
    next(error);
  }
};

// Get ERC20 token balance
export const getTokenBalance = async (req, res, next) => {
  try {
    const { contractAddress, walletAddress } = req.params;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(walletAddress)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();

    // ERC20 ABI for balanceOf and decimals
    const erc20ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'function name() view returns (string)'
    ];

    const contract = new ethers.Contract(contractAddress, erc20ABI, provider);

    const [balance, decimals, symbol, name] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals().catch(() => 18),
      contract.symbol().catch(() => 'UNKNOWN'),
      contract.name().catch(() => 'Unknown Token')
    ]);

    const formattedBalance = ethers.formatUnits(balance, decimals);

    res.json({
      contractAddress,
      walletAddress,
      balance: formattedBalance,
      balanceRaw: balance.toString(),
      decimals,
      symbol,
      name
    });
  } catch (error) {
    next(error);
  }
};

// Get NFT metadata (ERC721)
export const getNFTMetadata = async (req, res, next) => {
  try {
    const { contractAddress, tokenId } = req.params;

    if (!ethers.isAddress(contractAddress)) {
      throw new AppError('Invalid contract address', 400);
    }

    const provider = getProvider();

    // ERC721 ABI
    const erc721ABI = [
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ];

    const contract = new ethers.Contract(contractAddress, erc721ABI, provider);

    const [owner, tokenURI, name, symbol] = await Promise.all([
      contract.ownerOf(tokenId),
      contract.tokenURI(tokenId).catch(() => null),
      contract.name().catch(() => 'Unknown NFT'),
      contract.symbol().catch(() => 'NFT')
    ]);

    res.json({
      contractAddress,
      tokenId,
      owner,
      tokenURI,
      name,
      symbol
    });
  } catch (error) {
    if (error.message.includes('ERC721')) {
      next(new AppError('Token does not exist or contract is not ERC721', 404));
    } else {
      next(error);
    }
  }
};
