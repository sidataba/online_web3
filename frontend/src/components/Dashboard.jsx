import { useState, useEffect } from 'react';
import { useAccount, useBalance, useBlockNumber } from 'wagmi';
import { Wallet, TrendingUp, Clock, Network } from 'lucide-react';
import axios from 'axios';

function Dashboard() {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const [gasPrice, setGasPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchGasPrice = async () => {
    try {
      const response = await axios.get('/api/blockchain/gas-price');
      setGasPrice(response.data);
    } catch (error) {
      console.error('Error fetching gas price:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      icon: Wallet,
      label: 'Balance',
      value: balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0',
      color: 'text-blue-500'
    },
    {
      icon: TrendingUp,
      label: 'Gas Price',
      value: gasPrice ? `${parseFloat(gasPrice.gasPrice).toFixed(2)} Gwei` : 'Loading...',
      color: 'text-green-500'
    },
    {
      icon: Clock,
      label: 'Block Number',
      value: blockNumber ? blockNumber.toString() : 'Loading...',
      color: 'text-purple-500'
    },
    {
      icon: Network,
      label: 'Network',
      value: gasPrice?.network || 'sepolia',
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 gradient-text">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-slate-700/30 p-6 rounded-lg border border-slate-600 card-hover"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white truncate">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-white">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-400">Address</span>
            <span className="text-white font-mono text-sm">{address}</span>
          </div>
          {gasPrice && (
            <>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-400">Max Fee Per Gas</span>
                <span className="text-white">
                  {parseFloat(gasPrice.maxFeePerGas).toFixed(2)} Gwei
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-400">Priority Fee</span>
                <span className="text-white">
                  {parseFloat(gasPrice.maxPriorityFeePerGas).toFixed(2)} Gwei
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
