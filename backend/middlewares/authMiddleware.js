// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { query } = require("../config/dbConfig"); // use the query helper you defined

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Optional: check expiration manually
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ error: "Token expired" });
    }

    // 🔄 Cross-check with database to ensure session is still valid
    const rows = await query(
      "SELECT * FROM user_session WHERE session_token = ? AND is_active = 1",
      [token]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: "Session no longer active" });
    }

    // Attach user payload and db session
    req.user = decoded;
    req.session = rows[0];

    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);

    return res.status(401).json({
      error:
        err.name === "TokenExpiredError"
          ? "Token expired"
          : "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
