const express = require("express");
const {
  getKidsSecurityLogs,
  getKidsActivitySummary,
  exportKidsActivityLogs,
  getKidsDashboardStats,
  logKidActivityEndpoint,
  createSecurityAlert
} = require("../controllers/kidsSecurityController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Kids security logs routes
router.get("/security-logs", getKidsSecurityLogs);
router.get("/activity-summary", getKidsActivitySummary);
router.get("/export-logs", exportKidsActivityLogs);
router.get("/dashboard-stats", getKidsDashboardStats);
router.post("/log-activity", logKidActivityEndpoint);
router.post("/security-alert", createSecurityAlert);

module.exports = router;