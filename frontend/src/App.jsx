import { useState } from 'react';
import { useAccount } from 'wagmi';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TokenTransfer from './components/TokenTransfer';
import NFTMinter from './components/NFTMinter';
import ContractInteraction from './components/ContractInteraction';
import TransactionHistory from './components/TransactionHistory';
import Staking from './components/Staking';
import DEXSwap from './components/DEXSwap';
import Marketplace from './components/Marketplace';
import DAOGovernance from './components/DAOGovernance';
import { Wallet } from 'lucide-react';

function App() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transfer', label: 'Transfer' },
    { id: 'staking', label: 'Staking' },
    { id: 'swap', label: 'DEX Swap' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'dao', label: 'DAO' },
    { id: 'nft', label: 'NFT Minter' },
    { id: 'contract', label: 'Contract' },
    { id: 'history', label: 'History' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-slate-800/50 backdrop-blur-sm p-12 rounded-2xl border border-slate-700 max-w-md">
              <Wallet className="w-20 h-20 mx-auto mb-6 text-blue-500" />
              <h2 className="text-3xl font-bold mb-4 gradient-text">
                Welcome to Web3 DApp
              </h2>
              <p className="text-slate-300 mb-8">
                Connect your wallet to access DeFi, NFT marketplace, DAO governance,
                token staking, DEX swaps, and more advanced Web3 features.
              </p>
              <w3m-button />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-slate-800/50 backdrop-blur-sm p-2 rounded-xl border border-slate-700">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'transfer' && <TokenTransfer />}
              {activeTab === 'staking' && <Staking />}
              {activeTab === 'swap' && <DEXSwap />}
              {activeTab === 'marketplace' && <Marketplace />}
              {activeTab === 'dao' && <DAOGovernance />}
              {activeTab === 'nft' && <NFTMinter />}
              {activeTab === 'contract' && <ContractInteraction />}
              {activeTab === 'history' && <TransactionHistory />}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-slate-400 border-t border-slate-800 mt-16">
        <p>🚀 Built with React, Node.js, Solidity & Multi-chain Support</p>
        <p className="text-xs mt-2">DeFi • NFT Marketplace • DAO • Staking • DEX • IPFS</p>
      </footer>
    </div>
  );
}

export default App;
