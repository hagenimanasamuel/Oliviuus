const { query } = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const { Parser } = require("json2csv");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail } = require("../services/emailService");

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

// ✅ Get all users
const getUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "newest";
    const date_start = req.query.date_start || "";
    const date_end = req.query.date_end || "";
    const last_login = req.query.last_login || "";

    // Base query with LEFT JOIN on sessions table
    let sql = `
      SELECT u.*, 
        MAX(s.logout_time) AS last_login_time
      FROM users u
      LEFT JOIN user_session s ON u.id = s.user_id
      WHERE 1=1
    `;
    const params = [];

    // Search
    if (search) {
      sql += " AND u.email LIKE ?";
      params.push(`%${search}%`);
    }

    // Role filter
    if (role) {
      sql += " AND u.role = ?";
      params.push(role);
    }

    // Status filter
    if (status) {
      sql += " AND u.is_active = ?";
      params.push(status === "active" ? 1 : 0);
    }

    // Registration date filter
    if (date_start && date_end) {
      sql += " AND DATE(u.created_at) BETWEEN ? AND ?";
      params.push(date_start, date_end);
    } else if (date_start) {
      sql += " AND DATE(u.created_at) >= ?";
      params.push(date_start);
    } else if (date_end) {
      sql += " AND DATE(u.created_at) <= ?";
      params.push(date_end);
    }

    // Last login filter using sessions
    if (last_login) {
      const now = new Date();
      let startDate;

      switch (last_login) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          sql += " AND s.logout_time >= ?";
          params.push(startDate);
          break;
        case "week":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          sql += " AND s.logout_time >= ?";
          params.push(startDate);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          sql += " AND s.logout_time >= ?";
          params.push(startDate);
          break;
        case "quarter":
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          sql += " AND s.logout_time >= ?";
          params.push(startDate);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          sql += " AND s.logout_time >= ?";
          params.push(startDate);
          break;
        case "never":
          sql += " AND s.logout_time IS NULL";
          break;
      }
    }

    sql += " GROUP BY u.id";

    // Sorting
    switch (sort) {
      case "newest":
        sql += " ORDER BY u.created_at DESC";
        break;
      case "oldest":
        sql += " ORDER BY u.created_at ASC";
        break;
      case "email_asc":
        sql += " ORDER BY u.email ASC";
        break;
      case "email_desc":
        sql += " ORDER BY u.email DESC";
        break;
      case "role":
        sql += " ORDER BY u.role ASC";
        break;
      case "last_login":
        sql += " ORDER BY last_login_time DESC";
        break;
      default:
        sql += " ORDER BY u.created_at DESC";
        break;
    }

    // Pagination
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const users = await query(sql, params);

    // Total count
    let countSql = "SELECT COUNT(*) as total FROM users u WHERE 1=1";
    const countParams = [];
    if (search) {
      countSql += " AND u.email LIKE ?";
      countParams.push(`%${search}%`);
    }
    if (role) {
      countSql += " AND u.role = ?";
      countParams.push(role);
    }
    if (status) {
      countSql += " AND u.is_active = ?";
      countParams.push(status === "active" ? 1 : 0);
    }
    if (date_start && date_end) {
      countSql += " AND DATE(u.created_at) BETWEEN ? AND ?";
      countParams.push(date_start, date_end);
    } else if (date_start) {
      countSql += " AND DATE(u.created_at) >= ?";
      countParams.push(date_start);
    } else if (date_end) {
      countSql += " AND DATE(u.created_at) <= ?";
      countParams.push(date_end);
    }

    const countRes = await query(countSql, countParams);
    const total = countRes[0]?.total || users.length;

    res.status(200).json({ users, total });
  } catch (err) {
    console.error("❌ Error in getUsers:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

// ✅ Get total active users
const getTotalUsers = async (req, res) => {
  try {
    const result = await query("SELECT COUNT(*) AS total FROM users");
    res.status(200).json({ total: result[0].total });
  } catch (err) {
    console.error("❌ Error in getTotalUsers:", err);
    res.status(500).json({ message: "Failed to fetch total users." });
  }
};

// ✅ Export users filtered (CSV)
const exportUsers = async (req, res) => {
  try {
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";

    let sql = "SELECT id, email, role, is_active, subscription_plan, created_at FROM users WHERE 1=1";
    const params = [];

    if (search) {
      sql += " AND email LIKE ?";
      params.push(`%${search}%`);
    }
    if (role) {
      sql += " AND role = ?";
      params.push(role);
    }
    if (status) {
      sql += " AND is_active = ?";
      params.push(status === "active" ? 1 : 0);
    }

    sql += " ORDER BY created_at DESC";

    const users = await query(sql, params);

    const fields = ["id", "email", "role", "is_active", "subscription_plan", "created_at"];
    const parser = new Parser({ fields });
    const csv = parser.parse(users);

    res.header("Content-Type", "text/csv");
    res.attachment("users_export.csv");
    return res.send(csv);
  } catch (err) {
    console.error("❌ Error in exportUsers:", err);
    res.status(500).json({ message: "Failed to export users." });
  }
};

// ✅ ADMIN: Update user status (activate/deactivate)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    // Validate input
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: "is_active must be a boolean" });
    }

    // Update user status
    await query(
      "UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [is_active, userId]
    );

    // If deactivating, also invalidate active sessions
    if (!is_active) {
      await query(
        "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
        [userId]
      );
    }

    res.status(200).json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully.`,
      is_active
    });
  } catch (err) {
    console.error("❌ Error in updateUserStatus:", err);
    res.status(500).json({ message: "Failed to update user status." });
  }
};

// ✅ ADMIN: Update user email
const updateUserEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Check if email already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Update user email
    await query(
      "UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?",
      [email, userId]
    );

    res.status(200).json({
      message: "Email updated successfully.",
      email
    });
  } catch (err) {
    console.error("❌ Error in updateUserEmail:", err);
    res.status(500).json({ message: "Failed to update email." });
  }
};

// ✅ ADMIN: Delete user account
const adminDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Delete user-related data
    await query("DELETE FROM user_session WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_preferences WHERE user_id = ?", [userId]);

    // 2️⃣ Delete the user
    await query("DELETE FROM users WHERE id = ?", [userId]);

    res.status(200).json({ message: "User account deleted successfully." });
  } catch (err) {
    console.error("❌ Error in adminDeleteUser:", err);
    res.status(500).json({ message: "Failed to delete user account." });
  }
};

// ✅ Get user details by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await query(`
      SELECT 
        u.*,
        MAX(s.login_time) as last_login,
        COUNT(DISTINCT s.id) as total_logins,
        COUNT(DISTINCT CASE WHEN s.is_active = FALSE THEN s.id END) as failed_attempts
      FROM users u
      LEFT JOIN user_session s ON u.id = s.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: user[0] });
  } catch (err) {
    console.error("❌ Error in getUserById:", err);
    res.status(500).json({ message: "Failed to fetch user details." });
  }
};

// ✅ Get user login sessions
const getUserLoginSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: "User ID is required" });
    }

    console.log("🔍 Fetching sessions for user:", userId);

    // First, verify the user exists
    const userExists = await query("SELECT id FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const sessions = await query(`
      SELECT 
        id,
        device_name,
        device_type,
        ip_address,
        location,
        login_time,
        logout_time,
        is_active,
        user_agent,
        created_at
      FROM user_session 
      WHERE user_id = ? 
      ORDER BY login_time DESC 
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    console.log("📊 Found sessions:", sessions.length);

    const totalResult = await query(
      "SELECT COUNT(*) as total FROM user_session WHERE user_id = ?",
      [userId]
    );

    // Get session statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_sessions,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as completed_sessions,
        MAX(login_time) as last_login
      FROM user_session 
      WHERE user_id = ?
    `, [userId]);

    // Map the data to match frontend expectations
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      device_name: session.device_name || 'Unknown Device',
      device_type: session.device_type || 'desktop',
      ip_address: session.ip_address || 'Unknown IP',
      location: session.location || 'Unknown location',
      login_time: session.login_time,
      logout_time: session.logout_time,
      is_active: Boolean(session.is_active),
      success: true,
      user_agent: session.user_agent,
      created_at: session.created_at
    }));

    res.status(200).json({
      sessions: formattedSessions,
      total: totalResult[0].total,
      stats: statsResult[0] || {
        total_sessions: 0,
        active_sessions: 0,
        completed_sessions: 0,
        last_login: null
      }
    });
  } catch (err) {
    console.error("❌ Error in getUserLoginSessions:", err);
    res.status(500).json({ message: "Failed to fetch login sessions." });
  }
};

// ✅ Get user overview data with comprehensive stats
const getUserOverview = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Get comprehensive user data with activity stats
    const userData = await query(`
      SELECT 
        u.*,
        up.language,
        up.notifications,
        up.subtitles,
        MAX(us.login_time) as last_login,
        COUNT(DISTINCT us.id) as total_logins,
        (
          SELECT COUNT(*) 
          FROM user_session us2 
          WHERE us2.user_id = u.id 
          AND DATE(us2.login_time) = CURDATE()
        ) as today_logins,
        (
          SELECT COUNT(*) 
          FROM user_session us3 
          WHERE us3.user_id = u.id 
          AND us3.login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ) as week_logins,
        (
          SELECT AVG(TIMESTAMPDIFF(MINUTE, login_time, COALESCE(last_activity, login_time)))
          FROM user_session 
          WHERE user_id = u.id 
          AND last_activity IS NOT NULL
        ) as avg_session_minutes,
        (
          SELECT COUNT(*) 
          FROM user_subscriptions 
          WHERE user_id = u.id 
          AND status = 'active'
          AND (end_date IS NULL OR end_date > NOW())
        ) as active_subscription_count,
        us_current.ip_address as last_ip,
        us_current.device_name as last_device
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      LEFT JOIN user_session us ON u.id = us.user_id
      LEFT JOIN user_session us_current ON u.id = us_current.user_id 
        AND us_current.login_time = (
          SELECT MAX(login_time) 
          FROM user_session 
          WHERE user_id = u.id
        )
      WHERE u.id = ?
      GROUP BY u.id, up.language, up.notifications, up.subtitles, us_current.ip_address, us_current.device_name
    `, [userId]);

    if (userData.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userData[0];

    // Calculate current streak (consecutive days with login)
    const streakResult = await query(`
      WITH login_dates AS (
        SELECT DISTINCT DATE(login_time) as login_date
        FROM user_session 
        WHERE user_id = ? 
        AND login_time IS NOT NULL
        ORDER BY login_date DESC
      ),
      streaks AS (
        SELECT 
          login_date,
          DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (ORDER BY login_date) DAY) as streak_group
        FROM login_dates
      )
      SELECT COUNT(*) as current_streak
      FROM streaks
      WHERE streak_group = (
        SELECT streak_group 
        FROM streaks 
        ORDER BY login_date DESC 
        LIMIT 1
      )
    `, [userId]);

    // Get subscription details
    const subscriptionData = await query(`
      SELECT 
        us.*,
        s.name as subscription_name,
        s.type as subscription_type,
        s.price,
        s.features as subscription_features
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > NOW())
      ORDER BY us.start_date DESC
      LIMIT 1
    `, [userId]);

    // Format the response data
    const overviewData = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        status: user.is_active ? 'active' : 'inactive',
        email_verified: user.email_verified,
        profile_avatar_url: user.profile_avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      preferences: {
        language: user.language || 'en',
        notifications: user.notifications,
        subtitles: user.subtitles
      },
      subscription: subscriptionData.length > 0 ? {
        name: subscriptionData[0].subscription_name,
        type: subscriptionData[0].subscription_type,
        price: subscriptionData[0].price,
        features: subscriptionData[0].subscription_features ? JSON.parse(subscriptionData[0].subscription_features) : null,
        start_date: subscriptionData[0].start_date,
        end_date: subscriptionData[0].end_date,
        status: subscriptionData[0].status
      } : {
        name: user.subscription_plan !== 'none' ? user.subscription_plan : 'Free',
        type: 'free',
        price: 0,
        features: null,
        status: 'active'
      },
      activity: {
        total_logins: user.total_logins || 0,
        failed_attempts: 0, // Your table doesn't track failed logins
        today_logins: user.today_logins || 0,
        week_logins: user.week_logins || 0,
        current_streak: streakResult[0]?.current_streak || 0,
        avg_session_minutes: Math.round(user.avg_session_minutes) || 0,
        avg_session: user.avg_session_minutes ? 
          `${Math.floor(user.avg_session_minutes)}m ${Math.round((user.avg_session_minutes % 1) * 60)}s` : "0m 00s",
        last_login: user.last_login,
        last_ip: user.last_ip,
        last_device: user.last_device
      },
      stats: {
        active_subscription: user.active_subscription_count > 0,
        total_subscriptions: user.active_subscription_count
      }
    };

    res.status(200).json(overviewData);
  } catch (err) {
    console.error("❌ Error in getUserOverview:", err);
    res.status(500).json({ message: "Failed to fetch user overview data." });
  }
};

// ✅ Get user activity timeline
const getUserActivityTimeline = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const activities = await query(`
      SELECT 
        'login' as type,
        login_time as timestamp,
        device_name as device,
        ip_address as ip,
        location,
        is_active as success,
        NULL as description
      FROM user_session 
      WHERE user_id = ?
      
      UNION ALL
      
      SELECT 
        'subscription' as type,
        start_date as timestamp,
        NULL as device,
        NULL as ip,
        NULL as location,
        TRUE as success,
        CONCAT('Subscribed to ', s.name) as description
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ?
      
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `, [userId, userId, limit, offset]);

    const totalResult = await query(`
      SELECT (
        (SELECT COUNT(*) FROM user_session WHERE user_id = ?) +
        (SELECT COUNT(*) FROM user_subscriptions WHERE user_id = ?)
      ) as total
    `, [userId, userId]);

    res.status(200).json({
      activities,
      total: totalResult[0]?.total || 0
    });
  } catch (err) {
    console.error("❌ Error in getUserActivityTimeline:", err);
    res.status(500).json({ message: "Failed to fetch user activity timeline." });
  }
};

// ✅ Update user preferences
const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { language, notifications, subtitles, genres } = req.body;

    // Check if preferences exist
    const existingPrefs = await query(
      "SELECT id FROM user_preferences WHERE user_id = ?",
      [userId]
    );

    if (existingPrefs.length > 0) {
      // Update existing preferences
      await query(`
        UPDATE user_preferences 
        SET language = ?, notifications = ?, subtitles = ?, genres = ?, updated_at = NOW()
        WHERE user_id = ?
      `, [language, notifications, subtitles, JSON.stringify(genres), userId]);
    } else {
      // Insert new preferences
      await query(`
        INSERT INTO user_preferences (user_id, language, notifications, subtitles, genres)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, language, notifications, subtitles, JSON.stringify(genres)]);
    }

    res.status(200).json({ 
      message: "User preferences updated successfully.",
      preferences: { language, notifications, subtitles, genres }
    });
  } catch (err) {
    console.error("❌ Error in updateUserPreferences:", err);
    res.status(500).json({ message: "Failed to update user preferences." });
  }
};

// ✅ Get user subscription history
const getUserSubscriptionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscriptions = await query(`
      SELECT 
        us.*,
        s.name as subscription_name,
        s.type as subscription_type,
        s.price,
        s.features as subscription_features,
        s.devices_allowed
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.start_date DESC
    `, [userId]);

    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      name: sub.subscription_name,
      type: sub.subscription_type,
      price: sub.price,
      features: sub.subscription_features ? JSON.parse(sub.subscription_features) : null,
      devices_allowed: sub.devices_allowed ? JSON.parse(sub.devices_allowed) : null,
      start_date: sub.start_date,
      end_date: sub.end_date,
      status: sub.status,
      created_at: sub.created_at
    }));

    res.status(200).json({ subscriptions: formattedSubscriptions });
  } catch (err) {
    console.error("❌ Error in getUserSubscriptionHistory:", err);
    res.status(500).json({ message: "Failed to fetch subscription history." });
  }
};

// ✅ Get user security settings
const getUserSecuritySettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const securityData = await query(`
      SELECT 
        u.email_verified,
        u.two_factor_enabled,
        (
          SELECT COUNT(*) 
          FROM user_session 
          WHERE user_id = u.id 
          AND is_active = TRUE
        ) as active_sessions,
        (
          SELECT MAX(login_time)
          FROM user_session 
          WHERE user_id = u.id
        ) as last_login,
        (
          SELECT COUNT(*) 
          FROM password_resets 
          WHERE user_id = u.id 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ) as password_resets_last_30_days
      FROM users u
      WHERE u.id = ?
    `, [userId]);

    if (securityData.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const securityInfo = securityData[0];

    res.status(200).json({
      email_verified: securityInfo.email_verified,
      two_factor_enabled: securityInfo.two_factor_enabled || false,
      active_sessions: securityInfo.active_sessions || 0,
      last_login: securityInfo.last_login,
      password_resets_last_30_days: securityInfo.password_resets_last_30_days || 0
    });
  } catch (err) {
    console.error("❌ Error in getUserSecuritySettings:", err);
    res.status(500).json({ message: "Failed to fetch security settings." });
  }
};

// ✅ Terminate specific user session
const terminateUserSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    
    // Verify the session belongs to the user
    const sessionCheck = await query(
      "SELECT id FROM user_session WHERE id = ? AND user_id = ?",
      [sessionId, userId]
    );

    if (sessionCheck.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    await query(
      "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE id = ? AND user_id = ?",
      [sessionId, userId]
    );

    res.status(200).json({ message: "Session terminated successfully" });
  } catch (err) {
    console.error("❌ Error in terminateUserSession:", err);
    res.status(500).json({ message: "Failed to terminate session" });
  }
};

// ✅ Terminate all user sessions
const terminateAllUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await query(
      "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );

    res.status(200).json({ 
      message: "All sessions terminated successfully",
      terminated: true
    });
  } catch (err) {
    console.error("❌ Error in terminateAllUserSessions:", err);
    res.status(500).json({ message: "Failed to terminate sessions" });
  }
};

// ✅ Get enhanced user login sessions
const getEnhancedUserLoginSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const filter = req.query.filter || "all";

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: "User ID is required" });
    }

    let whereClause = "WHERE user_id = ?";
    const params = [userId];

    // Apply filters based on your table structure
    if (filter === "active") {
      whereClause += " AND is_active = TRUE";
    } else if (filter === "completed") {
      whereClause += " AND is_active = FALSE";
    }

    const sessions = await query(`
      SELECT 
        id,
        device_name,
        device_type,
        ip_address,
        location,
        login_time,
        logout_time,
        last_activity,
        is_active,
        user_agent,
        device_id,
        created_at
      FROM user_session 
      ${whereClause}
      ORDER BY login_time DESC 
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count for pagination
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM user_session ${whereClause}`,
      params
    );

    // Get session statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_sessions,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as completed_sessions,
        MAX(login_time) as last_login
      FROM user_session 
      WHERE user_id = ?
    `, [userId]);

    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      device_name: session.device_name,
      device_type: session.device_type,
      device_info: session.device_name ? `${session.device_name} (${session.device_type})` : `${session.device_type} Device`,
      ip_address: session.ip_address,
      location: session.location,
      login_time: session.login_time,
      logout_time: session.logout_time,
      last_activity: session.last_activity,
      is_active: session.is_active,
      success: true, // All recorded sessions are considered successful
      user_agent: session.user_agent,
      device_id: session.device_id,
      created_at: session.created_at
    }));

    res.status(200).json({
      sessions: formattedSessions,
      total: totalResult[0].total,
      stats: statsResult[0]
    });
  } catch (err) {
    console.error("❌ Error in getEnhancedUserLoginSessions:", err);
    res.status(500).json({ message: "Failed to fetch login sessions" });
  }
};

// ✅ ADMIN: Send password reset email to user
const sendPasswordReset = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Check if user exists
    const users = await query("SELECT id, email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // 2️⃣ Get user preferred language from DB
    let userLang = "en"; // default to English
    const prefs = await query(
      "SELECT language FROM user_preferences WHERE user_id = ?",
      [userId]
    );
    if (prefs.length > 0 && prefs[0].language) {
      userLang = prefs[0].language;
    }

    // 3️⃣ Generate reset token (JWT)
    const resetToken = jwt.sign(
      { id: userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // valid for 1 hour
    );

    // 4️⃣ Build reset link
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    // 5️⃣ Save token in DB for tracking (delete existing first since no used column)
    await query("DELETE FROM password_resets WHERE user_id = ?", [userId]);
    
    await query(
      `INSERT INTO password_resets (user_id, token, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [userId, resetToken]
    );

    // 6️⃣ Send reset email in user's preferred language
    await sendPasswordResetEmail(user.email, resetLink, userLang);

    res.status(200).json({ 
      message: "Password reset email sent successfully",
      language: userLang,
      email: user.email
    });
  } catch (err) {
    console.error("❌ Error in sendPasswordReset:", err);
    res.status(500).json({ message: "Failed to send password reset email." });
  }
};

// ✅ ADMIN: Force password reset (immediate reset by admin)
const forcePasswordReset = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // 1️⃣ Check if user exists
    const users = await query("SELECT id, email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3️⃣ Update password (using 'password' column, not 'password_hash')
    await query(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, userId]
    );

    // 4️⃣ Terminate all active sessions
    await query(
      "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );

    // 5️⃣ Delete any existing reset tokens (since no 'used' column)
    await query("DELETE FROM password_resets WHERE user_id = ?", [userId]);

    res.status(200).json({ 
      message: "Password reset successfully. All active sessions have been terminated.",
      email: users[0].email
    });
  } catch (err) {
    console.error("❌ Error in forcePasswordReset:", err);
    res.status(500).json({ message: "Failed to reset password." });
  }
};

// ✅ ADMIN: Get user security info
const getUserSecurityInfo = async (req, res) => {
  try {
    const { userId } = req.params;

    const securityData = await query(`
      SELECT 
        u.id,
        u.email,
        u.email_verified,
        u.is_active,
        u.created_at,
        u.updated_at,
        up.language,
        (
          SELECT COUNT(*) 
          FROM user_session 
          WHERE user_id = u.id 
          AND is_active = TRUE
        ) as active_sessions,
        (
          SELECT MAX(login_time)
          FROM user_session 
          WHERE user_id = u.id
        ) as last_login,
        (
          SELECT COUNT(*) 
          FROM password_resets 
          WHERE user_id = u.id 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND expires_at > NOW()
        ) as pending_reset_requests,
        (
          SELECT COUNT(*)
          FROM user_session
          WHERE user_id = u.id
          AND login_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND is_active = FALSE
          AND logout_time IS NOT NULL
        ) as recent_logins
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.id = ?
    `, [userId]);

    if (securityData.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const securityInfo = securityData[0];

    res.status(200).json({
      user_id: securityInfo.id,
      email: securityInfo.email,
      email_verified: securityInfo.email_verified,
      is_active: securityInfo.is_active,
      language: securityInfo.language || 'en',
      active_sessions: securityInfo.active_sessions || 0,
      last_login: securityInfo.last_login,
      pending_reset_requests: securityInfo.pending_reset_requests || 0,
      recent_logins: securityInfo.recent_logins || 0,
      account_created: securityInfo.created_at,
      last_updated: securityInfo.updated_at
    });
  } catch (err) {
    console.error("❌ Error in getUserSecurityInfo:", err);
    res.status(500).json({ message: "Failed to fetch security information." });
  }
};

// ✅ ADMIN: Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['admin', 'viewer'].includes(role)) {
      return res.status(400).json({ message: "Role must be either 'admin' or 'viewer'" });
    }

    // Check if user exists
    const users = await query("SELECT id, email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user role
    await query(
      "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?",
      [role, userId]
    );

    res.status(200).json({ 
      message: `User role updated to ${role} successfully.`,
      role,
      email: users[0].email
    });
  } catch (err) {
    console.error("❌ Error in updateUserRole:", err);
    res.status(500).json({ message: "Failed to update user role." });
  }
};

module.exports = {
  deactivateAccount,
  deleteAccount,
  getUsers,
  getTotalUsers,
  exportUsers,
  updateUserStatus,
  updateUserEmail,
  adminDeleteUser,
  getUserById,
  getUserLoginSessions,
  getUserOverview,
  getUserActivityTimeline,
  updateUserPreferences,
  getUserSubscriptionHistory,
  getUserSecuritySettings,
  terminateUserSession,
  terminateAllUserSessions,
  getEnhancedUserLoginSessions,
  sendPasswordReset,
  forcePasswordReset,
  getUserSecurityInfo,
  updateUserRole,
};