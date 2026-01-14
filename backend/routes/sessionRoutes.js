const express = require("express");
const { logoutSession, logoutAllOtherSessions } = require("../controllers/sessionController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Logout a specific session
router.post("/logout", authMiddleware, logoutSession);

// Logout all other sessions except current one
router.post("/logout-all", authMiddleware, logoutAllOtherSessions);

module.exports = router;


