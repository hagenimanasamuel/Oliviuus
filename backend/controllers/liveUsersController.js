const { query } = require("../config/dbConfig");

// ✅ Get live users overview (aggregated stats)
const getLiveOverview = async (req, res) => {
  try {
    // Get total live users count
    const totalLive = await query(`
      SELECT COUNT(*) as total_live
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
    `);

    // Get breakdown by user type
    const userTypes = await query(`
      SELECT 
        user_type,
        COUNT(*) as count
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      GROUP BY user_type
      ORDER BY count DESC
    `);

    // Get breakdown by session type (viewing, browsing, idle)
    const sessionTypes = await query(`
      SELECT 
        session_type,
        COUNT(*) as count
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      GROUP BY session_type
      ORDER BY count DESC
    `);

    // Get breakdown by device
    const deviceTypes = await query(`
      SELECT 
        device_type,
        COUNT(*) as count
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      GROUP BY device_type
      ORDER BY count DESC
    `);

    // Get currently watching content
    const watchingContent = await query(`
      SELECT 
        content_id,
        content_title,
        content_type,
        COUNT(*) as viewers,
        AVG(percentage_watched) as avg_completion
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND session_type = 'viewing'
      AND content_id IS NOT NULL
      GROUP BY content_id, content_title, content_type
      ORDER BY viewers DESC
      LIMIT 10
    `);

    // Get geographic distribution
    const geographic = await query(`
      SELECT 
        country_code,
        COUNT(*) as users,
        GROUP_CONCAT(DISTINCT region) as regions
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND country_code IS NOT NULL
      GROUP BY country_code
      ORDER BY users DESC
      LIMIT 10
    `);

    // Get peak today
    const peakToday = await query(`
      SELECT 
        MAX(total_live_users) as peak_users,
        DATE_FORMAT(time_bucket, '%H:%i') as peak_time
      FROM live_stats_snapshots 
      WHERE DATE(time_bucket) = CURDATE()
      AND snapshot_type = 'real_time'
    `);

    // Get performance metrics
    const performance = await query(`
      SELECT 
        AVG(network_latency) as avg_latency_ms,
        AVG(bandwidth_estimate) as avg_bandwidth_kbps,
        AVG(frame_rate) as avg_frame_rate,
        SUM(buffering_count) as total_buffers
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND session_type = 'viewing'
    `);

    // Get hourly trend for last 24 hours
    const hourlyTrend = await query(`
      SELECT 
        HOUR(time_bucket) as hour,
        AVG(total_live_users) as avg_users,
        MAX(total_live_users) as max_users,
        MIN(total_live_users) as min_users
      FROM live_stats_snapshots 
      WHERE time_bucket >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND snapshot_type = 'hourly'
      GROUP BY HOUR(time_bucket)
      ORDER BY hour
    `);

    res.status(200).json({
      success: true,
      overview: {
        total_live_users: totalLive[0]?.total_live || 0,
        user_types: userTypes,
        session_types: sessionTypes,
        device_types: deviceTypes,
        watching_content: watchingContent,
        geographic_distribution: geographic,
        peak_today: {
          users: peakToday[0]?.peak_users || 0,
          time: peakToday[0]?.peak_time || 'N/A'
        },
        performance: {
          avg_latency_ms: performance[0]?.avg_latency_ms || 0,
          avg_bandwidth_kbps: performance[0]?.avg_bandwidth_kbps || 0,
          avg_frame_rate: performance[0]?.avg_frame_rate || 0,
          total_buffers: performance[0]?.total_buffers || 0
        },
        hourly_trend: hourlyTrend
      }
    });
  } catch (err) {
    console.error("Error fetching live overview:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch live overview" 
    });
  }
};

// ✅ Get detailed live users list with filtering
const getLiveUsersList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      user_type = "",
      device_type = "",
      session_type = "",
      country_code = "",
      content_type = "",
      sort_by = "last_activity",
      sort_order = "DESC"
    } = req.query;

    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        lp.*,
        u.email as user_email,
        c.title as content_full_title,
        c.content_type as content_type_name
      FROM live_presence lp
      LEFT JOIN users u ON lp.user_id = u.id
      LEFT JOIN contents c ON lp.content_id = c.id
      WHERE lp.is_active = TRUE 
      AND lp.expires_at > NOW()
    `;
    
    const params = [];

    // Apply filters
    if (search) {
      sql += ` AND (
        lp.device_name LIKE ? OR 
        lp.content_title LIKE ? OR 
        u.email LIKE ? OR
        lp.ip_address LIKE ?
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (user_type) {
      sql += " AND lp.user_type = ?";
      params.push(user_type);
    }

    if (device_type) {
      sql += " AND lp.device_type = ?";
      params.push(device_type);
    }

    if (session_type) {
      sql += " AND lp.session_type = ?";
      params.push(session_type);
    }

    if (country_code) {
      sql += " AND lp.country_code = ?";
      params.push(country_code);
    }

    if (content_type) {
      sql += " AND lp.content_type = ?";
      params.push(content_type);
    }

    // Add sorting
    const validSortFields = ['last_activity', 'joined_at', 'total_watch_time_seconds', 'total_actions'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'last_activity';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    sql += ` ORDER BY lp.${sortField} ${order}`;

    // Add pagination
    sql += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    // Execute query
    const liveUsers = await query(sql, params);

    // Count total
    const countSql = sql
      .replace('SELECT lp.*, u.email as user_email, c.title as content_full_title, c.content_type as content_type_name', 'SELECT COUNT(*) as total')
      .split('ORDER BY')[0]
      .split('LIMIT')[0];
    
    const totalResult = await query(countSql, params.slice(0, params.length - 2));
    const total = totalResult[0]?.total || 0;

    // Format response
    const formattedUsers = liveUsers.map(user => ({
      id: user.id,
      session_id: user.session_id,
      user_id: user.user_id,
      user_email: user.user_email,
      user_type: user.user_type,
      session_type: user.session_type,
      device_type: user.device_type,
      device_name: user.device_name,
      content_id: user.content_id,
      content_title: user.content_title || user.content_full_title,
      content_type: user.content_type || user.content_type_name,
      playback_time: user.playback_time,
      duration: user.duration,
      percentage_watched: user.percentage_watched,
      ip_address: user.ip_address,
      country_code: user.country_code,
      region: user.region,
      city: user.city,
      last_activity: user.last_activity,
      joined_at: user.joined_at,
      total_watch_time_seconds: user.total_watch_time_seconds,
      total_actions: user.total_actions,
      page_views: user.page_views,
      buffering_count: user.buffering_count,
      quality_changes: user.quality_changes,
      current_quality: user.current_quality,
      network_latency: user.network_latency,
      frame_rate: user.frame_rate,
      connection_type: user.connection_type,
      bandwidth_estimate: user.bandwidth_estimate,
      screen_resolution: user.screen_resolution,
      language_preference: user.language_preference,
      user_agent: user.user_agent ? user.user_agent.substring(0, 100) + '...' : null,
      is_active: user.is_active,
      time_online_minutes: user.last_activity 
        ? Math.round((new Date(user.last_activity) - new Date(user.joined_at)) / (1000 * 60))
        : 0
    }));

    // Get filter options for frontend
    const filterOptions = await query(`
      SELECT 
        COUNT(DISTINCT user_type) as user_types,
        COUNT(DISTINCT device_type) as device_types,
        COUNT(DISTINCT session_type) as session_types,
        COUNT(DISTINCT country_code) as countries,
        COUNT(DISTINCT content_type) as content_types
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
    `);

    res.status(200).json({
      success: true,
      live_users: formattedUsers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / limit),
      filter_options: filterOptions[0]
    });
  } catch (err) {
    console.error("Error fetching live users list:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch live users list" 
    });
  }
};

// ✅ Get live user details by session ID
const getLiveUserDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const userDetails = await query(`
      SELECT 
        lp.*,
        u.email as user_email,
        u.role as user_role,
        u.subscription_plan,
        u.created_at as user_created_at,
        c.title as content_title,
        c.description as content_description,
        c.content_type as content_type,
        c.age_rating as content_age_rating,
        c.duration_minutes as content_duration,
        ma.file_name as media_file,
        ma.resolution as media_resolution
      FROM live_presence lp
      LEFT JOIN users u ON lp.user_id = u.id
      LEFT JOIN contents c ON lp.content_id = c.id
      LEFT JOIN media_assets ma ON lp.media_asset_id = ma.id
      WHERE lp.session_id = ? 
      AND lp.is_active = TRUE
      AND lp.expires_at > NOW()
    `, [sessionId]);

    if (userDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Live session not found or expired"
      });
    }

    const user = userDetails[0];

    // Get recent events for this session
    const recentEvents = await query(`
      SELECT 
        event_type,
        event_data,
        metadata,
        created_at
      FROM live_events 
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [sessionId]);

    // Get similar users (watching same content)
    const similarUsers = await query(`
      SELECT 
        session_id,
        user_type,
        device_type,
        country_code,
        percentage_watched,
        last_activity
      FROM live_presence 
      WHERE content_id = ? 
      AND session_id != ?
      AND is_active = TRUE
      AND expires_at > NOW()
      ORDER BY last_activity DESC
      LIMIT 5
    `, [user.content_id, sessionId]);

    // Calculate engagement score
    let engagementScore = 0;
    if (user.session_type === 'viewing') {
      engagementScore += 40; // Base for watching
      engagementScore += Math.min(user.percentage_watched, 40); // Up to 40 for completion
      engagementScore += Math.min(user.total_actions / 10, 20); // Up to 20 for interactions
    } else if (user.session_type === 'browsing') {
      engagementScore += 20; // Base for browsing
      engagementScore += Math.min(user.page_views * 5, 30); // Up to 30 for page views
      engagementScore += Math.min(user.total_actions / 5, 30); // Up to 30 for interactions
    }

    res.status(200).json({
      success: true,
      user_details: {
        session_info: {
          session_id: user.session_id,
          user_type: user.user_type,
          session_type: user.session_type,
          joined_at: user.joined_at,
          last_activity: user.last_activity,
          time_online_minutes: Math.round((new Date(user.last_activity) - new Date(user.joined_at)) / (1000 * 60)),
          engagement_score: Math.min(engagementScore, 100)
        },
        user_info: {
          user_id: user.user_id,
          email: user.user_email,
          role: user.user_role,
          subscription_plan: user.subscription_plan,
          account_age_days: user.user_created_at 
            ? Math.round((new Date() - new Date(user.user_created_at)) / (1000 * 60 * 60 * 24))
            : null
        },
        device_info: {
          device_type: user.device_type,
          device_name: user.device_name,
          screen_resolution: user.screen_resolution,
          user_agent: user.user_agent,
          language: user.language_preference
        },
        content_info: {
          content_id: user.content_id,
          title: user.content_title,
          description: user.content_description,
          content_type: user.content_type,
          age_rating: user.content_age_rating,
          duration_minutes: user.content_duration,
          media_file: user.media_file,
          media_resolution: user.media_resolution
        },
        playback_info: {
          playback_time: user.playback_time,
          duration: user.duration,
          percentage_watched: user.percentage_watched,
          quality: user.current_quality,
          buffering_count: user.buffering_count,
          quality_changes: user.quality_changes
        },
        network_info: {
          ip_address: user.ip_address,
          country_code: user.country_code,
          region: user.region,
          city: user.city,
          connection_type: user.connection_type,
          bandwidth_estimate: user.bandwidth_estimate,
          network_latency: user.network_latency,
          frame_rate: user.frame_rate
        },
        engagement_info: {
          total_watch_time_seconds: user.total_watch_time_seconds,
          total_watch_time_minutes: Math.round(user.total_watch_time_seconds / 60),
          total_actions: user.total_actions,
          page_views: user.page_views
        }
      },
      recent_events: recentEvents,
      similar_users: similarUsers
    });
  } catch (err) {
    console.error("Error fetching live user details:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch live user details" 
    });
  }
};

// ✅ Get real-time statistics (for dashboard widgets)
const getRealtimeStats = async (req, res) => {
  try {
    // Get current live stats
    const currentStats = await query(`
      SELECT 
        COUNT(*) as total_live,
        COUNT(CASE WHEN user_type = 'authenticated' THEN 1 END) as authenticated,
        COUNT(CASE WHEN user_type = 'anonymous' THEN 1 END) as anonymous,
        COUNT(CASE WHEN user_type = 'kid_profile' THEN 1 END) as kid_profiles,
        COUNT(CASE WHEN user_type = 'family_member' THEN 1 END) as family_members,
        COUNT(CASE WHEN session_type = 'viewing' THEN 1 END) as viewing,
        COUNT(CASE WHEN session_type = 'browsing' THEN 1 END) as browsing,
        COUNT(CASE WHEN session_type = 'idle' THEN 1 END) as idle,
        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile,
        COUNT(CASE WHEN device_type = 'web' THEN 1 END) as web,
        COUNT(CASE WHEN device_type = 'smarttv' THEN 1 END) as smarttv,
        COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet,
        COUNT(DISTINCT country_code) as countries,
        COUNT(DISTINCT content_id) as unique_contents
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
    `);

    // Get top content being watched
    const topContent = await query(`
      SELECT 
        content_id,
        content_title,
        content_type,
        COUNT(*) as viewers,
        AVG(percentage_watched) as avg_completion
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND session_type = 'viewing'
      AND content_id IS NOT NULL
      GROUP BY content_id, content_title, content_type
      ORDER BY viewers DESC
      LIMIT 5
    `);

    // Get top countries
    const topCountries = await query(`
      SELECT 
        country_code,
        COUNT(*) as users
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND country_code IS NOT NULL
      GROUP BY country_code
      ORDER BY users DESC
      LIMIT 5
    `);

    // Get recent joins (last 5 minutes)
    const recentJoins = await query(`
      SELECT 
        COUNT(*) as joins_last_5min
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND joined_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    `);

    // Get performance metrics
    const performance = await query(`
      SELECT 
        AVG(network_latency) as avg_latency,
        AVG(bandwidth_estimate) as avg_bandwidth,
        SUM(buffering_count) as total_buffering,
        COUNT(CASE WHEN frame_rate < 24 THEN 1 END) as low_fps_sessions
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND session_type = 'viewing'
    `);

    // Get hourly trend for today
    const hourlyTrend = await query(`
      SELECT 
        HOUR(time_bucket) as hour,
        AVG(total_live_users) as avg_users
      FROM live_stats_snapshots 
      WHERE DATE(time_bucket) = CURDATE()
      AND snapshot_type = 'hourly'
      GROUP BY HOUR(time_bucket)
      ORDER BY hour
      LIMIT 24
    `);

    res.status(200).json({
      success: true,
      realtime: {
        timestamp: new Date().toISOString(),
        totals: currentStats[0],
        top_content: topContent,
        top_countries: topCountries,
        recent_activity: {
          joins_last_5min: recentJoins[0]?.joins_last_5min || 0
        },
        performance: performance[0],
        hourly_trend: hourlyTrend
      }
    });
  } catch (err) {
    console.error("Error fetching realtime stats:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch realtime stats" 
    });
  }
};

// ✅ Get live users map (geographic distribution)
const getLiveUsersMap = async (req, res) => {
  try {
    const geographicData = await query(`
      SELECT 
        country_code,
        region,
        city,
        COUNT(*) as users,
        GROUP_CONCAT(DISTINCT device_type) as devices,
        GROUP_CONCAT(DISTINCT content_type) as content_types
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND country_code IS NOT NULL
      GROUP BY country_code, region, city
      ORDER BY users DESC
    `);

    // Get coordinates for countries (you might want to have a countries table with coordinates)
    const countriesWithUsers = await query(`
      SELECT DISTINCT country_code 
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND country_code IS NOT NULL
    `);

    // Format for map visualization
    const mapData = geographicData.map(location => ({
      country: location.country_code,
      region: location.region,
      city: location.city,
      users: location.users,
      devices: location.devices ? location.devices.split(',') : [],
      content_types: location.content_types ? location.content_types.split(',') : []
    }));

    res.status(200).json({
      success: true,
      map_data: mapData,
      total_locations: geographicData.length,
      unique_countries: countriesWithUsers.length
    });
  } catch (err) {
    console.error("Error fetching live users map:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch live users map" 
    });
  }
};

// ✅ Get historical trends
const getHistoricalTrends = async (req, res) => {
  try {
    const { period = '24h' } = req.query; // 24h, 7d, 30d, 90d

    let interval, groupBy;
    switch (period) {
      case '24h':
        interval = 'INTERVAL 24 HOUR';
        groupBy = 'HOUR(time_bucket)';
        break;
      case '7d':
        interval = 'INTERVAL 7 DAY';
        groupBy = 'DATE(time_bucket)';
        break;
      case '30d':
        interval = 'INTERVAL 30 DAY';
        groupBy = 'DATE(time_bucket)';
        break;
      case '90d':
        interval = 'INTERVAL 90 DAY';
        groupBy = 'WEEK(time_bucket)';
        break;
      default:
        interval = 'INTERVAL 24 HOUR';
        groupBy = 'HOUR(time_bucket)';
    }

    const trends = await query(`
      SELECT 
        ${groupBy} as time_period,
        AVG(total_live_users) as avg_users,
        MAX(total_live_users) as peak_users,
        MIN(total_live_users) as low_users,
        AVG(viewing_users) as avg_viewing,
        AVG(browsing_users) as avg_browsing,
        AVG(authenticated_users) as avg_authenticated,
        AVG(anonymous_users) as avg_anonymous
      FROM live_stats_snapshots 
      WHERE time_bucket >= DATE_SUB(NOW(), ${interval})
      AND snapshot_type IN ('hourly', 'daily')
      GROUP BY ${groupBy}
      ORDER BY time_period
    `);

    // Get peak hours
    const peakHours = await query(`
      SELECT 
        HOUR(time_bucket) as hour,
        AVG(total_live_users) as avg_users,
        COUNT(*) as samples
      FROM live_stats_snapshots 
      WHERE time_bucket >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND snapshot_type = 'hourly'
      GROUP BY HOUR(time_bucket)
      ORDER BY avg_users DESC
      LIMIT 5
    `);

    // Get growth rate
    const growth = await query(`
      SELECT 
        DATE(time_bucket) as date,
        total_live_users,
        LAG(total_live_users) OVER (ORDER BY time_bucket) as previous_users,
        ROUND(((total_live_users - LAG(total_live_users) OVER (ORDER BY time_bucket)) / LAG(total_live_users) OVER (ORDER BY time_bucket)) * 100, 2) as growth_rate
      FROM live_stats_snapshots 
      WHERE snapshot_type = 'daily'
      AND time_bucket >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY time_bucket DESC
      LIMIT 7
    `);

    res.status(200).json({
      success: true,
      period,
      trends,
      peak_hours: peakHours,
      growth_trend: growth,
      summary: {
        avg_concurrent_users: trends.reduce((sum, t) => sum + t.avg_users, 0) / trends.length,
        peak_concurrent_users: Math.max(...trends.map(t => t.peak_users)),
        avg_growth_rate: growth.reduce((sum, g) => sum + (g.growth_rate || 0), 0) / growth.length
      }
    });
  } catch (err) {
    console.error("Error fetching historical trends:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch historical trends" 
    });
  }
};

// ✅ Force disconnect a live user (admin action)
const forceDisconnectUser = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.user.id;

    // Check if session exists
    const session = await query(`
      SELECT * FROM live_presence 
      WHERE session_id = ? 
      AND is_active = TRUE
    `, [sessionId]);

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Session not found or already disconnected"
      });
    }

    // Mark as disconnected
    await query(`
      UPDATE live_presence 
      SET 
        is_active = FALSE,
        disconnected_at = NOW(),
        expires_at = NOW()
      WHERE session_id = ?
    `, [sessionId]);

    // Log the event
    await query(`
      INSERT INTO live_events (
        session_id,
        user_id,
        event_type,
        event_data,
        metadata
      ) VALUES (?, ?, 'user_left', ?, ?)
    `, [
      sessionId,
      session[0].user_id,
      JSON.stringify({ reason: 'admin_forced_disconnect', admin_id: adminId }),
      JSON.stringify({ disconnected_by_admin: true, timestamp: new Date().toISOString() })
    ]);

    // Log security action
    await query(`
      INSERT INTO security_logs (
        user_id,
        action,
        ip_address,
        status,
        details
      ) VALUES (?, 'live_user_disconnected', ?, 'success', ?)
    `, [
      adminId,
      req.ip || 'unknown',
      JSON.stringify({
        target_session_id: sessionId,
        target_user_id: session[0].user_id,
        disconnected_at: new Date().toISOString(),
        reason: 'admin_action'
      })
    ]);

    res.status(200).json({
      success: true,
      message: "User disconnected successfully",
      session_id: sessionId,
      disconnected_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error disconnecting user:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to disconnect user" 
    });
  }
};

// ✅ Bulk disconnect users
const bulkDisconnectUsers = async (req, res) => {
  try {
    const { sessionIds, reason = 'admin_bulk_action' } = req.body;
    const adminId = req.user.id;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Session IDs are required"
      });
    }

    if (sessionIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Cannot disconnect more than 100 users at once"
      });
    }

    const placeholders = sessionIds.map(() => '?').join(',');
    
    // Get sessions before disconnecting
    const sessions = await query(`
      SELECT session_id, user_id FROM live_presence 
      WHERE session_id IN (${placeholders}) 
      AND is_active = TRUE
    `, sessionIds);

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active sessions found"
      });
    }

    // Disconnect all sessions
    await query(`
      UPDATE live_presence 
      SET 
        is_active = FALSE,
        disconnected_at = NOW(),
        expires_at = NOW()
      WHERE session_id IN (${placeholders})
    `, sessionIds);

    // Log events for each session
    for (const session of sessions) {
      await query(`
        INSERT INTO live_events (
          session_id,
          user_id,
          event_type,
          event_data,
          metadata
        ) VALUES (?, ?, 'user_left', ?, ?)
      `, [
        session.session_id,
        session.user_id,
        JSON.stringify({ reason, admin_id: adminId }),
        JSON.stringify({ disconnected_by_admin: true, bulk_action: true })
      ]);
    }

    // Log security action
    await query(`
      INSERT INTO security_logs (
        user_id,
        action,
        ip_address,
        status,
        details
      ) VALUES (?, 'bulk_live_users_disconnected', ?, 'success', ?)
    `, [
      adminId,
      req.ip || 'unknown',
      JSON.stringify({
        session_count: sessions.length,
        session_ids: sessions.map(s => s.session_id),
        reason,
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      success: true,
      message: `${sessions.length} users disconnected successfully`,
      disconnected_count: sessions.length,
      session_ids: sessions.map(s => s.session_id)
    });
  } catch (err) {
    console.error("Error in bulk disconnect:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to disconnect users" 
    });
  }
};

// ✅ Get active session warnings (performance issues, etc.)
const getSessionWarnings = async (req, res) => {
  try {
    // Get sessions with performance issues
    const performanceWarnings = await query(`
      SELECT 
        session_id,
        user_id,
        device_type,
        network_latency,
        frame_rate,
        buffering_count,
        bandwidth_estimate,
        content_title,
        ROUND(percentage_watched, 2) as completion
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND (
        network_latency > 1000 OR 
        frame_rate < 20 OR 
        buffering_count > 10 OR
        bandwidth_estimate < 500
      )
      ORDER BY network_latency DESC
      LIMIT 20
    `);

    // Get suspicious sessions (multiple connections from same IP)
    const suspiciousSessions = await query(`
      SELECT 
        ip_address,
        COUNT(*) as connections,
        GROUP_CONCAT(DISTINCT user_type) as user_types,
        GROUP_CONCAT(DISTINCT device_type) as device_types,
        MAX(last_activity) as latest_activity
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING COUNT(*) > 3
      ORDER BY connections DESC
      LIMIT 10
    `);

    // Get long idle sessions
    const idleWarnings = await query(`
      SELECT 
        session_id,
        user_id,
        session_type,
        TIMESTAMPDIFF(MINUTE, last_activity, NOW()) as idle_minutes,
        device_type,
        content_title
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND session_type = 'idle'
      AND TIMESTAMPDIFF(MINUTE, last_activity, NOW()) > 30
      ORDER BY idle_minutes DESC
      LIMIT 20
    `);

    // Get geographic anomalies
    const geographicWarnings = await query(`
      SELECT 
        user_id,
        session_id,
        country_code,
        region,
        ip_address,
        joined_at,
        last_activity,
        TIMESTAMPDIFF(HOUR, joined_at, last_activity) as hours_online
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      AND user_id IS NOT NULL
      AND TIMESTAMPDIFF(HOUR, joined_at, last_activity) > 24
      ORDER BY hours_online DESC
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      warnings: {
        performance: performanceWarnings,
        suspicious: suspiciousSessions,
        idle: idleWarnings,
        geographic: geographicWarnings,
        summary: {
          total_warnings: performanceWarnings.length + suspiciousSessions.length + 
                         idleWarnings.length + geographicWarnings.length,
          performance_count: performanceWarnings.length,
          suspicious_count: suspiciousSessions.length,
          idle_count: idleWarnings.length,
          geographic_count: geographicWarnings.length
        }
      }
    });
  } catch (err) {
    console.error("Error fetching session warnings:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch session warnings" 
    });
  }
};

// ✅ Get live events feed (real-time activity)
const getLiveEventsFeed = async (req, res) => {
  try {
    const { limit = 50, event_type = "" } = req.query;

    let sql = `
      SELECT 
        le.*,
        lp.user_type,
        lp.device_type,
        lp.content_title,
        lp.country_code,
        u.email as user_email
      FROM live_events le
      LEFT JOIN live_presence lp ON le.session_id = lp.session_id
      LEFT JOIN users u ON le.user_id = u.id
      WHERE le.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `;
    
    const params = [];

    if (event_type) {
      sql += " AND le.event_type = ?";
      params.push(event_type);
    }

    sql += " ORDER BY le.created_at DESC LIMIT ?";
    params.push(parseInt(limit));

    const events = await query(sql, params);

    // Format events for display
    const formattedEvents = events.map(event => {
      let description = '';
      let icon = '🔔';
      let severity = 'info';

      switch (event.event_type) {
        case 'user_joined':
          description = `${event.user_type} user joined`;
          icon = '🟢';
          severity = 'info';
          break;
        case 'user_left':
          description = `User disconnected`;
          icon = '🔴';
          severity = 'info';
          break;
        case 'content_started':
          description = `Started watching: ${event.content_title || 'Unknown content'}`;
          icon = '▶️';
          severity = 'info';
          break;
        case 'content_completed':
          description = `Completed: ${event.content_title || 'Unknown content'}`;
          icon = '🏁';
          severity = 'success';
          break;
        case 'buffering_started':
          description = `Buffering started`;
          icon = '⏸️';
          severity = 'warning';
          break;
        case 'quality_changed':
          description = `Quality changed`;
          icon = '⚙️';
          severity = 'info';
          break;
        default:
          description = event.event_type.replace(/_/g, ' ');
          icon = '📝';
      }

      return {
        id: event.id,
        session_id: event.session_id,
        user_id: event.user_id,
        user_email: event.user_email,
        user_type: event.user_type,
        device_type: event.device_type,
        content_title: event.content_title,
        country_code: event.country_code,
        event_type: event.event_type,
        description,
        icon,
        severity,
        event_data: event.event_data ? JSON.parse(event.event_data) : {},
        metadata: event.metadata ? JSON.parse(event.metadata) : {},
        created_at: event.created_at,
        time_ago: formatTimeAgo(event.created_at)
      };
    });

    // Get event statistics
    const eventStats = await query(`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM live_events 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY event_type
      ORDER BY count DESC
    `);

    res.status(200).json({
      success: true,
      events: formattedEvents,
      statistics: eventStats,
      total_events: events.length,
      time_range: 'last_hour'
    });
  } catch (err) {
    console.error("Error fetching live events:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch live events" 
    });
  }
};

// Helper function to format time ago
function formatTimeAgo(timestamp) {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now - eventTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ✅ Export live users data
const exportLiveUsers = async (req, res) => {
  try {
    const liveUsers = await query(`
      SELECT 
        lp.*,
        u.email as user_email,
        c.title as content_title,
        c.content_type as content_type_name
      FROM live_presence lp
      LEFT JOIN users u ON lp.user_id = u.id
      LEFT JOIN contents c ON lp.content_id = c.id
      WHERE lp.is_active = TRUE 
      AND lp.expires_at > NOW()
      ORDER BY lp.last_activity DESC
    `);

    // Convert to CSV
    const csvRows = [];
    
    // Add header
    const headers = [
      'Session ID', 'User ID', 'User Email', 'User Type', 'Session Type',
      'Device Type', 'Device Name', 'Content Title', 'Content Type',
      'Playback Time', 'Duration', 'Percentage Watched', 'IP Address',
      'Country', 'Region', 'City', 'Joined At', 'Last Activity',
      'Time Online (min)', 'Total Actions', 'Page Views',
      'Network Latency', 'Bandwidth', 'Frame Rate', 'Quality',
      'Buffering Count', 'Connection Type', 'Screen Resolution', 'Language'
    ];
    csvRows.push(headers.join(','));

    // Add data rows
    for (const user of liveUsers) {
      const row = [
        user.session_id,
        user.user_id || 'N/A',
        user.user_email || 'Anonymous',
        user.user_type,
        user.session_type,
        user.device_type,
        user.device_name || 'Unknown',
        user.content_title || user.content_title || 'N/A',
        user.content_type || user.content_type_name || 'N/A',
        user.playback_time || 0,
        user.duration || 0,
        user.percentage_watched || 0,
        user.ip_address || 'Unknown',
        user.country_code || 'Unknown',
        user.region || 'Unknown',
        user.city || 'Unknown',
        user.joined_at,
        user.last_activity,
        Math.round((new Date(user.last_activity) - new Date(user.joined_at)) / (1000 * 60)),
        user.total_actions || 0,
        user.page_views || 0,
        user.network_latency || 0,
        user.bandwidth_estimate || 0,
        user.frame_rate || 0,
        user.current_quality || 'Unknown',
        user.buffering_count || 0,
        user.connection_type || 'Unknown',
        user.screen_resolution || 'Unknown',
        user.language_preference || 'en'
      ];
      
      // Escape quotes for CSV
      csvRows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
    }

    const csv = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`live-users-${timestamp}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Error exporting live users:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to export live users" 
    });
  }
};

// ✅ Cleanup expired sessions (cron job endpoint)
const cleanupExpiredSessions = async (req, res) => {
  try {
    const result = await query(`
      UPDATE live_presence 
      SET is_active = FALSE 
      WHERE expires_at < NOW() 
      AND is_active = TRUE
    `);

    // Also cleanup old stats snapshots (older than 90 days)
    await query(`
      DELETE FROM live_stats_snapshots 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
    `);

    // Cleanup old events (older than 30 days)
    await query(`
      DELETE FROM live_events 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.affectedRows} expired sessions`,
      cleaned_sessions: result.affectedRows,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error cleaning up expired sessions:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to cleanup expired sessions" 
    });
  }
};

module.exports = {
  getLiveOverview,
  getLiveUsersList,
  getLiveUserDetails,
  getRealtimeStats,
  getLiveUsersMap,
  getHistoricalTrends,
  forceDisconnectUser,
  bulkDisconnectUsers,
  getSessionWarnings,
  getLiveEventsFeed,
  exportLiveUsers,
  cleanupExpiredSessions
};