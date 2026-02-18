// backend/routes/isanzure/wishlistRoutes.js
const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/isanzure/wishlistController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// 📋 WISHLIST - FOR ALL USERS
// ============================================

// Get user's wishlist with pagination and filters
router.get('/', wishlistController.getWishlist);

// Get wishlist summary (counts, recently added)
router.get('/summary', wishlistController.getWishlistSummary);

// Check if specific property is in wishlist
router.get('/check/:propertyUid', wishlistController.checkWishlistStatus);

// Add property to wishlist
router.post('/add/:propertyUid', wishlistController.addToWishlist);

// Remove property from wishlist
router.delete('/remove/:propertyUid', wishlistController.removeFromWishlist);

// Bulk remove properties
router.post('/bulk-remove', wishlistController.bulkRemoveFromWishlist);

// Clear entire wishlist
router.delete('/clear', wishlistController.clearWishlist);

// Update display order (for drag-drop reordering)
router.put('/reorder', wishlistController.updateDisplayOrder);

// Get properties from wishlist with full details
router.get('/properties', wishlistController.getWishlistProperties);

// Get wishlist statistics
router.get('/stats', wishlistController.getWishlistStats);

module.exports = router;