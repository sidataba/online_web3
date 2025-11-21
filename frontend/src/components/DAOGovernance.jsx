import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Vote, Loader2, CheckCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

// DAO Contract ABI
const DAO_ABI = [
  {
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' }
    ],
    name: 'propose',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'voteType', type: 'uint8' }
    ],
    name: 'castVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

function DAOGovernance() {
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('proposals');

  // Create proposal state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (contractAddress) {
      fetchProposals();
    }
  }, [contractAddress]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/dao/proposals/${contractAddress}?limit=10`);
      setProposals(response.data.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();

    if (!title || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: DAO_ABI,
        functionName: 'propose',
        args: [title, description]
      });
      toast.success('Proposal creation submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to create proposal');
    }
  };

  const handleVote = async (proposalId, voteType) => {
    try {
      writeContract({
        address: contractAddress,
        abi: DAO_ABI,
        functionName: 'castVote',
        args: [BigInt(proposalId), voteType] // 0: Against, 1: For, 2: Abstain
      });
      toast.success('Vote submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to vote');
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      toast.success('Transaction confirmed!');
      fetchProposals();
      setTitle('');
      setDescription('');
    }, 2000);
  }

  const getStateColor = (state) => {
    const colors = {
      'Pending': 'text-yellow-400',
      'Active': 'text-green-400',
      'Succeeded': 'text-blue-400',
      'Defeated': 'text-red-400',
      'Executed': 'text-purple-400'
    };
    return colors[state] || 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <Vote className="w-6 h-6 text-indigo-500" />
          <h2 className="text-2xl font-bold gradient-text">DAO Governance</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            DAO Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('proposals')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'proposals'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Vote className="w-4 h-4 inline mr-2" />
            Proposals
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Proposal
          </button>
        </div>

        {activeTab === 'proposals' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              </div>
            ) : proposals.length > 0 ? (
              proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-slate-700/30 p-5 rounded-lg border border-slate-600 card-hover"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{proposal.title}</h3>
                      <p className={`text-sm font-medium ${getStateColor(proposal.state)}`}>
                        {proposal.state}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">#{proposal.id}</span>
                  </div>

                  <p className="text-slate-300 text-sm mb-4">{proposal.description}</p>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">For</p>
                      <p className="text-lg font-bold text-green-400">{parseFloat(proposal.forVotes).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Against</p>
                      <p className="text-lg font-bold text-red-400">{parseFloat(proposal.againstVotes).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Abstain</p>
                      <p className="text-lg font-bold text-yellow-400">{parseFloat(proposal.abstainVotes).toFixed(2)}</p>
                    </div>
                  </div>

                  {proposal.state === 'Active' && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleVote(proposal.id, 1)}
                        disabled={isPending || isConfirming}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white text-sm font-bold py-2 rounded transition-all"
                      >
                        Vote For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 0)}
                        disabled={isPending || isConfirming}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-sm font-bold py-2 rounded transition-all"
                      >
                        Vote Against
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 2)}
                        disabled={isPending || isConfirming}
                        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 text-white text-sm font-bold py-2 rounded transition-all"
                      >
                        Abstain
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                No proposals found. Create one to get started!
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateProposal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Proposal Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Increase staking rewards"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your proposal in detail..."
                rows={5}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Create Proposal</span>
                </>
              )}
            </button>
          </form>
        )}

        {hash && (
          <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <div className="flex items-start space-x-3">
              {isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-1" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">
                  {isSuccess ? 'Transaction Successful!' : 'Transaction Pending'}
                </p>
                <p className="text-xs text-slate-400 font-mono break-all">{hash}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DAOGovernance;
