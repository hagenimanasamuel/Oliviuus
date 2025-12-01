const express = require("express");
const {
  getViewerLandingContent,
  getAllViewerContent,
  getViewerContentById,
  trackContentView,
  rateContent,
  getWatchHistory,
  toggleWatchlist,
  toggleLike,
  getUserContentPreferences,
  getBatchUserPreferences,
  getUserWatchlist,
  extractDeviceInfo
} = require("../controllers/viewerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes (no auth required)
router.get("/content", getAllViewerContent);

// Protected routes (auth required) - Apply security to content by ID
router.get("/content/:contentId", authMiddleware, extractDeviceInfo, getViewerContentById);
router.post("/content/:contentId/view", authMiddleware, extractDeviceInfo, trackContentView);

// Other protected routes
router.get("/landing-content", authMiddleware, extractDeviceInfo, getViewerLandingContent);
router.get("/watch-history", authMiddleware, extractDeviceInfo, getWatchHistory);
router.post("/content/:contentId/rate", authMiddleware, extractDeviceInfo, rateContent);
router.post("/watchlist", authMiddleware, extractDeviceInfo, toggleWatchlist);
router.post("/likes", authMiddleware, extractDeviceInfo, toggleLike);
router.get("/preferences/:contentId", authMiddleware, extractDeviceInfo, getUserContentPreferences);
router.post("/preferences/batch", authMiddleware, extractDeviceInfo, getBatchUserPreferences);
router.get("/watchlist", authMiddleware, extractDeviceInfo, getUserWatchlist);

module.exports = router;