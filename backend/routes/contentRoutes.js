const express = require("express");
const {
  createContent,
  getContents,
  getContentById,
  updateContent,
  deleteContent,
  publishContent,
  archiveContent,
  duplicateContent,
  updateContentSettings,
} = require("../controllers/contentController");

const {
  uploadMediaAsset,
  getMediaAssets,
  updateMediaAsset,
  deleteMediaAsset,
  setPrimaryMediaAsset,
} = require("../controllers/mediaController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Content CRUD operations
router.post("/", authMiddleware, adminMiddleware, createContent);
router.get("/", authMiddleware, getContents);
router.get("/:contentId", authMiddleware, getContentById);
router.put("/:contentId", authMiddleware, updateContent);
router.delete("/:contentId", authMiddleware, adminMiddleware, deleteContent);

// Content actions
router.put("/:contentId/publish", authMiddleware, publishContent);
router.put("/:contentId/archive", authMiddleware, archiveContent);
router.post("/:contentId/duplicate", authMiddleware, duplicateContent);
router.put("/:contentId/settings", authMiddleware, updateContentSettings);

// Media asset management
router.post("/:contentId/media", authMiddleware, uploadMediaAsset);
router.get("/:contentId/media", authMiddleware, getMediaAssets);
router.put("/media/:assetId", authMiddleware, updateMediaAsset);
router.delete("/media/:assetId", authMiddleware, deleteMediaAsset);
router.put("/media/:assetId/primary", authMiddleware, setPrimaryMediaAsset);

module.exports = router;