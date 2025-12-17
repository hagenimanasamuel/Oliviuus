const { query } = require("../config/dbConfig");

const checkProfileSelection = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.cookies?.token;

    // Get current session mode
    const session = await query(`
      SELECT session_mode 
      FROM user_session 
      WHERE session_token = ? AND user_id = ? AND is_active = TRUE
    `, [currentToken, userId]);

    if (session.length === 0) {
      return res.json({ requires_profile_selection: false });
    }

    // Check if user has family plan
    const planCheck = await query(`
      SELECT s.type as plan_type
      FROM users u
      LEFT JOIN user_subscriptions usub ON u.id = usub.user_id 
        AND usub.status = 'active'
      LEFT JOIN subscriptions s ON usub.subscription_id = s.id
      WHERE u.id = ?
    `, [userId]);

    const requiresProfileSelection = 
      planCheck[0]?.plan_type === 'family' && 
      session[0].session_mode === null;

  res.json({
      requires_profile_selection: requiresProfileSelection
    });

  } catch (error) {
    console.error("Error checking profile selection:", error);
    res.status(500).json({ error: "Failed to check profile selection" });
  }
};

const getAvailableProfiles = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get main account profile
    const userProfile = await query(
      `SELECT id, email, profile_avatar_url as avatar_url, 'main' as type 
       FROM users WHERE id = ? AND is_active = TRUE`,
      [userId]
    );

    // Get kid profiles
    const kidProfiles = await query(
      `SELECT kp.id, kp.name, kp.avatar_url, COALESCE(kcr.max_age_rating, kp.max_content_age_rating) as max_age_rating, 'kid' as type
       FROM kids_profiles kp
       LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
       WHERE kp.parent_user_id = ? AND kp.is_active = TRUE`,
      [userId]
    );

    const profiles = [];

    // Add main account profile (only one)
    if (userProfile.length > 0) {
      profiles.push({
        ...userProfile[0],
        display_name: 'My Account',
        name: 'My Account',
        type: 'main',
        description: 'Full access to all features'
      });
    }

    // Add kid profiles
    const formattedKidProfiles = kidProfiles.map(kid => ({
      ...kid,
      display_name: kid.name,
      max_age_rating: kid.max_age_rating,
      description: 'Kids mode'
    }));

    profiles.push(...formattedKidProfiles);

    res.json({
      success: true,
      profiles: profiles
    });

  } catch (error) {
    console.error("Error getting profiles:", error);
    res.status(500).json({ error: "Failed to get profiles" });
  }
};

module.exports = {
  checkProfileSelection,
  getAvailableProfiles
};