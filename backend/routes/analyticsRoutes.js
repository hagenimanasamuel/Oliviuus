const express = require('express');
const router = express.Router();
const { 
  getComprehensiveAnalytics, 
  exportAnalyticsData,
  getUserAcquisitionMetrics,
  getContentPerformanceMetrics,
  getRevenueMetrics
} = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Main analytics endpoints
router.get('/comprehensive', authMiddleware, adminMiddleware, getComprehensiveAnalytics);
router.get('/export', authMiddleware, adminMiddleware, exportAnalyticsData);

// Specific metrics endpoints
router.get('/user-acquisition', authMiddleware, adminMiddleware, getUserAcquisitionMetrics);
router.get('/content-performance', authMiddleware, adminMiddleware, getContentPerformanceMetrics);
router.get('/revenue-metrics', authMiddleware, adminMiddleware, getRevenueMetrics);

module.exports = router;