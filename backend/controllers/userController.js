const { query } = require("../config/dbConfig");
const bcrypt = require("bcrypt");

// ✅ Deactivate account (soft delete)
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Mark account as inactive
    await query(
      "UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?",
      [userId]
    );

    // Optionally, invalidate all active sessions
    await query(
      "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );

    res.status(200).json({ message: "Account deactivated successfully." });
  } catch (err) {
    console.error("❌ Error in deactivateAccount:", err);
    res.status(500).json({ message: "Failed to deactivate account." });
  }
};

// ✅ Delete account (permanent)
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Delete user-related data (sessions, preferences, etc.)
    await query("DELETE FROM user_session WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_preferences WHERE user_id = ?", [userId]);

    // 2️⃣ Delete the user
    await query("DELETE FROM users WHERE id = ?", [userId]);

    // 3️⃣ Clear auth cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("❌ Error in deleteAccount:", err);
    res.status(500).json({ message: "Failed to delete account." });
  }
};

module.exports = {
  deactivateAccount,
  deleteAccount,
};