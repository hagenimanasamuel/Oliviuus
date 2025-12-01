// middleware/requireFamilyPlan.js
const { query } = require("../config/dbConfig");

const requireFamilyPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user has active family plan subscription
    const subscriptionCheck = await query(
      `SELECT us.*, s.type, s.name 
       FROM user_subscriptions us
       JOIN subscriptions s ON us.subscription_id = s.id
       WHERE us.user_id = ? 
       AND us.status = 'active'
       AND us.end_date > NOW()
       AND s.type = 'family'
       AND s.is_active = TRUE
       LIMIT 1`,
      [userId]
    );

    if (subscriptionCheck.length === 0) {
      return res.status(403).json({
        error: "family_plan_required",
        message: "Family plan subscription is required to access kid features",
        upgrade_url: "/subscriptions?plan=family"
      });
    }

    // Attach subscription info for later use
    req.user_subscription = subscriptionCheck[0];
    next();
  } catch (error) {
    console.error("❌ Family plan check error:", error);
    res.status(500).json({ error: "Subscription verification failed" });
  }
};

module.exports = { requireFamilyPlan };