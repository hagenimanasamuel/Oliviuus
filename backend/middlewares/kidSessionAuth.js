const { query } = require("../config/dbConfig");

// Safe JSON parsing function
const safeJsonParse = (jsonString, defaultValue = []) => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

const kidSessionAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentToken = req.cookies?.token;

    // Get current session mode
    const session = await query(`
      SELECT 
        us.session_mode,
        us.active_kid_profile_id,
        kp.*,
        kcr.max_age_rating as restriction_max_age_rating,
        kcr.blocked_genres,
        kcr.allow_movies,
        kcr.allow_series,
        kcr.allow_live_events,
        s.type as plan_type
      FROM user_session us
      LEFT JOIN kids_profiles kp ON us.active_kid_profile_id = kp.id
      LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN user_subscriptions usub ON u.id = usub.user_id 
        AND usub.status = 'active'
      LEFT JOIN subscriptions s ON usub.subscription_id = s.id
      WHERE us.session_token = ? 
        AND us.user_id = ?
        AND us.is_active = TRUE
      LIMIT 1
    `, [currentToken, userId]);

    if (session.length === 0) {
      return res.status(401).json({ error: "Session not found" });
    }

    const sessionData = session[0];

    // Step 1: Check if user is in kid mode
    if (sessionData.session_mode !== 'kid') {
      // Step 2: Check if user is a family member with kid dashboard
      const familyCheck = await query(
        `SELECT id, dashboard_type, member_role, family_owner_id 
         FROM family_members 
         WHERE user_id = ? AND dashboard_type = 'kid'`,
        [userId]
      );

      if (familyCheck.length === 0) {
        return res.status(403).json({
          error: "not_in_kid_mode",
          message: "Access to kid content requires kid mode or family membership"
        });
      }

      // Family member with kid dashboard
      const familyData = familyCheck[0];
      let userName = req.user.email?.split('@')[0] || 'Friend';

      req.kid_profile = {
        id: userId,
        is_family_member: true,
        family_owner_id: familyData.family_owner_id,
        member_role: familyData.member_role,
        dashboard_type: 'kid',
        name: userName,
        max_age_rating: '7+',
        allowed_content_types: ['cartoons', 'educational', 'family'],
        blocked_genres: [],
        theme_color: 'blue',
        interface_mode: 'simple',
        has_family_plan_access: sessionData.plan_type === 'family',
        parent_user_id: familyData.family_owner_id || userId
      };

      return next();
    }

    // User is in regular kid mode
    if (!sessionData.active_kid_profile_id) {
      return res.status(403).json({
        error: "invalid_kid_session",
        message: "No active kid profile selected"
      });
    }

    // Attach kid profile data from session
    req.kid_profile = {
      id: sessionData.active_kid_profile_id,
      name: sessionData.name,
      max_age_rating: sessionData.restriction_max_age_rating || sessionData.max_content_age_rating || '7+',
      allowed_content_types: safeJsonParse(sessionData.allowed_content_types, ['cartoons', 'educational', 'family']),
      parent_user_id: sessionData.parent_user_id,
      blocked_genres: safeJsonParse(sessionData.blocked_genres, []),
      theme_color: sessionData.theme_color || 'blue',
      interface_mode: sessionData.interface_mode || 'simple',
      allow_movies: sessionData.allow_movies !== undefined ? sessionData.allow_movies : true,
      allow_series: sessionData.allow_series !== undefined ? sessionData.allow_series : true,
      allow_live_events: sessionData.allow_live_events !== undefined ? sessionData.allow_live_events : false,
      is_family_member: false,
      has_family_plan_access: sessionData.plan_type === 'family'
    };

    next();
  } catch (error) {
    console.error("Kid session auth error:", error);
    res.status(500).json({ error: "Kid session verification failed" });
  }
};

module.exports = kidSessionAuth;