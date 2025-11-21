import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ShoppingCart, Loader2, CheckCircle, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

// Marketplace Contract ABI
const MARKETPLACE_ABI = [
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' }
    ],
    name: 'listNFT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'buyNFT',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'listingId', type: 'uint256' }],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

function Marketplace() {
  const { address } = useAccount();
  const [marketplaceAddress, setMarketplaceAddress] = useState('');
  const [activeTab, setActiveTab] = useState('list');

  // List NFT state
  const [nftContract, setNftContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');

  // Buy NFT state
  const [listingId, setListingId] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleListNFT = async (e) => {
    e.preventDefault();

    if (!marketplaceAddress || !nftContract || !tokenId || !price) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      writeContract({
        address: marketplaceAddress,
        abi: MARKETPLACE_ABI,
        functionName: 'listNFT',
        args: [nftContract, BigInt(tokenId), parseEther(price)]
      });
      toast.success('Listing transaction submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to list NFT');
    }
  };

  const handleBuyNFT = async (e) => {
    e.preventDefault();

    if (!marketplaceAddress || !listingId || !buyPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      writeContract({
        address: marketplaceAddress,
        abi: MARKETPLACE_ABI,
        functionName: 'buyNFT',
        args: [BigInt(listingId)],
        value: parseEther(buyPrice)
      });
      toast.success('Purchase transaction submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to buy NFT');
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      toast.success('Transaction successful!');
      setTokenId('');
      setPrice('');
      setListingId('');
      setBuyPrice('');
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <ShoppingCart className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-bold gradient-text">NFT Marketplace</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Marketplace Contract Address
          </label>
          <input
            type="text"
            value={marketplaceAddress}
            onChange={(e) => setMarketplaceAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'list'
                ? 'bg-pink-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Tag className="w-4 h-4 inline mr-2" />
            List NFT
          </button>
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'buy'
                ? 'bg-pink-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShoppingCart className="w-4 h-4 inline mr-2" />
            Buy NFT
          </button>
        </div>

        {activeTab === 'list' ? (
          <form onSubmit={handleListNFT} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                NFT Contract Address
              </label>
              <input
                type="text"
                value={nftContract}
                onChange={(e) => setNftContract(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Token ID
              </label>
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.1"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Listing...</span>
                </>
              ) : (
                <>
                  <Tag className="w-5 h-5" />
                  <span>List NFT</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBuyNFT} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Listing ID
              </label>
              <input
                type="number"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.1"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Buying...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Buy NFT</span>
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

export default Marketplace;
