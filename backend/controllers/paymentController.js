import Stripe from 'stripe';
import { AppError } from '../middleware/errorHandler.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Create payment intent for crypto purchase
 */
export const createPaymentIntent = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment system not configured', 500);
    }

    const { amount, currency = 'usd', cryptoAmount, cryptoSymbol } = req.body;

    if (!amount || !cryptoAmount) {
      throw new AppError('Amount and crypto amount required', 400);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        cryptoAmount,
        cryptoSymbol: cryptoSymbol || 'ETH',
        type: 'crypto_purchase'
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create checkout session for marketplace purchase
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment system not configured', 500);
    }

    const { nftId, price, name, description, imageUrl } = req.body;

    if (!nftId || !price) {
      throw new AppError('NFT ID and price required', 400);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: name || `NFT #${nftId}`,
              description: description || 'Digital Collectible NFT',
              images: imageUrl ? [imageUrl] : []
            },
            unit_amount: Math.round(price * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.CORS_ORIGIN}/marketplace?success=true&nftId=${nftId}`,
      cancel_url: `${process.env.CORS_ORIGIN}/marketplace?cancelled=true`,
      metadata: {
        nftId,
        type: 'nft_purchase'
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment system not configured', 500);
    }

    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create customer for recurring payments
 */
export const createCustomer = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment system not configured', 500);
    }

    const { email, name, address } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const customer = await stripe.customers.create({
      email,
      name,
      address,
      metadata: {
        walletAddress: address
      }
    });

    res.json({
      customerId: customer.id,
      email: customer.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate MoonPay widget URL
 */
export const getMoonPayUrl = async (req, res, next) => {
  try {
    const { walletAddress, currencyCode = 'eth', baseCurrencyAmount } = req.body;

    if (!walletAddress) {
      throw new AppError('Wallet address required', 400);
    }

    const moonPayApiKey = process.env.MOONPAY_API_KEY;

    if (!moonPayApiKey) {
      throw new AppError('MoonPay not configured', 500);
    }

    const params = new URLSearchParams({
      apiKey: moonPayApiKey,
      walletAddress,
      currencyCode,
      ...(baseCurrencyAmount && { baseCurrencyAmount })
    });

    const moonPayUrl = `https://buy.moonpay.com?${params.toString()}`;

    res.json({
      url: moonPayUrl,
      provider: 'MoonPay'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Transak widget URL
 */
export const getTransakUrl = async (req, res, next) => {
  try {
    const { walletAddress, cryptoCurrency = 'ETH', fiatCurrency = 'USD' } = req.body;

    if (!walletAddress) {
      throw new AppError('Wallet address required', 400);
    }

    const transakApiKey = process.env.TRANSAK_API_KEY;

    if (!transakApiKey) {
      throw new AppError('Transak not configured', 500);
    }

    const params = new URLSearchParams({
      apiKey: transakApiKey,
      walletAddress,
      cryptoCurrency,
      fiatCurrency,
      network: process.env.ETHEREUM_NETWORK || 'ethereum'
    });

    const transakUrl = `https://global.transak.com/?${params.toString()}`;

    res.json({
      url: transakUrl,
      provider: 'Transak'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get crypto price
 */
export const getCryptoPrice = async (req, res, next) => {
  try {
    const { symbol = 'ETH', currency = 'USD' } = req.params;

    // Use CoinGecko API for price
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=${currency.toLowerCase()}`
    );

    const data = await response.json();
    const price = data.ethereum?.[currency.toLowerCase()];

    if (!price) {
      throw new AppError('Price not found', 404);
    }

    res.json({
      symbol,
      currency,
      price,
      timestamp: Date.now()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Webhook handler for Stripe events
 */
export const handleWebhook = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new AppError('Payment system not configured', 500);
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      throw new AppError(`Webhook Error: ${err.message}`, 400);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        // Handle successful payment (e.g., release tokens)
        break;

      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        // Handle NFT purchase completion
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};
