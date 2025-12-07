// src/routes/kidRoutes.js
const express = require("express");
const {
  getKidLandingContent,
  getAllKidContent,
  getKidContentById,
  trackKidContentView,
  getKidFilters,
  getKidViewingHistory,
  clearKidViewingHistory,
  getKidRecommendations,
  getKidDashboardStats,
  getKidContentPreferences,
  getBatchKidPreferences,
  searchKidContent,
  getKidTrendingContent,
  getKidLearningContent,
  getKidLikedContent,
  getKidWatchLaterContent,
  toggleKidLikedContent,
  toggleKidWatchLaterContent,
  removeKidLikedContent,
  removeKidWatchLaterContent,
  getBatchKidLikesStatus,
  getKidSongsMusicContent,
} = require("../controllers/kidController");
const { extractDeviceInfo } = require("../controllers/viewerController");
const authMiddleware = require("../middlewares/authMiddleware");
const kidSessionAuth = require("../middlewares/kidSessionAuth");
const kidContentFilter = require("../middlewares/kidContentFilter");

const router = express.Router();

// Device info extraction for all kid routes
router.use(extractDeviceInfo);

// All kid routes require authentication and kid session
router.use(authMiddleware);
router.use(kidSessionAuth);
router.use(kidContentFilter);

// Content routes
router.get("/landing-content", getKidLandingContent);
router.get("/content", getAllKidContent);
router.get("/content/:contentId", getKidContentById);
router.post("/content/:contentId/view", trackKidContentView);

// Filter and browsing routes
router.get("/filters", getKidFilters);
router.get("/viewing-history", getKidViewingHistory);
router.delete("/viewing-history", clearKidViewingHistory);
router.get("/recommendations", getKidRecommendations);
router.get("/dashboard-stats", getKidDashboardStats);
router.get("/preferences/:contentId", getKidContentPreferences);
router.post("/preferences/batch", getBatchKidPreferences);
router.get("/search", searchKidContent);
router.get("/trending", getKidTrendingContent);
router.get("/learning", getKidLearningContent);
router.get("/songs-music", getKidSongsMusicContent);

// Liked content routes
router.get("/liked-content", getKidLikedContent);
router.post("/liked-content", toggleKidLikedContent);
router.delete("/liked-content/:contentId", removeKidLikedContent);

// Watch later routes
router.get("/watch-later", getKidWatchLaterContent);
router.post("/watch-later", toggleKidWatchLaterContent);
router.delete("/watch-later/:contentId", removeKidWatchLaterContent);

// Batch likes status route
router.get("/likes/status", getBatchKidLikesStatus);

module.exports = router;