// backend/routes/isanzure/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/isanzure/notificationController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// 📊 NOTIFICATION COUNTS - ALL ENDPOINTS WORKING
// ============================================

// ✅ GET ALL COUNTS IN ONE CALL (RECOMMENDED - USE THIS)
router.get('/counts/all', notificationController.getAllNotificationCounts);

// ✅ INDIVIDUAL COUNTS (FALLBACK - ALL IMPLEMENTED)
router.get('/counts/messages', notificationController.getUnreadMessagesCount);
router.get('/counts/bookings', notificationController.getPendingBookingsCount);
router.get('/counts/payments', notificationController.getPendingPaymentsCount);
router.get('/counts/verifications', notificationController.getPendingVerificationsCount);
router.get('/counts/tenants', notificationController.getPendingTenantsCount);
router.get('/counts/system', notificationController.getUnreadSystemNotificationsCount);

// ============================================
// ✅ MARK AS READ - ALL IMPLEMENTED
// ============================================

// Mark specific notification as read
// Types: message, booking, payment, verification, tenant, system
router.put('/:type/:id/read', notificationController.markAsRead);

// Mark all notifications of a type as read
// Types: messages, bookings, payments, verifications, tenants, system, all
router.put('/:type/mark-all-read', notificationController.markAllAsRead);

// ============================================
// ⚙️ PREFERENCES - ALL IMPLEMENTED
// ============================================

// Get notification preferences
router.get('/preferences', notificationController.getNotificationPreferences);

// Update notification preferences
router.put('/preferences', notificationController.updateNotificationPreferences);

router.get('/counts/wishlist', notificationController.getWishlistNotificationsCount);

module.exports = router;