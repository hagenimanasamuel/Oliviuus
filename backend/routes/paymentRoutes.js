/**
 * 🛣️ Payment Routes - Combined MoMo + Card
 */

const express = require('express');
const router = express.Router();
const momoPaymentController = require('../controllers/paymentController');
const cardPaymentController = require('../controllers/paymentControllerCard');
const authMiddleware = require('../middlewares/authMiddleware');

// 🔐 MoMo Payment Routes
router.post('/initiate', authMiddleware, momoPaymentController.initiatePayment);
router.get('/status/:referenceId', authMiddleware, momoPaymentController.checkPaymentStatus);

// 💳 Card Payment Routes
router.post('/initiate-card', authMiddleware, cardPaymentController.initiateCardPayment);
router.get('/card-status/:referenceId', authMiddleware, cardPaymentController.checkCardPaymentStatus);
router.get('/card-form/:referenceId', cardPaymentController.generatePaymentForm);

// 🌐 Payment Callbacks (no auth needed)
router.post('/callback', momoPaymentController.handleCallback); // MoMo callback
router.post('/card-callback', cardPaymentController.handleCardCallback); // Card callback

// 🆕 Payment method selection endpoint
router.get('/methods', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    data: {
      methods: [
        {
          id: 'momo',
          name: 'Mobile Money',
          description: 'Pay with MTN or Airtel Mobile Money',
          icon: 'mobile',
          available: true
        },
        {
          id: 'card',
          name: 'Credit/Debit Card',
          description: 'Pay with Visa, Mastercard, or other cards',
          icon: 'credit-card',
          available: true
        }
      ]
    }
  });
});

module.exports = router;