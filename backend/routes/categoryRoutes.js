const express = require("express");
const {
  getAllCategories,
  getCategoryById,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkUpdateCategories,
  getPublicCategories,
  getParentCategories
} = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// ✅ Public routes
router.get("/public", getPublicCategories);
router.get("/public/parents", getParentCategories);

// ✅ Admin routes (protected)
router.get("/", authMiddleware, adminMiddleware, getAllCategories);
router.get("/tree", authMiddleware, adminMiddleware, getCategoryTree);
router.get("/parents", authMiddleware, adminMiddleware, getParentCategories);
router.get("/:id", authMiddleware, adminMiddleware, getCategoryById);
router.post("/", authMiddleware, adminMiddleware, createCategory);
router.put("/:id", authMiddleware, adminMiddleware, updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);
router.patch("/bulk-update", authMiddleware, adminMiddleware, bulkUpdateCategories);

module.exports = router;