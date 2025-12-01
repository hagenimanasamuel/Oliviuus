// middleware/authMiddleware.js
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

    let sessionRows = [];
    
    // Check if user has active kid session OR is family member with kid dashboard
    if (decoded.active_kid_profile) {
      sessionRows = await query(
        `SELECT * FROM kids_sessions 
         WHERE session_token = ? AND is_active = TRUE AND expires_at > NOW()`,
        [token]
      );
    } else {
      // Check for regular user session OR family member session
      sessionRows = await query(
        `SELECT * FROM user_session WHERE session_token = ? AND is_active = TRUE AND token_expires > NOW()`,
        [token]
      );
    }

    if (!sessionRows || sessionRows.length === 0) {
      return res.status(401).json({ error: "Session no longer active" });
    }

    // Check if user is a family member with special dashboard type
    const familyMemberCheck = await query(`
      SELECT 
        fm.*,
        u.email as owner_email,
        us.subscription_name,
        us.status as subscription_status,
        s.type as plan_type
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      LEFT JOIN user_subscriptions us ON fm.family_owner_id = us.user_id 
        AND us.status = 'active' 
        AND us.start_date <= UTC_TIMESTAMP() 
        AND us.end_date > UTC_TIMESTAMP()
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE fm.user_id = ? 
        AND fm.invitation_status = 'accepted'
        AND fm.is_active = true
      LIMIT 1
    `, [decoded.id]);

    if (familyMemberCheck.length > 0) {
      const familyData = familyMemberCheck[0];
      decoded.is_family_member = true;
      decoded.family_owner_id = familyData.family_owner_id;
      decoded.member_role = familyData.member_role;
      decoded.dashboard_type = familyData.dashboard_type;
      decoded.has_family_plan_access = familyData.plan_type === 'family' && 
        familyData.subscription_status === 'active';
    } else {
      decoded.is_family_member = false;
      decoded.has_family_plan_access = false;
    }

    req.user = decoded;
    req.session = sessionRows[0];

    next();
  } catch (err) {
    console.error("Auth error:", err.message);

    return res.status(401).json({
      error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;