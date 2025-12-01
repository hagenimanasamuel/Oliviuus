// middleware/checkKidProfileLimit.js
const { query } = require("../config/dbConfig");

const checkKidProfileLimit = async (req, res, next) => {
  try {
    const parentUserId = req.user.id;

    // Get current kid profile count
    const kidCountResult = await query(
      `SELECT COUNT(*) as kid_count FROM kids_profiles 
       WHERE parent_user_id = ? AND is_active = TRUE`,
      [parentUserId]
    );

    const currentKidCount = kidCountResult[0].kid_count;

    // Get family plan kid limit (from subscriptions table)
    const planLimitResult = await query(
      `SELECT s.max_profiles 
       FROM user_subscriptions us
       JOIN subscriptions s ON us.subscription_id = s.id
       WHERE us.user_id = ? AND us.status = 'active' AND us.end_date > NOW()
       AND s.type = 'family'
       LIMIT 1`,
      [parentUserId]
    );

    if (planLimitResult.length === 0) {
      return res.status(403).json({
        error: "no_active_family_plan",
        message: "Active family plan required to create kid profiles"
      });
    }

    const maxProfiles = planLimitResult[0].max_profiles || 4; // Default to 4

    if (currentKidCount >= maxProfiles) {
      return res.status(403).json({
        error: "kid_profile_limit_reached",
        message: `Maximum ${maxProfiles} kid profiles allowed on your plan`,
        current_count: currentKidCount,
        max_allowed: maxProfiles,
        upgrade_url: "/subscriptions?plan=premium_family" // If you have higher tiers
      });
    }

    next();
  } catch (error) {
    console.error("❌ Kid profile limit check error:", error);
    res.status(500).json({ error: "Profile limit check failed" });
  }
};

module.exports = checkKidProfileLimit;