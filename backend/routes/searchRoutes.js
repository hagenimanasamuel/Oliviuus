const express = require("express");
const {
  searchContent,
  quickSearch,
  getSearchAnalytics
} = require("../controllers/searchController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// Public search routes
router.get("/", searchContent);
router.get("/quick", quickSearch);

// Admin analytics route
router.get("/analytics", authMiddleware, adminMiddleware, getSearchAnalytics);

module.exports = router;