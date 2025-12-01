const express = require('express');
const router = express.Router();
const upgradeController = require('../controllers/upgradeController');
const authMiddleware = require('../middlewares/authMiddleware');

// 🔐 Upgrade Routes (Authenticated users only)
router.post('/calculate-cost', authMiddleware, upgradeController.calculateUpgradeCost);
router.post('/initiate', authMiddleware, upgradeController.initiateUpgrade);
router.get('/available', authMiddleware, upgradeController.getAvailableUpgrades);
router.get('/status/:referenceId', authMiddleware, upgradeController.checkUpgradeStatus);

// 🌐 Upgrade Callback (called by payment provider - NO AUTH NEEDED)
router.post('/callback', upgradeController.handleUpgradeCallback);

// 🆕 Health check for upgrade service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Upgrade service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;