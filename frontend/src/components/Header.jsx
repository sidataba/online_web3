import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Wallet, LogOut } from 'lucide-react';

function Header() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Web3 DApp</h1>
              <p className="text-xs text-slate-400">Decentralized Application</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <>
                <div className="hidden sm:block bg-slate-700/50 px-4 py-2 rounded-lg">
                  <p className="text-xs text-slate-400">Connected</p>
                  <p className="text-sm font-mono text-white">
                    {truncateAddress(address)}
                  </p>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </>
            ) : (
              <w3m-button />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
