const jwt = require("jsonwebtoken");
const { query } = require("../config/dbConfig");

// ✅ Logout a specific session
const logoutSession = async (req, res) => {
  try {
    const { session_id } = req.body;
    const token = req.cookies?.token;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session belongs to the logged-in user
    const [session] = await query(
      "SELECT * FROM user_session WHERE id = ? AND user_id = ?",
      [session_id, decoded.id]
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Mark session as logged out
    await query(
      `UPDATE user_session 
       SET logout_time = NOW(), is_active = FALSE 
       WHERE id = ?`,
      [session_id]
    );

    res.json({ message: "Session logged out successfully" });
  } catch (err) {
    console.error("❌ Logout session error:", err);
    res.status(500).json({ error: "Something went wrong while logging out session." });
  }
};

// ✅ Logout all other sessions except current one
const logoutAllOtherSessions = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Mark all other active sessions as logged out
    await query(
      `UPDATE user_session 
       SET logout_time = NOW(), is_active = FALSE 
       WHERE user_id = ? 
       AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM user_session 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 1
         ) AS sub
       ) 
       AND logout_time IS NULL`,
      [decoded.id, decoded.id]
    );

    res.json({ message: "All other sessions logged out successfully" });
  } catch (err) {
    console.error("❌ Logout all sessions error:", err);
    res.status(500).json({ error: "Something went wrong while logging out other sessions." });
  }
};

module.exports = {
  logoutSession,
  logoutAllOtherSessions,
};
