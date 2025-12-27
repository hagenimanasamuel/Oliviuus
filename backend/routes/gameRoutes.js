// routes/gamesRoutes.js - COMPLETE FIXED VERSION
const express = require("express");
const {
  // Game Management (Admin)
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  
  // Game Analytics (Admin)
  getGameAnalytics,
  exportGameAnalytics,
  
  // Categories Management
  getGameCategories,
  createGameCategory,
  updateGameCategory,
  deleteGameCategory,
  
  // Educational Skills Management
  getAllEducationalSkills,
  createEducationalSkill,
  updateEducationalSkill,
  deleteEducationalSkill,
  
  // Bulk Operations
  bulkUpdateGames,
  exportGamesData,
  
  // Kid Game Play
  startGameSession,
  submitGameScore,
  saveGameProgress,
  loadGameProgress,
  getKidGameHistory,
  getAvailableGames,
  updateSessionActivity,
  
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

// Game Analytics (Admin)
router.get("/admin/analytics", authMiddleware, adminMiddleware, getGameAnalytics);
router.get("/admin/analytics/export", authMiddleware, adminMiddleware, exportGameAnalytics);

// Game Categories Management (Admin) - ADD THESE ROUTES
router.get("/categories", authMiddleware, adminMiddleware, getGameCategories);
router.post("/categories", authMiddleware, adminMiddleware, createGameCategory);
router.put("/categories/:categoryId", authMiddleware, adminMiddleware, updateGameCategory);
router.delete("/categories/:categoryId", authMiddleware, adminMiddleware, deleteGameCategory);

// Educational Skills Management (Admin) - ADD THESE ROUTES
router.get("/educational-skills", authMiddleware, adminMiddleware, getAllEducationalSkills);
router.post("/educational-skills", authMiddleware, adminMiddleware, createEducationalSkill);
router.put("/educational-skills/:skillId", authMiddleware, adminMiddleware, updateEducationalSkill);
router.delete("/educational-skills/:skillId", authMiddleware, adminMiddleware, deleteEducationalSkill);

// Bulk Operations (Admin)
router.post("/admin/bulk-update", authMiddleware, adminMiddleware, bulkUpdateGames);
router.get("/admin/export", authMiddleware, adminMiddleware, exportGamesData);

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
router.post("/kids/session/:sessionId/activity", updateSessionActivity);

// Game history
router.get("/kids/history", getKidGameHistory);

// ============================
// PARENT ANALYTICS ROUTES
// ============================

// Parent routes - require authentication
router.get("/parent/kid/:kidId/analytics", authMiddleware, getKidGameAnalytics);

module.exports = router;