const express = require("express");
const {
  // Game Management (Admin)
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  
  // Kid Game Play
  startGameSession,
  submitGameScore,
  saveGameProgress,
  loadGameProgress,
  getKidGameHistory,
  getAvailableGames,
  
  // Parent Analytics
  getKidGameAnalytics
} = require("../controllers/gamesController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');
const kidSessionAuth = require("../middlewares/kidSessionAuth");

const router = express.Router();

// ============================
// PUBLIC GAME ROUTES
// ============================

// Get all available games (public - filtered by age)
router.get("/public", getAllGames);

// Get game details by ID (public)
router.get("/public/:gameId", getGameById);

// ============================
// ADMIN GAME MANAGEMENT ROUTES
// ============================

// Admin routes - require admin middleware
router.get("/admin", authMiddleware, adminMiddleware, getAllGames);
router.get("/admin/:gameId", authMiddleware, adminMiddleware, getGameById);
router.post("/admin", authMiddleware, adminMiddleware, createGame);
router.put("/admin/:gameId", authMiddleware, adminMiddleware, updateGame);
router.delete("/admin/:gameId", authMiddleware, adminMiddleware, deleteGame);

// ============================
// KID GAME PLAY ROUTES
// ============================

// All kid routes require kid session auth
router.use("/kids", authMiddleware, kidSessionAuth);

// Get available games for kid (age-appropriate)
router.get("/kids/available", getAvailableGames);

// Game session management
router.post("/kids/games/:gameId/start", startGameSession);
router.post("/kids/games/:gameId/score", submitGameScore);
router.post("/kids/games/:gameId/save", saveGameProgress);
router.get("/kids/games/:gameId/progress", loadGameProgress);

// Game history
router.get("/kids/history", getKidGameHistory);

// ============================
// PARENT ANALYTICS ROUTES
// ============================

// Parent routes - require authentication
router.get("/parent/kid/:kidId/analytics", authMiddleware, getKidGameAnalytics);

module.exports = router;