// backend/routes/isanzure/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/isanzure/bookingController');
const authMiddleware = require('../../middlewares/authMiddleware');

// ============================================
// ✅ PUBLIC WEBHOOK - NO AUTH (Called by LMBTech)
// ============================================
router.post('/webhook', bookingController.handlePaymentWebhook);
router.post('/callback', bookingController.handleBookingPaymentCallback); // Legacy

// ============================================
// ✅ AVAILABILITY CHECK
// ============================================
router.post('/check-availability', authMiddleware, bookingController.checkBookingAvailability);

// ============================================
// ✅ ALL OTHER ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authMiddleware);

// ============================================
// 💰 BOOKING PAYMENT ENDPOINTS
// ============================================
router.post('/initiate', bookingController.initiateBookingPayment);
router.get('/status/:referenceId', bookingController.checkBookingPaymentStatus);

module.exports = router;