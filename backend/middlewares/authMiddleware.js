const jwt = require("jsonwebtoken");
const { query } = require("../config/dbConfig");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ error: "Token expired" });
    }

    // Main query with all necessary joins
    const sessionRows = await query(`
      SELECT 
        us.*,
        u.role as user_role,
        u.subscription_plan,
        u.email,
        
        -- Regular user's own subscription
        usub.status as subscription_status,
        s.type as plan_type,
        
        -- Kid profile info
        kp.name as kid_profile_name,
        kcr.max_age_rating,
        
        -- Family member info
        fm.id as family_member_id,
        fm.family_owner_id,
        fm.dashboard_type as family_dashboard_type,
        fm.member_role,
        fm.invitation_status as family_invitation_status,
        fm.is_active as family_member_active,
        
        -- Family owner's subscription (for family members)
        owner_usub.status as owner_subscription_status,
        owner_s.type as owner_plan_type
        
      FROM user_session us
      JOIN users u ON us.user_id = u.id
      
      -- Regular user's subscription
      LEFT JOIN user_subscriptions usub ON u.id = usub.user_id 
        AND usub.status = 'active'
      LEFT JOIN subscriptions s ON usub.subscription_id = s.id
      
      -- Kid profile joins
      LEFT JOIN kids_profiles kp ON us.active_kid_profile_id = kp.id
      LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
      
      -- Family member joins
      LEFT JOIN family_members fm ON u.id = fm.user_id 
        AND fm.invitation_status = 'accepted'
        AND fm.is_active = true
        
      -- Family owner's subscription
      LEFT JOIN user_subscriptions owner_usub ON fm.family_owner_id = owner_usub.user_id 
        AND owner_usub.status = 'active'
      LEFT JOIN subscriptions owner_s ON owner_usub.subscription_id = owner_s.id
        
      WHERE us.session_token = ? 
        AND us.is_active = TRUE 
        AND us.token_expires > NOW()
    `, [token]);

    if (!sessionRows || sessionRows.length === 0) {
      return res.status(401).json({ error: "Session no longer active" });
    }

    const session = sessionRows[0];
    
    // Set user basic info
    decoded.id = session.user_id;
    decoded.email = session.email;
    decoded.role = session.user_role;

    // DEBUG LOG
    console.log('🔍 AUTH DEBUG for user:', session.user_id, {
      has_family_member_id: !!session.family_member_id,
      family_invitation_status: session.family_invitation_status,
      family_member_active: session.family_member_active,
      family_owner_id: session.family_owner_id,
      dashboard_type: session.family_dashboard_type,
      owner_plan_type: session.owner_plan_type,
      owner_subscription_status: session.owner_subscription_status
    });

    // Check if user is a family plan OWNER (has active family plan subscription)
    const isFamilyPlanOwner = session.plan_type === 'family' && 
                             session.subscription_status === 'active';

    // Check if user is a family MEMBER (invited by someone else)
    const isFamilyMemberInvitee = session.family_member_id && 
                                 session.family_invitation_status === 'accepted' && 
                                 session.family_member_active === 1;

    if (isFamilyPlanOwner || isFamilyMemberInvitee) {
      decoded.is_family_member = true;
      
      if (isFamilyPlanOwner) {
        // User is the family plan OWNER
        decoded.family_owner_id = session.user_id; // They own themselves
        decoded.member_role = 'owner';
        decoded.dashboard_type = 'normal'; // Owners have normal dashboard
        decoded.has_family_plan_access = true;
        
        console.log('✅ User is FAMILY PLAN OWNER:', {
          userId: decoded.id,
          ownerId: decoded.family_owner_id
        });
      } else {
        // User is an INVITED FAMILY MEMBER
        decoded.family_owner_id = session.family_owner_id;
        decoded.member_role = session.member_role;
        decoded.dashboard_type = session.family_dashboard_type;
        decoded.has_family_plan_access = 
          session.owner_plan_type === 'family' && 
          session.owner_subscription_status === 'active';
        
        console.log('✅ User is INVITED FAMILY MEMBER:', {
          userId: decoded.id,
          ownerId: decoded.family_owner_id,
          dashboard_type: decoded.dashboard_type,
          member_role: decoded.member_role
        });
        
        // SPECIAL HANDLING FOR INVITED FAMILY MEMBERS WITH KID DASHBOARD
        if (session.family_dashboard_type === 'kid') {
          // Family members with kid dashboard login as PARENT mode
          // Frontend will treat them as kid mode based on dashboard_type
          req.needsProfileSelection = false;
          req.sessionMode = 'parent'; // ← LOGIN AS PARENT MODE
          req.activeKidProfile = null; // ← NO KID PROFILE IN DB
          
          // Set simulated kid profile for frontend only
          decoded.active_kid_profile = `family_${session.user_id}`;
          
          // SKIP database update - let them login normally
          req.user = decoded;
          req.session = session;
          return next();
        }
      }
    } else {
      decoded.is_family_member = false;
      decoded.has_family_plan_access = false;
      console.log('❌ User is NOT in family:', { userId: decoded.id });
    }

    // FAMILY PLAN OWNERS and regular users check for profile selection
    const userRequiresProfileSelection = 
      decoded.role === 'viewer' && 
      session.plan_type === 'family' && 
      session.subscription_status === 'active' &&
      session.session_mode === null; // Only if no mode selected yet

    if (userRequiresProfileSelection) {
      req.needsProfileSelection = true;
    } else {
      req.needsProfileSelection = false;
      req.sessionMode = session.session_mode;
      req.activeKidProfile = session.active_kid_profile_id ? {
        id: session.active_kid_profile_id,
        name: session.kid_profile_name,
        maxAgeRating: session.max_age_rating
      } : null;
    }

    // Attach session data
    req.user = decoded;
    req.session = session;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({
      error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;