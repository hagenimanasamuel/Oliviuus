// routes/kidSessionRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createKidSession,
  exitKidSession,
  getCurrentKidSession,
  checkProfileSelection
} = require("../controllers/kidSessionController");

// Make sure all route handlers are properly defined
router.post("/session", authMiddleware, createKidSession);
router.post("/session/exit", authMiddleware, exitKidSession);
router.get("/session/current", authMiddleware, getCurrentKidSession);
router.get("/check-selection", authMiddleware, checkProfileSelection);

module.exports = router;