const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getAvailableProfiles,
  checkProfileSelection
} = require("../controllers/profileSelectionController");

router.get("/check-selection", authMiddleware, checkProfileSelection);
router.get("/profiles/available", authMiddleware, getAvailableProfiles);

module.exports = router;