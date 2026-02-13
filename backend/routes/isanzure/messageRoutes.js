// backend/routes/user/messageRoutes.js
const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/isanzure/messageController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// 📋 CONVERSATIONS - FOR USERS
// ============================================
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:conversationId', messageController.getConversation);
router.post('/conversations/:conversationId', messageController.sendMessage);
router.put('/conversations/:conversationId/read', messageController.markAsRead);

// ============================================
// 💬 MESSAGES
// ============================================
router.post('/send', messageController.sendMessage);
router.delete('/:messageId', messageController.deleteMessage);

// ============================================
// 🔍 SEARCH & SUGGESTIONS
// ============================================
router.get('/search', messageController.searchMessages);
router.get('/suggestions/properties', messageController.getPropertySuggestions);
router.get('/suggestions/tags', messageController.getTagSuggestions);
router.post('/parse', messageController.parseMessageContent);

// ============================================
// 📊 STATS & COUNTS
// ============================================
router.get('/unread/count', messageController.getUnreadCount);
router.get('/stats', messageController.getStats);
router.put('/read/all', messageController.markAllAsRead);

module.exports = router;