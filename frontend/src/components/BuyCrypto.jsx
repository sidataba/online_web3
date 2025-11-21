import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { CreditCard, Zap, Loader2, ExternalLink, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

function BuyCrypto() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('moonpay');
  const [amount, setAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('0');
  const [ethPrice, setEthPrice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEthPrice();
  }, []);

  useEffect(() => {
    if (amount && ethPrice) {
      const crypto = (parseFloat(amount) / ethPrice).toFixed(6);
      setCryptoAmount(crypto);
    } else {
      setCryptoAmount('0');
    }
  }, [amount, ethPrice]);

  const fetchEthPrice = async () => {
    try {
      const response = await axios.get('/api/payment/crypto-price/ETH/USD');
      setEthPrice(response.data.price);
    } catch (error) {
      console.error('Error fetching price:', error);
      toast.error('Failed to fetch ETH price');
    }
  };

  const handleMoonPay = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/payment/moonpay-url', {
        walletAddress: address,
        currencyCode: 'eth',
        baseCurrencyAmount: amount || undefined
      });

      window.open(response.data.url, '_blank');
      toast.success('Opening MoonPay...');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to open MoonPay');
    } finally {
      setLoading(false);
    }
  };

  const handleTransak = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/payment/transak-url', {
        walletAddress: address,
        cryptoCurrency: 'ETH',
        fiatCurrency: 'USD'
      });

      window.open(response.data.url, '_blank');
      toast.success('Opening Transak...');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to open Transak');
    } finally {
      setLoading(false);
    }
  };

  const handleStripe = async () => {
    if (!address || !amount) {
      toast.error('Please enter an amount');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/payment/create-payment-intent', {
        amount: parseFloat(amount),
        currency: 'usd',
        cryptoAmount,
        cryptoSymbol: 'ETH'
      });

      // In a real implementation, you'd integrate Stripe Elements here
      toast.success('Payment intent created! (Stripe Elements integration needed)');
      console.log('Client secret:', response.data.clientSecret);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <CreditCard className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold gradient-text">Buy Crypto</h2>
        </div>

        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-200">
            <strong>Purchase crypto with credit card or bank transfer.</strong> Multiple payment
            providers supported for instant crypto purchases.
          </p>
        </div>

        {/* Price Display */}
        {ethPrice && (
          <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current ETH Price</span>
              <span className="text-xl font-bold text-white">
                ${ethPrice.toLocaleString()} USD
              </span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Amount (USD)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {amount && (
            <p className="text-sm text-slate-400 mt-2">
              ≈ {cryptoAmount} ETH
            </p>
          )}
        </div>

        {/* Provider Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('moonpay')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'moonpay'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            MoonPay
          </button>
          <button
            onClick={() => setActiveTab('transak')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'transak'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Transak
          </button>
          <button
            onClick={() => setActiveTab('stripe')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'stripe'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Credit Card
          </button>
        </div>

        {/* Provider Info */}
        <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600 mb-6">
          {activeTab === 'moonpay' && (
            <>
              <h3 className="font-bold text-white mb-2">MoonPay</h3>
              <p className="text-sm text-slate-300 mb-2">
                Popular crypto on-ramp supporting credit cards, debit cards, and bank transfers.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Fees: 3.5% - 4.5%</li>
                <li>• Instant delivery</li>
                <li>• 150+ countries</li>
              </ul>
            </>
          )}
          {activeTab === 'transak' && (
            <>
              <h3 className="font-bold text-white mb-2">Transak</h3>
              <p className="text-sm text-slate-300 mb-2">
                Global fiat-to-crypto gateway with competitive rates and fast processing.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Fees: 0.99% - 5.5%</li>
                <li>• Bank transfer & cards</li>
                <li>• 160+ countries</li>
              </ul>
            </>
          )}
          {activeTab === 'stripe' && (
            <>
              <h3 className="font-bold text-white mb-2">Credit Card (Stripe)</h3>
              <p className="text-sm text-slate-300 mb-2">
                Direct credit card payment processing through Stripe.
              </p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Fees: 2.9% + $0.30</li>
                <li>• Instant processing</li>
                <li>• Major cards accepted</li>
              </ul>
            </>
          )}
        </div>

        {/* Buy Button */}
        <button
          onClick={
            activeTab === 'moonpay'
              ? handleMoonPay
              : activeTab === 'transak'
              ? handleTransak
              : handleStripe
          }
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Opening...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Buy with {activeTab === 'moonpay' ? 'MoonPay' : activeTab === 'transak' ? 'Transak' : 'Card'}</span>
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <p className="text-xs text-yellow-200">
            ⚠️ You will be redirected to a third-party provider. Please review their terms and fees
            before completing your purchase.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BuyCrypto;
