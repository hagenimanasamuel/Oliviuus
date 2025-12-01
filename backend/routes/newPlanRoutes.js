const express = require("express");
const newPlanController = require('../controllers/newPlanController');
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 🚀 New Plan Purchase Routes (Authenticated users)
router.post('/purchase', authMiddleware, newPlanController.purchaseNewPlan);

// 🆕 Get available plans for new purchase
router.get('/available-plans', authMiddleware, async (req, res) => {
  try {
    const { query } = require('../config/dbConfig');
    
    const sql = `
      SELECT * FROM subscriptions 
      WHERE is_active = true AND is_visible = true
      ORDER BY price ASC
    `;
    
    const plans = await query(sql);
    
    res.json({
      success: true,
      data: plans
    });
    
  } catch (error) {
    console.error('Error fetching available plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load plans'
    });
  }
});

module.exports = router;