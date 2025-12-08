const express = require('express');
const router = express.Router();
const { 
  submitFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getFeedbackStats,
  exportFeedback,
  getUserFeedback
} = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Public route - anyone can submit feedback
router.post('/submit', submitFeedback);

// User route - get own feedback (authenticated users only)
router.get('/my-feedback', authMiddleware, getUserFeedback);

// Admin routes - protected
router.get('/admin/feedback', authMiddleware, adminMiddleware, getFeedback);
router.get('/admin/feedback/stats', authMiddleware, adminMiddleware, getFeedbackStats);
router.get('/admin/feedback/export', authMiddleware, adminMiddleware, exportFeedback);
router.get('/admin/feedback/:id', authMiddleware, adminMiddleware, getFeedbackById);
router.put('/admin/feedback/:id/status', authMiddleware, adminMiddleware, updateFeedbackStatus);

module.exports = router;