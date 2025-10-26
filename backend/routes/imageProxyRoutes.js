const express = require("express");
const { proxyImage } = require("../controllers/imageProxyController");

const router = express.Router();

// Public image proxy route
router.get("/:contentId/:assetType", proxyImage);

module.exports = router;