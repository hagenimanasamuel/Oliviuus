const { query } = require("../config/dbConfig");

const enterKidMode = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const { kid_profile_id } = req.body;

    if (!kid_profile_id) {
      return res.status(400).json({ error: "Kid profile ID is required" });
    }

    const kidProfile = await query(
      `SELECT kp.*, kcr.max_age_rating 
       FROM kids_profiles kp
       LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
       WHERE kp.id = ? AND kp.parent_user_id = ? AND kp.is_active = TRUE`,
      [kid_profile_id, parentUserId]
    );

    if (kidProfile.length === 0) {
      return res.status(404).json({ error: "Kid profile not found or access denied" });
    }

    // 🆕 FIXED: Update ONLY the current session (using session_token)
    await query(
      `UPDATE user_session 
       SET session_mode = 'kid', active_kid_profile_id = ?, updated_at = NOW()
       WHERE user_id = ? AND session_token = ? AND is_active = TRUE`,
      [kid_profile_id, parentUserId, req.token]  // 🆕 Use req.token
    );

    res.json({
      success: true,
      message: "Kid mode activated",
      kid_profile: kidProfile[0]
    });

  } catch (error) {
    console.error("Error entering kid mode:", error);
    res.status(500).json({ error: "Failed to enter kid mode" });
  }
};

const exitKidMode = async (req, res) => {
  try {
    const parentUserId = req.user.id;

    // 🆕 FIXED: Update ONLY the current session
    await query(
      `UPDATE user_session 
       SET session_mode = 'parent', active_kid_profile_id = NULL, updated_at = NOW()
       WHERE user_id = ? AND session_token = ? AND is_active = TRUE`,
      [parentUserId, req.token]  // 🆕 Use req.token
    );

    res.json({
      success: true,
      message: "Exited kid mode successfully"
    });

  } catch (error) {
    console.error("Error exiting kid mode:", error);
    res.status(500).json({ error: "Failed to exit kid mode" });
  }
};

const getCurrentSessionMode = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🆕 For family members with kid dashboard
    if (req.user.is_family_member && 
        req.user.member_role !== 'owner' && 
        req.user.dashboard_type === 'kid') {
      
      return res.status(200).json({
        session_mode: 'kid',
        active_kid_profile: {
          id: `family_${userId}`,
          name: req.user.username || req.user.email?.split('@')[0] || 'Kid',
          is_family_member: true,
          family_owner_id: req.user.family_owner_id,
          member_role: req.user.member_role,
          dashboard_type: 'kid',
          max_age_rating: '7+'
        }
      });
    }

    // 🆕 Get CURRENT session (using session_token)
    const session = await query(`
      SELECT 
        us.session_mode,
        us.active_kid_profile_id,
        kp.name as kid_profile_name,
        kp.avatar_url as kid_avatar,
        kp.max_content_age_rating,
        kcr.max_age_rating as restriction_max_age_rating
      FROM user_session us
      LEFT JOIN kids_profiles kp ON us.active_kid_profile_id = kp.id
      LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
      WHERE us.user_id = ? 
        AND us.session_token = ?  -- 🆕 Use session_token
        AND us.is_active = TRUE
      LIMIT 1
    `, [userId, req.token]);

    if (session.length === 0) {
      return res.status(200).json({ 
        session_mode: null,
        active_kid_profile: null 
      });
    }

    const currentSession = session[0];
    const maxAgeRating = currentSession.max_content_age_rating || 
                         currentSession.restriction_max_age_rating || '7+';

    return res.status(200).json({
      session_mode: currentSession.session_mode,
      active_kid_profile: currentSession.active_kid_profile_id ? {
        id: currentSession.active_kid_profile_id,
        name: currentSession.kid_profile_name,
        avatar: currentSession.kid_avatar,
        max_age_rating: maxAgeRating,
        is_family_member: false
      } : null
    });

  } catch (error) {
    console.error("Error getting session mode:", error);
    return res.status(200).json({ 
      session_mode: null,
      active_kid_profile: null 
    });
  }
};

const checkProfileSelection = async (req, res) => {
  try {
    // 🆕 Family members with kid dashboard don't need profile selection
    if (req.user.is_family_member && req.user.dashboard_type === 'kid') {
      return res.json({ requires_profile_selection: false });
    }

    // 🆕 Check current session mode
    const session = await query(`
      SELECT session_mode 
      FROM user_session 
      WHERE user_id = ? 
        AND session_token = ?  -- 🆕 Use session_token
        AND is_active = TRUE
    `, [req.user.id, req.token]);

    if (session.length === 0) {
      return res.json({ requires_profile_selection: false });
    }

    // 🆕 Check if user has family plan
    const planCheck = await query(`
      SELECT s.type as plan_type
      FROM users u
      LEFT JOIN user_subscriptions usub ON u.id = usub.user_id 
        AND usub.status = 'active'
      LEFT JOIN subscriptions s ON usub.subscription_id = s.id
      WHERE u.id = ?
    `, [req.user.id]);

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

module.exports = {
  enterKidMode,  
  exitKidMode,  
  getCurrentSessionMode,
  checkProfileSelection
};