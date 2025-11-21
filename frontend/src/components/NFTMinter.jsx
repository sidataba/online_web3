import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Image, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// NFT Contract ABI (only the mint function)
const NFT_ABI = [
  {
    inputs: [{ name: 'tokenURI', type: 'string' }],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  }
];

function NFTMinter() {
  const { address } = useAccount();
  const [tokenURI, setTokenURI] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleMint = async (e) => {
    e.preventDefault();

    if (!contractAddress || !tokenURI) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [tokenURI],
        value: parseEther('0.01') // Default mint price
      });
      toast.success('Minting NFT...');
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error(error.message || 'Failed to mint NFT');
    }
  };

  const resetForm = () => {
    setTokenURI('');
  };

  if (isSuccess) {
    setTimeout(() => {
      toast.success('NFT minted successfully!');
      resetForm();
    }, 1000);
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <Image className="w-6 h-6 text-purple-500" />
        <h2 className="text-2xl font-bold gradient-text">Mint NFT</h2>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-200">
          <strong>Note:</strong> Enter your deployed NFT contract address and the metadata URI for your NFT.
          Make sure your wallet has enough ETH to cover the mint price (0.01 ETH) plus gas fees.
        </p>
      </div>

      <form onSubmit={handleMint} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            NFT Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Token URI (Metadata URL)
          </label>
          <input
            type="text"
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="ipfs://... or https://..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Example: ipfs://QmX... or https://example.com/metadata.json
          </p>
        </div>

        <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Mint Price</span>
            <span className="text-white font-bold">0.01 ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Your Address</span>
            <span className="text-white text-sm font-mono truncate max-w-[200px]">
              {address}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isPending ? 'Minting...' : 'Confirming...'}</span>
            </>
          ) : (
            <>
              <Image className="w-5 h-5" />
              <span>Mint NFT</span>
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
                  {isSuccess ? 'NFT Minted!' : 'Transaction Pending'}
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

export default NFTMinter;
