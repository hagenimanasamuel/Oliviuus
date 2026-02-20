// backend/routes/isanzure/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/isanzure/notificationController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// GET ALL COUNTS IN ONE CALL (RECOMMENDED)
// ============================================
router.get('/counts/all', notificationController.getAllNotificationCounts);

// ============================================
// INDIVIDUAL COUNTS - Core
// ============================================
router.get('/counts/messages', notificationController.getUnreadMessagesCount);
router.get('/counts/bookings', notificationController.getPendingBookingsCount);
router.get('/counts/payments', notificationController.getPendingPaymentsCount);
router.get('/counts/verifications', notificationController.getPendingVerificationsCount);
router.get('/counts/wishlist', notificationController.getWishlistNotificationsCount);

// ============================================
// INDIVIDUAL COUNTS - Enhanced (using existing tables)
// ============================================
router.get('/counts/booking-messages', notificationController.getUnreadBookingMessagesCount);
router.get('/counts/active-bookings', notificationController.getActiveBookingsCount);
router.get('/counts/upcoming-bookings', notificationController.getUpcomingBookingsCount);
router.get('/counts/wishlist-items', notificationController.getTotalWishlistItemsCount);
router.get('/counts/wishlist-activity', notificationController.getRecentWishlistActivityCount);
router.get('/counts/withdrawal-verification', notificationController.getPendingWithdrawalVerificationCount);
router.get('/counts/property-verifications', notificationController.getPendingPropertyVerificationsCount);

// ============================================
// ALIASES / ALTERNATIVE NAMES (for frontend compatibility)
// ============================================
router.get('/counts/tenants', notificationController.getPendingBookingsCount);
router.get('/counts/tenants/new', notificationController.getPendingBookingsCount);

// ============================================
// SYSTEM AND REVIEWS ROUTES - Return empty counts (no tables exist)
// ============================================
router.get('/counts/system', (req, res) => {
  res.status(200).json({ 
    success: true, 
    data: { count: 0, hasUnread: false, type: 'system' } 
  });
});

router.get('/counts/reviews', (req, res) => {
  res.status(200).json({ 
    success: true, 
    data: { count: 0, hasUnread: false, type: 'reviews' } 
  });
});

// ============================================
// MARK AS READ
// ============================================
// Individual item
router.put('/:type/:id/read', notificationController.markAsRead);

// Mark all of a type
router.put('/:type/mark-all-read', notificationController.markAllAsRead);

// Convenience endpoints
router.put('/messages/:id/read', (req, res) => {
  req.params.type = 'messages';
  notificationController.markAsRead(req, res);
});

router.put('/messages/read-all', (req, res) => {
  req.params.type = 'messages';
  req.params.id = 'all';
  notificationController.markAsRead(req, res);
});

router.put('/booking-messages/read-all', (req, res) => {
  req.params.type = 'booking_messages';
  req.params.id = 'all';
  notificationController.markAsRead(req, res);
});

module.exports = router;