import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { FileCode, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// SimpleStorage Contract ABI
const STORAGE_ABI = [
  {
    inputs: [{ name: 'value', type: 'uint256' }],
    name: 'set',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'get',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

function ContractInteraction() {
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [valueToSet, setValueToSet] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Read contract
  const { data: storedValue, isLoading: isReading, refetch } = useReadContract({
    address: isValidAddress ? contractAddress : undefined,
    abi: STORAGE_ABI,
    functionName: 'get',
    enabled: isValidAddress
  });

  // Write contract
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleAddressChange = (e) => {
    const addr = e.target.value;
    setContractAddress(addr);
    // Simple validation
    setIsValidAddress(/^0x[a-fA-F0-9]{40}$/.test(addr));
  };

  const handleSetValue = async (e) => {
    e.preventDefault();

    if (!valueToSet) {
      toast.error('Please enter a value');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: STORAGE_ABI,
        functionName: 'set',
        args: [BigInt(valueToSet)]
      });
      toast.success('Setting value...');
    } catch (error) {
      console.error('Error setting value:', error);
      toast.error(error.message || 'Failed to set value');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Value refreshed!');
  };

  if (isSuccess) {
    setTimeout(() => {
      toast.success('Value set successfully!');
      setValueToSet('');
      refetch();
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <FileCode className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold gradient-text">Smart Contract Interaction</h2>
        </div>

        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-200">
            <strong>SimpleStorage Contract:</strong> This interface allows you to interact with a
            SimpleStorage contract. Enter the contract address to read and write values.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contract Address
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={handleAddressChange}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {contractAddress && (
              <p className={`text-xs mt-1 ${isValidAddress ? 'text-green-400' : 'text-red-400'}`}>
                {isValidAddress ? '✓ Valid address' : '✗ Invalid address'}
              </p>
            )}
          </div>
        </div>
      </div>

      {isValidAddress && (
        <>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Read Contract</h3>
            <div className="bg-slate-700/30 p-6 rounded-lg border border-slate-600">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Stored Value</p>
                  <p className="text-3xl font-bold text-white">
                    {isReading ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      storedValue?.toString() || '0'
                    )}
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Write Contract</h3>
            <form onSubmit={handleSetValue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Value
                </label>
                <input
                  type="number"
                  value={valueToSet}
                  onChange={(e) => setValueToSet(e.target.value)}
                  placeholder="Enter a number"
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
                    <span>{isPending ? 'Pending...' : 'Confirming...'}</span>
                  </>
                ) : (
                  <>
                    <FileCode className="w-5 h-5" />
                    <span>Set Value</span>
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
                        {isSuccess ? 'Value Updated!' : 'Transaction Pending'}
                      </p>
                      <p className="text-xs text-slate-400 font-mono break-all">{hash}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default ContractInteraction;
