// backend/routes/isanzure/userBookingRoutes.js
const express = require('express');
const router = express.Router();
const userBookingController = require('../../controllers/isanzure/userBookingController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// 📋 BOOKINGS - FOR ALL USERS
// ============================================

// Get user's bookings with filters
router.get('/', userBookingController.getUserBookings);

// Get booking statistics
router.get('/stats', userBookingController.getBookingStats);

// Get single booking details
router.get('/:bookingUid', userBookingController.getBookingDetails);

// ============================================
// 🏨 BOOKING ACTIONS
// ============================================

// Check-in (tenant only)
router.post('/:bookingUid/check-in', userBookingController.checkIn);

// Check-out (tenant only)
router.post('/:bookingUid/check-out', userBookingController.checkOut);

// Request extension (tenant only)
router.post('/:bookingUid/extend', userBookingController.requestExtension);

// Cancel booking (tenant or landlord)
router.post('/:bookingUid/cancel', userBookingController.cancelBooking);

module.exports = router;