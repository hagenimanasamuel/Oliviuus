const { query } = require("../config/dbConfig");
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendAccountCreatedEmail } = require("../services/emailService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Generate alphanumeric code (letters + numbers)
const generateCode = (length = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check email & send verification if not found
const checkEmail = async (req, res) => {
  const { email, language } = req.body;
  const lang = language || "rw"; // default to Kinyarwanda if not provided

  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // 1. Check if email exists in users table
    const userResults = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (userResults.length > 0) {
      return res.json({ exists: true, message: "Email already registered" });
    }

    // 2. Generate verification code
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    // 3. Check if email already exists in email_verifications
    const verificationResults = await query(
      "SELECT id FROM email_verifications WHERE email = ?",
      [email]
    );

    if (verificationResults.length > 0) {
      // Update existing verification record
      await query(
        "UPDATE email_verifications SET code = ?, created_at = NOW(), expires_at = ? WHERE email = ?",
        [code, expiresAt, email]
      );
    } else {
      // Insert new verification record
      await query(
        "INSERT INTO email_verifications (email, code, expires_at) VALUES (?, ?, ?)",
        [email, code, expiresAt]
      );
    }

    // 4. Send email with code and selected language
    await sendVerificationEmail(email, code, lang);

    return res.json({
      exists: false,
      message: "Verification code sent successfully",
    });
  } catch (err) {
    console.error("❌ Error in checkEmail:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};


// Save user info after email verification (UserInfoStep)
const saveUserInfo = async (req, res) => {
  const { email, password, language, device_name, device_type, user_agent } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 1. Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert user into the database
    const result = await query(
      `INSERT INTO users 
      (email, password, email_verified, is_active, role, subscription_plan)
      VALUES (?, ?, true, true, 'viewer', 'none')`,
      [email, hashedPassword]
    );

    const userId = result.insertId;

    // 3a. Generate avatar URL using DiceBear (based on userId)
    const avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${userId}`;

    // 3b. Save avatar URL in users table
    await query("UPDATE users SET profile_avatar_url = ? WHERE id = ?", [avatarUrl, userId]);

    // 4. Insert default user preferences
    const chosenLang = language || "rw";
    await query(
      `INSERT INTO user_preferences (user_id, language, genres)
       VALUES (?, ?, NULL)`,
      [userId, chosenLang]
    );

    // 5. Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(email, chosenLang);
    } catch (emailErr) {
      console.error("⚠️ Failed to send welcome email:", emailErr);
    }

    // 6. Generate JWT token (same as login)
    const token = jwt.sign(
      { id: userId, role: "viewer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // token valid for 7 days
    );

    // 7. Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    // 8. Record session in user_session table (same logic as login)
    const ip_address =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";

    await query(
      `INSERT INTO user_session 
       (user_id, session_token, device_name, device_type, ip_address, user_agent, token_expires)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [
        userId,
        token, // 🔑 use the same JWT as cookie
        device_name || "Unknown",
        device_type || "desktop",
        ip_address,
        user_agent || "Unknown",
      ]
    );

    // 9. Return created user info
    return res.status(200).json({
      message: "User created and logged in successfully",
      user: {
        id: userId,
        email,
        role: "viewer",
        profile_avatar_url: avatarUrl,
      },
      preferences: { language: chosenLang, genres: null },
    });
  } catch (err) {
    console.error("❌ Error in saveUserInfo:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};



// ✅ GET logged in user 
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.cookies?.token; // current JWT session token

    // Fetch all user columns 
    const userRows = await query(
      `SELECT id, email, role, email_verified, is_active, profile_avatar_url, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRows[0];

    // Fetch user preferences
    const prefRows = await query(
      `SELECT * FROM user_preferences WHERE user_id = ?`,
      [userId]
    );
    const preferences = prefRows[0] || {};

    // Fetch all sessions for this user
    const sessionRows = await query(
      `SELECT id, session_token, device_name, device_type, ip_address, location, login_time, last_activity, is_active, logout_time, user_agent, device_id
       FROM user_session
       WHERE user_id = ?
       ORDER BY last_activity DESC`,
      [userId]
    );

    // Merge user, preferences, sessions, and current session token
    const result = {
      ...user,
      preferences,
      sessions: sessionRows,
      current_session_token: currentToken, // <- important for frontend
    };

    res.json(result);
  } catch (err) {
    console.error("❌ Error in getMe:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};


// ✅ LOGOUT user
const logout = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Update the latest active session for this user
      await query(
        `UPDATE user_session 
         SET logout_time = NOW(), is_active = FALSE
         WHERE user_id = ? AND logout_time IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [decoded.id]
      );
    }

    // Clear the auth cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).json({ error: "Something went wrong while logging out." });
  }
};


// login controller
const loginUser = async (req, res) => {
  const { email, password, device_name, device_type, user_agent } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 1️⃣ Check user
    const rows = await query(
      "SELECT id, password, role, is_active FROM users WHERE email = ?",
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 3️⃣ Generate JWT token (used for both cookie + DB session)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4️⃣ Set HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 5️⃣ Record session in user_session table
    const ip_address =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";

    await query(
      `INSERT INTO user_session 
       (user_id, session_token, device_name, device_type, ip_address, user_agent, token_expires)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [
        user.id,
        token, // 🔑 use the same JWT as cookie + middleware
        device_name || "Unknown",
        device_type || "desktop",
        ip_address,
        user_agent || "Unknown",
      ]
    );

    // 6️⃣ Return response
    return res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email, role: user.role },
    });
  } catch (err) {
    console.error("❌ Error in loginUser:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// Update user's profile avatar
const updateProfileAvatar = async (req, res) => {
  const { profile_avatar_url } = req.body;
  const userId = req.user.id;

  if (!profile_avatar_url) {
    return res.status(400).json({ error: "Profile avatar URL is required" });
  }

  try {
    // 1️⃣ Update avatar URL in users table
    await query(
      "UPDATE users SET profile_avatar_url = ?, updated_at = NOW() WHERE id = ?",
      [profile_avatar_url, userId]
    );

    // 2️⃣ Return updated user info
    const updatedUserRows = await query(
      "SELECT id, email, role, profile_avatar_url, email_verified, is_active, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    if (updatedUserRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "Profile avatar updated successfully",
      user: updatedUserRows[0],
    });
  } catch (err) {
    console.error("❌ Error in updateProfileAvatar:", err);
    return res.status(500).json({ error: "Failed to update profile avatar" });
  }
};

// ✅ Update user password
const updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both current and new passwords are required." });
  }

  try {
    // 1️⃣ Get current hashed password
    const userRows = await query("SELECT password FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) return res.status(404).json({ error: "User not found." });

    const hashedPassword = userRows[0].password;

    // 2️⃣ Verify current password
    const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });

    // 3️⃣ Hash new password
    const salt = await bcrypt.genSalt(12);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // 4️⃣ Update password in DB
    await query("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", [
      newHashedPassword,
      userId,
    ]);

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("❌ Error in updatePassword:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// ✅ REQUEST PASSWORD RESET
const requestPasswordReset = async (req, res) => {
  const { email, language } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // 1️⃣ Check if user exists
    const users = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    const userId = users[0].id;

    // 2️⃣ Get user preferred language from DB (fallback to request or default 'en')
    let userLang = "en";
    if (language) {
      userLang = language;
    } else {
      const prefs = await query(
        "SELECT language FROM user_preferences WHERE user_id = ?",
        [userId]
      );
      if (prefs.length > 0 && prefs[0].language) {
        userLang = prefs[0].language;
      }
    }

    // 3️⃣ Generate reset token (JWT)
    const resetToken = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // valid for 1 hour
    );

    // 4️⃣ Build reset link
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    // 5️⃣ Save token in DB (optional for tracking)
    await query(
      `INSERT INTO password_resets (user_id, token, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
       ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)`,
      [userId, resetToken]
    );

    // 6️⃣ Send reset email in correct language
    await sendPasswordResetEmail(email, resetLink, userLang);

    return res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    console.error("❌ Error in requestPasswordReset:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password in DB
    await query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    // Optional: delete any existing password reset tokens
    await query("DELETE FROM password_resets WHERE user_id = ?", [userId]);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(400).json({ error: "Invalid or expired reset link" });
  }
};

// create user via admin
const createUser = async (req, res) => {
  const { email, role = "viewer", language } = req.body;
  const lang = language || "rw"; // default to Kinyarwanda

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!role) return res.status(400).json({ error: "Role is required" });

  try {
    // 1️⃣ Check if user exists
    const existingUser = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 2️⃣ Set default profile picture (avatar)
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=BC8BBC&color=fff&size=128`;

    // 3️⃣ Create user with placeholder password and profile picture
    const result = await query(
      `INSERT INTO users (email, password, email_verified, is_active, role, subscription_plan, profile_avatar_url)
       VALUES (?, '', true, true, ?, 'none', ?)`,
      [email, role, defaultAvatar]
    );
    const userId = result.insertId;

    // 4️⃣ Save language in user_preferences
    await query(
      `INSERT INTO user_preferences (user_id, language) VALUES (?, ?)`,
      [userId, lang]
    );

    // 5️⃣ Generate JWT for password setup
    const resetToken = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    // 6️⃣ Send account created email in the selected language
    await sendAccountCreatedEmail(email, resetLink, lang);

    // 7️⃣ Return created user info including profile picture
    res.status(201).json({
      message: "User created successfully. Account email sent.",
      user: { id: userId, email, role, language: lang, profile_avatar_url: defaultAvatar },
    });
  } catch (err) {
    console.error("❌ Error in createUser:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};






// Exporting all Controllers
module.exports = {
  checkEmail,
  saveUserInfo,
  getMe,
  logout,
  loginUser,
  updateProfileAvatar,
  updatePassword,
  requestPasswordReset,
  resetPassword,
  createUser,
};
