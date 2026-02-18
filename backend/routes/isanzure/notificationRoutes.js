// backend/routes/isanzure/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/isanzure/notificationController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET ALL COUNTS IN ONE CALL (RECOMMENDED)
router.get('/counts/all', notificationController.getAllNotificationCounts);

// INDIVIDUAL COUNTS
router.get('/counts/messages', notificationController.getUnreadMessagesCount);
router.get('/counts/bookings', notificationController.getPendingBookingsCount);
router.get('/counts/payments', notificationController.getPendingPaymentsCount);
router.get('/counts/verifications', notificationController.getPendingVerificationsCount);
router.get('/counts/wishlist', notificationController.getWishlistNotificationsCount);

// MARK AS READ
router.put('/:type/:id/read', notificationController.markAsRead);
router.put('/:type/mark-all-read', notificationController.markAllAsRead);

module.exports = router;