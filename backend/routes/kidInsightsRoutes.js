const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getCompleteKidInsights,
  getWeeklyActivityReport,
  getContentConsumptionAnalytics,
  getLearningProgressReport,
  getScreenTimeAnalytics,
  getComparativeInsights,
  getPredictiveInsights,
  exportKidReport
} = require("../controllers/kidInsightsController");

// All routes require authentication
router.use(authMiddleware);

// Complete insights dashboard
router.get("/complete/:kidId", getCompleteKidInsights);

// Weekly activity report
router.get("/weekly/:kidId", getWeeklyActivityReport);

// Content consumption analytics
router.get("/content/:kidId", getContentConsumptionAnalytics);

// Learning progress report
router.get("/learning/:kidId", getLearningProgressReport);

// Screen time analytics
router.get("/screentime/:kidId", getScreenTimeAnalytics);

// Comparative insights
router.get("/compare/:kidId", getComparativeInsights);

// Predictive insights
router.get("/predictive/:kidId", getPredictiveInsights);

// Export reports
router.get("/export/:kidId", exportKidReport);

module.exports = router;