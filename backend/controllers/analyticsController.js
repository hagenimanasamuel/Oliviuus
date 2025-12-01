const { query } = require('../config/dbConfig');

const getComprehensiveAnalytics = async (req, res) => {
  try {
    const { dateRange, startDate, endDate, contentType, metric } = req.query;
    
    // Calculate date range - using only existing columns from your tables
    const dateCondition = getDateCondition(dateRange, startDate, endDate);
    
    // 1. User Growth Analytics - using your exact users table columns
    const userGrowth = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_users
      FROM users 
      WHERE ${dateCondition}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // 2. Revenue Analytics - using your exact payment_transactions table columns
    const revenueAnalytics = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions,
        SUM(amount) as daily_revenue,
        AVG(amount) as avg_transaction_value,
        COUNT(DISTINCT user_id) as paying_customers
      FROM payment_transactions 
      WHERE status = 'completed' AND ${dateCondition}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // 3. Subscription Analytics - using your exact subscriptions and user_subscriptions tables
    const subscriptionAnalytics = await query(`
      SELECT 
        s.name as plan_name,
        COUNT(us.id) as active_subscriptions,
        SUM(us.subscription_price) as mrr,
        AVG(us.subscription_price) as avg_revenue_per_user,
        COUNT(CASE WHEN us.start_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_subscriptions_30d,
        COUNT(CASE WHEN us.status = 'cancelled' AND us.cancelled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as cancellations_30d
      FROM subscriptions s
      LEFT JOIN user_subscriptions us ON s.id = us.subscription_id AND us.status = 'active'
      WHERE s.is_active = true
      GROUP BY s.id, s.name
      ORDER BY mrr DESC
    `);

    // 4. Content Performance Analytics - using your exact tables and columns
    const contentPerformance = await query(`
      SELECT 
        c.id,
        c.title,
        c.content_type,
        c.view_count,
        c.like_count,
        c.average_rating,
        c.rating_count,
        COUNT(DISTINCT cvh.user_id) as unique_viewers,
        AVG(cvh.watch_duration_seconds) as avg_watch_time,
        COUNT(DISTINCT ul.user_id) as total_likes,
        (SELECT COUNT(*) FROM user_watchlist uw WHERE uw.content_id = c.id) as watchlist_adds
      FROM contents c
      LEFT JOIN content_view_history cvh ON c.id = cvh.content_id AND cvh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      LEFT JOIN user_likes ul ON c.id = ul.content_id AND ul.is_active = true
      WHERE c.status = 'published'
      GROUP BY c.id, c.title, c.content_type, c.view_count, c.like_count, c.average_rating, c.rating_count
      ORDER BY c.view_count DESC
      LIMIT 50
    `);

    // 5. Engagement Metrics - FIXED: Using only existing columns from your tables
    const engagementMetrics = await query(`
      SELECT 
        -- Session Analytics (from user_session table)
        (SELECT COUNT(*) FROM user_session WHERE is_active = true) as active_sessions,
        (SELECT COUNT(DISTINCT user_id) FROM user_session WHERE is_active = true) as unique_active_users,
        (SELECT AVG(TIMESTAMPDIFF(MINUTE, login_time, last_activity)) FROM user_session WHERE is_active = true) as avg_session_duration,
        
        -- Content Engagement (from content_view_history table)
        (SELECT COUNT(*) FROM content_view_history WHERE ${dateCondition}) as total_views,
        (SELECT AVG(watch_duration_seconds) FROM content_view_history WHERE ${dateCondition}) as avg_view_duration,
        
        -- User Likes (from user_likes table - using liked_at column instead of created_at)
        (SELECT COUNT(*) FROM user_likes WHERE is_active = true AND liked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as total_likes,
        
        -- Watchlist (from user_watchlist table - using added_at column)
        (SELECT COUNT(*) FROM user_watchlist WHERE added_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as watchlist_additions,
        
        -- Platform Usage (from user_session table)
        (SELECT COUNT(*) FROM user_session WHERE device_type = 'mobile' AND is_active = true) as mobile_users,
        (SELECT COUNT(*) FROM user_session WHERE device_type = 'desktop' AND is_active = true) as desktop_users,
        (SELECT COUNT(*) FROM user_session WHERE device_type = 'tablet' AND is_active = true) as tablet_users,
        (SELECT COUNT(*) FROM user_session WHERE device_type = 'smarttv' AND is_active = true) as smarttv_users
    `);

    // 6. Geographic Distribution - using your user_session table columns
    const geographicDistribution = await query(`
      SELECT 
        location,
        COUNT(*) as users,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(TIMESTAMPDIFF(MINUTE, login_time, last_activity)) as avg_session_duration
      FROM user_session 
      WHERE location IS NOT NULL AND ${dateCondition}
      GROUP BY location
      ORDER BY users DESC
      LIMIT 20
    `);

    // 7. Support Analytics - using your contacts table columns
    const supportAnalytics = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
        AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(first_response_at, NOW()))) as avg_first_response_hours,
        AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(resolved_at, NOW()))) as avg_resolution_hours
      FROM contacts
      WHERE ${dateCondition}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // 8. Security Analytics - using your security_logs table columns
    const securityAnalytics = await query(`
      SELECT 
        action,
        status,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM security_logs
      WHERE ${dateCondition}
      GROUP BY action, status, DATE(created_at)
      ORDER BY date DESC, count DESC
    `);

    // 9. Real-time Metrics - using only existing columns
    const realTimeMetrics = await query(`
      SELECT 
        (SELECT COUNT(*) FROM user_session WHERE is_active = true AND last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)) as active_users_5min,
        (SELECT COUNT(*) FROM content_view_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as views_last_hour,
        (SELECT COUNT(*) FROM payment_transactions WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as purchases_last_hour,
        (SELECT COUNT(*) FROM contacts WHERE status = 'new' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as new_tickets_last_hour
    `);

    res.json({
      success: true,
      data: {
        userGrowth,
        revenueAnalytics,
        subscriptionAnalytics,
        contentPerformance,
        engagementMetrics: engagementMetrics[0],
        geographicDistribution,
        supportAnalytics,
        securityAnalytics,
        realTimeMetrics: realTimeMetrics[0],
        summary: await generateSummaryMetrics(dateCondition),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analytics controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comprehensive analytics',
      details: error.message
    });
  }
};

const getDateCondition = (dateRange, startDate, endDate) => {
  if (startDate && endDate) {
    return `created_at BETWEEN '${startDate}' AND '${endDate}'`;
  }
  
  switch (dateRange) {
    case '24h':
      return "created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
    case '7d':
      return "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    case '30d':
      return "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    case '90d':
      return "created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)";
    case '1y':
      return "created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    default:
      return "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  }
};

const generateSummaryMetrics = async (dateCondition) => {
  const summary = await query(`
    SELECT 
      -- User Metrics (from users table)
      (SELECT COUNT(*) FROM users WHERE ${dateCondition}) as total_users,
      (SELECT COUNT(*) FROM users WHERE email_verified = true AND ${dateCondition}) as verified_users,
      (SELECT COUNT(*) FROM users WHERE subscription_plan != 'none' AND ${dateCondition}) as subscribed_users,
      
      -- Revenue Metrics (from payment_transactions table)
      (SELECT SUM(amount) FROM payment_transactions WHERE status = 'completed' AND ${dateCondition}) as total_revenue,
      (SELECT COUNT(*) FROM payment_transactions WHERE status = 'completed' AND ${dateCondition}) as total_transactions,
      (SELECT AVG(amount) FROM payment_transactions WHERE status = 'completed' AND ${dateCondition}) as avg_transaction_value,
      
      -- Engagement Metrics (from content_view_history table)
      (SELECT COUNT(*) FROM content_view_history WHERE ${dateCondition}) as total_views,
      (SELECT COUNT(DISTINCT content_id) FROM content_view_history WHERE ${dateCondition}) as unique_content_viewed,
      (SELECT COUNT(DISTINCT user_id) FROM content_view_history WHERE ${dateCondition}) as engaged_users,
      
      -- Content Metrics (from contents table)
      (SELECT COUNT(*) FROM contents WHERE status = 'published' AND ${dateCondition}) as published_content,
      (SELECT COUNT(*) FROM contents WHERE content_type = 'movie' AND status = 'published') as total_movies,
      (SELECT COUNT(*) FROM contents WHERE content_type = 'series' AND status = 'published') as total_series,
      
      -- Support Metrics (from contacts table)
      (SELECT COUNT(*) FROM contacts WHERE ${dateCondition}) as total_tickets,
      (SELECT COUNT(*) FROM contacts WHERE status IN ('new', 'open', 'in_progress') AND ${dateCondition}) as pending_tickets,
      (SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(resolved_at, NOW()))) FROM contacts WHERE ${dateCondition}) as avg_resolution_time
  `);

  return summary[0];
};

const exportAnalyticsData = async (req, res) => {
  try {
    const { format, type, ...filters } = req.query;
    
    let data;
    switch (type) {
      case 'users':
        data = await exportUserAnalytics(filters);
        break;
      case 'revenue':
        data = await exportRevenueAnalytics(filters);
        break;
      case 'content':
        data = await exportContentAnalytics(filters);
        break;
      case 'engagement':
        data = await exportEngagementAnalytics(filters);
        break;
      default:
        data = await exportComprehensiveAnalytics(filters);
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.csv`);
      return res.send(convertToCSV(data));
    } else {
      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data',
      details: error.message
    });
  }
};

const exportUserAnalytics = async (filters) => {
  const dateCondition = getDateCondition(filters.dateRange, filters.startDate, filters.endDate);
  
  return await query(`
    SELECT 
      u.id,
      u.email,
      u.role,
      u.subscription_plan,
      u.created_at,
      u.email_verified,
      u.is_active,
      COUNT(DISTINCT us.id) as total_sessions,
      COUNT(DISTINCT cvh.content_id) as content_viewed,
      COUNT(DISTINCT ul.content_id) as content_liked,
      EXISTS(SELECT 1 FROM user_subscriptions us WHERE us.user_id = u.id AND us.status = 'active') as has_active_subscription
    FROM users u
    LEFT JOIN user_session us ON u.id = us.user_id AND us.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    LEFT JOIN content_view_history cvh ON u.id = cvh.user_id AND cvh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    LEFT JOIN user_likes ul ON u.id = ul.user_id AND ul.is_active = true AND ul.liked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    GROUP BY u.id, u.email, u.role, u.subscription_plan, u.created_at, u.email_verified, u.is_active
    ORDER BY u.created_at DESC
  `);
};

const exportRevenueAnalytics = async (filters) => {
  return await query(`
    SELECT 
      pt.id,
      pt.amount,
      pt.currency,
      pt.status,
      pt.transaction_type,
      pt.created_at,
      u.email,
      s.name as subscription_name,
      pm.type as payment_method
    FROM payment_transactions pt
    LEFT JOIN users u ON pt.user_id = u.id
    LEFT JOIN subscriptions s ON pt.subscription_id = s.id
    LEFT JOIN payment_methods pm ON pt.payment_method_id = pm.id
    WHERE pt.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    ORDER BY pt.created_at DESC
  `);
};

const exportContentAnalytics = async (filters) => {
  return await query(`
    SELECT 
      c.id,
      c.title,
      c.content_type,
      c.view_count,
      c.like_count,
      c.average_rating,
      c.rating_count,
      c.created_at,
      COUNT(DISTINCT cvh.user_id) as unique_viewers,
      AVG(cvh.watch_duration_seconds) as avg_watch_time
    FROM contents c
    LEFT JOIN content_view_history cvh ON c.id = cvh.content_id AND cvh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    WHERE c.status = 'published'
    GROUP BY c.id, c.title, c.content_type, c.view_count, c.like_count, c.average_rating, c.rating_count, c.created_at
    ORDER BY c.view_count DESC
  `);
};

const exportEngagementAnalytics = async (filters) => {
  return await query(`
    SELECT 
      us.device_type,
      us.location,
      COUNT(*) as session_count,
      AVG(TIMESTAMPDIFF(MINUTE, us.login_time, us.last_activity)) as avg_duration,
      COUNT(DISTINCT us.user_id) as unique_users
    FROM user_session us
    WHERE us.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY us.device_type, us.location
    ORDER BY session_count DESC
  `);
};

const exportComprehensiveAnalytics = async (filters) => {
  return await query(`
    SELECT 
      'user_metrics' as category,
      COUNT(*) as value,
      'total_users' as metric
    FROM users 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    
    UNION ALL
    
    SELECT 
      'revenue_metrics' as category,
      SUM(amount) as value,
      'total_revenue' as metric
    FROM payment_transactions 
    WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    
    UNION ALL
    
    SELECT 
      'engagement_metrics' as category,
      COUNT(*) as value,
      'total_views' as metric
    FROM content_view_history 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);
};

const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(field => 
      typeof field === 'string' && field.includes(',') ? `"${field}"` : field
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

// Additional analytics endpoints
const getUserAcquisitionMetrics = async (req, res) => {
  try {
    const metrics = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN subscription_plan != 'none' THEN 1 END) as subscribed_users
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('User acquisition metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user acquisition metrics'
    });
  }
};

const getContentPerformanceMetrics = async (req, res) => {
  try {
    const { contentType } = req.query;
    const contentTypeFilter = contentType && contentType !== 'all' ? `AND content_type = '${contentType}'` : '';

    const metrics = await query(`
      SELECT 
        content_type,
        COUNT(*) as total_content,
        SUM(view_count) as total_views,
        AVG(average_rating) as avg_rating,
        SUM(like_count) as total_likes
      FROM contents
      WHERE status = 'published' ${contentTypeFilter}
      GROUP BY content_type
      ORDER BY total_views DESC
    `);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Content performance metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content performance metrics'
    });
  }
};

const getRevenueMetrics = async (req, res) => {
  try {
    const metrics = await query(`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as daily_revenue,
        COUNT(*) as transactions,
        COUNT(DISTINCT user_id) as paying_customers,
        AVG(amount) as avg_transaction_value
      FROM payment_transactions
      WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Revenue metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue metrics'
    });
  }
};

module.exports = {
  getComprehensiveAnalytics,
  exportAnalyticsData,
  getUserAcquisitionMetrics,
  getContentPerformanceMetrics,
  getRevenueMetrics
};