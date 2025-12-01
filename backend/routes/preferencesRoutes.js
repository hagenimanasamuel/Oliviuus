const express = require("express");
const router = express.Router();
const { getPreferences, updatePreferences } = require("../controllers/preferencesController");
const authMiddleware = require("../middlewares/authMiddleware");

// Get current user's preferences
router.get("/preferences", authMiddleware, getPreferences);

// Update current user's preferences
router.put("/update-preferences", authMiddleware, updatePreferences);

module.exports = router;
