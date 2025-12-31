const express = require('express');
const router = express.Router();
const { 
  submitContact, 
  getContacts, 
  getContactStats,
  updateContactStatus,
  sendReply,
  exportContacts,
  getContactById,
  getContactResponses,
  getContactInfo,
  updateContactInfo,
    getFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  exportFeedback,
  getFeedbackStats
} = require('../controllers/contactController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Public route - anyone can submit contact form
router.post('/submit', submitContact);

// Admin routes - protected
router.get('/admin/contacts', authMiddleware, adminMiddleware, getContacts);
router.get('/admin/contacts/stats', authMiddleware, adminMiddleware, getContactStats);
router.get('/admin/contacts/export', authMiddleware, adminMiddleware, exportContacts);
router.get('/admin/contacts/:id', authMiddleware, adminMiddleware, getContactById);
router.put('/admin/contacts/:id/status', authMiddleware, adminMiddleware, updateContactStatus);
router.post('/admin/contacts/:id/reply', authMiddleware, adminMiddleware, sendReply);
router.get('/admin/contacts/:id/responses', authMiddleware, adminMiddleware, getContactResponses);
// Public route - get contact info
router.get('/info', getContactInfo);

// Admin route - update contact info
router.put('/admin/info', authMiddleware, adminMiddleware, updateContactInfo);

// Admin feedback routes
router.get('/admin/feedback', authMiddleware, adminMiddleware, getFeedbacks);
router.get('/admin/feedback/stats', authMiddleware, adminMiddleware, getFeedbackStats);
router.get('/admin/feedback/export', authMiddleware, adminMiddleware, exportFeedback);
router.get('/admin/feedback/:id', authMiddleware, adminMiddleware, getFeedbackById);
router.put('/admin/feedback/:id/status', authMiddleware, adminMiddleware, updateFeedbackStatus);
router.delete('/admin/feedback/:id', authMiddleware, adminMiddleware, deleteFeedback);

module.exports = router;