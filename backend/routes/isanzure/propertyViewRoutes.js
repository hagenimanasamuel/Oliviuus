// backend/routes/isanzure/propertyViewRoutes.js
const express = require('express');
const router = express.Router();
const propertyViewController = require('../../controllers/isanzure/propertyViewController');
const authMiddleware = require('../../middlewares/authMiddleware');

// ============================================
// 📋 PUBLIC VIEW TRACKING ROUTES (No auth required)
// ============================================

// Record a view when someone visits a property
router.post('/property/:propertyUid/view', propertyViewController.recordView);

// Update view data (time spent, scroll depth, etc.)
router.patch('/view/:viewUid', propertyViewController.updateView);

// Track a specific action (clicked contact, saved, shared, etc.)
router.post('/view/:viewUid/action', propertyViewController.trackAction);

// Get public view stats for a property (optional - can be public or protected)
router.get('/property/:propertyUid/stats', propertyViewController.getPropertyViewStats);

module.exports = router;