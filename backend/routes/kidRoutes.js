// src/routes/kidRoutes.js
const express = require("express");
const {
  getKidLandingContent,
  getAllKidContent,
  getKidContentById,
  trackKidContentView,
  getKidFavorites,
  toggleKidFavorite,
  getKidFilters,
} = require("../controllers/kidController");
const authMiddleware = require("../middlewares/authMiddleware");
const kidSessionAuth = require("../middlewares/kidSessionAuth");
const kidContentFilter = require("../middlewares/kidContentFilter");

const router = express.Router();

// All kid routes require authentication and kid session
router.use(authMiddleware);
router.use(kidSessionAuth);
router.use(kidContentFilter);

// Kid content routes
router.get("/landing-content", getKidLandingContent);
router.get("/content", getAllKidContent);
router.get("/content/:contentId", getKidContentById);
router.post("/content/:contentId/view", trackKidContentView);

// Kid favorites
router.get("/favorites", getKidFavorites);
router.post("/favorites", toggleKidFavorite);

// Filters and metadata
router.get("/filters", getKidFilters);

module.exports = router;