// backend/routes/isanzure/landlordBookingRoutes.js
const express = require('express');
const router = express.Router();
const landlordBookingController = require('../../controllers/isanzure/landlordBookingController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication and landlord access
router.use(authMiddleware);

// ============================================
// 📋 BOOKING MANAGEMENT
// ============================================

// Get all bookings for landlord's properties
router.get('/', landlordBookingController.getLandlordBookings);

// Get booking details by ID or UID
router.get('/:bookingId', landlordBookingController.getBookingDetails);

// Update booking status (confirm, cancel, complete)
router.put('/:bookingId/status', landlordBookingController.updateBookingStatus);

// Handle extension request (approve/reject)
router.put('/extensions/:extensionId', landlordBookingController.handleExtensionRequest);

// ============================================
// 📊 ANALYTICS & REPORTS
// ============================================

// Get booking statistics and analytics
router.get('/analytics/overview', landlordBookingController.getBookingAnalytics);

// Get pending requests (extensions, cancellations)
router.get('/requests/pending', landlordBookingController.getPendingRequests);

// Get property booking calendar
router.get('/calendar/property', landlordBookingController.getPropertyBookingCalendar);

// Export bookings (CSV/JSON)
router.get('/export/data', landlordBookingController.exportBookings);

// ============================================
// 💬 COMMUNICATION
// ============================================

// Send message to tenant
router.post('/:bookingId/message', landlordBookingController.sendMessageToTenant);

module.exports = router;