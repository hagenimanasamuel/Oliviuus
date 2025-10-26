const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Initialize payment with phone number
router.post('/initiate', authMiddleware, paymentController.initiatePayment);

// PesaPal callback URL
router.get('/callback', paymentController.paymentCallback);

// PesaPal IPN endpoint (for webhooks)
router.post('/ipn', paymentController.handleIPN);

// Check payment status
router.get('/status/:orderId', authMiddleware, paymentController.checkPaymentStatus);

module.exports = router;