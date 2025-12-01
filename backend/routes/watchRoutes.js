// routes/watchRoutes.js
const express = require("express");
const {
  trackVideoWatching,
  getPlaybackPosition,
  clearPlaybackPosition,
  getWatchStatistics
} = require("../controllers/watchController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Track video watching progress
router.post("/content/:contentId/watch", authMiddleware, trackVideoWatching);

// Get playback position for resume
router.get("/content/:contentId/position", authMiddleware, getPlaybackPosition);

// Clear playback position
router.delete("/content/:contentId/position", authMiddleware, clearPlaybackPosition);

// Get user watch statistics
router.get("/watch-statistics", authMiddleware, getWatchStatistics);

module.exports = router;