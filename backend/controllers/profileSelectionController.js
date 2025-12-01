const { query } = require("../config/dbConfig");
const jwt = require("jsonwebtoken");

const checkProfileSelection = async (req, res) => {
  try {
    const userId = req.user.id;

    const kidProfiles = await query(
      `SELECT COUNT(*) as kid_count FROM kids_profiles 
       WHERE parent_user_id = ? AND is_active = TRUE`,
      [userId]
    );

    const requiresSelection = kidProfiles[0].kid_count > 0;

    res.json({
      success: true,
      requires_profile_selection: requiresSelection
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
      profiles: profiles,
      requires_profile_selection: kidProfiles.length > 0
    });

  } catch (error) {
    console.error("Error getting profiles:", error);
    res.status(500).json({ error: "Failed to get profiles" });
  }
};

const switchToAdultMode = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.cookies?.token;

    if (!currentToken) {
      return res.status(400).json({ error: "No active session" });
    }

    const adultToken = jwt.sign(
      {
        id: userId,
        role: "viewer"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await query(
      `INSERT INTO user_session 
       (user_id, session_token, is_active, token_expires)
       VALUES (?, ?, TRUE, DATE_ADD(NOW(), INTERVAL 7 DAY))
       ON DUPLICATE KEY UPDATE
       session_token = VALUES(session_token),
       token_expires = VALUES(token_expires),
       is_active = VALUES(is_active)`,
      [userId, adultToken]
    );

    if (req.user.active_kid_profile) {
      await query(
        `UPDATE kids_sessions 
         SET is_active = FALSE, logout_time = NOW() 
         WHERE parent_user_id = ? AND is_active = TRUE`,
        [userId]
      );
    }

    res.cookie("token", adultToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Switched to adult mode successfully",
      session_type: "adult"
    });

  } catch (error) {
    console.error("Error switching to adult mode:", error);
    res.status(500).json({ error: "Failed to switch to adult mode" });
  }
};

module.exports = {
  checkProfileSelection,
  getAvailableProfiles,
  switchToAdultMode
};