// backend/routes/isanzure/propertyReportRoutes.js
const express = require('express');
const router = express.Router();
const propertyReportController = require('../../controllers/isanzure/propertyReportController');
const authMiddleware = require('../../middlewares/authMiddleware');

// ============================================
// 📋 PUBLIC REPORTING ROUTES (No auth required)
// ============================================

// Submit a report for a property (works for both logged-in and anonymous users)
// No file uploads - text only
router.post(
  '/property/:propertyUid/report',
  propertyReportController.submitReport
);

// Check status of a report (requires report UID)
router.get(
  '/report/:reportUid/status',
  propertyReportController.getReportStatus
);

module.exports = router;