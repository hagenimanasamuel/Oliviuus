const { query } = require("../config/dbConfig");
const jwt = require("jsonwebtoken");

const createKidSession = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const { kid_profile_id } = req.body;

    if (!kid_profile_id) {
      return res.status(400).json({ error: "Kid profile ID is required" });
    }

    const kidProfile = await query(
      `SELECT kp.*, kcr.max_age_rating 
       FROM kids_profiles kp
       LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
       WHERE kp.id = ? AND kp.parent_user_id = ? AND kp.is_active = TRUE`,
      [kid_profile_id, parentUserId]
    );

    if (kidProfile.length === 0) {
      return res.status(404).json({ error: "Kid profile not found or access denied" });
    }

    const kidToken = jwt.sign(
      {
        id: parentUserId,
        role: "viewer",
        active_kid_profile: parseInt(kid_profile_id),
        session_type: "kid"
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    await query(
      `INSERT INTO kids_sessions 
       (kid_profile_id, parent_user_id, session_token, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [kid_profile_id, parentUserId, kidToken]
    );

    await query(
      "UPDATE kids_profiles SET last_active_at = NOW() WHERE id = ?",
      [kid_profile_id]
    );

    res.cookie("token", kidToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Kid session started successfully",
      kid_profile: kidProfile[0]
      // Removed redirect_to: "/kid-dashboard"
    });

  } catch (error) {
    console.error("Error creating kid session:", error);
    res.status(500).json({ error: "Failed to create kid session" });
  }
};

const exitKidSession = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const currentToken = req.cookies?.token;

    if (!currentToken) {
      return res.status(400).json({ error: "No active session" });
    }

    let decoded;
    try {
      decoded = jwt.verify(currentToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    if (!decoded.active_kid_profile) {
      return res.status(400).json({ error: "Not in kid mode" });
    }

    await query(
      `UPDATE kids_sessions 
       SET is_active = FALSE, logout_time = NOW() 
       WHERE session_token = ? AND parent_user_id = ?`,
      [currentToken, parentUserId]
    );

    const parentToken = jwt.sign(
      { id: parentUserId, role: "viewer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await query(
      `INSERT INTO user_session 
       (user_id, session_token, is_active, token_expires)
       VALUES (?, ?, TRUE, DATE_ADD(NOW(), INTERVAL 7 DAY))
       ON DUPLICATE KEY UPDATE
       session_token = VALUES(session_token),
       token_expires = VALUES(token_expires),
       is_active = VALUES(is_active)`,
      [parentUserId, parentToken]
    );

    res.cookie("token", parentToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Exited kid mode successfully"
    });

  } catch (error) {
    console.error("Error exiting kid session:", error);
    res.status(500).json({ error: "Failed to exit kid session" });
  }
};

const getCurrentKidSession = async (req, res) => {
  try {
    const parentUserId = req.user.id;
    const currentToken = req.cookies?.token;

    if (!currentToken) {
      return res.json({ is_kid_mode: false });
    }

    let decoded;
    try {
      decoded = jwt.verify(currentToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.json({ is_kid_mode: false });
    }

    if (!decoded.active_kid_profile) {
      return res.json({ is_kid_mode: false });
    }

    const kidSession = await query(
      `SELECT ks.*, kp.name, kp.avatar_url, kcr.max_age_rating
       FROM kids_sessions ks
       JOIN kids_profiles kp ON ks.kid_profile_id = kp.id
       LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
       WHERE ks.session_token = ? 
       AND ks.parent_user_id = ? 
       AND ks.is_active = TRUE
       AND ks.expires_at > NOW()`,
      [currentToken, parentUserId]
    );

    if (kidSession.length === 0) {
      return res.json({ is_kid_mode: false });
    }

    res.json({
      is_kid_mode: true,
      kid_session: kidSession[0]
    });

  } catch (error) {
    console.error("Error getting kid session:", error);
    res.json({ is_kid_mode: false });
  }
};

const checkProfileSelection = async (req, res) => {
  try {
    const userId = req.user.id;

    const kidProfiles = await query(
      `SELECT COUNT(*) as kid_count FROM kids_profiles 
       WHERE parent_user_id = ? AND is_active = TRUE`,
      [userId]
    );

    const requiresSelection = kidProfiles[0].kid_count > 0;

    res.json({
      success: true,
      requires_profile_selection: requiresSelection
    });

  } catch (error) {
    console.error("Error checking profile selection:", error);
    res.status(500).json({ error: "Failed to check profile selection" });
  }
};

module.exports = {
  createKidSession,
  exitKidSession,
  getCurrentKidSession,
  checkProfileSelection
};