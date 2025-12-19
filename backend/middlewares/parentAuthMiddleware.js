const { query } = require("../config/dbConfig");

const parentAuthMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if user is a family owner or parent role
    const userCheck = await query(`
      SELECT 
        u.id,
        u.role,
        fm.member_role as family_role,
        fm.family_owner_id,
        (SELECT COUNT(*) FROM kids_profiles WHERE parent_user_id = u.id) as has_kids
      FROM users u
      LEFT JOIN family_members fm ON u.id = fm.user_id AND fm.invitation_status = 'accepted'
      WHERE u.id = ?
    `, [userId]);

    if (userCheck.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = userCheck[0];
    
    // Allow if: user is admin, family owner, parent role, or has kids profiles
    const isAuthorized = 
      user.role === 'admin' || 
      user.family_role === 'owner' || 
      user.family_role === 'parent' || 
      user.has_kids > 0;

    if (!isAuthorized) {
      return res.status(403).json({ 
        error: "Access denied. You need to be a family owner, parent, or have kid profiles to access this feature." 
      });
    }

    // Attach parent info to request
    req.parent = {
      id: user.id,
      role: user.role,
      family_role: user.family_role,
      family_owner_id: user.family_owner_id,
      has_kids: user.has_kids
    };

    next();
  } catch (error) {
    console.error("Parent auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

module.exports = parentAuthMiddleware;