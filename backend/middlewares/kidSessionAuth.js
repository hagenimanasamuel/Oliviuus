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

// Helper function to get user display name with flexible identifiers
const getUserDisplayName = async (userId) => {
  try {
    const userQuery = `
      SELECT 
        username,
        email,
        phone,
        first_name,
        last_name,
        profile_avatar_url
      FROM users 
      WHERE id = ? AND is_active = TRUE AND is_deleted = FALSE
    `;
    
    const [user] = await query(userQuery, [userId]);
    
    if (!user) return 'Family Member';
    
    // Priority: username > full name > email prefix > phone > fallback
    if (user.username) return user.username;
    
    if (user.first_name) {
      return `${user.first_name} ${user.last_name || ''}`.trim();
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    if (user.phone) {
      return `Friend (${user.phone.substring(user.phone.length - 4)})`;
    }
    
    return 'Family Member';
  } catch (error) {
    console.error('Error fetching user display name:', error);
    return 'Family Member';
  }
};

const kidSessionAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentToken = req.cookies?.token;

    if (!userId) {
      return res.status(401).json({ 
        error: "authentication_required",
        message: "User authentication required" 
      });
    }

    // Get current session mode and user info
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
        s.type as plan_type,
        u.username,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.profile_avatar_url,
        u.global_account_tier,
        u.onboarding_completed
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
      return res.status(401).json({ 
        error: "session_not_found",
        message: "Session not found or expired" 
      });
    }

    const sessionData = session[0];

    // Step 1: Check if user is in kid mode
    if (sessionData.session_mode !== 'kid') {
      // Step 2: Check if user is a family member with kid dashboard
      const familyCheck = await query(`
        SELECT 
          fm.*,
          u.username,
          u.email,
          u.phone,
          u.first_name,
          u.last_name,
          u.profile_avatar_url
        FROM family_members fm
        LEFT JOIN users u ON fm.user_id = u.id AND u.is_active = TRUE AND u.is_deleted = FALSE
        WHERE fm.user_id = ? 
          AND fm.dashboard_type = 'kid'
          AND fm.is_active = TRUE
          AND fm.invitation_status = 'accepted'
        LIMIT 1
      `, [userId]);

      if (familyCheck.length === 0) {
        return res.status(403).json({
          error: "not_in_kid_mode",
          message: "Access to kid content requires kid mode or family membership"
        });
      }

      // Family member with kid dashboard
      const familyData = familyCheck[0];
      
      // Get user display name using multiple identifiers
      let displayName = 'Family Member';
      if (familyData.username) {
        displayName = familyData.username;
      } else if (familyData.first_name) {
        displayName = `${familyData.first_name} ${familyData.last_name || ''}`.trim();
      } else if (familyData.email) {
        displayName = familyData.email.split('@')[0];
      } else if (familyData.phone) {
        displayName = `Friend (${familyData.phone.substring(familyData.phone.length - 4)})`;
      }

      // Get parent user info (family owner)
      const parentUserQuery = await query(`
        SELECT 
          username,
          email,
          phone,
          first_name,
          last_name
        FROM users 
        WHERE id = ? AND is_active = TRUE AND is_deleted = FALSE
      `, [familyData.family_owner_id]);

      const parentUser = parentUserQuery[0] || {};
      let parentName = 'Parent';
      if (parentUser.username) {
        parentName = parentUser.username;
      } else if (parentUser.first_name) {
        parentName = `${parentUser.first_name} ${parentUser.last_name || ''}`.trim();
      } else if (parentUser.email) {
        parentName = parentUser.email.split('@')[0];
      }

      req.kid_profile = {
        id: userId,
        user_id: userId, // Important: family members have user_id
        is_family_member: true,
        family_owner_id: familyData.family_owner_id,
        family_owner_name: parentName,
        member_role: familyData.member_role || 'child',
        dashboard_type: 'kid',
        name: displayName,
        display_name: displayName,
        max_age_rating: '7+', // Default for family members
        
        // User identifiers (for display purposes)
        username: familyData.username,
        email: familyData.email,
        phone: familyData.phone,
        first_name: familyData.first_name,
        last_name: familyData.last_name,
        profile_avatar_url: familyData.profile_avatar_url,
        
        // Content preferences from family member settings
        allowed_content_types: safeJsonParse(familyData.allowed_content_types, ['cartoons', 'educational', 'family']),
        blocked_genres: safeJsonParse(familyData.blocked_genres, []),
        content_restrictions: safeJsonParse(familyData.content_restrictions, {}),
        
        theme_color: 'blue',
        interface_mode: 'simple',
        
        // Access controls from family member settings
        max_daily_watch_time: familyData.max_daily_watch_time,
        is_suspended: familyData.is_suspended || false,
        suspended_until: familyData.suspended_until,
        
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

    // Get parent user info for kid profile
    const parentUserQuery = await query(`
      SELECT 
        username,
        email,
        phone,
        first_name,
        last_name
      FROM users 
      WHERE id = ? AND is_active = TRUE AND is_deleted = FALSE
    `, [sessionData.parent_user_id]);

    const parentUser = parentUserQuery[0] || {};
    let parentName = 'Parent';
    if (parentUser.username) {
      parentName = parentUser.username;
    } else if (parentUser.first_name) {
      parentName = `${parentUser.first_name} ${parentUser.last_name || ''}`.trim();
    } else if (parentUser.email) {
      parentName = parentUser.email.split('@')[0];
    }

    // Attach kid profile data from session
    req.kid_profile = {
      id: sessionData.active_kid_profile_id,
      kid_profile_id: sessionData.active_kid_profile_id,
      name: sessionData.name,
      display_name: sessionData.name,
      max_age_rating: sessionData.restriction_max_age_rating || sessionData.max_content_age_rating || '7+',
      
      // Parent information
      parent_user_id: sessionData.parent_user_id,
      parent_name: parentName,
      
      // Content restrictions
      allowed_content_types: safeJsonParse(sessionData.allowed_content_types, ['cartoons', 'educational', 'family']),
      blocked_genres: safeJsonParse(sessionData.blocked_genres, []),
      allow_movies: sessionData.allow_movies !== undefined ? sessionData.allow_movies : true,
      allow_series: sessionData.allow_series !== undefined ? sessionData.allow_series : true,
      allow_live_events: sessionData.allow_live_events !== undefined ? sessionData.allow_live_events : false,
      
      // Profile settings
      theme_color: sessionData.theme_color || 'blue',
      interface_mode: sessionData.interface_mode || 'simple',
      avatar_url: sessionData.avatar_url,
      birth_date: sessionData.birth_date,
      calculated_age: sessionData.calculated_age,
      
      // Status
      is_family_member: false,
      has_family_plan_access: sessionData.plan_type === 'family',
      
      // Additional metadata
      require_pin_to_exit: sessionData.require_pin_to_exit || true,
      daily_time_limit_minutes: sessionData.daily_time_limit_minutes || 120,
      bedtime_start: sessionData.bedtime_start,
      bedtime_end: sessionData.bedtime_end,
      total_watch_time_minutes: sessionData.total_watch_time_minutes || 0,
      last_active_at: sessionData.last_active_at
    };

    next();
  } catch (error) {
    console.error("Kid session auth error:", error);
    res.status(500).json({ 
      error: "kid_session_verification_failed",
      message: "Failed to verify kid session",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = kidSessionAuth;