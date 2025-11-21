import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { TrendingUp, Loader2, CheckCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

// Staking Contract ABI
const STAKING_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

function Staking() {
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [stakingInfo, setStakingInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (contractAddress && address) {
      fetchStakingInfo();
    }
  }, [contractAddress, address]);

  const fetchStakingInfo = async () => {
    if (!contractAddress || !address) return;

    setLoading(true);
    try {
      const response = await axios.get(`/api/defi/staking/${contractAddress}/${address}`);
      setStakingInfo(response.data);
    } catch (error) {
      console.error('Error fetching staking info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    if (!amount || !contractAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [parseEther(amount)]
      });
      toast.success('Staking transaction submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to stake');
    }
  };

  const handleUnstake = async () => {
    if (!stakingInfo) return;

    try {
      writeContract({
        address: contractAddress,
        abi: STAKING_ABI,
        functionName: 'unstake',
        args: [parseEther(stakingInfo.stakedAmount)]
      });
      toast.success('Unstake transaction submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to unstake');
    }
  };

  const handleClaim = async () => {
    try {
      writeContract({
        address: contractAddress,
        abi: STAKING_ABI,
        functionName: 'claimRewards'
      });
      toast.success('Claim transaction submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to claim rewards');
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      toast.success('Transaction confirmed!');
      fetchStakingInfo();
      setAmount('');
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold gradient-text">Token Staking</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Staking Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {stakingInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
              <p className="text-slate-400 text-sm mb-1">Staked Amount</p>
              <p className="text-2xl font-bold text-white">{parseFloat(stakingInfo.stakedAmount).toFixed(4)}</p>
            </div>
            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
              <p className="text-slate-400 text-sm mb-1">Pending Rewards</p>
              <p className="text-2xl font-bold text-green-400">{parseFloat(stakingInfo.pendingReward).toFixed(4)}</p>
            </div>
            <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
              <p className="text-slate-400 text-sm mb-1">Unlock Time</p>
              <p className="text-lg font-bold text-orange-400">
                {stakingInfo.unlockTime ? new Date(parseInt(stakingInfo.unlockTime) * 1000).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleStake} className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount to Stake
            </label>
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isPending ? 'Staking...' : 'Confirming...'}</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Stake Tokens</span>
              </>
            )}
          </button>
        </form>

        {stakingInfo && parseFloat(stakingInfo.stakedAmount) > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleUnstake}
              disabled={isPending || isConfirming}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              Unstake All
            </button>
            <button
              onClick={handleClaim}
              disabled={isPending || isConfirming}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              Claim Rewards
            </button>
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
                  {isSuccess ? 'Transaction Confirmed' : 'Transaction Pending'}
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

export default Staking;
