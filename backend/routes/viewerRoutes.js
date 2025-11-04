// src/routes/viewerRoutes.js
const express = require("express");
const {
  getViewerLandingContent,
  getAllViewerContent,
  getViewerContentById,
  trackContentView,
  rateContent,
  getWatchHistory,
} = require("../controllers/viewerController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// Public routes (no auth required)
router.get("/content", getAllViewerContent);
router.get("/content/:contentId", getViewerContentById);

// Protected routes (auth required)
router.get("/landing-content", authMiddleware, getViewerLandingContent);
router.get("/watch-history", authMiddleware, getWatchHistory);
router.post("/content/:contentId/view", authMiddleware, trackContentView);
router.post("/content/:contentId/rate", authMiddleware, rateContent);

module.exports = router;