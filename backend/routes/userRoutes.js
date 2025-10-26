const express = require("express");
const { updatePassword } = require("../controllers/authController");
const {
  deactivateAccount, 
  deleteAccount, 
  getUsers, 
  getTotalUsers, 
  exportUsers, 
  updateUserStatus, 
  updateUserEmail, 
  adminDeleteUser, 
  getUserById, 
  getUserLoginSessions,
  getUserOverview,
  getUserActivityTimeline,
  updateUserPreferences,
  getUserSubscriptionHistory,
  getUserSecuritySettings,
  getEnhancedUserLoginSessions,
  terminateUserSession,
  terminateAllUserSessions,
  sendPasswordReset,
  forcePasswordReset,
  getUserSecurityInfo,
  updateUserRole,
  getUserSubscription,
  updateUserSubscription,
  cancelUserSubscription,
  getSubscriptionPlans,
  createUserSubscription,
  getUserSecurityLogs,
  exportSecurityLogs,
  sendUserNotification,
  getUserNotifications,
  markNotificationAsRead,
  archiveNotification,
  bulkUserOperations,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// update the current user's password
router.put("/update-password", authMiddleware, updatePassword);

// Deactivate account (PUT)
router.put("/deactivate-account", authMiddleware, deactivateAccount);

// Delete account (DELETE)
router.delete("/delete-account", authMiddleware, deleteAccount);

// ✅ Fetch all users 
router.get("/", authMiddleware, getUsers);

// get total users count
router.get("/total", getTotalUsers);

// export users to CSV
router.get("/export", authMiddleware, adminMiddleware, exportUsers);


// ✅ Update user status (activate/deactivate)
router.put("/:userId/status", authMiddleware, adminMiddleware, updateUserStatus);

// ✅ Update user email  
router.put("/:userId/email", authMiddleware, adminMiddleware, updateUserEmail);

// ✅ Delete user account (admin)
router.delete("/:userId", authMiddleware, adminMiddleware, adminDeleteUser);

// ✅ Get user details by ID
router.get("/:userId", authMiddleware, adminMiddleware, getUserById);

// ✅ Get user login sessions
router.get("/:userId/sessions", authMiddleware, adminMiddleware, getUserLoginSessions);

// ✅ Get user overview data
router.get("/:userId/overview", authMiddleware, adminMiddleware, getUserOverview);

// ✅ Get user activity timeline
router.get("/:userId/activity-timeline", authMiddleware, adminMiddleware, getUserActivityTimeline);

// ✅ Update user preferences
router.put("/:userId/preferences", authMiddleware, adminMiddleware, updateUserPreferences);

// ✅ Get user subscription history
router.get("/:userId/subscription-history", authMiddleware, adminMiddleware, getUserSubscriptionHistory);

// ✅ Get user security settings
router.get("/:userId/security", authMiddleware, adminMiddleware, getUserSecuritySettings);

// ✅ Enhanced login sessions with filtering
router.get("/:userId/sessions/enhanced", authMiddleware, adminMiddleware, getEnhancedUserLoginSessions);

// ✅ Terminate specific session
router.delete("/:userId/sessions/:sessionId", authMiddleware, adminMiddleware, terminateUserSession);

// ✅ Terminate all sessions
router.delete("/:userId/sessions", authMiddleware, adminMiddleware, terminateAllUserSessions);

// ✅ Send password reset email (admin)
router.post("/:userId/send-password-reset", authMiddleware, adminMiddleware, sendPasswordReset);

// ✅ Force password reset (admin)
router.put("/:userId/force-password-reset", authMiddleware, adminMiddleware, forcePasswordReset);

// ✅ Get user security info (admin)
router.get("/:userId/security-info", authMiddleware, adminMiddleware, getUserSecurityInfo);

// change user's role route
router.put("/:userId/role", authMiddleware, adminMiddleware, updateUserRole);

// ✅ Get user subscription details
router.get("/:userId/subscription", authMiddleware, adminMiddleware, getUserSubscription);

// ✅ Update user subscription
router.put("/:userId/subscription", authMiddleware, adminMiddleware, updateUserSubscription);

// ✅ Create new subscription for user
router.post("/:userId/subscription", authMiddleware, adminMiddleware, createUserSubscription);

// ✅ Cancel user subscription
router.delete("/:userId/subscription", authMiddleware, adminMiddleware, cancelUserSubscription);

// ✅ Get available subscription plans
router.get("/subscription/plans", authMiddleware, adminMiddleware, getSubscriptionPlans);

// Get user security logs
router.get('/:userId/security-logs', getUserSecurityLogs);

// Export user security logs
router.get('/:userId/security-logs/export', exportSecurityLogs);

// ✅ User Notifications Routes
router.get('/:userId/notifications', getUserNotifications);
router.post('/:userId/send-notification', sendUserNotification);
router.put('/:userId/notifications/:notificationId/read', markNotificationAsRead);
router.put('/:userId/notifications/:notificationId/archive', archiveNotification);

// ✅ Bulk user operations
router.post('/bulk-operations', bulkUserOperations);

module.exports = router;