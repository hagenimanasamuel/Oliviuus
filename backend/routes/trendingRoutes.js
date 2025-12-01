const express = require("express");
const {
  getTrendingMovies,
  getTrendingInsights,
  getHealth
} = require("../controllers/trendingController");

const router = express.Router();

// Main trending endpoint
router.get("/movies", getTrendingMovies);

// Insights
router.get("/insights", getTrendingInsights);

// Health check
router.get("/health", getHealth);

module.exports = router;