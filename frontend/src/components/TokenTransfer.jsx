import { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function TokenTransfer() {
  const { address } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const { data: hash, sendTransaction, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recipient || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      sendTransaction({
        to: recipient,
        value: parseEther(amount)
      });
      toast.success('Transaction submitted!');
    } catch (error) {
      console.error('Error sending transaction:', error);
      toast.error(error.message || 'Failed to send transaction');
    }
  };

  const resetForm = () => {
    setRecipient('');
    setAmount('');
  };

  if (isSuccess) {
    setTimeout(() => {
      toast.success('Transaction confirmed!');
      resetForm();
    }, 1000);
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <Send className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold gradient-text">Send ETH</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            From
          </label>
          <input
            type="text"
            value={address}
            disabled
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isPending ? 'Pending...' : 'Confirming...'}</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send Transaction</span>
            </>
          )}
        </button>

        {hash && (
          <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <div className="flex items-start space-x-3">
              {isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              ) : isConfirming ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-1" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mt-1" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">
                  Transaction {isSuccess ? 'Confirmed' : isConfirming ? 'Pending' : 'Sent'}
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

export default TokenTransfer;
