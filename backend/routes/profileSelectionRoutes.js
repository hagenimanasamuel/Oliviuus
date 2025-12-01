// routes/profileSelectionRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getAvailableProfiles,
  switchToAdultMode,
  checkProfileSelection
} = require("../controllers/profileSelectionController");

// Make sure these routes match what your frontend is calling
router.get("/check-selection", authMiddleware, checkProfileSelection);
router.get("/profiles/available", authMiddleware, getAvailableProfiles);
router.post("/switch-to-adult", authMiddleware, switchToAdultMode);

module.exports = router;