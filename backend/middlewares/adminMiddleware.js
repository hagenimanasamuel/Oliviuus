const { query } = require("../config/dbConfig");

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Fetch fresh user data from database to check role
    const users = await query(
      "SELECT role, is_active FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Check if user account is active
    if (!user.is_active) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // Check if user has admin role
    const adminRoles = ['admin', 'viewer'];
    
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: "Admin access required",
        message: "You need administrator privileges to access this resource"
      });
    }

    // Attach fresh user data to request
    req.user.role = user.role;
    req.user.is_active = user.is_active;

    next();
  } catch (err) {
    console.error("❌ Admin middleware error:", err.message);
    return res.status(500).json({ error: "Server error in admin verification" });
  }
};

module.exports = adminMiddleware;