/**
 * 🛣️ Payment Routes - Production Ready
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// 🔐 Payment Routes (Authenticated users only)
router.post('/initiate', authMiddleware, paymentController.initiatePayment);
router.get('/status/:referenceId', authMiddleware, paymentController.checkPaymentStatus);

// 🌐 Payment Callback (called by payment provider - NO AUTH NEEDED)
router.post('/callback', paymentController.handleCallback);

// 🆕 Health check route for payment service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payment service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;