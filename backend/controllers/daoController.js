import { ethers } from 'ethers';
import { AppError } from '../middleware/errorHandler.js';
import { getProvider } from '../utils/web3Provider.js';

// DAO Contract ABI (simplified)
const DAO_ABI = [
  'function proposalCount() view returns (uint256)',
  'function getProposal(uint256) view returns (address, string, string, uint256, uint256, uint256, uint256, uint256, uint8)',
  'function hasVoted(uint256, address) view returns (bool)',
  'function getVote(uint256, address) view returns (uint8)',
  'function state(uint256) view returns (uint8)'
];

/**
 * Get all proposals
 */
export const getProposals = async (req, res, next) => {
  try {
    const { contractAddress } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!ethers.isAddress(contractAddress)) {
      throw new AppError('Invalid contract address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, DAO_ABI, provider);

    const proposalCount = await contract.proposalCount();
    const total = Number(proposalCount);

    const proposals = [];
    const start = Math.max(0, total - offset - limit);
    const end = Math.max(0, total - offset);

    for (let i = start; i < end; i++) {
      try {
        const [
          proposer,
          title,
          description,
          forVotes,
          againstVotes,
          abstainVotes,
          startBlock,
          endBlock,
          currentState
        ] = await contract.getProposal(i);

        proposals.push({
          id: i,
          proposer,
          title,
          description,
          forVotes: ethers.formatEther(forVotes),
          againstVotes: ethers.formatEther(againstVotes),
          abstainVotes: ethers.formatEther(abstainVotes),
          startBlock: startBlock.toString(),
          endBlock: endBlock.toString(),
          state: ['Pending', 'Active', 'Cancelled', 'Defeated', 'Succeeded', 'Executed'][currentState]
        });
      } catch (error) {
        console.error(`Error fetching proposal ${i}:`, error);
      }
    }

    res.json({
      contractAddress,
      total,
      proposals: proposals.reverse() // Show newest first
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single proposal
 */
export const getProposal = async (req, res, next) => {
  try {
    const { contractAddress, proposalId } = req.params;

    if (!ethers.isAddress(contractAddress)) {
      throw new AppError('Invalid contract address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, DAO_ABI, provider);

    const [
      proposer,
      title,
      description,
      forVotes,
      againstVotes,
      abstainVotes,
      startBlock,
      endBlock,
      currentState
    ] = await contract.getProposal(proposalId);

    res.json({
      id: proposalId,
      proposer,
      title,
      description,
      forVotes: ethers.formatEther(forVotes),
      againstVotes: ethers.formatEther(againstVotes),
      abstainVotes: ethers.formatEther(abstainVotes),
      startBlock: startBlock.toString(),
      endBlock: endBlock.toString(),
      state: ['Pending', 'Active', 'Cancelled', 'Defeated', 'Succeeded', 'Executed'][currentState]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has voted
 */
export const checkVote = async (req, res, next) => {
  try {
    const { contractAddress, proposalId, userAddress } = req.params;

    if (!ethers.isAddress(contractAddress) || !ethers.isAddress(userAddress)) {
      throw new AppError('Invalid address', 400);
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, DAO_ABI, provider);

    const hasVoted = await contract.hasVoted(proposalId, userAddress);
    let voteType = null;

    if (hasVoted) {
      const vote = await contract.getVote(proposalId, userAddress);
      voteType = ['Against', 'For', 'Abstain'][vote];
    }

    res.json({
      proposalId,
      userAddress,
      hasVoted,
      voteType
    });
  } catch (error) {
    next(error);
  }
};
