import { useState } from 'react';
import { useAccount } from 'wagmi';
import { History, Search, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function TransactionHistory() {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!txHash) {
      toast.error('Please enter a transaction hash');
      return;
    }

    setLoading(true);
    setTransaction(null);
    setReceipt(null);

    try {
      const [txResponse, receiptResponse] = await Promise.all([
        axios.get(`/api/blockchain/transaction/${txHash}`).catch(() => null),
        axios.get(`/api/blockchain/transaction-receipt/${txHash}`).catch(() => null)
      ]);

      if (txResponse?.data) {
        setTransaction(txResponse.data);
      }

      if (receiptResponse?.data) {
        setReceipt(receiptResponse.data);
      }

      if (!txResponse?.data && !receiptResponse?.data) {
        toast.error('Transaction not found');
      } else {
        toast.success('Transaction loaded!');
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      toast.error('Failed to fetch transaction');
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (hash) => {
    // Using Sepolia Etherscan
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <History className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold gradient-text">Transaction History</h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Transaction Hash
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold px-6 py-3 rounded-lg transition-all flex items-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {(transaction || receipt) && (
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Transaction Details</h3>
            <a
              href={getExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="text-sm">View on Etherscan</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-3">
            {transaction && (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm mb-1 sm:mb-0">Hash</span>
                  <span className="text-white text-sm font-mono break-all">
                    {transaction.hash}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm">From</span>
                  <span className="text-white text-sm font-mono truncate max-w-[200px]">
                    {transaction.from}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm">To</span>
                  <span className="text-white text-sm font-mono truncate max-w-[200px]">
                    {transaction.to || 'Contract Creation'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm">Value</span>
                  <span className="text-white text-sm font-bold">
                    {transaction.value} ETH
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm">Gas Price</span>
                  <span className="text-white text-sm">
                    {transaction.gasPrice ? `${transaction.gasPrice} Gwei` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm">Block Number</span>
                  <span className="text-white text-sm">{transaction.blockNumber || 'Pending'}</span>
                </div>
              </>
            )}

            {receipt && (
              <>
                <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm">Status</span>
                  <span
                    className={`text-sm font-bold ${
                      receipt.status === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {receipt.status === 'success' ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm">Gas Used</span>
                  <span className="text-white text-sm">{receipt.gasUsed}</span>
                </div>
                {receipt.contractAddress && (
                  <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400 text-sm mb-1 sm:mb-0">Contract Address</span>
                    <span className="text-white text-sm font-mono break-all">
                      {receipt.contractAddress}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!transaction && !receipt && !loading && (
        <div className="bg-slate-800/50 backdrop-blur-sm p-12 rounded-xl border border-slate-700 text-center">
          <History className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">
            Enter a transaction hash to view its details
          </p>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
