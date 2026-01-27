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
      SELECT 
        u.id,
        u.oliviuus_id,
        u.username,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.profile_avatar_url,
        u.email_verified,
        u.phone_verified,
        u.username_verified,
        u.is_active,
        u.is_locked,
        u.role,
        u.global_account_tier,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        u.last_active_at,
        u.onboarding_completed,
        MAX(s.logout_time) AS last_login_time
      FROM users u
      LEFT JOIN user_session s ON u.id = s.user_id
      WHERE u.is_deleted = false
    `;
    const params = [];

    if (search) {
      // Search in multiple fields: email, phone, username, first_name, last_name
      sql += " AND (u.email LIKE ? OR u.phone LIKE ? OR u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
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
          sql += " AND s.logout_time IS NULL AND u.last_login_at IS NULL";
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
        sql += " ORDER BY u.email ASC NULLS LAST";
        break;
      case "email_desc":
        sql += " ORDER BY u.email DESC NULLS LAST";
        break;
      case "phone_asc":
        sql += " ORDER BY u.phone ASC NULLS LAST";
        break;
      case "phone_desc":
        sql += " ORDER BY u.phone DESC NULLS LAST";
        break;
      case "username_asc":
        sql += " ORDER BY u.username ASC NULLS LAST";
        break;
      case "username_desc":
        sql += " ORDER BY u.username DESC NULLS LAST";
        break;
      case "name_asc":
        sql += " ORDER BY u.first_name ASC, u.last_name ASC NULLS LAST";
        break;
      case "name_desc":
        sql += " ORDER BY u.first_name DESC, u.last_name DESC NULLS LAST";
        break;
      case "role":
        sql += " ORDER BY u.role ASC";
        break;
      case "last_login":
        sql += " ORDER BY COALESCE(MAX(s.logout_time), u.last_login_at, u.created_at) DESC";
        break;
      case "active":
        sql += " ORDER BY u.is_active DESC, u.created_at DESC";
        break;
      default:
        sql += " ORDER BY u.created_at DESC";
        break;
    }

    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const users = await query(sql, params);

    // Process users to add display_name for frontend
    const processedUsers = users.map(user => ({
      ...user,
      // Add display_name for easy frontend access
      display_name: user.username || 
                    (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) ||
                    user.email?.split('@')[0] ||
                    user.phone ||
                    'User'
    }));

    // Get total count
    let countSql = "SELECT COUNT(*) as total FROM users u WHERE u.is_deleted = false";
    const countParams = [];
    
    if (search) {
      countSql += " AND (u.email LIKE ? OR u.phone LIKE ? OR u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?)";
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
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
    const total = countRes[0]?.total || processedUsers.length;

    res.status(200).json({ 
      success: true,
      users: processedUsers, 
      total,
      limit,
      offset 
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch users.",
      error: err.message 
    });
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


// ✅ ADMIN: Update user phone number
const updateUserPhone = async (req, res) => {
  try {
    const { userId } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Check if phone already exists (optional, but recommended for uniqueness)
    const existingUser = await query(
      "SELECT id FROM users WHERE phone = ? AND id != ?",
      [phone, userId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    // Update phone and reset verification status
    await query(
      "UPDATE users SET phone = ?, phone_verified = FALSE, phone_verified_at = NULL, updated_at = NOW() WHERE id = ?",
      [phone, userId]
    );

    res.status(200).json({
      message: "Phone number updated successfully.",
      phone,
      phone_verified: false
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update phone number." });
  }
};

// ✅ ADMIN: Update user username
const updateUserUsername = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    // Check if username already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, userId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Update username
    await query(
      "UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?",
      [username, userId]
    );

    res.status(200).json({
      message: "Username updated successfully.",
      username
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update username." });
  }
};

// ✅ ADMIN: Update user name (first and last name)
const updateUserName = async (req, res) => {
  try {
    const { userId } = req.params;
    const { first_name, last_name } = req.body;

    // Both fields are optional - user can update one or both
    if (!first_name && !last_name) {
      return res.status(400).json({ message: "At least first name or last name is required" });
    }

    // Update name fields (NULL is allowed)
    await query(
      "UPDATE users SET first_name = ?, last_name = ?, updated_at = NOW() WHERE id = ?",
      [first_name || null, last_name || null, userId]
    );

    res.status(200).json({
      message: "Name updated successfully.",
      first_name: first_name || null,
      last_name: last_name || null
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update name." });
  }
};

// ✅ Get user identifiers (email, phone, username)
const getUserIdentifiers = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await query(`
      SELECT 
        id,
        email,
        phone,
        username,
        first_name,
        last_name,
        oliviuus_id,
        email_verified,
        phone_verified,
        username_verified,
        profile_avatar_url
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      identifiers: user[0]
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user identifiers." });
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
      await query("DELETE FROM verifications WHERE email = (SELECT email FROM users WHERE id = ?)", [userId]);
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
        u.email as parent_name,
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
        ) as total_watch_seconds,
        DATE(kp.last_active_at) as last_active_date,
        kcr.max_age_rating as max_content_age_rating,
        vtl.daily_time_limit_minutes as daily_time_limit_minutes
      FROM kids_profiles kp
      LEFT JOIN users u ON kp.parent_user_id = u.id
      LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
      LEFT JOIN viewing_time_limits vtl ON kp.id = vtl.kid_profile_id
      ORDER BY kp.created_at DESC
    `);

    // Calculate ages and format data for frontend
    const calculateAge = (birthDate) => {
      if (!birthDate) return 0;
      try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      } catch (e) {
        return 0;
      }
    };

    const formattedProfiles = kidProfiles.map(profile => ({
      id: profile.id,
      name: profile.name || 'Unnamed',
      birth_date: profile.birth_date,
      calculated_age: calculateAge(profile.birth_date),
      parent_id: profile.parent_id,
      parent_name: profile.parent_name,
      parent_email: profile.parent_email,
      profile_avatar_url: profile.profile_avatar_url,
      theme_color: profile.theme_color,
      max_content_age_rating: profile.max_content_age_rating || 'N/A',
      daily_time_limit_minutes: profile.daily_time_limit_minutes || 0,
      bedtime_start: profile.bedtime_start,
      bedtime_end: profile.bedtime_end,
      require_pin_to_exit: Boolean(profile.require_pin_to_exit),
      is_active: Boolean(profile.is_active),
      last_active_at: profile.last_active_at,
      last_active_date: profile.last_active_date,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      total_viewing_sessions: profile.total_viewing_sessions || 0,
      watchlist_items: profile.watchlist_items || 0,
      pending_notifications: profile.pending_notifications || 0,
      total_watch_seconds: profile.total_watch_seconds || 0,
      total_watch_time_minutes: Math.round((profile.total_watch_seconds || 0) / 60)
    }));

    res.status(200).json({
      success: true,
      profiles: formattedProfiles,
      total: formattedProfiles.length
    });
  } catch (err) {
    console.error("Error fetching kid profiles:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch kid profiles." 
    });
  }
};

// ✅ Get kid viewing history
const getKidViewingHistory = async (req, res) => {
  try {
    const { kidId } = req.params;
    
    // Validate kidId
    if (!kidId || kidId === 'undefined') {
      return res.status(400).json({ 
        success: false,
        message: "Kid ID is required" 
      });
    }

    // Check if kid exists
    const kidExists = await query(
      "SELECT id FROM kids_profiles WHERE id = ?",
      [kidId]
    );

    if (kidExists.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Kid profile not found" 
      });
    }

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
      id: item.id,
      kid_profile_id: item.kid_profile_id,
      content_id: item.content_id,
      media_asset_id: item.media_asset_id,
      device_type: item.device_type || 'Unknown',
      content_title: item.content_title || 'Unknown Content',
      content_type: item.content_type || 'N/A',
      media_file: item.media_file,
      asset_type: item.asset_type,
      started_at: item.started_at,
      ended_at: item.ended_at,
      watch_duration_seconds: item.watch_duration_seconds || 0,
      watch_duration_minutes: Math.round((item.watch_duration_seconds || 0) / 60),
      percentage_watched: item.percentage_watched || 0,
      is_completed: Boolean(item.is_completed),
      created_at: item.created_at
    }));

    res.status(200).json({
      success: true,
      history: formattedHistory,
      total: formattedHistory.length
    });
  } catch (err) {
    console.error("Error fetching viewing history:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch viewing history." 
    });
  }
};


// ✅ Get all family members (for FamilyPlan tab)
const getFamilyMembers = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    const adminId = req.user.id;

    const familyMembers = await query(`
      SELECT 
        fm.*,
        u.email as user_email,
        ou.email as owner_email
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      LEFT JOIN users ou ON fm.family_owner_id = ou.id
      WHERE fm.family_owner_id = ? AND fm.is_active = TRUE
      ORDER BY fm.created_at DESC
    `, [adminId]);

    // Format the response
    const formattedMembers = familyMembers.map(member => ({
      id: member.id,
      user_id: member.user_id,
      family_owner_id: member.family_owner_id,
      user_email: member.user_email,
      owner_email: member.owner_email,
      member_role: member.member_role || 'child',
      relationship: member.relationship || 'Family Member',
      dashboard_type: member.dashboard_type || 'normal',
      invitation_status: member.invitation_status || 'accepted',
      invited_at: member.created_at,
      joined_at: member.joined_at,
      is_suspended: Boolean(member.is_suspended),
      suspended_until: member.suspended_until,
      is_active: Boolean(member.is_active),
      sleep_time_start: member.sleep_time_start,
      sleep_time_end: member.sleep_time_end,
      allowed_access_start: member.allowed_access_start,
      allowed_access_end: member.allowed_access_end,
      monthly_spending_limit: member.monthly_spending_limit || 0,
      enforce_sleep_time: Boolean(member.enforce_sleep_time),
      enforce_access_window: Boolean(member.enforce_access_window),
      created_at: member.created_at,
      updated_at: member.updated_at
    }));

    // Get family stats
    const totalMembers = await query(`
      SELECT COUNT(*) as total FROM family_members 
      WHERE family_owner_id = ? AND is_active = TRUE
    `, [adminId]);
    
    const activeMembers = await query(`
      SELECT COUNT(*) as active FROM family_members 
      WHERE family_owner_id = ? AND is_active = TRUE AND is_suspended = FALSE
    `, [adminId]);
    
    const suspendedMembers = await query(`
      SELECT COUNT(*) as suspended FROM family_members 
      WHERE family_owner_id = ? AND is_active = TRUE AND is_suspended = TRUE
    `, [adminId]);

    res.status(200).json({
      success: true,
      members: formattedMembers,
      stats: {
        total: totalMembers[0]?.total || 0,
        active: activeMembers[0]?.active || 0,
        pending: 0, // Since we're auto-accepting members
        suspended: suspendedMembers[0]?.suspended || 0
      },
      total: formattedMembers.length
    });
  } catch (err) {
    console.error("Error fetching family members:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch family members." 
    });
  }
};

// ✅ Invite new family member
const addFamilyMember = async (req, res) => {
  try {
    const { email, role = 'child', relationship = '', dashboardType = 'normal' } = req.body;
    const adminId = req.user.id;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: "Valid email is required." 
      });
    }

    // Check if user exists
    const user = await query(
      "SELECT id, email FROM users WHERE email = ?", 
      [email]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "User not found with this email." 
      });
    }

    const userId = user[0].id;

    // Check if user is already in a family (as owner or member)
    const existingFamily = await query(`
      SELECT id FROM family_members 
      WHERE user_id = ? AND is_active = TRUE
    `, [userId]);

    if (existingFamily.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "User is already part of a family plan." 
      });
    }

    // Check if admin is trying to add themselves
    if (userId === adminId) {
      return res.status(400).json({ 
        success: false,
        message: "You cannot add yourself to your own family plan." 
      });
    }

    // Get admin's subscription to check if they have family plan
    const adminSubscription = await query(`
      SELECT us.*, s.max_family_members, s.is_family_plan
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > NOW())
      ORDER BY us.start_date DESC
      LIMIT 1
    `, [adminId]);

    if (adminSubscription.length === 0 || !adminSubscription[0].is_family_plan) {
      return res.status(400).json({ 
        success: false,
        message: "You need an active family plan subscription to add family members." 
      });
    }

    // Check current family members count
    const currentMembers = await query(`
      SELECT COUNT(*) as count FROM family_members 
      WHERE family_owner_id = ? AND is_active = TRUE
    `, [adminId]);

    const maxMembers = adminSubscription[0].max_family_members || 6;
    if (currentMembers[0].count >= maxMembers) {
      return res.status(400).json({ 
        success: false,
        message: `Family plan limit reached. Maximum ${maxMembers} members allowed.` 
      });
    }

    // Add user to family (auto-accepted since admin is adding)
    const result = await query(`
      INSERT INTO family_members (
        user_id, family_owner_id, member_role, relationship, 
        dashboard_type, invitation_status, is_suspended,
        is_active, invited_by, joined_at
      ) VALUES (?, ?, ?, ?, ?, 'accepted', FALSE, TRUE, ?, NOW())
    `, [userId, adminId, role, relationship, dashboardType, adminId]);

    // Update user's subscription plan to indicate they're part of family
    await query(
      "UPDATE users SET subscription_plan = 'custom', updated_at = NOW() WHERE id = ?",
      [userId]
    );

    // Create family PIN security record
    await query(`
      INSERT INTO family_pin_security (
        family_member_id,
        max_pin_attempts,
        pin_lock_duration_minutes
      ) VALUES (?, 5, 30)
    `, [result.insertId]);

    // Log the action
    await query(`
      INSERT INTO security_logs (
        user_id, action, ip_address, status, details
      ) VALUES (?, 'family_member_added', ?, 'success', ?)
    `, [
      adminId,
      req.ip || 'unknown',
      JSON.stringify({
        target_user_id: userId,
        target_email: email,
        role: role,
        relationship: relationship,
        added_at: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      success: true,
      message: "User added to family plan successfully.",
      member: {
        id: result.insertId,
        user_id: userId,
        email: email,
        role: role,
        relationship: relationship,
        dashboard_type: dashboardType,
        joined_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("Error adding family member:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to add user to family plan." 
    });
  }
};

// ✅ Update family member status/restrictions
const updateFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const updates = req.body;
    const adminId = req.user.id;

    // Check if member exists and admin has permission
    const memberCheck = await query(`
      SELECT fm.*, u.email 
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ?
    `, [memberId, adminId]);

    if (memberCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Family member not found or you don't have permission." 
      });
    }

    // Build update query dynamically with validation
    const updateFields = [];
    const updateValues = [];

    // Allowed update fields
    const allowedFields = [
      'member_role', 'relationship', 'dashboard_type', 'is_suspended',
      'suspended_until', 'sleep_time_start', 'sleep_time_end',
      'allowed_access_start', 'allowed_access_end', 'monthly_spending_limit',
      'enforce_sleep_time', 'enforce_access_window', 'content_restrictions',
      'max_daily_watch_time', 'allowed_content_types', 'blocked_categories',
      'custom_permissions'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        // Handle JSON fields
        if (['content_restrictions', 'allowed_content_types', 'blocked_categories', 'custom_permissions'].includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(updates[key]));
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "No valid updates provided." 
      });
    }

    // Add updated_at timestamp
    updateFields.push("updated_at = NOW()");
    updateValues.push(memberId);

    const result = await query(
      `UPDATE family_members SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Member not found." 
      });
    }

    // If suspending a member, also log them out
    if (updates.is_suspended === true || updates.is_suspended === 'true') {
      await query(
        "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
        [memberCheck[0].user_id]
      );
      
      // Set suspension until date if provided
      if (updates.suspended_until) {
        await query(
          "UPDATE family_members SET suspended_until = ?, updated_at = NOW() WHERE id = ?",
          [updates.suspended_until, memberId]
        );
      }
    }

    // If unsuspending, clear suspension date
    if (updates.is_suspended === false || updates.is_suspended === 'false') {
      await query(
        "UPDATE family_members SET suspended_until = NULL, updated_at = NOW() WHERE id = ?",
        [memberId]
      );
    }

    // Log the update
    await query(`
      INSERT INTO security_logs (
        user_id, action, ip_address, status, details
      ) VALUES (?, 'family_member_updated', ?, 'success', ?)
    `, [
      adminId,
      req.ip || 'unknown',
      JSON.stringify({
        member_id: memberId,
        updates: updates,
        updated_at: new Date().toISOString()
      })
    ]);

    res.status(200).json({ 
      success: true,
      message: "Member settings updated successfully.",
      updated: true,
      member_id: memberId
    });
  } catch (err) {
    console.error("Error updating family member:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update member settings." 
    });
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
        u.email as parent_name,
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
      return res.status(404).json({ 
        success: false,
        message: "Kid profile not found." 
      });
    }

    res.status(200).json({
      success: true,
      profile: kidProfile[0]
    });
  } catch (err) {
    console.error("Error fetching kid profile details:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch kid profile details." 
    });
  }
};

// ✅ Delete kid profile
const deleteKidProfile = async (req, res) => {
  try {
    const { kidId } = req.params;
    const adminId = req.user.id;

    // Verify kid profile exists
    const kidProfile = await query(
      "SELECT parent_user_id FROM kids_profiles WHERE id = ?",
      [kidId]
    );

    if (kidProfile.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Kid profile not found." 
      });
    }

    // Check if admin is either the parent or a system admin
    const adminUser = await query(
      "SELECT role FROM users WHERE id = ?",
      [adminId]
    );

    const isAdmin = adminUser[0]?.role === 'admin';
    const isParent = kidProfile[0].parent_user_id === adminId;

    if (!isAdmin && !isParent) {
      return res.status(403).json({ 
        success: false,
        message: "You don't have permission to delete this profile." 
      });
    }

    // Delete the kid profile (cascade will handle related records)
    await query("DELETE FROM kids_profiles WHERE id = ?", [kidId]);

    res.status(200).json({
      success: true,
      message: "Kid profile deleted successfully.",
      deleted: true,
      kid_id: kidId
    });
  } catch (err) {
    console.error("Error deleting kid profile:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete kid profile." 
    });
  }
};

// ✅ Remove family member
const removeFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user.id;

    // Check if member exists and admin has permission
    const member = await query(`
      SELECT fm.*, u.email 
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ?
    `, [memberId, adminId]);

    if (member.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Family member not found or you don't have permission." 
      });
    }

    const familyMember = member[0];

    // Mark member as inactive (soft delete)
    await query(
      "UPDATE family_members SET is_active = FALSE, updated_at = NOW() WHERE id = ?",
      [memberId]
    );

    // Terminate all active sessions
    await query(
      "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
      [familyMember.user_id]
    );

    // Remove family PIN security record
    await query(
      "DELETE FROM family_pin_security WHERE family_member_id = ?",
      [memberId]
    );

    // Reset user's subscription plan
    await query(
      "UPDATE users SET subscription_plan = 'none', updated_at = NOW() WHERE id = ?",
      [familyMember.user_id]
    );

    // Log the action
    await query(`
      INSERT INTO security_logs (
        user_id, action, ip_address, status, details
      ) VALUES (?, 'family_member_removed', ?, 'success', ?)
    `, [
      adminId,
      req.ip || 'unknown',
      JSON.stringify({
        removed_user_id: familyMember.user_id,
        removed_email: familyMember.email,
        removed_at: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      success: true,
      message: "Family member removed successfully.",
      removed: true,
      member_id: memberId,
      user_email: familyMember.email
    });
  } catch (err) {
    console.error("Error removing family member:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove family member." 
    });
  }
};

// ✅ New endpoint: Get kid profile by ID
const getKidProfileById = async (req, res) => {
  try {
    const { kidId } = req.params;

    const kidProfile = await query(`
      SELECT * FROM kids_profiles WHERE id = ?
    `, [kidId]);

    if (kidProfile.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Kid profile not found." 
      });
    }

    res.status(200).json({
      success: true,
      profile: kidProfile[0]
    });
  } catch (err) {
    console.error("Error fetching kid profile:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch kid profile." 
    });
  }
};

// ✅ Get family PIN security info
const getFamilyPinSecurity = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user.id;

    // Check if member exists and admin has permission
    const memberCheck = await query(`
      SELECT fm.*, u.email 
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ?
    `, [memberId, adminId]);

    if (memberCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Family member not found or you don't have permission." 
      });
    }

    // Get PIN security info
    const pinSecurity = await query(`
      SELECT * FROM family_pin_security 
      WHERE family_member_id = ?
    `, [memberId]);

    res.status(200).json({
      success: true,
      pin_security: pinSecurity[0] || null,
      member: {
        id: memberCheck[0].id,
        user_id: memberCheck[0].user_id,
        email: memberCheck[0].email,
        member_role: memberCheck[0].member_role,
        dashboard_type: memberCheck[0].dashboard_type
      }
    });
  } catch (err) {
    console.error("Error fetching family PIN security:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch PIN security information." 
    });
  }
};

// ✅ Reset family member PIN (Admin action)
const resetFamilyPin = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user.id;

    // Check if member exists and admin has permission
    const memberCheck = await query(`
      SELECT fm.*, u.email 
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ?
    `, [memberId, adminId]);

    if (memberCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Family member not found or you don't have permission." 
      });
    }

    const member = memberCheck[0];

    // Reset PIN security
    await query(`
      UPDATE family_pin_security 
      SET 
        pin_attempts = 0,
        last_pin_attempt = NULL,
        is_pin_locked = FALSE,
        pin_locked_until = NULL,
        updated_at = NOW()
      WHERE family_member_id = ?
    `, [memberId]);

    // Log the action
    await query(`
      INSERT INTO security_logs (
        user_id, action, ip_address, status, details
      ) VALUES (?, 'family_pin_reset', ?, 'success', ?)
    `, [
      adminId,
      req.ip || 'unknown',
      JSON.stringify({
        member_id: memberId,
        user_email: member.email,
        reset_at: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      success: true,
      message: "PIN security reset successfully.",
      reset: true,
      member_id: memberId,
      user_email: member.email
    });
  } catch (err) {
    console.error("Error resetting family PIN:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to reset PIN security." 
    });
  }
};

// ✅ Get family plan subscription info
const getFamilyPlanInfo = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    const adminId = req.user.id;

    // Get admin's subscription
    const subscription = await query(`
      SELECT 
        us.*,
        s.name,
        s.type,
        s.max_family_members,
        s.is_family_plan,
        s.price,
        s.currency,
        s.description
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > NOW())
      ORDER BY us.start_date DESC
      LIMIT 1
    `, [adminId]);

    if (subscription.length === 0) {
      // Return basic info even if no subscription
      const currentMembers = await query(`
        SELECT COUNT(*) as count FROM family_members 
        WHERE family_owner_id = ? AND is_active = TRUE
      `, [adminId]);

      return res.status(200).json({
        success: true,
        subscription: {
          name: "No Active Subscription",
          type: "none",
          is_family_plan: false,
          max_family_members: 0,
          current_members: currentMembers[0]?.count || 0,
          price: 0,
          currency: 'RWF',
          description: "No active family plan subscription",
          status: "none"
        },
        family_members: [],
        total_members: currentMembers[0]?.count || 0,
        available_slots: 0
      });
    }

    // Get current family members count
    const currentMembers = await query(`
      SELECT COUNT(*) as count FROM family_members 
      WHERE family_owner_id = ? AND is_active = TRUE
    `, [adminId]);

    // Get detailed family members
    const familyMembers = await query(`
      SELECT 
        fm.*,
        u.email,
        (
          SELECT COUNT(*) 
          FROM user_session 
          WHERE user_id = fm.user_id 
          AND is_active = TRUE
        ) as active_sessions
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.family_owner_id = ? AND fm.is_active = TRUE
      ORDER BY fm.created_at DESC
    `, [adminId]);

    const formattedSubscription = {
      name: subscription[0].name,
      type: subscription[0].type,
      is_family_plan: Boolean(subscription[0].is_family_plan),
      max_family_members: subscription[0].max_family_members || 6,
      current_members: currentMembers[0]?.count || 0,
      price: subscription[0].price,
      currency: subscription[0].currency || 'RWF',
      description: subscription[0].description,
      start_date: subscription[0].start_date,
      end_date: subscription[0].end_date,
      status: subscription[0].status
    };

    res.status(200).json({
      success: true,
      subscription: formattedSubscription,
      family_members: familyMembers,
      total_members: currentMembers[0]?.count || 0,
      available_slots: Math.max(0, (subscription[0].max_family_members || 6) - (currentMembers[0]?.count || 0))
    });
  } catch (err) {
    console.error("Error fetching family plan info:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch family plan information." 
    });
  }
};

// ✅ Get family plan usage analytics
const getFamilyUsageAnalytics = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = "DATE(us.last_activity) = CURDATE()";
        break;
      case 'week':
        dateFilter = "us.last_activity >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
      case 'month':
        dateFilter = "us.last_activity >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
      case 'year':
        dateFilter = "us.last_activity >= DATE_SUB(NOW(), INTERVAL 365 DAY)";
        break;
      default:
        dateFilter = "us.last_activity >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }

    // Get family members' session activity
    const usageAnalytics = await query(`
      SELECT 
        fm.id as member_id,
        u.email,
        fm.member_role,
        fm.dashboard_type,
        COUNT(DISTINCT us.id) as total_sessions,
        SUM(CASE WHEN us.is_active = TRUE THEN 1 ELSE 0 END) as active_sessions,
        MAX(us.login_time) as last_login,
        MIN(us.login_time) as first_login_this_period
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      LEFT JOIN user_session us ON fm.user_id = us.user_id AND ${dateFilter}
      WHERE fm.family_owner_id = ? AND fm.is_active = TRUE
      GROUP BY fm.id, u.email, fm.member_role, fm.dashboard_type
      ORDER BY fm.member_role, u.email
    `, [adminId]);

    // Get total watch time for family members
    const watchTimeAnalytics = await query(`
      SELECT 
        fm.id as member_id,
        COALESCE(SUM(
          CASE 
            WHEN cs.total_watch_time IS NOT NULL THEN cs.total_watch_time
            WHEN cws.total_watch_time IS NOT NULL THEN cws.total_watch_time
            ELSE 0 
          END
        ), 0) as total_watch_minutes
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      LEFT JOIN (
        SELECT user_id, SUM(total_watch_time) as total_watch_time
        FROM content_watch_sessions
        WHERE ${dateFilter.replace('us.last_activity', 'last_activity_at')}
        GROUP BY user_id
      ) cs ON fm.user_id = cs.user_id
      LEFT JOIN (
        SELECT user_id, SUM(total_watch_time) as total_watch_time
        FROM kids_viewing_history
        WHERE ${dateFilter.replace('us.last_activity', 'started_at')}
        GROUP BY user_id
      ) cws ON fm.user_id = cws.user_id
      WHERE fm.family_owner_id = ? AND fm.is_active = TRUE
      GROUP BY fm.id
    `, [adminId]);

    // Format analytics data
    const analytics = usageAnalytics.map(usage => {
      const watchTime = watchTimeAnalytics.find(wt => wt.member_id === usage.member_id);
      return {
        ...usage,
        total_watch_minutes: watchTime?.total_watch_minutes || 0,
        last_login: usage.last_login ? new Date(usage.last_login).toISOString() : null,
        first_login_this_period: usage.first_login_this_period ? new Date(usage.first_login_this_period).toISOString() : null
      };
    });

    // Calculate totals
    const totals = {
      total_members: analytics.length,
      total_sessions: analytics.reduce((sum, a) => sum + (a.total_sessions || 0), 0),
      active_sessions: analytics.reduce((sum, a) => sum + (a.active_sessions || 0), 0),
      total_watch_minutes: analytics.reduce((sum, a) => sum + (a.total_watch_minutes || 0), 0),
      period: period
    };

    res.status(200).json({
      success: true,
      analytics: analytics,
      totals: totals,
      period: period
    });
  } catch (err) {
    console.error("Error fetching family usage analytics:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch family usage analytics." 
    });
  }
};

// ✅ Bulk family member operations
const bulkFamilyOperations = async (req, res) => {
  try {
    const { memberIds, operation, settings } = req.body;
    const adminId = req.user.id;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Member IDs are required." 
      });
    }

    if (!operation || !['suspend', 'unsuspend', 'update_settings', 'remove'].includes(operation)) {
      return res.status(400).json({ 
        success: false,
        message: "Valid operation is required." 
      });
    }

    // Check if admin has permission for all members
    const placeholders = memberIds.map(() => '?').join(',');
    const members = await query(`
      SELECT fm.id, fm.user_id, u.email 
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.id IN (${placeholders}) AND fm.family_owner_id = ? AND fm.is_active = TRUE
    `, [...memberIds, adminId]);

    if (members.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: "No valid members found or you don't have permission." 
      });
    }

    const results = {
      processed: members.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Perform bulk operation
    for (const member of members) {
      try {
        switch (operation) {
          case 'suspend':
            await query(
              "UPDATE family_members SET is_suspended = TRUE, suspended_until = ?, updated_at = NOW() WHERE id = ?",
              [settings?.suspended_until || null, member.id]
            );
            // Logout all sessions
            await query(
              "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
              [member.user_id]
            );
            break;

          case 'unsuspend':
            await query(
              "UPDATE family_members SET is_suspended = FALSE, suspended_until = NULL, updated_at = NOW() WHERE id = ?",
              [member.id]
            );
            break;

          case 'update_settings':
            if (settings) {
              const updateFields = [];
              const updateValues = [];
              
              Object.keys(settings).forEach(key => {
                if (['dashboard_type', 'member_role', 'relationship'].includes(key)) {
                  updateFields.push(`${key} = ?`);
                  updateValues.push(settings[key]);
                }
              });
              
              if (updateFields.length > 0) {
                updateValues.push(member.id);
                await query(
                  `UPDATE family_members SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
                  updateValues
                );
              }
            }
            break;

          case 'remove':
            // Soft delete
            await query(
              "UPDATE family_members SET is_active = FALSE, updated_at = NOW() WHERE id = ?",
              [member.id]
            );
            // Logout all sessions
            await query(
              "UPDATE user_session SET is_active = FALSE, logout_time = NOW() WHERE user_id = ? AND is_active = TRUE",
              [member.user_id]
            );
            // Remove PIN security
            await query(
              "DELETE FROM family_pin_security WHERE family_member_id = ?",
              [member.id]
            );
            // Reset user subscription
            await query(
              "UPDATE users SET subscription_plan = 'none', updated_at = NOW() WHERE id = ?",
              [member.user_id]
            );
            break;
        }

        results.successful++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Member ${member.id} (${member.email}): ${err.message}`);
      }
    }

    // Log bulk operation
    await query(`
      INSERT INTO security_logs (
        user_id, action, ip_address, status, details
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      adminId,
      `bulk_family_${operation}`,
      req.ip || 'unknown',
      results.failed === 0 ? 'success' : 'partial',
      JSON.stringify({
        operation: operation,
        member_count: results.processed,
        successful: results.successful,
        failed: results.failed,
        member_ids: memberIds,
        settings: settings
      })
    ]);

    res.status(200).json({
      success: true,
      message: `Bulk ${operation} operation completed.`,
      results: results
    });
  } catch (err) {
    console.error("Error in bulk family operations:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to perform bulk operation." 
    });
  }
};

// ✅ Get family member device sessions
const getFamilyMemberSessions = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    // Check if member exists and admin has permission
    const memberCheck = await query(`
      SELECT fm.*, u.email 
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ?
    `, [memberId, adminId]);

    if (memberCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Family member not found or you don't have permission." 
      });
    }

    const member = memberCheck[0];

    // Get user sessions
    const sessions = await query(`
      SELECT 
        us.*,
        kp.name as active_kid_name
      FROM user_session us
      LEFT JOIN kids_profiles kp ON us.active_kid_profile_id = kp.id
      WHERE us.user_id = ?
      ORDER BY us.login_time DESC
      LIMIT ? OFFSET ?
    `, [member.user_id, parseInt(limit), parseInt(offset)]);

    // Get total count
    const totalResult = await query(
      "SELECT COUNT(*) as total FROM user_session WHERE user_id = ?",
      [member.user_id]
    );

    // Get session stats
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_sessions,
        MAX(login_time) as last_login,
        MIN(login_time) as first_login
      FROM user_session 
      WHERE user_id = ?
    `, [member.user_id]);

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      device_name: session.device_name || 'Unknown Device',
      device_type: session.device_type || 'desktop',
      ip_address: session.ip_address || 'Unknown',
      location: session.location || 'Unknown',
      login_time: session.login_time,
      logout_time: session.logout_time,
      last_activity: session.last_activity,
      is_active: Boolean(session.is_active),
      user_agent: session.user_agent,
      device_id: session.device_id,
      session_mode: session.session_mode,
      active_kid_name: session.active_kid_name,
      created_at: session.created_at
    }));

    res.status(200).json({
      success: true,
      sessions: formattedSessions,
      total: totalResult[0]?.total || 0,
      stats: statsResult[0] || {
        total_sessions: 0,
        active_sessions: 0,
        last_login: null,
        first_login: null
      },
      member: {
        id: member.id,
        user_id: member.user_id,
        email: member.email,
        member_role: member.member_role
      }
    });
  } catch (err) {
    console.error("Error fetching family member sessions:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch family member sessions." 
    });
  }
};

// ✅ Terminate family member sessions
const terminateFamilyMemberSessions = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { sessionId } = req.query;
    const adminId = req.user.id;

    // Check if member exists and admin has permission
    const memberCheck = await query(`
      SELECT fm.*, u.email 
      FROM family_members fm
      LEFT JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ?
    `, [memberId, adminId]);

    if (memberCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Family member not found or you don't have permission." 
      });
    }

    const member = memberCheck[0];
    let affectedRows = 0;

    if (sessionId) {
      // Terminate specific session
      const result = await query(`
        UPDATE user_session 
        SET is_active = FALSE, logout_time = NOW() 
        WHERE id = ? AND user_id = ? AND is_active = TRUE
      `, [sessionId, member.user_id]);
      affectedRows = result.affectedRows;
    } else {
      // Terminate all sessions
      const result = await query(`
        UPDATE user_session 
        SET is_active = FALSE, logout_time = NOW() 
        WHERE user_id = ? AND is_active = TRUE
      `, [member.user_id]);
      affectedRows = result.affectedRows;
    }

    // Log the action
    await query(`
      INSERT INTO security_logs (
        user_id, action, ip_address, status, details
      ) VALUES (?, ?, ?, 'success', ?)
    `, [
      adminId,
      sessionId ? 'terminate_family_session' : 'terminate_all_family_sessions',
      req.ip || 'unknown',
      JSON.stringify({
        member_id: memberId,
        member_email: member.email,
        session_id: sessionId || 'all',
        terminated_sessions: affectedRows,
        terminated_at: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      success: true,
      message: sessionId 
        ? "Session terminated successfully." 
        : "All sessions terminated successfully.",
      terminated: true,
      affected_sessions: affectedRows,
      member_id: memberId
    });
  } catch (err) {
    console.error("Error terminating family member sessions:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to terminate sessions." 
    });
  }
};

// ✅ Get top users by various criteria (Top Users Analytics) - FIXED VERSION
const getTopUsers = async (req, res) => {
  try {
    const { criteria = 'watch_time', period = 'month', limit = 10 } = req.query;
    
    let sqlQuery = '';
    const params = [];
    let dateFilter = '';
    
    // Set date filter based on period
    switch (period) {
      case 'day':
        dateFilter = "DATE(us.last_activity) = CURDATE()";
        break;
      case 'week':
        dateFilter = "us.last_activity >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
      case 'month':
        dateFilter = "us.last_activity >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
      case 'year':
        dateFilter = "us.last_activity >= DATE_SUB(NOW(), INTERVAL 365 DAY)";
        break;
      default:
        dateFilter = "1=1";
    }
    
    // Build query based on criteria
    switch (criteria) {
      case 'watch_time':
        sqlQuery = `
          SELECT 
            u.id,
            u.email,
            u.phone,
            u.username,
            u.first_name,
            u.last_name,
            u.created_at,
            u.subscription_plan,
            COALESCE(SUM(
              CASE 
                WHEN cs.total_watch_time IS NOT NULL THEN cs.total_watch_time
                WHEN kp.total_watch_seconds IS NOT NULL THEN ROUND(kp.total_watch_seconds / 60)
                ELSE 0 
              END
            ), 0) as total_watch_minutes,
            COUNT(DISTINCT us.id) as total_sessions,
            (
              SELECT COUNT(DISTINCT content_id) 
              FROM kids_viewing_history kvh
              LEFT JOIN kids_profiles kp ON kvh.kid_profile_id = kp.id
              WHERE kp.parent_user_id = u.id
            ) as unique_content_watched,
            (
              SELECT COUNT(*) 
              FROM user_session 
              WHERE user_id = u.id AND ${dateFilter.replace('us.last_activity', 'last_activity')}
            ) as recent_sessions,
            (
              SELECT us2.status 
              FROM user_subscriptions us2 
              WHERE us2.user_id = u.id 
              ORDER BY us2.start_date DESC 
              LIMIT 1
            ) as subscription_status,
            (
              SELECT s.price 
              FROM user_subscriptions us2 
              LEFT JOIN subscriptions s ON us2.subscription_id = s.id 
              WHERE us2.user_id = u.id 
              ORDER BY us2.start_date DESC 
              LIMIT 1
            ) as subscription_price
          FROM users u
          LEFT JOIN (
            SELECT user_id, SUM(total_watch_time) as total_watch_time
            FROM content_watch_sessions
            WHERE ${dateFilter.replace('us.last_activity', 'last_activity_at')}
            GROUP BY user_id
          ) cs ON u.id = cs.user_id
          LEFT JOIN (
            SELECT 
              kp.parent_user_id as user_id,
              SUM(kvh.watch_duration_seconds) as total_watch_seconds
            FROM kids_profiles kp
            LEFT JOIN kids_viewing_history kvh ON kp.id = kvh.kid_profile_id
            WHERE kvh.started_at >= DATE_SUB(NOW(), INTERVAL 
              CASE ?
                WHEN 'day' THEN 1 
                WHEN 'week' THEN 7 
                WHEN 'month' THEN 30 
                WHEN 'year' THEN 365 
                ELSE 30 
              END DAY)
            GROUP BY kp.parent_user_id
          ) kp ON u.id = kp.user_id
          LEFT JOIN user_session us ON u.id = us.user_id AND ${dateFilter}
          WHERE u.is_active = TRUE
          GROUP BY u.id, u.email, u.phone, u.username, u.first_name, u.last_name, u.created_at, u.subscription_plan
          ORDER BY total_watch_minutes DESC
          LIMIT ?
        `;
        params.push(period, parseInt(limit));
        break;
        
      case 'sessions':
        sqlQuery = `
          SELECT 
            u.id,
            u.email,
            u.phone,
            u.username,
            u.first_name,
            u.last_name,
            u.created_at,
            u.subscription_plan,
            COUNT(DISTINCT us.id) as total_sessions,
            SUM(CASE WHEN us.is_active = TRUE THEN 1 ELSE 0 END) as active_sessions,
            COALESCE(SUM(
              CASE 
                WHEN cs.total_watch_time IS NOT NULL THEN cs.total_watch_time
                WHEN kp.total_watch_seconds IS NOT NULL THEN ROUND(kp.total_watch_seconds / 60)
                ELSE 0 
              END
            ), 0) as total_watch_minutes,
            MAX(us.login_time) as last_session,
            (
              SELECT COUNT(DISTINCT device_id) 
              FROM user_session 
              WHERE user_id = u.id
            ) as unique_devices,
            (
              SELECT COUNT(*) 
              FROM security_logs 
              WHERE user_id = u.id AND action = 'login'
            ) as total_logins
          FROM users u
          LEFT JOIN user_session us ON u.id = us.user_id AND ${dateFilter}
          LEFT JOIN (
            SELECT user_id, SUM(total_watch_time) as total_watch_time
            FROM content_watch_sessions
            WHERE ${dateFilter.replace('us.last_activity', 'last_activity_at')}
            GROUP BY user_id
          ) cs ON u.id = cs.user_id
          LEFT JOIN (
            SELECT 
              kp.parent_user_id as user_id,
              SUM(kvh.watch_duration_seconds) as total_watch_seconds
            FROM kids_profiles kp
            LEFT JOIN kids_viewing_history kvh ON kp.id = kvh.kid_profile_id
            WHERE kvh.started_at >= DATE_SUB(NOW(), INTERVAL 
              CASE ?
                WHEN 'day' THEN 1 
                WHEN 'week' THEN 7 
                WHEN 'month' THEN 30 
                WHEN 'year' THEN 365 
                ELSE 30 
              END DAY)
            GROUP BY kp.parent_user_id
          ) kp ON u.id = kp.user_id
          WHERE u.is_active = TRUE
          GROUP BY u.id, u.email, u.phone, u.username, u.first_name, u.last_name, u.created_at, u.subscription_plan
          ORDER BY total_sessions DESC
          LIMIT ?
        `;
        params.push(period, parseInt(limit));
        break;
        
      case 'subscription_value':
        sqlQuery = `
          SELECT 
            u.id,
            u.email,
            u.phone,
            u.username,
            u.first_name,
            u.last_name,
            u.created_at,
            u.subscription_plan,
            (
              SELECT COALESCE(SUM(s.price), 0)
              FROM user_subscriptions us2
              LEFT JOIN subscriptions s ON us2.subscription_id = s.id
              WHERE us2.user_id = u.id 
              AND us2.status = 'active'
              AND (us2.end_date IS NULL OR us2.end_date > NOW())
            ) as total_subscription_value,
            (
              SELECT COUNT(*) 
              FROM user_subscriptions 
              WHERE user_id = u.id AND status = 'active'
            ) as active_subscriptions,
            (
              SELECT MAX(start_date) 
              FROM user_subscriptions 
              WHERE user_id = u.id AND status = 'active'
            ) as latest_subscription_start,
            COALESCE(SUM(
              CASE 
                WHEN cs.total_watch_time IS NOT NULL THEN cs.total_watch_time
                WHEN kp.total_watch_seconds IS NOT NULL THEN ROUND(kp.total_watch_seconds / 60)
                ELSE 0 
              END
            ), 0) as total_watch_minutes,
            COUNT(DISTINCT us.id) as total_sessions
          FROM users u
          LEFT JOIN user_session us ON u.id = us.user_id AND ${dateFilter}
          LEFT JOIN (
            SELECT user_id, SUM(total_watch_time) as total_watch_time
            FROM content_watch_sessions
            WHERE ${dateFilter.replace('us.last_activity', 'last_activity_at')}
            GROUP BY user_id
          ) cs ON u.id = cs.user_id
          LEFT JOIN (
            SELECT 
              kp.parent_user_id as user_id,
              SUM(kvh.watch_duration_seconds) as total_watch_seconds
            FROM kids_profiles kp
            LEFT JOIN kids_viewing_history kvh ON kp.id = kvh.kid_profile_id
            WHERE kvh.started_at >= DATE_SUB(NOW(), INTERVAL 
              CASE ?
                WHEN 'day' THEN 1 
                WHEN 'week' THEN 7 
                WHEN 'month' THEN 30 
                WHEN 'year' THEN 365 
                ELSE 30 
              END DAY)
            GROUP BY kp.parent_user_id
          ) kp ON u.id = kp.user_id
          WHERE u.is_active = TRUE
          GROUP BY u.id, u.email, u.phone, u.username, u.first_name, u.last_name, u.created_at, u.subscription_plan
          ORDER BY total_subscription_value DESC
          LIMIT ?
        `;
        params.push(period, parseInt(limit));
        break;
        
      case 'recent_activity':
        sqlQuery = `
          SELECT 
            u.id,
            u.email,
            u.phone,
            u.username,
            u.first_name,
            u.last_name,
            u.created_at,
            u.subscription_plan,
            MAX(us.last_activity) as last_activity,
            COUNT(DISTINCT us.id) as recent_sessions,
            SUM(CASE WHEN us.is_active = TRUE THEN 1 ELSE 0 END) as active_sessions,
            (
              SELECT COUNT(*) 
              FROM content_watch_sessions 
              WHERE user_id = u.id 
              AND last_activity_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ) as daily_watch_sessions,
            (
              SELECT COUNT(*) 
              FROM kids_viewing_history kvh
              LEFT JOIN kids_profiles kp ON kvh.kid_profile_id = kp.id
              WHERE kp.parent_user_id = u.id 
              AND kvh.started_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ) as daily_kid_sessions,
            COALESCE(SUM(
              CASE 
                WHEN cs.total_watch_time IS NOT NULL THEN cs.total_watch_time
                WHEN kp.total_watch_seconds IS NOT NULL THEN ROUND(kp.total_watch_seconds / 60)
                ELSE 0 
              END
            ), 0) as total_watch_minutes
          FROM users u
          LEFT JOIN user_session us ON u.id = us.user_id AND us.last_activity >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          LEFT JOIN (
            SELECT user_id, SUM(total_watch_time) as total_watch_time
            FROM content_watch_sessions
            WHERE last_activity_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY user_id
          ) cs ON u.id = cs.user_id
          LEFT JOIN (
            SELECT 
              kp.parent_user_id as user_id,
              SUM(kvh.watch_duration_seconds) as total_watch_seconds
            FROM kids_profiles kp
            LEFT JOIN kids_viewing_history kvh ON kp.id = kvh.kid_profile_id
            WHERE kvh.started_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY kp.parent_user_id
          ) kp ON u.id = kp.user_id
          WHERE u.is_active = TRUE
          GROUP BY u.id, u.email, u.phone, u.username, u.first_name, u.last_name, u.created_at, u.subscription_plan
          ORDER BY last_activity DESC
          LIMIT ?
        `;
        params.push(parseInt(limit));
        break;
        
      case 'content_engagement':
        sqlQuery = `
          SELECT 
            u.id,
            u.email,
            u.phone,
            u.username,
            u.first_name,
            u.last_name,
            u.created_at,
            u.subscription_plan,
            (
              SELECT COUNT(DISTINCT content_id) 
              FROM kids_viewing_history kvh
              LEFT JOIN kids_profiles kp ON kvh.kid_profile_id = kp.id
              WHERE kp.parent_user_id = u.id
            ) + (
              SELECT COUNT(DISTINCT content_id) 
              FROM content_watch_sessions 
              WHERE user_id = u.id
            ) as total_unique_content,
            (
              SELECT COUNT(*) 
              FROM kids_viewing_history kvh
              LEFT JOIN kids_profiles kp ON kvh.kid_profile_id = kp.id
              WHERE kp.parent_user_id = u.id
            ) + (
              SELECT COUNT(*) 
              FROM content_watch_sessions 
              WHERE user_id = u.id
            ) as total_viewing_sessions,
            COALESCE(SUM(
              CASE 
                WHEN cs.total_watch_time IS NOT NULL THEN cs.total_watch_time
                WHEN kp.total_watch_seconds IS NOT NULL THEN ROUND(kp.total_watch_seconds / 60)
                ELSE 0 
              END
            ), 0) as total_watch_minutes,
            (
              SELECT AVG(percentage_watched) 
              FROM kids_viewing_history kvh
              LEFT JOIN kids_profiles kp ON kvh.kid_profile_id = kp.id
              WHERE kp.parent_user_id = u.id
            ) as avg_completion_rate
          FROM users u
          LEFT JOIN (
            SELECT user_id, SUM(total_watch_time) as total_watch_time
            FROM content_watch_sessions
            WHERE ${dateFilter.replace('us.last_activity', 'last_activity_at')}
            GROUP BY user_id
          ) cs ON u.id = cs.user_id
          LEFT JOIN (
            SELECT 
              kp.parent_user_id as user_id,
              SUM(kvh.watch_duration_seconds) as total_watch_seconds
            FROM kids_profiles kp
            LEFT JOIN kids_viewing_history kvh ON kp.id = kvh.kid_profile_id
            WHERE kvh.started_at >= DATE_SUB(NOW(), INTERVAL 
              CASE ?
                WHEN 'day' THEN 1 
                WHEN 'week' THEN 7 
                WHEN 'month' THEN 30 
                WHEN 'year' THEN 365 
                ELSE 30 
              END DAY)
            GROUP BY kp.parent_user_id
          ) kp ON u.id = kp.user_id
          WHERE u.is_active = TRUE
          GROUP BY u.id, u.email, u.phone, u.username, u.first_name, u.last_name, u.created_at, u.subscription_plan
          ORDER BY total_unique_content DESC, total_viewing_sessions DESC
          LIMIT ?
        `;
        params.push(period, parseInt(limit));
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid criteria. Use: watch_time, sessions, subscription_value, recent_activity, content_engagement"
        });
    }
    
    // FIXED: Properly call the query function
    const topUsers = await query(sqlQuery, params);
    
    // Helper function to get user display name with null safety
    const getUserDisplayName = (user) => {
      if (!user) return 'User';
      
      // Priority: username > full name > email prefix > phone > fallback
      if (user.username) return user.username;
      
      if (user.first_name) {
        return `${user.first_name} ${user.last_name || ''}`.trim();
      }
      
      if (user.email) {
        return user.email.split('@')[0];
      }
      
      if (user.phone) {
        return `User (${user.phone.substring(user.phone.length - 4)})`;
      }
      
      return 'User';
    };
    
    // Format the response with null-safe user info
    const formattedUsers = topUsers.map(user => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at,
      subscription_plan: user.subscription_plan || 'none',
      total_watch_minutes: user.total_watch_minutes || 0,
      total_sessions: user.total_sessions || 0,
      active_sessions: user.active_sessions || 0,
      recent_sessions: user.recent_sessions || 0,
      total_subscription_value: user.total_subscription_value || 0,
      active_subscriptions: user.active_subscriptions || 0,
      total_unique_content: user.total_unique_content || 0,
      total_viewing_sessions: user.total_viewing_sessions || 0,
      avg_completion_rate: user.avg_completion_rate ? Math.round(user.avg_completion_rate) : 0,
      unique_devices: user.unique_devices || 0,
      total_logins: user.total_logins || 0,
      daily_watch_sessions: user.daily_watch_sessions || 0,
      daily_kid_sessions: user.daily_kid_sessions || 0,
      last_activity: user.last_activity || user.created_at,
      latest_subscription_start: user.latest_subscription_start,
      subscription_status: user.subscription_status,
      subscription_price: user.subscription_price,
      // Add derived fields for frontend
      display_name: getUserDisplayName(user),
      primary_identifier: user.email || user.phone || user.username || 'No identifier'
    }));
    
    // Calculate overall stats
    const totalWatchTime = formattedUsers.reduce((sum, user) => sum + (user.total_watch_minutes || 0), 0);
    const totalSessions = formattedUsers.reduce((sum, user) => sum + (user.total_sessions || 0), 0);
    const totalSubscriptionValue = formattedUsers.reduce((sum, user) => sum + (user.total_subscription_value || 0), 0);
    const avgWatchTime = formattedUsers.length > 0 ? Math.round(totalWatchTime / formattedUsers.length) : 0;
    
    res.status(200).json({
      success: true,
      top_users: formattedUsers,
      criteria: criteria,
      period: period,
      limit: parseInt(limit),
      stats: {
        total_watch_minutes: totalWatchTime,
        total_sessions: totalSessions,
        total_subscription_value: totalSubscriptionValue,
        avg_watch_minutes: avgWatchTime,
        total_users: formattedUsers.length
      }
    });
    
  } catch (err) {
    console.error("Error fetching top users:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch top users.",
      error: err.message
    });
  }
};

// ✅ Get comprehensive user engagement analytics - FIXED
const getUserEngagementAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = ">= CURDATE()";
        break;
      case 'week':
        dateFilter = ">= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
      case 'month':
        dateFilter = ">= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
      case 'year':
        dateFilter = ">= DATE_SUB(NOW(), INTERVAL 365 DAY)";
        break;
      default:
        dateFilter = ">= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }
    
    // Get user engagement stats
    const sqlQuery = `
      SELECT 
        u.id,
        u.email,
        u.subscription_plan,
        u.created_at,
        (
          SELECT COUNT(*) 
          FROM user_session 
          WHERE user_id = u.id AND login_time ${dateFilter}
        ) as session_count,
        (
          SELECT SUM(total_watch_time) 
          FROM content_watch_sessions 
          WHERE user_id = u.id AND last_activity_at ${dateFilter}
        ) as adult_watch_time,
        (
          SELECT SUM(kvh.watch_duration_seconds) / 60
          FROM kids_viewing_history kvh
          LEFT JOIN kids_profiles kp ON kvh.kid_profile_id = kp.id
          WHERE kp.parent_user_id = u.id AND kvh.started_at ${dateFilter}
        ) as kid_watch_time,
        (
          SELECT COUNT(DISTINCT content_id) 
          FROM content_watch_sessions 
          WHERE user_id = u.id AND last_activity_at ${dateFilter}
        ) as adult_unique_content,
        (
          SELECT COUNT(DISTINCT kvh.content_id) 
          FROM kids_viewing_history kvh
          LEFT JOIN kids_profiles kp ON kvh.kid_profile_id = kp.id
          WHERE kp.parent_user_id = u.id AND kvh.started_at ${dateFilter}
        ) as kid_unique_content,
        (
          SELECT COUNT(*) 
          FROM family_members 
          WHERE user_id = u.id AND is_active = TRUE
        ) as family_members_count,
        (
          SELECT COUNT(*) 
          FROM kids_profiles 
          WHERE parent_user_id = u.id AND is_active = TRUE
        ) as kid_profiles_count
      FROM users u
      WHERE u.is_active = TRUE
      ORDER BY u.created_at DESC
      LIMIT 100
    `;
    
    const engagementStats = await query(sqlQuery);
    
    // Calculate engagement scores
    const usersWithScores = engagementStats.map(user => {
      const totalWatchTime = (user.adult_watch_time || 0) + (user.kid_watch_time || 0);
      const totalUniqueContent = (user.adult_unique_content || 0) + (user.kid_unique_content || 0);
      const sessionCount = user.session_count || 0;
      
      // Calculate engagement score (0-100)
      let engagementScore = 0;
      
      // Watch time contribution (max 40 points)
      const watchTimeScore = Math.min(totalWatchTime / 100, 40);
      
      // Session frequency contribution (max 30 points)
      const sessionScore = Math.min(sessionCount * 3, 30);
      
      // Content variety contribution (max 20 points)
      const contentScore = Math.min(totalUniqueContent * 2, 20);
      
      // Recent activity contribution (max 10 points)
      const createdDays = user.created_at 
        ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
        : 365;
      const recencyScore = Math.max(0, 10 - (createdDays / 100));
      
      engagementScore = Math.round(watchTimeScore + sessionScore + contentScore + recencyScore);
      
      return {
        ...user,
        total_watch_time: totalWatchTime,
        total_unique_content: totalUniqueContent,
        engagement_score: Math.min(engagementScore, 100),
        watch_time_score: Math.round(watchTimeScore),
        session_score: Math.round(sessionScore),
        content_score: Math.round(contentScore),
        recency_score: Math.round(recencyScore)
      };
    });
    
    // Sort by engagement score
    const sortedUsers = usersWithScores.sort((a, b) => b.engagement_score - a.engagement_score);
    
    res.status(200).json({
      success: true,
      analytics: sortedUsers,
      period: period,
      total_users: sortedUsers.length
    });
    
  } catch (err) {
    console.error("Error fetching user engagement analytics:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch user engagement analytics." 
    });
  }
};

// ✅ Get top users summary (for dashboard) - FIXED
const getTopUsersSummary = async (req, res) => {
  try {
    // Get top users by different criteria
    const [topByWatchTime, topBySessions, topBySubscription, recentActive] = await Promise.all([
      query(`
        SELECT 
          u.id,
          u.email,
          u.phone,
          u.username,
          u.first_name,
          u.last_name,
          COALESCE(SUM(
            CASE 
              WHEN cs.total_watch_time IS NOT NULL THEN cs.total_watch_time
              WHEN kp.total_watch_seconds IS NOT NULL THEN ROUND(kp.total_watch_seconds / 60)
              ELSE 0 
            END
          ), 0) as total_watch_minutes
        FROM users u
        LEFT JOIN (
          SELECT user_id, SUM(total_watch_time) as total_watch_time
          FROM content_watch_sessions
          WHERE last_activity_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY user_id
        ) cs ON u.id = cs.user_id
        LEFT JOIN (
          SELECT 
            kp.parent_user_id as user_id,
            SUM(kvh.watch_duration_seconds) as total_watch_seconds
          FROM kids_profiles kp
          LEFT JOIN kids_viewing_history kvh ON kp.id = kvh.kid_profile_id
          WHERE kvh.started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY kp.parent_user_id
        ) kp ON u.id = kp.user_id
        WHERE u.is_active = TRUE
        GROUP BY u.id, u.email, u.phone, u.username, u.first_name, u.last_name
        ORDER BY total_watch_minutes DESC
        LIMIT 5
      `),
      
      query(`
        SELECT 
          u.id,
          u.email,
          u.phone,
          u.username,
          u.first_name,
          u.last_name,
          COUNT(DISTINCT us.id) as total_sessions
        FROM users u
        LEFT JOIN user_session us ON u.id = us.user_id 
          AND us.login_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE u.is_active = TRUE
        GROUP BY u.id, u.email, u.phone, u.username, u.first_name, u.last_name
        ORDER BY total_sessions DESC
        LIMIT 5
      `),
      
      query(`
        SELECT 
          u.id,
          u.email,
          u.phone,
          u.username,
          u.first_name,
          u.last_name,
          (
            SELECT COALESCE(SUM(s.price), 0)
            FROM user_subscriptions us2
            LEFT JOIN subscriptions s ON us2.subscription_id = s.id
            WHERE us2.user_id = u.id 
            AND us2.status = 'active'
            AND (us2.end_date IS NULL OR us2.end_date > NOW())
          ) as total_subscription_value
        FROM users u
        WHERE u.is_active = TRUE
        ORDER BY total_subscription_value DESC
        LIMIT 5
      `),
      
      query(`
        SELECT 
          u.id,
          u.email,
          u.phone,
          u.username,
          u.first_name,
          u.last_name,
          MAX(us.last_activity) as last_activity
        FROM users u
        LEFT JOIN user_session us ON u.id = us.user_id 
          AND us.last_activity >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        WHERE u.is_active = TRUE
        GROUP BY u.id, u.email, u.phone, u.username, u.first_name, u.last_name
        ORDER BY last_activity DESC
        LIMIT 5
      `)
    ]);
    
    // Helper function to get user display name with null safety
    const getUserDisplayName = (user) => {
      if (!user) return 'User';
      
      // Priority: username > full name > email prefix > phone > fallback
      if (user.username) return user.username;
      
      if (user.first_name) {
        return `${user.first_name} ${user.last_name || ''}`.trim();
      }
      
      if (user.email) {
        return user.email.split('@')[0];
      }
      
      if (user.phone) {
        return `User (${user.phone.substring(user.phone.length - 4)})`;
      }
      
      return 'User';
    };
    
    // Process each category with null-safe display names
    const processedSummary = {
      top_by_watch_time: topByWatchTime.map(u => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        display_name: getUserDisplayName(u),
        total_watch_minutes: u.total_watch_minutes || 0
      })),
      top_by_sessions: topBySessions.map(u => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        display_name: getUserDisplayName(u),
        total_sessions: u.total_sessions || 0
      })),
      top_by_subscription: topBySubscription.map(u => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        display_name: getUserDisplayName(u),
        total_subscription_value: u.total_subscription_value || 0
      })),
      recent_active: recentActive.map(u => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        display_name: getUserDisplayName(u),
        last_activity: u.last_activity
      }))
    };
    
    res.status(200).json({
      success: true,
      summary: processedSummary
    });
    
  } catch (err) {
    console.error("Error fetching top users summary:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch top users summary." 
    });
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
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
  updateFamilyMember,
  getFamilyPinSecurity,
  resetFamilyPin,
  getFamilyPlanInfo,
  getFamilyUsageAnalytics,
  bulkFamilyOperations,
  getFamilyMemberSessions,
  terminateFamilyMemberSessions,
  getKidProfileDetails,
  deleteKidProfile,
  getKidProfileById,
  getTopUsers,
  getUserEngagementAnalytics,
  getTopUsersSummary,
  updateUserPhone,
  updateUserUsername,
  updateUserName,
  getUserIdentifiers,
};