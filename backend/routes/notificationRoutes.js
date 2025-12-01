const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateUser  = require('../middlewares/authMiddleware');
const adminmiddleware = require('../middlewares/adminMiddleware');

// User routes (require authentication)
router.use(authenticateUser);

// User notification routes
router.get('/', notificationController.getUserNotifications);
router.get('/unread/count', notificationController.getUnreadCount);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:notificationId/archive', notificationController.archiveNotification);

// Admin routes (require admin authorization)
router.get('/admin/notifications', adminmiddleware, notificationController.getAdminNotifications);
router.get('/admin/stats', adminmiddleware, notificationController.getNotificationStats);
router.post('/admin/system-notification', adminmiddleware, notificationController.createSystemNotification);
router.delete('/admin/:notificationId', adminmiddleware, notificationController.deleteNotification);
router.put('/admin/bulk-update', adminmiddleware, notificationController.bulkUpdateNotifications);
router.get('/admin/user/:userId/notifications', adminmiddleware, notificationController.getUserNotificationsByAdmin);

module.exports = router;