// middleware/kidSessionAuth.js
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
    // 🆕 STEP 1: Check if user is a family member with kid dashboard FIRST
    if (req.user.is_family_member && req.user.dashboard_type === 'kid') {
      console.log('🎯 Family member accessing kid dashboard - bypassing kid session check');

      // Create a simulated kid profile for family members
      req.kid_profile = {
        is_family_member: true,
        family_owner_id: req.user.family_owner_id,
        member_role: req.user.member_role,
        dashboard_type: 'kid',
        kid_profile_id: `family_${req.user.id}`,
        name: req.user.email?.split('@')[0] || 'Friend',
        max_age_rating: '7+',
        allowed_content_types: ['cartoons', 'educational', 'family'],
        blocked_genres: [],
        theme_color: 'blue',
        interface_mode: 'simple',
        has_family_plan_access: req.user.has_family_plan_access || false
      };

      return next();
    }

    // 🆕 STEP 2: If not a family member, check for regular kid session
    if (!req.user.active_kid_profile) {
      console.log('🔒 User not in kid mode and not family member - denying access');
      return res.status(403).json({
        error: "not_in_kid_mode",
        message: "Access to kid content requires kid mode or family membership"
      });
    }

    // ... rest of existing kid session validation logic
    const kidProfileId = req.user.active_kid_profile;
    const parentUserId = req.user.id;

    const kidSession = await query(
      `SELECT ks.*, kp.name, kp.max_content_age_rating, kp.allowed_content_types,
              kp.is_active as kid_active, kp.parent_user_id, kp.theme_color, kp.interface_mode,
              kcr.blocked_genres, kcr.max_age_rating as restriction_max_age_rating,
              kcr.allow_movies, kcr.allow_series, kcr.allow_live_events
       FROM kids_sessions ks
       JOIN kids_profiles kp ON ks.kid_profile_id = kp.id
       LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
       WHERE ks.kid_profile_id = ? AND ks.parent_user_id = ?
       AND ks.is_active = TRUE AND ks.expires_at > NOW() AND kp.is_active = TRUE
       LIMIT 1`,
      [kidProfileId, parentUserId]
    );

    if (kidSession.length === 0) {
      req.user.active_kid_profile = null;
      return res.status(403).json({
        error: "invalid_kid_session",
        message: "Kid session has expired or is invalid"
      });
    }

    // Attach kid profile data
    const sessionData = kidSession[0];
    req.kid_profile = {
      kid_profile_id: sessionData.kid_profile_id,
      name: sessionData.name,
      max_age_rating: sessionData.max_content_age_rating || sessionData.restriction_max_age_rating || '7+',
      allowed_content_types: safeJsonParse(sessionData.allowed_content_types, ['cartoons', 'educational', 'family']),
      kid_active: sessionData.kid_active,
      parent_user_id: sessionData.parent_user_id,
      blocked_genres: safeJsonParse(sessionData.blocked_genres, []),
      theme_color: sessionData.theme_color || 'blue',
      interface_mode: sessionData.interface_mode || 'simple',
      allow_movies: sessionData.allow_movies !== undefined ? sessionData.allow_movies : true,
      allow_series: sessionData.allow_series !== undefined ? sessionData.allow_series : true,
      allow_live_events: sessionData.allow_live_events !== undefined ? sessionData.allow_live_events : false,
      session_id: sessionData.id,
      session_token: sessionData.session_token,
      expires_at: sessionData.expires_at,
      is_family_member: false,
      has_family_plan_access: false
    };

    next();
  } catch (error) {
    console.error("❌ Kid session auth error:", error);
    res.status(500).json({ error: "Kid session verification failed" });
  }
};

module.exports = kidSessionAuth;