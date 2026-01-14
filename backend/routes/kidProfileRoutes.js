// routes/kidProfileRoutes.js
const express = require("express");
const router = express.Router(); // ✅ FIXED: Use express.Router() not router
const {
  getKidProfiles,
  getKidProfileById,
  createKidProfile,
  updateKidProfile,
  deleteKidProfile,
  updateKidAvatar,
  getKidViewingStats,
  resetKidViewingTime,
  getKidWatchlist,
  reactivateKidProfile,
  permanentDeleteKidProfile  
} = require("../controllers/kidProfileController");

const authMiddleware = require("../middlewares/authMiddleware");
const { requireFamilyPlan } = require("../middlewares/requireFamilyPlan");
const { validateParentOwnership } = require("../middlewares/validateParentOwnership");

// All routes require authentication and family plan
router.use(authMiddleware);
router.use(requireFamilyPlan);

// Kid profile management routes
router.get("/profiles", getKidProfiles);
router.get("/profiles/:kidId", validateParentOwnership, getKidProfileById);
router.post("/profiles", createKidProfile);
router.put("/profiles/:kidId", validateParentOwnership, updateKidProfile);
router.delete("/profiles/:kidId", validateParentOwnership, deleteKidProfile);

// Kid profile specific routes
router.put("/profiles/:kidId/avatar", validateParentOwnership, updateKidAvatar);
router.get("/profiles/:kidId/stats", validateParentOwnership, getKidViewingStats);
router.post("/profiles/:kidId/reset-time", validateParentOwnership, resetKidViewingTime);
router.get("/profiles/:kidId/watchlist", validateParentOwnership, getKidWatchlist);
router.post("/profiles/:kidId/reactivate", validateParentOwnership, reactivateKidProfile);
router.post("/profiles/:kidId/permanent-delete", validateParentOwnership, permanentDeleteKidProfile);


module.exports = router;