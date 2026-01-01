// In your users route file (or create new liveUsersRoutes.js)
const express = require("express");
const {
  getLiveOverview,
  getLiveUsersList,
  getLiveUserDetails,
  getRealtimeStats,
  getLiveUsersMap,
  getHistoricalTrends,
  forceDisconnectUser,
  bulkDisconnectUsers,
  getSessionWarnings,
  getLiveEventsFeed,
  exportLiveUsers,
  cleanupExpiredSessions
} = require("../controllers/liveUsersController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// ✅ LIVE USERS ROUTES
router.get("/live/overview", authMiddleware, adminMiddleware, getLiveOverview);
router.get("/live/users", authMiddleware, adminMiddleware, getLiveUsersList);
router.get("/live/users/:sessionId", authMiddleware, adminMiddleware, getLiveUserDetails);
router.get("/live/realtime-stats", authMiddleware, adminMiddleware, getRealtimeStats);
router.get("/live/map", authMiddleware, adminMiddleware, getLiveUsersMap);
router.get("/live/historical-trends", authMiddleware, adminMiddleware, getHistoricalTrends);
router.get("/live/session-warnings", authMiddleware, adminMiddleware, getSessionWarnings);
router.get("/live/events-feed", authMiddleware, adminMiddleware, getLiveEventsFeed);

// Admin actions
router.delete("/live/users/:sessionId/disconnect", authMiddleware, adminMiddleware, forceDisconnectUser);
router.post("/live/users/bulk-disconnect", authMiddleware, adminMiddleware, bulkDisconnectUsers);

// Export
router.get("/live/export", authMiddleware, adminMiddleware, exportLiveUsers);

// Maintenance (can be called by cron job)
router.post("/live/cleanup", authMiddleware, adminMiddleware, cleanupExpiredSessions);

module.exports = router;