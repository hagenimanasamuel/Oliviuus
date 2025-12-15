const { query } = require("../config/dbConfig");
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendAccountCreatedEmail } = require("../services/emailService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Generate alphanumeric code (letters + numbers)
const generateCode = (length = 6) => {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
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

    // 5. Send welcome email in background (non-blocking)
    const sendWelcomeEmailBackground = async (email, language) => {
      try {
        await sendWelcomeEmail(email, language);
        // console.log(`✅ Welcome email sent to ${email}`);
      } catch (emailErr) {
        // console.error("⚠️ Failed to send welcome email:", emailErr);
        // Don't throw error - just log it
      }
    };

    // Trigger email sending in background without waiting
    sendWelcomeEmailBackground(email, chosenLang);

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
   (user_id, session_token, device_name, device_type, ip_address, 
    user_agent, token_expires, session_mode, active_kid_profile_id)
   VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NULL)`,
      [
        userId,
        token,
        device_name || "Unknown",
        device_type || "desktop",
        ip_address,
        user_agent || "Unknown",
      ]
    );

    // 9. Send welcome notifications to the user
    await sendWelcomeNotifications(userId, chosenLang);

    // 10. Return created user info immediately (don't wait for email)
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

// Helper function to send welcome notifications
const sendWelcomeNotifications = async (userId, language) => {
  try {
    const currentTime = new Date();

    // Welcome notification
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'welcome', '🎉 Welcome to Oliviuus!', ?, 'party', 'user', ?, 'normal', ?, ?)`,
      [
        userId,
        `Welcome to Oliviuus! We're excited to have you on board. Start exploring thousands of movies and series tailored just for you.`,
        userId,
        JSON.stringify({
          timestamp: currentTime.toISOString(),
          language: language,
          is_welcome: true
        }),
        "/browse"
      ]
    );

    // Profile customization tip
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'tip', '👤 Personalize Your Experience', ?, 'user', 'user', ?, 'low', ?, ?)`,
      [
        userId,
        `Make Oliviuus truly yours! Customize your profile, set up multiple viewing profiles for family members, and adjust your preferences in account settings.`,
        userId,
        JSON.stringify({
          timestamp: currentTime.toISOString(),
          language: language,
          tip_type: 'profile_customization'
        }),
        "/account/settings#profiles"
      ]
    );

    // Content discovery tip
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'tip', '🎬 Discover Amazing Content', ?, 'film', 'user', ?, 'low', ?, ?)`,
      [
        userId,
        `Explore our vast library of movies and series. Use our smart recommendations to find content you'll love based on your preferences.`,
        userId,
        JSON.stringify({
          timestamp: currentTime.toISOString(),
          language: language,
          tip_type: 'content_discovery'
        }),
        "/browse"
      ]
    );

    // Mobile app tip (if applicable)
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'tip', '📱 Watch Anywhere', ?, 'smartphone', 'user', ?, 'low', ?, ?)`,
      [
        userId,
        `Take Oliviuus with you! Download our mobile app to watch your favorite content on the go, download for offline viewing, and continue watching across all your devices.`,
        userId,
        JSON.stringify({
          timestamp: currentTime.toISOString(),
          language: language,
          tip_type: 'mobile_app'
        }),
        "/download"
      ]
    );

    // Subscription info tip
    await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'tip', '💎 Upgrade Your Experience', ?, 'diamond', 'user', ?, 'low', ?, ?)`,
      [
        userId,
        `Enjoying Oliviuus? Upgrade to a premium plan for HD streaming, multiple screens, offline downloads, and exclusive content. Explore our subscription plans to get the most out of your experience.`,
        userId,
        JSON.stringify({
          timestamp: currentTime.toISOString(),
          language: language,
          tip_type: 'subscription_info'
        }),
        "/subscriptions"
      ]
    );

    // console.log(`✅ Sent welcome notifications to user ${userId}`);

  } catch (error) {
    // console.error('Error sending welcome notifications:', error);
    // Don't throw error to avoid breaking user registration flow
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

    if (!token) {
      return res.status(200).json({ success: true, message: "Already logged out" });
    }

    // Verify token to get user info
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // If token is invalid, just clear the cookie
      res.clearCookie("token");
      return res.json({ success: true, message: "Logged out successfully" });
    }

    const userId = decoded.id;

    // Clear both adult and kid sessions
    await Promise.all([
      // Clear adult session
      query(
        "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
        [userId]
      ),
      // Clear kid sessions
      query(
        "UPDATE kids_sessions SET is_active = FALSE, logout_time = NOW() WHERE parent_user_id = ? AND is_active = TRUE",
        [userId]
      )
    ]);

    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout error:", error);
    // Always clear cookie even on error
    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully" });
  }
};


// login controller
const loginUser = async (req, res) => {
  const { email, password, device_name, device_type, user_agent } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const ip_address = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";

    // 1️⃣ Check user
    const rows = await query(
      "SELECT id, password, role, is_active, email FROM users WHERE email = ?",
      [email]
    );

    if (!rows || rows.length === 0) {
      // Send notification for failed login attempt (invalid email)
      await handleFailedLoginAttempt(null, email, ip_address, device_name, device_type, 'invalid_email');
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    if (!user.is_active) {
      // Send notification for disabled account attempt
      await handleFailedLoginAttempt(user.id, email, ip_address, device_name, device_type, 'account_disabled');
      return res.status(403).json({ error: "Account is disabled" });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Send notification for failed password attempt
      await handleFailedLoginAttempt(user.id, email, ip_address, device_name, device_type, 'invalid_password');
      return res.status(400).json({ error: "Invalid email or password" });
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
    await query(
      `INSERT INTO user_session 
   (user_id, session_token, device_name, device_type, ip_address, 
    user_agent, token_expires, session_mode, active_kid_profile_id)
   VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NULL)`,
      [
        user.id,
        token,
        device_name || "Unknown",
        device_type || "desktop",
        ip_address,
        user_agent || "Unknown",
      ]
    );

    // 6️⃣ Send success notification for new device/login
    await handleSuccessfulLogin(user.id, email, ip_address, device_name, device_type, user_agent);

    // 7️⃣ Return response
    return res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email, role: user.role },
    });
  } catch (err) {
    console.error("❌ Error in loginUser:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// Google Sign-In authentication
const googleAuth = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: "Google token is required" });
  }

  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;
    
    // Check if user exists in your database
    const existingUser = await query("SELECT id, role, is_active, profile_avatar_url FROM users WHERE email = ?", [email]);
    
    let userId;
    let userRole = "viewer";
    let isNewUser = false;
    
    if (existingUser.length > 0) {
      // Existing user
      userId = existingUser[0].id;
      userRole = existingUser[0].role;
      
      if (!existingUser[0].is_active) {
        return res.status(403).json({ error: "Account is disabled" });
      }
    } else {
      // New user - create account
      isNewUser = true;
      
      // Generate avatar URL using DiceBear (based on googleId)
      const avatarUrl = picture || `https://api.dicebear.com/7.x/shapes/svg?seed=${googleId}`;
      
      // Insert new user
      const result = await query(
        `INSERT INTO users 
        (email, password, email_verified, is_active, role, subscription_plan, profile_avatar_url)
        VALUES (?, ?, ?, true, 'viewer', 'none', ?)`,
        [email, 'google_oauth', email_verified || false, avatarUrl]
      );
      
      userId = result.insertId;
      
      // Set default language
      const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'rw';
      await query(
        `INSERT INTO user_preferences (user_id, language) VALUES (?, ?)`,
        [userId, language]
      );
      
      // Send welcome notifications
      await sendWelcomeNotifications(userId, language);
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: userId, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Set HttpOnly cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    // Record session
    const ip_address = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown";
    const user_agent = req.headers["user-agent"] || "Unknown";
    
    await query(
      `INSERT INTO user_session 
      (user_id, session_token, device_name, device_type, ip_address, 
       user_agent, token_expires, session_mode, active_kid_profile_id)
      VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NULL)`,
      [
        userId,
        jwtToken,
        "Google Sign-In",
        "web",
        ip_address,
        user_agent,
      ]
    );
    
    // Send login notification
    await handleSuccessfulLogin(userId, email, ip_address, "Google Sign-In", "web", user_agent);
    
    return res.status(200).json({
      success: true,
      message: isNewUser ? "Account created and logged in successfully" : "Login successful",
      user: {
        id: userId,
        email,
        role: userRole,
        profile_avatar_url: existingUser.length > 0 ? existingUser[0].profile_avatar_url : (picture || null),
        is_new_user: isNewUser
      }
    });
    
  } catch (error) {
    console.error("❌ Google auth error:", error);
    
    if (error.message.includes('Token used too late')) {
      return res.status(401).json({ error: "Google token has expired" });
    }
    
    res.status(401).json({ 
      success: false,
      error: "Google authentication failed"
    });
  }
};

// Helper function to handle failed login attempts with rate limiting
const handleFailedLoginAttempt = async (userId, email, ip_address, device_name, device_type, reason) => {
  try {
    const currentTime = new Date();
    const fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000);

    // MariaDB compatible rate limiting - check by created_at timestamp only
    const existingNotification = await query(
      `SELECT id FROM notifications 
       WHERE user_id = ? 
       AND reference_type = 'user' 
       AND type = 'security_alert' 
       AND created_at > ? 
       LIMIT 1`,
      [userId, fiveMinutesAgo]
    );

    // If no recent notification exists, send one
    if (!existingNotification || existingNotification.length === 0) {
      let title, message, action_url;

      switch (reason) {
        case 'invalid_email':
          title = '🔒 Suspicious Login Attempt Blocked';
          message = `We detected a failed login attempt for your email (${email}) from ${device_name || 'an unknown device'} (${ip_address}). The attempt was blocked by Oliviuus security due to incorrect credentials. If this wasn't you, we recommend securing your account.`;
          action_url = "/account/settings#security";
          break;
        case 'invalid_password':
          title = '🔒 Failed Login Attempt Detected';
          message = `A login attempt to your account from ${device_name || 'an unknown device'} (${ip_address}) was blocked due to incorrect password. If this wasn't you, we strongly recommend changing your password immediately.`;
          action_url = "/account/settings#security";
          break;
        case 'account_disabled':
          title = '🚫 Login Attempt on Disabled Account';
          message = `Someone tried to access your disabled account from ${device_name || 'an unknown device'} (${ip_address}). No action is required as your account remains secure.`;
          action_url = "/account/settings#security";
          break;
        default:
          title = '⚠️ Security Alert';
          message = `Unusual login activity detected on your account from ${ip_address}. Please review your account security.`;
          action_url = "/account/settings#security";
      }

      // Create notification with action URL
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'security_alert', ?, ?, 'shield-alert', 'user', ?, 'high', ?, ?)`,
        [
          userId,
          title,
          message,
          userId,
          JSON.stringify({
            ip_address: ip_address,
            device_name: device_name || 'Unknown',
            device_type: device_type || 'desktop',
            reason: reason,
            timestamp: currentTime.toISOString()
          }),
          action_url
        ]
      );
    }

    // Always log the failed attempt in security_logs table
    await query(
      `INSERT INTO security_logs 
       (user_id, action, ip_address, device_info, status, details) 
       VALUES (?, 'login_attempt', ?, ?, 'failed', ?)`,
      [
        userId,
        ip_address,
        JSON.stringify({
          device_name: device_name,
          device_type: device_type
        }),
        JSON.stringify({ reason: reason, email_attempted: email })
      ]
    );

  } catch (error) {
    console.error('Error handling failed login attempt:', error);
    // Don't throw error to avoid breaking login flow
  }
};

// Helper function to handle successful logins
const handleSuccessfulLogin = async (userId, email, ip_address, device_name, device_type, user_agent) => {
  try {
    const currentTime = new Date();

    // Check if this device has logged in before (within last 30 days)
    const existingSession = await query(
      `SELECT id FROM user_session 
       WHERE user_id = ? 
       AND ip_address = ? 
       AND device_type = ?
       AND is_active = true
       AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
       LIMIT 1`,
      [userId, ip_address, device_type]
    );

    const isNewDevice = !existingSession || existingSession.length === 0;

    if (isNewDevice) {
      // Send notification for login from new device
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'new_device_login', '📱 New Login Location', ?, 'devices', 'user', ?, 'high', ?, ?)`,
        [
          userId,
          `Your Account was just accessed from a new ${device_type || 'device'} (${device_name || 'Unknown Device'}) at ${ip_address}. If this wasn't you, please secure your account immediately by changing your password.`,
          userId,
          JSON.stringify({
            ip_address: ip_address,
            device_name: device_name || 'Unknown',
            device_type: device_type || 'desktop',
            location: 'Unknown',
            timestamp: currentTime.toISOString(),
            is_new_device: true
          }),
          "/account/settings#sessions"
        ]
      );
    } else {
      // Send notification for successful login from recognized device
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'login_success', '✅ Login Successful', ?, 'shield-check', 'user', ?, 'low', ?, ?)`,
        [
          userId,
          `You've successfully logged in to your Oliviuus account from your ${device_name || 'device'} (${device_type || 'desktop'}). Welcome back!`,
          userId,
          JSON.stringify({
            ip_address: ip_address,
            device_name: device_name || 'Unknown',
            device_type: device_type || 'desktop',
            timestamp: currentTime.toISOString(),
            is_new_device: false
          }),
          "/account/settings#sessions"
        ]
      );
    }

    // Log successful login in security_logs table
    await query(
      `INSERT INTO security_logs 
       (user_id, action, ip_address, device_info, status, details) 
       VALUES (?, 'login_attempt', ?, ?, 'success', ?)`,
      [
        userId,
        ip_address,
        JSON.stringify({
          device_name: device_name,
          device_type: device_type,
          is_new_device: isNewDevice
        }),
        JSON.stringify({ email: email, new_device: isNewDevice })
      ]
    );

  } catch (error) {
    console.error('Error handling successful login:', error);
    // Don't throw error to avoid breaking login flow
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

    // 6️⃣ Send account created email in background
    const sendAccountCreatedEmailBackground = async (email, resetLink, language) => {
      try {
        await sendAccountCreatedEmail(email, resetLink, language);
        console.log(`✅ Account creation email sent to ${email}`);
      } catch (emailErr) {
        console.error("⚠️ Failed to send account creation email:", emailErr);
        // Don't throw error - just log it
      }
    };

    // Trigger email sending in background without waiting
    sendAccountCreatedEmailBackground(email, resetLink, lang);

    // 7️⃣ Send role-based notifications
    await sendRoleBasedNotifications(userId, role, lang);

    // 8️⃣ Return created user info including profile picture
    res.status(201).json({
      message: "User created successfully. Account setup email sent.",
      user: { id: userId, email, role, language: lang, profile_avatar_url: defaultAvatar },
    });
  } catch (err) {
    console.error("❌ Error in createUser:", err);
    res.status(500).json({ error: "Something went wrong, please try again." });
  }
};

// Helper function to send role-based notifications
const sendRoleBasedNotifications = async (userId, role, language) => {
  try {
    const currentTime = new Date();

    if (role === "admin") {
      // Admin-specific notifications
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'admin_welcome', '⚡ Admin Account Created', ?, 'shield', 'user', ?, 'high', ?, ?)`,
        [
          userId,
          `Your Oliviuus admin account has been created. You now have access to the admin dashboard with full system management capabilities. Please set your password to get started.`,
          userId,
          JSON.stringify({
            timestamp: currentTime.toISOString(),
            language: language,
            role: 'admin',
            is_admin: true
          }),
          "/admin/dashboard"
        ]
      );

      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'admin_tip', '🔧 Admin Responsibilities', ?, 'settings', 'user', ?, 'high', ?, ?)`,
        [
          userId,
          `As an admin, you can manage users, content, subscriptions, and system settings. Review the admin guide to understand your responsibilities and capabilities.`,
          userId,
          JSON.stringify({
            timestamp: currentTime.toISOString(),
            language: language,
            tip_type: 'admin_responsibilities'
          }),
          "/admin/guide"
        ]
      );

      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'security', '🔒 Secure Your Admin Account', ?, 'lock', 'user', ?, 'high', ?, ?)`,
        [
          userId,
          `Admin accounts require enhanced security. Please set a strong password immediately and enable two-factor authentication for maximum security.`,
          userId,
          JSON.stringify({
            timestamp: currentTime.toISOString(),
            language: language,
            security_level: 'high'
          }),
          "/account/settings#security"
        ]
      );

    } else {
      // Viewer-specific notifications (same as registration flow)
      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'welcome', '🎉 Welcome to Oliviuus!', ?, 'party', 'user', ?, 'normal', ?, ?)`,
        [
          userId,
          `Welcome to Oliviuus! Your account has been created. We're excited to have you on board. Start exploring thousands of movies and series tailored just for you.`,
          userId,
          JSON.stringify({
            timestamp: currentTime.toISOString(),
            language: language,
            is_welcome: true,
            created_by_admin: true
          }),
          "/browse"
        ]
      );

      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'tip', '👤 Complete Your Setup', ?, 'user', 'user', ?, 'normal', ?, ?)`,
        [
          userId,
          `Your Oliviuus account is ready! Please set your password to start watching. You can then customize your profile and preferences.`,
          userId,
          JSON.stringify({
            timestamp: currentTime.toISOString(),
            language: language,
            tip_type: 'setup_required'
          }),
          "/reset-password"
        ]
      );

      await query(
        `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'tip', '🎬 Discover Amazing Content', ?, 'film', 'user', ?, 'low', ?, ?)`,
        [
          userId,
          `Once you set your password, explore our vast library of movies and series. Use our smart recommendations to find content you'll love.`,
          userId,
          JSON.stringify({
            timestamp: currentTime.toISOString(),
            language: language,
            tip_type: 'content_discovery'
          }),
          "/browse"
        ]
      );
    }

    // console.log(`✅ Sent ${role}-specific notifications to user ${userId}`);

  } catch (error) {
    // console.error('Error sending role-based notifications:', error);
    // Don't throw error to avoid breaking user creation flow
  }
};






// Exporting all Controllers
module.exports = {
  checkEmail,
  saveUserInfo,
  getMe,
  logout,
  loginUser,
  googleAuth,
  updateProfileAvatar,
  updatePassword,
  requestPasswordReset,
  resetPassword,
  createUser,
};
