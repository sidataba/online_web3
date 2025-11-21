import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Users, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

// Escrow Contract ABI
const ESCROW_ABI = [
  {
    inputs: [
      { name: 'buyer', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'price', type: 'uint256' }
    ],
    name: 'createTrade',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tradeId', type: 'uint256' }],
    name: 'fundTrade',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tradeId', type: 'uint256' }],
    name: 'completeTrade',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tradeId', type: 'uint256' }],
    name: 'disputeTrade',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

function P2PTrading() {
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  // Create trade state
  const [buyerAddress, setBuyerAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tradePrice, setTradePrice] = useState('');

  // Fund/Complete trade state
  const [tradeId, setTradeId] = useState('');
  const [tradeDetails, setTradeDetails] = useState(null);
  const [loadingTrade, setLoadingTrade] = useState(false);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const fetchTradeDetails = async () => {
    if (!contractAddress || !tradeId) return;

    setLoadingTrade(true);
    try {
      const response = await axios.get(`/api/escrow/trade/${contractAddress}/${tradeId}`);
      setTradeDetails(response.data);
      toast.success('Trade details loaded!');
    } catch (error) {
      console.error('Error fetching trade:', error);
      toast.error('Failed to fetch trade details');
    } finally {
      setLoadingTrade(false);
    }
  };

  const handleCreateTrade = async (e) => {
    e.preventDefault();

    if (!contractAddress || !buyerAddress || !tokenAddress || !tokenAmount || !tradePrice) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI,
        functionName: 'createTrade',
        args: [buyerAddress, tokenAddress, parseEther(tokenAmount), parseEther(tradePrice)]
      });
      toast.success('Creating trade...');
    } catch (error) {
      toast.error(error.message || 'Failed to create trade');
    }
  };

  const handleFundTrade = async () => {
    if (!tradeDetails) {
      toast.error('Load trade details first');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI,
        functionName: 'fundTrade',
        args: [BigInt(tradeId)],
        value: parseEther(tradeDetails.price)
      });
      toast.success('Funding trade...');
    } catch (error) {
      toast.error(error.message || 'Failed to fund trade');
    }
  };

  const handleCompleteTrade = async () => {
    try {
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI,
        functionName: 'completeTrade',
        args: [BigInt(tradeId)]
      });
      toast.success('Completing trade...');
    } catch (error) {
      toast.error(error.message || 'Failed to complete trade');
    }
  };

  const handleDisputeTrade = async () => {
    try {
      writeContract({
        address: contractAddress,
        abi: ESCROW_ABI,
        functionName: 'disputeTrade',
        args: [BigInt(tradeId)]
      });
      toast.success('Disputing trade...');
    } catch (error) {
      toast.error(error.message || 'Failed to dispute trade');
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      toast.success('Transaction successful!');
      fetchTradeDetails();
    }, 2000);
  }

  const getStatusColor = (status) => {
    const colors = {
      Created: 'text-yellow-400',
      Funded: 'text-blue-400',
      Completed: 'text-green-400',
      Disputed: 'text-red-400',
      Cancelled: 'text-gray-400',
      Refunded: 'text-purple-400'
    };
    return colors[status] || 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-cyan-500" />
          <h2 className="text-2xl font-bold gradient-text">P2P Escrow Trading</h2>
        </div>

        <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-cyan-200">
            <strong>Secure P2P Trading:</strong> Trade tokens directly with other users using smart
            contract escrow. Funds are held securely until both parties confirm.
          </p>
        </div>

        {/* Contract Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Escrow Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Create Trade
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'manage'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Manage Trade
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateTrade} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Buyer Address
              </label>
              <input
                type="text"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Token Contract Address
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Token Amount
              </label>
              <input
                type="number"
                step="0.000001"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="10.0"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                value={tradePrice}
                onChange={(e) => setTradePrice(e.target.value)}
                placeholder="0.1"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>Create Trade</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="number"
                value={tradeId}
                onChange={(e) => setTradeId(e.target.value)}
                placeholder="Trade ID"
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                onClick={fetchTradeDetails}
                disabled={loadingTrade}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold px-6 py-3 rounded-lg transition-all"
              >
                {loadingTrade ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Load'}
              </button>
            </div>

            {tradeDetails && (
              <>
                <div className="bg-slate-700/30 p-5 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Trade #{tradeDetails.tradeId}</h3>
                    <span className={`text-sm font-medium ${getStatusColor(tradeDetails.status)}`}>
                      {tradeDetails.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Seller</span>
                      <span className="text-white font-mono">{tradeDetails.seller.slice(0, 10)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Buyer</span>
                      <span className="text-white font-mono">{tradeDetails.buyer.slice(0, 10)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount</span>
                      <span className="text-white font-bold">{parseFloat(tradeDetails.amount).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price</span>
                      <span className="text-white font-bold">{parseFloat(tradeDetails.price).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Seller Confirmed</span>
                      <span className="text-white">{tradeDetails.sellerConfirmed ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Buyer Confirmed</span>
                      <span className="text-white">{tradeDetails.buyerConfirmed ? '✅' : '❌'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {tradeDetails.status === 'Created' && (
                    <button
                      onClick={handleFundTrade}
                      disabled={isPending || isConfirming}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                      Fund Trade
                    </button>
                  )}
                  {tradeDetails.status === 'Funded' && (
                    <>
                      <button
                        onClick={handleCompleteTrade}
                        disabled={isPending || isConfirming}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                      >
                        Complete
                      </button>
                      <button
                        onClick={handleDisputeTrade}
                        disabled={isPending || isConfirming}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                      >
                        Dispute
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
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

export default P2PTrading;
