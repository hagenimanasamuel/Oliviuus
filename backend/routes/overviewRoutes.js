const express = require('express');
const router = express.Router();
const { getSystemOverview, getDashboardMetrics } = require('../controllers/overviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.get('/system-overview', authMiddleware, adminMiddleware, getSystemOverview);
router.get('/dashboard-metrics', authMiddleware, adminMiddleware, getDashboardMetrics);

module.exports = router;