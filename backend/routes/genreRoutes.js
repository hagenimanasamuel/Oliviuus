const express = require("express");
const {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
  bulkUpdateGenres,
  getPublicGenres
} = require("../controllers/genreController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// ✅ Public routes
router.get("/public", getPublicGenres);

// ✅ Admin routes (protected)
router.get("/", authMiddleware, adminMiddleware, getAllGenres);
router.get("/:id", authMiddleware, adminMiddleware, getGenreById);
router.post("/", authMiddleware, adminMiddleware, createGenre);
router.put("/:id", authMiddleware, adminMiddleware, updateGenre);
router.delete("/:id", authMiddleware, adminMiddleware, deleteGenre);
router.patch("/bulk-update", authMiddleware, adminMiddleware, bulkUpdateGenres);

module.exports = router;