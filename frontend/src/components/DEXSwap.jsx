import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ArrowDownUp, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

// Swap Contract ABI
const SWAP_ABI = [
  {
    inputs: [
      { name: 'poolId', type: 'bytes32' },
      { name: 'tokenIn', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' }
    ],
    name: 'swap',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

function DEXSwap() {
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [poolId, setPoolId] = useState('');
  const [tokenIn, setTokenIn] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const getQuote = async () => {
    if (!contractAddress || !poolId || !tokenIn || !amountIn) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoadingQuote(true);
    try {
      const response = await axios.post(`/api/defi/swap-quote/${contractAddress}`, {
        poolId,
        tokenIn,
        amountIn
      });
      setQuote(response.data);
      toast.success('Quote fetched!');
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Failed to fetch quote');
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleSwap = async (e) => {
    e.preventDefault();

    if (!quote) {
      toast.error('Get a quote first');
      return;
    }

    try {
      const minAmountOut = parseFloat(quote.amountOut) * 0.99; // 1% slippage tolerance

      writeContract({
        address: contractAddress,
        abi: SWAP_ABI,
        functionName: 'swap',
        args: [
          poolId,
          tokenIn,
          parseEther(amountIn),
          parseEther(minAmountOut.toString())
        ]
      });
      toast.success('Swap transaction submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to swap');
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      toast.success('Swap completed!');
      setAmountIn('');
      setQuote(null);
    }, 2000);
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <ArrowDownUp className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold gradient-text">Token Swap</h2>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-200">
          <strong>DEX Swap:</strong> Exchange tokens through liquidity pools with minimal slippage.
          Get a quote before swapping to see the expected output.
        </p>
      </div>

      <form onSubmit={handleSwap} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Swap Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Pool ID
          </label>
          <input
            type="text"
            value={poolId}
            onChange={(e) => setPoolId(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Token In Address
          </label>
          <input
            type="text"
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Amount In
          </label>
          <input
            type="number"
            step="0.000001"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={getQuote}
          disabled={loadingQuote}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          {loadingQuote ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Getting Quote...</span>
            </>
          ) : (
            <span>Get Quote</span>
          )}
        </button>

        {quote && (
          <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">Expected Output</span>
              <span className="text-white font-bold text-lg">{parseFloat(quote.amountOut).toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Slippage Tolerance</span>
              <span className="text-green-400 text-sm">1%</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!quote || isPending || isConfirming}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isPending ? 'Swapping...' : 'Confirming...'}</span>
            </>
          ) : (
            <>
              <ArrowDownUp className="w-5 h-5" />
              <span>Swap Tokens</span>
            </>
          )}
        </button>

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
                  {isSuccess ? 'Swap Successful!' : 'Transaction Pending'}
                </p>
                <p className="text-xs text-slate-400 font-mono break-all">{hash}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default DEXSwap;
