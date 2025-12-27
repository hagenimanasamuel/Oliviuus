const { query } = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const { Parser } = require("json2csv");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail, sendAdminMessageEmail } = require("../services/emailService");

// ✅ Deactivate account (soft delete)
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      "UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?",
      [userId]
    );

    await query(
      "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );

    res.status(200).json({ message: "Account deactivated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to deactivate account." });
  }
};

// ✅ Delete account (permanent)
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await query("DELETE FROM user_session WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_preferences WHERE user_id = ?", [userId]);
    await query("DELETE FROM users WHERE id = ?", [userId]);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
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

    let sql = `
      SELECT u.*, 
        MAX(s.logout_time) AS last_login_time
      FROM users u
      LEFT JOIN user_session s ON u.id = s.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += " AND u.email LIKE ?";
      params.push(`%${search}%`);
    }

    if (role) {
      sql += " AND u.role = ?";
      params.push(role);
    }

    if (status) {
      sql += " AND u.is_active = ?";
      params.push(status === "active" ? 1 : 0);
    }

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

    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const users = await query(sql, params);

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
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

// ✅ Get total active users
const getTotalUsers = async (req, res) => {
  try {
    const result = await query("SELECT COUNT(*) AS total FROM users");
    res.status(200).json({ total: result[0].total });
  } catch (err) {
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
    res.status(500).json({ message: "Failed to export users." });
  }
};

// ✅ ADMIN: Update user status (activate/deactivate)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: "is_active must be a boolean" });
    }

    await query(
      "UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [is_active, userId]
    );

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
    res.status(500).json({ message: "Failed to update user status." });
  }
};

// ✅ ADMIN: Update user email
const updateUserEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const existingUser = await query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    await query(
      "UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?",
      [email, userId]
    );

    res.status(200).json({
      message: "Email updated successfully.",
      email
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update email." });
  }
};

// ✅ ADMIN: Delete user account
const adminDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await query("DELETE FROM user_session WHERE user_id = ?", [userId]);
    await query("DELETE FROM user_preferences WHERE user_id = ?", [userId]);
    await query("DELETE FROM users WHERE id = ?", [userId]);

    res.status(200).json({ message: "User account deleted successfully." });
  } catch (err) {
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

    const totalResult = await query(
      "SELECT COUNT(*) as total FROM user_session WHERE user_id = ?",
      [userId]
    );

    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_sessions,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as completed_sessions,
        MAX(login_time) as last_login
      FROM user_session 
      WHERE user_id = ?
    `, [userId]);

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

    // Get basic user data
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
        ) as week_logins
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      LEFT JOIN user_session us ON u.id = us.user_id
      WHERE u.id = ?
      GROUP BY u.id, up.language, up.notifications, up.subtitles
    `, [userId]);

    if (userData.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userData[0];

    // Get session statistics
    const sessionStats = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_sessions,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as completed_sessions,
        AVG(TIMESTAMPDIFF(MINUTE, login_time, COALESCE(logout_time, NOW()))) as avg_session_minutes
      FROM user_session 
      WHERE user_id = ?
    `, [userId]);

    // Get current streak
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

    // Get subscription details - FIXED: Get actual subscription data
    const subscriptionData = await query(`
      SELECT 
        us.*,
        s.name as subscription_name,
        s.type as subscription_type,
        s.price,
        s.currency
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > NOW())
      ORDER BY us.start_date DESC
      LIMIT 1
    `, [userId]);

    // Get last session details
    const lastSession = await query(`
      SELECT ip_address, device_name 
      FROM user_session 
      WHERE user_id = ? 
      ORDER BY login_time DESC 
      LIMIT 1
    `, [userId]);

    // FIXED: Determine actual subscription data with proper mapping
    let actualSubscription = {};
    if (subscriptionData.length > 0) {
      // User has an active subscription in user_subscriptions table
      const sub = subscriptionData[0];
      actualSubscription = {
        name: sub.subscription_name || sub.name,
        type: sub.subscription_type || sub.type,
        price: sub.price || 0,
        currency: sub.currency || 'RWF',
        start_date: sub.start_date,
        end_date: sub.end_date,
        status: sub.status || 'active'
      };
    } else {
      // Fallback to user's subscription_plan field with proper mapping
      // FIXED: Use consistent mapping that matches SubscriptionTab
      const userSubscriptionPlan = user.subscription_plan;

      let subscriptionName = 'Free';
      let subscriptionType = 'free';
      let price = 0;

      switch (userSubscriptionPlan) {
        case 'free_trial':
          subscriptionName = 'Free Trial';
          subscriptionType = 'free_trial';
          break;
        case 'basic':
          subscriptionName = 'Basic';
          subscriptionType = 'basic';
          price = 4900;
          break;
        case 'standard':
          subscriptionName = 'Standard';
          subscriptionType = 'standard';
          price = 8900;
          break;
        case 'premium':
          subscriptionName = 'Premium';
          subscriptionType = 'mobile'; // Map premium to mobile to match SubscriptionTab
          price = 12900;
          break;
        case 'custom':
          subscriptionName = 'Custom';
          subscriptionType = 'custom';
          price = 0;
          break;
        case 'none':
        default:
          subscriptionName = 'Free';
          subscriptionType = 'free';
          price = 0;
      }

      actualSubscription = {
        name: subscriptionName,
        type: subscriptionType,
        price: price,
        currency: 'RWF',
        start_date: user.created_at,
        end_date: null,
        status: 'active'
      };
    }

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
      subscription: actualSubscription, // Use the actual subscription data
      activity: {
        total_logins: user.total_logins || 0,
        today_logins: user.today_logins || 0,
        week_logins: user.week_logins || 0,
        current_streak: streakResult[0]?.current_streak || 0,
        avg_session_minutes: Math.round(sessionStats[0]?.avg_session_minutes) || 0,
        avg_session: sessionStats[0]?.avg_session_minutes ?
          `${Math.floor(sessionStats[0].avg_session_minutes)}m ${Math.round((sessionStats[0].avg_session_minutes % 1) * 60)}s` : "0m 00s",
        last_login: user.last_login,
        last_ip: lastSession[0]?.ip_address || 'Unknown',
        last_device: lastSession[0]?.device_name || 'Unknown device'
      },
      stats: {
        active_subscription: subscriptionData.length > 0,
        total_subscriptions: subscriptionData.length,
        active_sessions: sessionStats[0]?.active_sessions || 0,
        total_sessions: sessionStats[0]?.total_sessions || 0
      }
    };

    res.status(200).json(overviewData);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user overview data."
    });
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
    res.status(500).json({ message: "Failed to fetch user activity timeline." });
  }
};

// ✅ Update user preferences
const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { language, notifications, subtitles, genres } = req.body;

    const existingPrefs = await query(
      "SELECT id FROM user_preferences WHERE user_id = ?",
      [userId]
    );

    if (existingPrefs.length > 0) {
      await query(`
        UPDATE user_preferences 
        SET language = ?, notifications = ?, subtitles = ?, genres = ?, updated_at = NOW()
        WHERE user_id = ?
      `, [language, notifications, subtitles, JSON.stringify(genres), userId]);
    } else {
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
    res.status(500).json({ message: "Failed to update user preferences." });
  }
};

// ✅ Get user subscription history
const getUserSubscriptionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const userExists = await query("SELECT id, subscription_plan, created_at FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userExists[0];

    const subscriptions = await query(`
      SELECT 
        us.*,
        s.name as subscription_name,
        s.type as subscription_type,
        s.price,
        s.currency,
        s.description,
        s.devices_allowed,
        s.max_sessions,
        s.video_quality,
        s.offline_downloads,
        s.max_profiles
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.start_date DESC
    `, [userId]);

    let formattedSubscriptions = [];

    if (subscriptions.length > 0) {
      formattedSubscriptions = subscriptions.map(sub => ({
        id: sub.id,
        name: sub.subscription_name || sub.subscription_name || 'Unknown Plan',
        type: sub.subscription_type || sub.type || 'free',
        price: sub.subscription_price || sub.price || 0,
        currency: sub.subscription_currency || sub.currency || 'RWF',
        status: sub.status || 'unknown',
        start_date: sub.start_date,
        end_date: sub.end_date,
        cancelled_at: sub.cancelled_at,
        auto_renew: Boolean(sub.auto_renew),
        devices_allowed: sub.devices_allowed ? JSON.parse(sub.devices_allowed) : null,
        max_sessions: sub.max_sessions || 1,
        video_quality: sub.video_quality || 'SD',
        offline_downloads: Boolean(sub.offline_downloads),
        max_profiles: sub.max_profiles || 1,
        created_at: sub.created_at
      }));
    } else {
      const fallbackSubscription = {
        id: 0,
        name: user.subscription_plan !== 'none' ? user.subscription_plan : 'Free',
        type: user.subscription_plan !== 'none' ? user.subscription_plan.toLowerCase() : 'free',
        price: 0,
        currency: 'RWF',
        status: 'active',
        start_date: user.created_at,
        end_date: null,
        cancelled_at: null,
        auto_renew: false,
        devices_allowed: null,
        max_sessions: 1,
        video_quality: 'SD',
        offline_downloads: false,
        max_profiles: 1,
        created_at: user.created_at
      };
      formattedSubscriptions = [fallbackSubscription];
    }

    res.status(200).json({
      subscriptions: formattedSubscriptions,
      total: formattedSubscriptions.length
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch subscription history."
    });
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
    res.status(500).json({ message: "Failed to fetch security settings." });
  }
};

// ✅ Terminate specific user session
const terminateUserSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

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

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM user_session ${whereClause}`,
      params
    );

    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_sessions,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as completed_sessions,
        MAX(login_time) as last_login
      FROM user_session 
      WHERE user_id = ?
    `, [userId]);

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
      success: true,
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
    res.status(500).json({ message: "Failed to fetch login sessions" });
  }
};

// ✅ ADMIN: Send password reset email to user
const sendPasswordReset = async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await query("SELECT id, email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    let userLang = "en";
    const prefs = await query(
      "SELECT language FROM user_preferences WHERE user_id = ?",
      [userId]
    );
    if (prefs.length > 0 && prefs[0].language) {
      userLang = prefs[0].language;
    }

    const resetToken = jwt.sign(
      { id: userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    await query("DELETE FROM password_resets WHERE user_id = ?", [userId]);

    await query(
      `INSERT INTO password_resets (user_id, token, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [userId, resetToken]
    );

    await sendPasswordResetEmail(user.email, resetLink, userLang);

    res.status(200).json({
      message: "Password reset email sent successfully",
      language: userLang,
      email: user.email
    });
  } catch (err) {
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

    const users = await query("SELECT id, email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await query(
      "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, userId]
    );

    await query(
      "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
      [userId]
    );

    await query("DELETE FROM password_resets WHERE user_id = ?", [userId]);

    res.status(200).json({
      message: "Password reset successfully. All active sessions have been terminated.",
      email: users[0].email
    });
  } catch (err) {
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
    res.status(500).json({ message: "Failed to fetch security information." });
  }
};

// ✅ ADMIN: Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'viewer'].includes(role)) {
      return res.status(400).json({ message: "Role must be either 'admin' or 'viewer'" });
    }

    const users = await query("SELECT id, email FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

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
    res.status(500).json({ message: "Failed to update user role." });
  }
};

// ✅ ADMIN: Get user subscription details
const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's active subscription with details
    const subscriptionData = await query(`
      SELECT 
        us.*,
        s.name,
        s.type,
        s.price,
        s.currency,
        s.description,
        s.devices_allowed,
        s.max_sessions,
        s.video_quality,
        s.offline_downloads,
        s.max_profiles
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > NOW())
      ORDER BY us.start_date DESC
      LIMIT 1
    `, [userId]);

    // If no active subscription, check user's subscription_plan field
    if (subscriptionData.length === 0) {
      const userData = await query(
        "SELECT id, subscription_plan, created_at FROM users WHERE id = ?",
        [userId]
      );

      if (userData.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userData[0];

      // FIXED: Map subscription_plan enum to proper subscription data with correct types
      let subscriptionType = 'free';
      let subscriptionName = 'Free';
      let price = 0;

      switch (user.subscription_plan) {
        case 'free_trial':
          subscriptionType = 'free_trial';
          subscriptionName = 'Free Trial';
          break;
        case 'basic':
          subscriptionType = 'basic';
          subscriptionName = 'Basic';
          price = 4900;
          break;
        case 'standard':
          subscriptionType = 'standard';
          subscriptionName = 'Standard';
          price = 8900;
          break;
        case 'premium':
          subscriptionType = 'mobile'; // Map premium to mobile
          subscriptionName = 'Premium';
          price = 12900;
          break;
        case 'custom':
          subscriptionType = 'custom';
          subscriptionName = 'Custom';
          price = 0;
          break;
        case 'none':
        default:
          subscriptionType = 'free';
          subscriptionName = 'Free';
          price = 0;
      }

      return res.status(200).json({
        subscription: {
          name: subscriptionName,
          type: subscriptionType, // Use the mapped type
          status: 'active',
          price: price,
          currency: 'RWF',
          billing_cycle: 'monthly',
          start_date: user.created_at,
          end_date: null,
          auto_renew: false,
          is_active: true
        }
      });
    }

    const sub = subscriptionData[0];
    const subscription = {
      id: sub.id,
      name: sub.name,
      type: sub.type, // Use the actual type from subscriptions table
      status: sub.status,
      price: sub.price,
      currency: sub.currency || 'RWF',
      billing_cycle: 'monthly',
      start_date: sub.start_date,
      end_date: sub.end_date,
      trial_end_date: sub.trial_end_date,
      auto_renew: sub.auto_renew || false,
      is_active: sub.status === 'active',
      description: sub.description,
      devices_allowed: sub.devices_allowed ? JSON.parse(sub.devices_allowed) : null,
      max_sessions: sub.max_sessions || 1,
      video_quality: sub.video_quality || 'SD',
      offline_downloads: sub.offline_downloads || false,
      max_profiles: sub.max_profiles || 1
    };

    res.status(200).json({ subscription });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subscription details." });
  }
};

// ✅ ADMIN: Update user subscription
const updateUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      subscription_type,
      price = 0,
      billing_cycle = 'monthly',
      start_date,
      end_date,
      auto_renew = false,
      status = 'active'
    } = req.body;

    const validTypes = ['mobile', 'basic', 'standard', 'family', 'free', 'custom'];
    if (!validTypes.includes(subscription_type)) {
      return res.status(400).json({
        message: "Invalid subscription type. Must be: mobile, basic, standard, family, free, or custom"
      });
    }

    const userExists = await query("SELECT id FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscriptionPlan = await query(
      "SELECT id, name, price FROM subscriptions WHERE type = ? AND is_active = TRUE",
      [subscription_type]
    );

    let subscriptionId;
    let subscriptionName;
    let subscriptionPrice = price;

    if (subscriptionPlan.length > 0) {
      subscriptionId = subscriptionPlan[0].id;
      subscriptionName = subscriptionPlan[0].name;
      if (!price) {
        subscriptionPrice = subscriptionPlan[0].price;
      }
    } else {
      subscriptionId = null;
      subscriptionName = subscription_type.charAt(0).toUpperCase() + subscription_type.slice(1) + ' Plan';
    }

    let userSubscriptionPlan = 'none';
    switch (subscription_type) {
      case 'free':
        userSubscriptionPlan = 'free_trial';
        break;
      case 'basic':
        userSubscriptionPlan = 'basic';
        break;
      case 'standard':
        userSubscriptionPlan = 'standard';
        break;
      case 'mobile':
        userSubscriptionPlan = 'premium';
        break;
      case 'family':
        userSubscriptionPlan = 'custom';
        break;
      case 'custom':
        userSubscriptionPlan = 'custom';
        break;
    }

    const now = new Date();
    const startDate = start_date ? new Date(start_date) : now;

    let endDate = end_date ? new Date(end_date) : new Date();
    if (!end_date) {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const existingSubscription = await query(`
      SELECT id FROM user_subscriptions 
      WHERE user_id = ? AND status = 'active' AND (end_date IS NULL OR end_date > NOW())
    `, [userId]);

    if (existingSubscription.length > 0) {
      await query(`
        UPDATE user_subscriptions 
        SET 
          subscription_id = ?,
          subscription_name = ?,
          subscription_price = ?,
          subscription_currency = 'RWF',
          start_date = ?,
          end_date = ?,
          auto_renew = ?,
          status = ?,
          updated_at = NOW()
        WHERE user_id = ? AND status = 'active'
      `, [
        subscriptionId,
        subscriptionName,
        subscriptionPrice,
        startDate,
        endDate,
        auto_renew,
        status,
        userId
      ]);
    } else {
      await query(`
        INSERT INTO user_subscriptions (
          user_id, subscription_id, subscription_name, subscription_price, 
          subscription_currency, start_date, end_date, auto_renew, status
        ) VALUES (?, ?, ?, ?, 'RWF', ?, ?, ?, ?)
      `, [
        userId,
        subscriptionId,
        subscriptionName,
        subscriptionPrice,
        startDate,
        endDate,
        auto_renew,
        status
      ]);
    }

    await query(
      "UPDATE users SET subscription_plan = ?, updated_at = NOW() WHERE id = ?",
      [userSubscriptionPlan, userId]
    );

    res.status(200).json({
      message: "Subscription updated successfully.",
      subscription: {
        type: subscription_type,
        name: subscriptionName,
        price: subscriptionPrice,
        currency: 'RWF',
        billing_cycle: billing_cycle,
        start_date: startDate,
        end_date: endDate,
        auto_renew: auto_renew,
        status: status
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update subscription." });
  }
};

// ✅ ADMIN: Cancel user subscription
const cancelUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'admin_cancelled' } = req.body;

    const activeSubscription = await query(`
      SELECT id FROM user_subscriptions 
      WHERE user_id = ? AND status = 'active' AND (end_date IS NULL OR end_date > NOW())
    `, [userId]);

    if (activeSubscription.length === 0) {
      return res.status(404).json({ message: "No active subscription found for this user." });
    }

    await query(`
      UPDATE user_subscriptions 
      SET 
        status = 'cancelled', 
        cancelled_at = NOW(), 
        cancellation_reason = ?,
        auto_renew = FALSE,
        updated_at = NOW()
      WHERE user_id = ? AND status = 'active'
    `, [reason, userId]);

    await query(
      "UPDATE users SET subscription_plan = 'none', updated_at = NOW() WHERE id = ?",
      [userId]
    );

    res.status(200).json({
      message: "Subscription cancelled successfully.",
      cancelled: true,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel subscription." });
  }
};

// ✅ ADMIN: Get available subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await query(`
      SELECT 
        id,
        name,
        type,
        price,
        currency,
        description,
        devices_allowed,
        max_sessions,
        video_quality,
        offline_downloads,
        max_profiles,
        display_order,
        is_popular,
        is_featured,
        is_active
      FROM subscriptions 
      WHERE is_active = TRUE AND is_visible = TRUE
      ORDER BY display_order ASC, price ASC
    `);

    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      type: plan.type,
      price: plan.price,
      currency: plan.currency,
      description: plan.description,
      devices_allowed: plan.devices_allowed ? JSON.parse(plan.devices_allowed) : [],
      max_sessions: plan.max_sessions,
      video_quality: plan.video_quality,
      offline_downloads: plan.offline_downloads,
      max_profiles: plan.max_profiles,
      display_order: plan.display_order,
      is_popular: plan.is_popular,
      is_featured: plan.is_featured,
      is_active: plan.is_active
    }));

    res.status(200).json({ plans: formattedPlans });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subscription plans." });
  }
};

// ✅ ADMIN: Create a new subscription for user
const createUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      subscription_type,
      price = 0,
      duration_months = 1,
      auto_renew = false
    } = req.body;

    const validTypes = ['mobile', 'basic', 'standard', 'family', 'free', 'custom'];
    if (!validTypes.includes(subscription_type)) {
      return res.status(400).json({
        message: "Invalid subscription type"
      });
    }

    const userExists = await query("SELECT id, created_at FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscriptionPlan = await query(
      "SELECT id, name, price FROM subscriptions WHERE type = ? AND is_active = TRUE",
      [subscription_type]
    );

    let subscriptionId = null;
    let subscriptionName = subscription_type.charAt(0).toUpperCase() + subscription_type.slice(1) + ' Plan';
    let subscriptionPrice = price;

    if (subscriptionPlan.length > 0) {
      subscriptionId = subscriptionPlan[0].id;
      subscriptionName = subscriptionPlan[0].name;
      if (!price) {
        subscriptionPrice = subscriptionPlan[0].price;
      }
    }

    let userSubscriptionPlan = 'none';
    switch (subscription_type) {
      case 'free':
        userSubscriptionPlan = 'free_trial';
        break;
      case 'basic':
        userSubscriptionPlan = 'basic';
        break;
      case 'standard':
        userSubscriptionPlan = 'standard';
        break;
      case 'mobile':
        userSubscriptionPlan = 'premium';
        break;
      case 'family':
      case 'custom':
        userSubscriptionPlan = 'custom';
        break;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration_months);

    const result = await query(`
      INSERT INTO user_subscriptions (
        user_id, subscription_id, subscription_name, subscription_price,
        subscription_currency, start_date, end_date, auto_renew, status
      ) VALUES (?, ?, ?, ?, 'RWF', ?, ?, ?, 'active')
    `, [
      userId,
      subscriptionId,
      subscriptionName,
      subscriptionPrice,
      startDate,
      endDate,
      auto_renew
    ]);

    await query(
      "UPDATE users SET subscription_plan = ?, updated_at = NOW() WHERE id = ?",
      [userSubscriptionPlan, userId]
    );

    res.status(201).json({
      message: "Subscription created successfully.",
      subscription: {
        id: result.insertId,
        type: subscription_type,
        name: subscriptionName,
        price: subscriptionPrice,
        start_date: startDate,
        end_date: endDate,
        auto_renew: auto_renew,
        status: 'active'
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create subscription." });
  }
};

// ✅ Get user security logs 
const getUserSecurityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      search = "",
      type = "",
      severity = "",
      date_start = "",
      date_end = ""
    } = req.query;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Verify user exists
    const userExists = await query("SELECT id FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let sql = `
      SELECT 
        sl.*,
        u.email as user_email
      FROM security_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE sl.user_id = ?
    `;
    const params = [userId];

    // Apply filters with safe column names
    if (search) {
      sql += " AND (sl.action LIKE ? OR sl.details LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      // Map frontend event types to your action column values
      const actionMap = {
        'login': 'user_login',
        'password_change': 'password_change',
        'email_change': 'email_update',
        'suspicious_activity': 'suspicious_activity',
        'account_lockout': 'account_blocked'
      };
      const actionValue = actionMap[type] || type;
      sql += " AND sl.action = ?";
      params.push(actionValue);
    }

    if (severity) {
      // Map severity to status
      const statusMap = {
        'low': 'success',
        'medium': 'success',
        'high': 'failed',
        'critical': 'blocked'
      };
      const statusValue = statusMap[severity];
      if (statusValue) {
        sql += " AND sl.status = ?";
        params.push(statusValue);
      }
    }

    if (date_start && date_end) {
      sql += " AND DATE(sl.created_at) BETWEEN ? AND ?";
      params.push(date_start, date_end);
    } else if (date_start) {
      sql += " AND DATE(sl.created_at) >= ?";
      params.push(date_start);
    } else if (date_end) {
      sql += " AND DATE(sl.created_at) <= ?";
      params.push(date_end);
    }

    // Count total records
    const countSql = sql.replace('SELECT sl.*, u.email as user_email', 'SELECT COUNT(*) as total');
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Add ordering and pagination
    sql += " ORDER BY sl.created_at DESC LIMIT ? OFFSET ?";
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const logs = await query(sql, params);

    // Format response with safe field access
    const formattedLogs = logs.map(log => {
      // Safely extract details from JSON field
      let details = {};
      let detailsText = '';
      try {
        if (log.details) {
          details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
          detailsText = typeof details === 'object' ? JSON.stringify(details) : String(details);
        }
      } catch (e) {
        details = { raw: log.details };
        detailsText = String(log.details || '');
      }

      // Safely map action to event_type for frontend
      const action = log.action || 'unknown';
      const eventTypeMap = {
        'user_login': 'login',
        'password_change': 'password_change',
        'email_update': 'email_change',
        'suspicious_activity': 'suspicious_activity',
        'account_blocked': 'account_lockout'
      };

      // Safely map status to severity for frontend
      const status = log.status || 'success';
      const severityMap = {
        'success': action === 'suspicious_activity' ? 'medium' : 'low',
        'failed': 'high',
        'blocked': 'critical'
      };

      return {
        id: log.id || 0,
        user_id: log.user_id || 0,
        user_email: log.user_email || 'Unknown',
        event_type: eventTypeMap[action] || action,
        description: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        details: detailsText,
        severity: severityMap[status] || 'low',
        status: status,
        ip_address: log.ip_address || 'Unknown',
        user_agent: details.user_agent || details.device_info || 'Unknown',
        metadata: details,
        created_at: log.created_at
      };
    });

    res.status(200).json({
      logs: formattedLogs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("❌ Error in getUserSecurityLogs:", err);
    res.status(500).json({ message: "Failed to fetch security logs." });
  }
};

// ✅ Export security logs (CSV)
const exportSecurityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      search = "",
      type = "",
      severity = "",
      date_start = "",
      date_end = ""
    } = req.query;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: "User ID is required" });
    }

    let sql = `
      SELECT 
        sl.id,
        sl.action,
        sl.ip_address,
        sl.status,
        sl.details,
        sl.created_at,
        u.email as user_email
      FROM security_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE sl.user_id = ?
    `;
    const params = [userId];

    // Apply filters
    if (search) {
      sql += " AND (sl.action LIKE ? OR JSON_EXTRACT(sl.details, '$') LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      const actionMap = {
        'login': 'user_login',
        'password_change': 'password_change',
        'email_change': 'email_update',
        'suspicious_activity': 'suspicious_activity',
        'account_lockout': 'account_blocked'
      };
      const actionValue = actionMap[type] || type;
      sql += " AND sl.action = ?";
      params.push(actionValue);
    }

    if (severity) {
      const statusMap = {
        'low': 'success',
        'medium': 'success',
        'high': 'failed',
        'critical': 'blocked'
      };
      const statusValue = statusMap[severity];
      if (statusValue) {
        sql += " AND sl.status = ?";
        params.push(statusValue);
      }
    }

    if (date_start && date_end) {
      sql += " AND DATE(sl.created_at) BETWEEN ? AND ?";
      params.push(date_start, date_end);
    } else if (date_start) {
      sql += " AND DATE(sl.created_at) >= ?";
      params.push(date_start);
    } else if (date_end) {
      sql += " AND DATE(sl.created_at) <= ?";
      params.push(date_end);
    }

    sql += " ORDER BY sl.created_at DESC";

    const logs = await query(sql, params);

    // Convert to CSV with proper field mapping and error handling
    const fields = [
      'id',
      'event_type',
      'description',
      'status',
      'severity',
      'ip_address',
      'user_email',
      'details',
      'created_at'
    ];

    const csvRows = logs.map(log => {
      // Safely format description from action
      const action = log.action || 'unknown_action';
      const description = action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Map status to severity
      const severityMap = {
        'success': log.action === 'suspicious_activity' ? 'medium' : 'low',
        'failed': 'high',
        'blocked': 'critical'
      };
      const severity = severityMap[log.status] || 'low';

      // Safely handle details
      let detailsText = '';
      try {
        if (log.details) {
          const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
          detailsText = typeof details === 'object' ? JSON.stringify(details) : String(details);
        }
      } catch (e) {
        detailsText = String(log.details || '');
      }

      const row = [
        log.id || '',
        action, // event_type
        description, // description
        log.status || '', // status
        severity, // severity
        log.ip_address || '', // ip_address
        log.user_email || '', // user_email
        detailsText, // details
        log.created_at ? new Date(log.created_at).toISOString() : '' // created_at
      ];

      // Escape quotes for CSV
      return row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [
      fields.join(','), // header
      ...csvRows
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`security-logs-${userId}-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("❌ Error in exportSecurityLogs:", err);
    res.status(500).json({ message: "Failed to export security logs." });
  }
};

// ✅ Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 10,
      status = "",
      type = "",
      search = ""
    } = req.query;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Verify user exists
    const userExists = await query("SELECT id, email FROM users WHERE id = ?", [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let sql = `
      SELECT 
        n.*
      FROM notifications n
      WHERE n.user_id = ?
    `;
    const params = [userId];

    // Apply filters
    if (status) {
      sql += " AND n.status = ?";
      params.push(status);
    }

    if (type) {
      sql += " AND n.type = ?";
      params.push(type);
    }

    if (search) {
      sql += " AND (n.title LIKE ? OR n.message LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Count total records
    const countSql = sql.replace('SELECT n.*', 'SELECT COUNT(*) as total');
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Add ordering and pagination
    sql += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?";
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const notifications = await query(sql, params);

    res.status(200).json({
      notifications,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("❌ Error in getUserNotifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

// ✅ Send notification/email to user
const sendUserNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      title,
      message,
      sendType = "both", // "notification", "email", "both"
      priority = "normal",
      type = "admin_message"
    } = req.body;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    // Verify user exists and get email
    const userData = await query("SELECT id, email, is_active FROM users WHERE id = ?", [userId]);
    if (userData.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userData[0];

    if (!user.is_active) {
      return res.status(400).json({ message: "Cannot send to inactive user" });
    }

    const results = [];

    // Send notification if requested
    if (sendType === "notification" || sendType === "both") {
      const notificationResult = await query(`
        INSERT INTO notifications (
          user_id, type, title, message, priority, status, 
          icon, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, 'unread', ?, ?, NOW())
      `, [
        userId,
        type,
        title,
        message,
        priority,
        type === 'admin_message' ? 'bell' : 'info',
        JSON.stringify({ sent_via: 'admin_dashboard', send_type: sendType })
      ]);

      results.push({
        type: 'notification',
        success: true,
        id: notificationResult.insertId
      });
    }

    // Send email if requested
    if (sendType === "email" || sendType === "both") {
      try {
        await sendAdminMessageEmail(user.email, title, message, user.email);
        results.push({
          type: 'email',
          success: true,
          email: user.email
        });
      } catch (emailError) {
        console.error("❌ Failed to send email:", emailError);
        results.push({
          type: 'email',
          success: false,
          error: emailError.message
        });
      }
    }

    res.status(200).json({
      message: "Message sent successfully",
      results,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error("❌ Error in sendUserNotification:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
};

// ✅ Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { userId, notificationId } = req.params;

    const result = await query(`
      UPDATE notifications 
      SET status = 'read', read_at = NOW() 
      WHERE id = ? AND user_id = ? AND status = 'unread'
    `, [notificationId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found or already read" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("❌ Error in markNotificationAsRead:", err);
    res.status(500).json({ message: "Failed to mark notification as read." });
  }
};

// ✅ Archive notification
const archiveNotification = async (req, res) => {
  try {
    const { userId, notificationId } = req.params;

    const result = await query(`
      UPDATE notifications 
      SET status = 'archived'
      WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification archived" });
  } catch (err) {
    console.error("❌ Error in archiveNotification:", err);
    res.status(500).json({ message: "Failed to archive notification." });
  }
};

// ✅ Bulk operations for multiple users - COMPREHENSIVE VERSION
const bulkUserOperations = async (req, res) => {
  try {
    const {
      userIds,
      operation,
      title,
      message,
      subscriptionType,
      customSubscription,
      role,
      sendType = "both",
      userStatus,
      sessionAction
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "User IDs are required" });
    }

    if (userIds.length > 1000) {
      return res.status(400).json({ message: "Cannot process more than 1000 users at once" });
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Get user details for the operation
    const placeholders = userIds.map(() => '?').join(',');
    const users = await query(
      `SELECT id, email, is_active FROM users WHERE id IN (${placeholders})`,
      userIds
    );

    const validUserIds = users.map(user => user.id);
    results.processed = validUserIds.length;

    // Perform the requested operation
    switch (operation) {
      case "notification":
      case "email":
        await handleBulkNotifications(validUserIds, title, message, sendType, results);
        break;

      case "subscription":
        await handleBulkSubscription(validUserIds, subscriptionType, customSubscription, results);
        break;

      case "role":
        await handleBulkRoleChange(validUserIds, role, results);
        break;

      case "status":
        await handleBulkStatusChange(validUserIds, userStatus, results);
        break;

      case "session":
        await handleBulkSessionManagement(validUserIds, sessionAction, results);
        break;

      case "delete":
        await handleBulkDelete(validUserIds, results);
        break;

      default:
        return res.status(400).json({ message: "Invalid operation type" });
    }

    res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error in bulkUserOperations:", err);
    res.status(500).json({ message: "Bulk operation failed." });
  }
};

// Helper function for bulk notifications/emails
const handleBulkNotifications = async (userIds, title, message, sendType, results) => {
  for (const userId of userIds) {
    try {
      // Send notification if requested
      if (sendType === "notification" || sendType === "both") {
        await query(`
          INSERT INTO notifications (
            user_id, type, title, message, priority, status, 
            icon, metadata, created_at
          ) VALUES (?, 'admin_message', ?, ?, 'high', 'unread', 'bell', ?, NOW())
        `, [userId, title, message, JSON.stringify({ bulk_operation: true })]);
      }

      // Send email if requested
      if (sendType === "email" || sendType === "both") {
        const user = await query("SELECT email FROM users WHERE id = ?", [userId]);
        if (user.length > 0) {
          await sendAdminMessageEmail(user[0].email, title, message, user[0].email);
        }
      }

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(`User ${userId}: ${error.message}`);
    }
  }
};

// Helper function for bulk subscription changes - UPDATED with custom subscriptions
const handleBulkSubscription = async (userIds, subscriptionType, customSubscription, results) => {
  let plan;

  // Handle custom subscription
  if (customSubscription && customSubscription.name) {
    plan = {
      id: null, // No ID for custom plans
      name: customSubscription.name,
      type: customSubscription.type || 'custom',
      price: customSubscription.price || 0,
      currency: customSubscription.currency || 'RWF',
      duration_months: customSubscription.duration_months || 1
    };
  } else {
    // Get the subscription plan details from subscriptions table
    const subscriptionPlan = await query(
      "SELECT id, name, type, price, currency FROM subscriptions WHERE type = ? AND is_active = TRUE LIMIT 1",
      [subscriptionType]
    );

    if (subscriptionPlan.length === 0) {
      results.failed = userIds.length;
      results.errors.push(`Subscription plan '${subscriptionType}' not found`);
      return;
    }

    plan = subscriptionPlan[0];
    plan.duration_months = 1; // Default duration for existing plans
  }

  // Map subscription type to user subscription_plan enum
  const userSubscriptionPlanMap = {
    'free': 'none',
    'mobile': 'premium',
    'basic': 'basic',
    'standard': 'standard',
    'family': 'custom',
    'custom': 'custom'
  };

  const userSubscriptionPlan = userSubscriptionPlanMap[plan.type] || 'none';

  // Update users table subscription_plan
  const placeholders = userIds.map(() => '?').join(',');

  try {
    const result = await query(
      `UPDATE users SET subscription_plan = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [userSubscriptionPlan, ...userIds]
    );

    // Also create user_subscriptions records for tracking
    for (const userId of userIds) {
      try {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.duration_months);

        await query(`
          INSERT INTO user_subscriptions (
            user_id, subscription_id, subscription_name, subscription_price, 
            subscription_currency, start_date, end_date, status, auto_renew
          ) VALUES (?, ?, ?, ?, ?, NOW(), ?, 'active', FALSE)
        `, [
          userId,
          plan.id,
          plan.name,
          plan.price,
          plan.currency,
          endDate
        ]);
      } catch (subError) {
        // Continue even if subscription record creation fails
        console.warn(`Failed to create subscription record for user ${userId}:`, subError.message);
      }
    }

    results.successful = result.affectedRows;
    results.failed = userIds.length - result.affectedRows;
  } catch (error) {
    results.failed = userIds.length;
    results.errors.push(`Subscription update failed: ${error.message}`);
  }
};

// Helper function for bulk role changes
const handleBulkRoleChange = async (userIds, role, results) => {
  const placeholders = userIds.map(() => '?').join(',');

  try {
    const result = await query(
      `UPDATE users SET role = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [role, ...userIds]
    );

    results.successful = result.affectedRows;
    results.failed = userIds.length - result.affectedRows;
  } catch (error) {
    results.failed = userIds.length;
    results.errors.push(`Role update failed: ${error.message}`);
  }
};

// Helper function for bulk status changes (activate/deactivate)
const handleBulkStatusChange = async (userIds, userStatus, results) => {
  const isActive = userStatus === 'active';
  const placeholders = userIds.map(() => '?').join(',');

  try {
    const result = await query(
      `UPDATE users SET is_active = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [isActive, ...userIds]
    );

    // If deactivating, also logout all sessions
    if (!isActive) {
      await query(
        `UPDATE user_session SET is_active = FALSE, logout_time = NOW() 
         WHERE user_id IN (${placeholders}) AND is_active = TRUE`,
        [...userIds]
      );
    }

    results.successful = result.affectedRows;
    results.failed = userIds.length - result.affectedRows;
  } catch (error) {
    results.failed = userIds.length;
    results.errors.push(`Status update failed: ${error.message}`);
  }
};

// Helper function for bulk session management
const handleBulkSessionManagement = async (userIds, sessionAction, results) => {
  const placeholders = userIds.map(() => '?').join(',');

  try {
    let result;

    switch (sessionAction) {
      case "logout_all":
        // Logout from all active sessions
        result = await query(
          `UPDATE user_session SET is_active = FALSE, logout_time = NOW() 
           WHERE user_id IN (${placeholders}) AND is_active = TRUE`,
          [...userIds]
        );
        results.successful = result.affectedRows;
        break;

      case "logout_specific":
        // Logout from specific session types (mobile/desktop)
        // You can extend this based on device_type or other criteria
        result = await query(
          `UPDATE user_session SET is_active = FALSE, logout_time = NOW() 
           WHERE user_id IN (${placeholders}) AND is_active = TRUE AND device_type IN ('mobile', 'tablet')`,
          [...userIds]
        );
        results.successful = result.affectedRows;
        break;

      case "clear_old":
        // Remove sessions older than 30 days
        result = await query(
          `DELETE FROM user_session 
           WHERE user_id IN (${placeholders}) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
          [...userIds]
        );
        results.successful = result.affectedRows;
        break;

      default:
        results.failed = userIds.length;
        results.errors.push(`Invalid session action: ${sessionAction}`);
        return;
    }

    results.failed = userIds.length - results.successful;
  } catch (error) {
    results.failed = userIds.length;
    results.errors.push(`Session management failed: ${error.message}`);
  }
};

// Helper function for bulk deletions
const handleBulkDelete = async (userIds, results) => {
  for (const userId of userIds) {
    try {
      // Delete user data in correct order to respect foreign key constraints
      await query("DELETE FROM user_session WHERE user_id = ?", [userId]);
      await query("DELETE FROM user_preferences WHERE user_id = ?", [userId]);
      await query("DELETE FROM notifications WHERE user_id = ?", [userId]);
      await query("DELETE FROM security_logs WHERE user_id = ?", [userId]);
      await query("DELETE FROM user_subscriptions WHERE user_id = ?", [userId]);
      await query("DELETE FROM email_verifications WHERE email = (SELECT email FROM users WHERE id = ?)", [userId]);
      await query("DELETE FROM password_resets WHERE user_id = ?", [userId]);
      await query("DELETE FROM users WHERE id = ?", [userId]);

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(`User ${userId}: ${error.message}`);
    }
  }
};

// ✅ Get available genres from database
const getAvailableGenres = async (req, res) => {
  try {
    const genres = await query(`
      SELECT 
        id,
        name,
        slug,
        description,
        sort_order
      FROM genres 
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, name ASC
    `);

    // Also get categories if you want to include them
    const categories = await query(`
      SELECT 
        id,
        name,
        slug,
        description,
        sort_order
      FROM categories 
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, name ASC
    `);

    res.status(200).json({
      genres: genres,
      categories: categories,
      total: genres.length
    });
  } catch (err) {
    console.error("Error fetching genres:", err);
    res.status(500).json({ message: "Failed to fetch available genres" });
  }
};

// ✅ Get user onboarding status
const getOnboardingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(
      "SELECT onboarding_completed FROM users WHERE id = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      onboarding_completed: result[0].onboarding_completed || false
    });
  } catch (err) {
    console.error("Error getting onboarding status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get onboarding status"
    });
  }
};

// ✅ Complete user onboarding
const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mark onboarding as completed
    await query(
      "UPDATE users SET onboarding_completed = TRUE, updated_at = NOW() WHERE id = ?",
      [userId]
    );

    // Log the onboarding completion
    await query(
      `INSERT INTO security_logs (user_id, action, ip_address, status, details) 
       VALUES (?, 'onboarding_completed', ?, 'success', ?)`,
      [
        userId,
        req.ip || 'unknown',
        JSON.stringify({
          completed_at: new Date().toISOString()
        })
      ]
    );

    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      onboarding_completed: true
    });
  } catch (err) {
    console.error("Error completing onboarding:", err);
    res.status(500).json({
      success: false,
      message: "Failed to complete onboarding"
    });
  }
};

// ✅ Get all kid profiles (for Specials tab)
const getKidProfiles = async (req, res) => {
  try {
    const kidProfiles = await query(`
      SELECT 
        kp.*,
        u.email as parent_email,
        u.id as parent_id,
        CONCAT(u.first_name, ' ', u.last_name) as parent_name,
        (
          SELECT COUNT(*) 
          FROM kids_viewing_history 
          WHERE kid_profile_id = kp.id
        ) as total_viewing_sessions,
        (
          SELECT COUNT(*) 
          FROM kids_watchlist 
          WHERE kid_profile_id = kp.id
        ) as watchlist_items,
        (
          SELECT COUNT(*) 
          FROM parent_notifications 
          WHERE kid_profile_id = kp.id 
          AND status = 'pending'
        ) as pending_notifications,
        (
          SELECT SUM(watch_duration_seconds) 
          FROM kids_viewing_history 
          WHERE kid_profile_id = kp.id
        ) as total_watch_seconds
      FROM kids_profiles kp
      LEFT JOIN users u ON kp.parent_user_id = u.id
      ORDER BY kp.created_at DESC
    `);

    // Convert watch seconds to minutes for display
    const formattedProfiles = kidProfiles.map(profile => ({
      ...profile,
      total_watch_time_minutes: Math.round((profile.total_watch_seconds || 0) / 60),
      calculated_age: calculateAgeFromDB(profile.birth_date)
    }));

    res.status(200).json({
      profiles: formattedProfiles,
      total: formattedProfiles.length
    });
  } catch (err) {
    console.error("Error fetching kid profiles:", err);
    res.status(500).json({ message: "Failed to fetch kid profiles." });
  }
};

// Helper function to calculate age from birth date
const calculateAgeFromDB = (birthDate) => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ✅ Get kid viewing history
const getKidViewingHistory = async (req, res) => {
  try {
    const { kidId } = req.params;
    
    const history = await query(`
      SELECT 
        kvh.*,
        c.title as content_title,
        c.content_type,
        ma.file_name as media_file,
        ma.asset_type
      FROM kids_viewing_history kvh
      LEFT JOIN contents c ON kvh.content_id = c.id
      LEFT JOIN media_assets ma ON kvh.media_asset_id = ma.id
      WHERE kvh.kid_profile_id = ?
      ORDER BY kvh.started_at DESC
      LIMIT 50
    `, [kidId]);

    const formattedHistory = history.map(item => ({
      ...item,
      watch_duration_minutes: Math.round(item.watch_duration_seconds / 60)
    }));

    res.status(200).json({
      history: formattedHistory,
      total: formattedHistory.length
    });
  } catch (err) {
    console.error("Error fetching viewing history:", err);
    res.status(500).json({ message: "Failed to fetch viewing history." });
  }
};

// ✅ Get all family members (for FamilyPlan tab)
const getFamilyMembers = async (req, res) => {
  try {
    const familyMembers = await query(`
      SELECT 
        fm.*,
        u.email as user_email,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        ou.email as owner_email,
        CONCAT(ou.first_name, ' ', ou.last_name) as owner_name,
        fm.created_at as invited_at,
        fm.joined_at,
        (
          SELECT COUNT(*) 
          FROM user_session 
          WHERE user_id = fm.user_id 
          AND is_active = TRUE
        ) as active_sessions,
        (
          SELECT MAX(login_time)
          FROM user_session 
          WHERE user_id = fm.user_id
        ) as last_login
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      LEFT JOIN users ou ON fm.family_owner_id = ou.id
      ORDER BY fm.created_at DESC
    `);

    res.status(200).json({
      members: familyMembers,
      total: familyMembers.length
    });
  } catch (err) {
    console.error("Error fetching family members:", err);
    res.status(500).json({ message: "Failed to fetch family members." });
  }
};

// ✅ Invite new family member
const inviteFamilyMember = async (req, res) => {
  try {
    const { email, role, relationship, dashboardType } = req.body;
    const ownerId = req.user.id;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: "Valid email is required." });
    }

    // Check if user exists
    const user = await query("SELECT id, email, first_name, last_name FROM users WHERE email = ?", [email]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found with this email." });
    }

    const userId = user[0].id;

    // Check if already a family member
    const existingMember = await query(
      "SELECT id FROM family_members WHERE user_id = ? AND family_owner_id = ?",
      [userId, ownerId]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({ message: "User is already a family member." });
    }

    // Create invitation
    const invitationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await query(`
      INSERT INTO family_members (
        user_id, family_owner_id, member_role, relationship, 
        dashboard_type, invitation_status, invitation_token,
        invitation_expires_at, invited_by, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, NOW())
    `, [userId, ownerId, role, relationship, dashboardType, invitationToken, expiresAt, ownerId]);

    // Get owner info for email
    const ownerInfo = await query(
      "SELECT email, first_name, last_name FROM users WHERE id = ?",
      [ownerId]
    );

    // Send invitation email (you would implement this)
    /*
    await sendInvitationEmail({
      to: email,
      ownerName: ownerInfo[0]?.first_name || 'Family Owner',
      invitationToken,
      expiresAt
    });
    */

    res.status(200).json({
      message: "Invitation sent successfully.",
      invitation_sent: true,
      email: email,
      expires_at: expiresAt,
      user_details: {
        id: userId,
        name: `${user[0].first_name} ${user[0].last_name}`,
        email: user[0].email
      }
    });
  } catch (err) {
    console.error("Error inviting family member:", err);
    res.status(500).json({ message: "Failed to send invitation." });
  }
};

// ✅ Update family member status/restrictions
const updateFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const updates = req.body;

    // Check if member exists and belongs to current user
    const memberCheck = await query(`
      SELECT fm.*, u.email as user_email 
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ?
    `, [memberId, req.user.id]);

    if (memberCheck.length === 0) {
      return res.status(404).json({ message: "Family member not found or you don't have permission." });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'user_id' && key !== 'family_owner_id') {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No updates provided." });
    }

    // Add updated_at timestamp
    updateFields.push("updated_at = NOW()");
    
    updateValues.push(memberId);

    const result = await query(
      `UPDATE family_members SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Member not found." });
    }

    // If suspending a member, also log them out
    if (updates.is_suspended === true) {
      await query(
        "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
        [memberCheck[0].user_id]
      );
    }

    res.status(200).json({ 
      message: "Member updated successfully.",
      updated: true,
      member_id: memberId
    });
  } catch (err) {
    console.error("Error updating family member:", err);
    res.status(500).json({ message: "Failed to update member." });
  }
};

// ✅ Get detailed kid profile info
const getKidProfileDetails = async (req, res) => {
  try {
    const { kidId } = req.params;

    const kidProfile = await query(`
      SELECT 
        kp.*,
        u.email as parent_email,
        CONCAT(u.first_name, ' ', u.last_name) as parent_name,
        kcr.max_age_rating,
        kcr.allow_movies,
        kcr.allow_series,
        kcr.blocked_genres,
        kcr.allowed_genres,
        vtl.daily_time_limit_minutes,
        vtl.current_daily_usage,
        vtl.weekly_time_limit_minutes,
        vtl.current_weekly_usage,
        vtl.allowed_start_time,
        vtl.allowed_end_time,
        COUNT(DISTINCT kvh.id) as total_viewing_sessions,
        COUNT(DISTINCT kw.id) as watchlist_items,
        COUNT(DISTINCT pn.id) as total_notifications
      FROM kids_profiles kp
      LEFT JOIN users u ON kp.parent_user_id = u.id
      LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
      LEFT JOIN viewing_time_limits vtl ON kp.id = vtl.kid_profile_id
      LEFT JOIN kids_viewing_history kvh ON kp.id = kvh.kid_profile_id
      LEFT JOIN kids_watchlist kw ON kp.id = kw.kid_profile_id
      LEFT JOIN parent_notifications pn ON kp.id = pn.kid_profile_id
      WHERE kp.id = ?
      GROUP BY kp.id, u.id, kcr.id, vtl.id
    `, [kidId]);

    if (kidProfile.length === 0) {
      return res.status(404).json({ message: "Kid profile not found." });
    }

    res.status(200).json({
      profile: kidProfile[0]
    });
  } catch (err) {
    console.error("Error fetching kid profile details:", err);
    res.status(500).json({ message: "Failed to fetch kid profile details." });
  }
};

// ✅ Delete kid profile
const deleteKidProfile = async (req, res) => {
  try {
    const { kidId } = req.params;
    const adminId = req.user.id;

    // Verify admin has permission (either admin or parent of the kid)
    const kidProfile = await query(
      "SELECT parent_user_id FROM kids_profiles WHERE id = ?",
      [kidId]
    );

    if (kidProfile.length === 0) {
      return res.status(404).json({ message: "Kid profile not found." });
    }

    // Check if admin is either the parent or a system admin
    const adminUser = await query(
      "SELECT role FROM users WHERE id = ?",
      [adminId]
    );

    const isAdmin = adminUser[0]?.role === 'admin';
    const isParent = kidProfile[0].parent_user_id === adminId;

    if (!isAdmin && !isParent) {
      return res.status(403).json({ message: "You don't have permission to delete this profile." });
    }

    // Delete the kid profile (cascade will handle related records)
    await query("DELETE FROM kids_profiles WHERE id = ?", [kidId]);

    res.status(200).json({
      message: "Kid profile deleted successfully.",
      deleted: true,
      kid_id: kidId
    });
  } catch (err) {
    console.error("Error deleting kid profile:", err);
    res.status(500).json({ message: "Failed to delete kid profile." });
  }
};

// ✅ Remove family member
const removeFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user.id;

    // Check if member exists and admin has permission
    const member = await query(
      "SELECT id, family_owner_id FROM family_members WHERE id = ?",
      [memberId]
    );

    if (member.length === 0) {
      return res.status(404).json({ message: "Family member not found." });
    }

    // Check if admin is either the owner or a system admin
    const adminUser = await query(
      "SELECT role FROM users WHERE id = ?",
      [adminId]
    );

    const isAdmin = adminUser[0]?.role === 'admin';
    const isOwner = member[0].family_owner_id === adminId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You don't have permission to remove this member." });
    }

    // Remove the family member
    await query("DELETE FROM family_members WHERE id = ?", [memberId]);

    res.status(200).json({
      message: "Family member removed successfully.",
      removed: true,
      member_id: memberId
    });
  } catch (err) {
    console.error("Error removing family member:", err);
    res.status(500).json({ message: "Failed to remove family member." });
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
  getUserSubscription,
  updateUserSubscription,
  cancelUserSubscription,
  getSubscriptionPlans,
  createUserSubscription,
  getUserSecurityLogs,
  exportSecurityLogs,
  getUserNotifications,
  sendUserNotification,
  markNotificationAsRead,
  archiveNotification,
  bulkUserOperations,
  getAvailableGenres,
  completeOnboarding,
  getOnboardingStatus,
    getKidProfiles,
  getKidViewingHistory,
  getKidProfileDetails,
  deleteKidProfile,
  getFamilyMembers,
  inviteFamilyMember,
  updateFamilyMember,
  removeFamilyMember
};