const { query } = require('../config/dbConfig');

const getSystemOverview = async (req, res) => {
  try {
    // 1. User Statistics
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN subscription_plan != 'none' THEN 1 END) as subscribed_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d
      FROM users
    `);

    // 2. Subscription & Revenue Statistics
    const subscriptionStats = await query(`
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'trialing' THEN 1 END) as trial_subscriptions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
        SUM(CASE WHEN status = 'active' THEN subscription_price ELSE 0 END) as monthly_recurring_revenue,
        COUNT(CASE WHEN start_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_subscriptions_30d
      FROM user_subscriptions
    `);

    // 3. Payment Statistics
    const paymentStats = await query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        SUM(CASE WHEN status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END) as revenue_30d,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as transactions_30d
      FROM payment_transactions
      WHERE transaction_type = 'subscription'
    `);

    // 4. Support Statistics
    const supportStats = await query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as high_priority_tickets,
        AVG(TIMESTAMPDIFF(HOUR, created_at, COALESCE(first_response_at, NOW()))) as avg_first_response_hours
      FROM contacts
    `);

    // 5. Security & Session Statistics
    const securityStats = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions,
        COUNT(DISTINCT user_id) as unique_active_users,
        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_sessions,
        COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_sessions,
        COUNT(CASE WHEN last_activity >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as recent_activity
      FROM user_session
      WHERE is_active = true
    `);

    // 6. Subscription Plan Distribution
    const planDistribution = await query(`
      SELECT 
        s.name as plan_name,
        s.type as plan_type,
        COUNT(us.id) as subscriber_count,
        SUM(us.subscription_price) as total_revenue
      FROM subscriptions s
      LEFT JOIN user_subscriptions us ON s.id = us.subscription_id AND us.status = 'active'
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.type
      ORDER BY subscriber_count DESC
    `);

    // 7. Recent Activities (Last 7 days)
    const recentActivities = await query(`
      (SELECT 'user_registered' as type, email as description, created_at as timestamp
       FROM users 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY created_at DESC 
       LIMIT 5)
      
      UNION ALL
      
      (SELECT 'subscription_created' as type, 
              CONCAT('New ', subscription_name, ' subscription') as description, 
              created_at as timestamp
       FROM user_subscriptions 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY created_at DESC 
       LIMIT 5)
      
      UNION ALL
      
      (SELECT 'payment_completed' as type,
              CONCAT('Payment of ', amount, ' ', currency) as description,
              created_at as timestamp
       FROM payment_transactions 
       WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY created_at DESC 
       LIMIT 5)
      
      UNION ALL
      
      (SELECT 'support_ticket' as type,
              CONCAT('New ticket: ', subject) as description,
              created_at as timestamp
       FROM contacts 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = 'new'
       ORDER BY created_at DESC 
       LIMIT 5)
      
      ORDER BY timestamp DESC 
      LIMIT 15
    `);

    // 8. System Health Metrics
    const systemHealth = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as active_subscriptions,
        (SELECT COUNT(*) FROM contacts WHERE status IN ('new', 'open', 'in_progress')) as pending_tickets,
        (SELECT COUNT(*) FROM security_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as security_events_24h,
        (SELECT COUNT(*) FROM notifications WHERE status = 'unread') as unread_notifications
    `);

    res.json({
      success: true,
      data: {
        userStats: userStats[0],
        subscriptionStats: subscriptionStats[0],
        paymentStats: paymentStats[0],
        supportStats: supportStats[0],
        securityStats: securityStats[0],
        planDistribution,
        recentActivities,
        systemHealth: systemHealth[0],
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Overview controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system overview'
    });
  }
};

const getDashboardMetrics = async (req, res) => {
  try {
    // Quick metrics for dashboard cards
    const metrics = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as active_subscriptions,
        (SELECT COUNT(*) FROM contacts WHERE status IN ('new', 'open')) as pending_tickets,
        (SELECT SUM(amount) FROM payment_transactions 
         WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_revenue,
        (SELECT COUNT(*) FROM user_session WHERE is_active = true) as active_sessions,
        (SELECT COUNT(*) FROM security_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND status = 'failed') as failed_logins_24h
    `);

    res.json({
      success: true,
      data: metrics[0]
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics'
    });
  }
};

module.exports = {
  getSystemOverview,
  getDashboardMetrics
};