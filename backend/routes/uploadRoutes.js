const express = require("express");
const {
  generateUploadUrl,
  confirmUpload,
  getContentMedia,
  deleteMediaAsset,
  setPrimaryAsset
} = require("../controllers/uploadController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Generate pre-signed upload URL
router.post("/generate-url", authMiddleware, adminMiddleware, generateUploadUrl);

// Confirm upload completion
router.post("/confirm", authMiddleware, adminMiddleware, confirmUpload);

// Get content media assets
router.get("/content/:contentId", authMiddleware, adminMiddleware, getContentMedia);

// Delete media asset
router.delete("/asset/:assetId", authMiddleware, adminMiddleware, deleteMediaAsset);

// Set asset as primary
router.put("/asset/:assetId/primary", authMiddleware, adminMiddleware, setPrimaryAsset);

module.exports = router;