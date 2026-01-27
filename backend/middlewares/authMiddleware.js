// authMiddleware.js - MINIMAL FIX
const jwt = require("jsonwebtoken");
const { query } = require("../config/dbConfig");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user session with ALL NECESSARY FIELDS
    const sessionRows = await query(`
      SELECT 
        us.*,
        u.id as user_id,
        u.oliviuus_id,
        u.username,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.role,
        u.profile_avatar_url,
        u.global_account_tier,
        u.subscription_plan,
        u.is_active,
        u.email_verified,
        u.phone_verified,
        
        -- 🆕 CRITICAL: Get kid profile info from the JOIN
        kp.id as kid_profile_id,
        kp.name as kid_profile_name,
        kp.max_content_age_rating as kid_max_age_rating,
        
        -- Family info
        fm.id as family_member_id,
        fm.family_owner_id,
        fm.dashboard_type as family_dashboard_type,
        fm.member_role,
        fm.invitation_status as family_invitation_status,
        fm.is_active as family_member_active
        
      FROM user_session us
      JOIN users u ON us.user_id = u.id
        
      -- 🆕 LEFT JOIN kids_profiles (important: LEFT join so we get session even if no kid profile)
      LEFT JOIN kids_profiles kp ON us.active_kid_profile_id = kp.id
        
      LEFT JOIN family_members fm ON u.id = fm.user_id 
        AND fm.invitation_status = 'accepted'
        AND fm.is_active = true
        
      WHERE us.session_token = ? 
        AND us.is_active = TRUE 
        AND us.token_expires > NOW()
      LIMIT 1
    `, [token]);

    if (!sessionRows || sessionRows.length === 0) {
      return res.status(401).json({ error: "Session no longer active" });
    }

    const session = sessionRows[0];
    
    // Build user object with ALL fields from session
    const user = {
      id: session.user_id,
      oliviuus_id: session.oliviuus_id,
      username: session.username,
      email: session.email,
      phone: session.phone,
      first_name: session.first_name,
      last_name: session.last_name,
      role: session.role,
      profile_avatar_url: session.profile_avatar_url,
      global_account_tier: session.global_account_tier,
      subscription_plan: session.subscription_plan,
      is_active: session.is_active,
      email_verified: session.email_verified,
      phone_verified: session.phone_verified,
      
      // 🆕 CRITICAL: Add session_mode and active_kid_profile_id
      session_mode: session.session_mode,
      active_kid_profile_id: session.active_kid_profile_id,
      
      // 🆕 Add kid profile info if exists
      active_kid_profile: session.kid_profile_id ? {
        id: session.kid_profile_id,
        name: session.kid_profile_name,
        max_age_rating: session.kid_max_age_rating
      } : null
    };

    // Family member logic
    const isFamilyMemberInvitee = session.family_member_id && 
                                 session.family_invitation_status === 'accepted' && 
                                 session.family_member_active === 1;

    if (isFamilyMemberInvitee) {
      user.is_family_member = true;
      user.family_owner_id = session.family_owner_id;
      user.member_role = session.member_role;
      user.dashboard_type = session.family_dashboard_type;
      user.has_family_plan_access = true;
      
      // Special handling for family members with kid dashboard
      if (session.family_dashboard_type === 'kid') {
        user.active_kid_profile = {
          id: `family_${session.user_id}`,
          name: 'Family Member',
          max_age_rating: '13+',
          is_family_member: true
        };
      }
    } else {
      user.is_family_member = false;
      user.has_family_plan_access = false;
    }

    // 🆕 Set req properties for backward compatibility
    req.user = user;
    req.session = session;
    req.token = token;
    
    // 🆕 For backward compatibility with existing code
    req.sessionMode = session.session_mode;
    req.activeKidProfile = session.active_kid_profile_id ? {
      id: session.active_kid_profile_id,
      name: session.kid_profile_name,
      maxAgeRating: session.kid_max_age_rating
    } : null;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({
      error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;