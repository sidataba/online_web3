import express from 'express';
import {
  createPaymentIntent,
  createCheckoutSession,
  getPaymentStatus,
  createCustomer,
  getMoonPayUrl,
  getTransakUrl,
  getCryptoPrice,
  handleWebhook
} from '../controllers/paymentController.js';

const router = express.Router();

// Stripe payment routes
router.post('/create-payment-intent', createPaymentIntent);
router.post('/create-checkout-session', createCheckoutSession);
router.get('/payment-status/:paymentIntentId', getPaymentStatus);
router.post('/create-customer', createCustomer);

// Crypto on-ramp routes
router.post('/moonpay-url', getMoonPayUrl);
router.post('/transak-url', getTransakUrl);

// Price API
router.get('/crypto-price/:symbol/:currency', getCryptoPrice);

// Webhook (raw body needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
