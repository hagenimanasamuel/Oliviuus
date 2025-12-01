const { query } = require("../config/dbConfig");

class SubscriptionAnalyticsController {
  
  // Get comprehensive subscription analytics
  static async getSubscriptionAnalytics(req, res) {
    try {
      const { period = '30d', startDate, endDate } = req.query;

      // Calculate date range based on period
      const dateRange = SubscriptionAnalyticsController.calculateDateRange(period, startDate, endDate);
      
      // Execute all analytics queries in parallel
      const [
        overviewStats,
        revenueTrends,
        planDistribution,
        subscriberGrowth,
        cancellationStats,
        paymentMethods,
        retentionMetrics,
        churnAnalysis,
        realTimeData,
        userGrowth,
        revenueByPlan
      ] = await Promise.all([
        SubscriptionAnalyticsController.getOverviewStats(dateRange),
        SubscriptionAnalyticsController.getRevenueTrends(dateRange),
        SubscriptionAnalyticsController.getPlanDistribution(dateRange),
        SubscriptionAnalyticsController.getSubscriberGrowth(dateRange),
        SubscriptionAnalyticsController.getCancellationStats(dateRange),
        SubscriptionAnalyticsController.getPaymentMethods(dateRange),
        SubscriptionAnalyticsController.getRetentionMetrics(dateRange),
        SubscriptionAnalyticsController.getChurnAnalysis(dateRange),
        SubscriptionAnalyticsController.getRealTimeData(),
        SubscriptionAnalyticsController.getUserGrowth(dateRange),
        SubscriptionAnalyticsController.getRevenueByPlan(dateRange)
      ]);

      const analyticsData = {
        overview: overviewStats,
        trends: {
          revenue: revenueTrends,
          subscribers: subscriberGrowth,
          user_growth: userGrowth
        },
        distribution: {
          plans: planDistribution,
          payment_methods: paymentMethods,
          revenue_by_plan: revenueByPlan
        },
        performance: {
          cancellations: cancellationStats,
          retention: retentionMetrics,
          churn: churnAnalysis
        },
        real_time: realTimeData,
        period: {
          type: period,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        },
        last_updated: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: analyticsData
      });

    } catch (error) {
      console.error('❌ Error fetching subscription analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription analytics',
        error: error.message
      });
    }
  }

  // Calculate date range based on period
  static calculateDateRange(period, startDate, endDate) {
    const end = endDate ? new Date(endDate) : new Date();
    let start = startDate ? new Date(startDate) : new Date();
    
    if (!startDate) {
      switch (period) {
        case '7d':
          start.setDate(end.getDate() - 7);
          break;
        case '30d':
          start.setDate(end.getDate() - 30);
          break;
        case '90d':
          start.setDate(end.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(end.getFullYear() - 1);
          break;
        case 'all':
          start = new Date('2024-01-01');
          break;
        default:
          start.setDate(end.getDate() - 30);
      }
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }

  // Get overview statistics
  static async getOverviewStats(dateRange) {
    try {
      // Get total subscribers
      const subscriberSql = `
        SELECT 
          COUNT(DISTINCT us.user_id) as total_subscribers,
          COUNT(DISTINCT CASE 
            WHEN us.status = 'active' AND us.end_date > UTC_TIMESTAMP() 
            THEN us.user_id 
          END) as active_subscribers,
          COUNT(DISTINCT CASE WHEN us.status = 'cancelled' THEN us.user_id END) as cancelled_subscribers,
          COUNT(DISTINCT CASE WHEN us.status = 'expired' THEN us.user_id END) as expired_subscribers
        FROM user_subscriptions us
      `;
      const [subscriberResult] = await query(subscriberSql);

      // Get revenue metrics
      const revenueSql = `
        SELECT 
          COALESCE(SUM(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE 0 END), 0) as total_revenue,
          COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.user_id END) as total_paying_customers,
          COUNT(DISTINCT CASE WHEN pt.status = 'completed' AND DATE(pt.created_at) BETWEEN ? AND ? THEN pt.user_id END) as period_paying_customers
        FROM payment_transactions pt
        WHERE pt.created_at BETWEEN ? AND ?
      `;
      const [revenueResult] = await query(revenueSql, [
        dateRange.startDate, dateRange.endDate,
        dateRange.startDate, dateRange.endDate
      ]);

      // Get growth metrics
      const growthSql = `
        SELECT 
          COUNT(DISTINCT CASE 
            WHEN DATE(us.created_at) BETWEEN ? AND ? 
            THEN us.user_id 
          END) as new_subscriptions,
          COUNT(DISTINCT CASE 
            WHEN us.status = 'cancelled' AND DATE(us.cancelled_at) BETWEEN ? AND ? 
            THEN us.user_id 
          END) as cancellations
        FROM user_subscriptions us
      `;
      const [growthResult] = await query(growthSql, [
        dateRange.startDate, dateRange.endDate,
        dateRange.startDate, dateRange.endDate
      ]);

      const totalSubscribers = subscriberResult.total_subscribers || 0;
      const activeSubscribers = subscriberResult.active_subscribers || 0;
      const totalRevenue = parseFloat(revenueResult.total_revenue) || 0;
      
      return {
        total_subscribers: totalSubscribers,
        active_subscribers: activeSubscribers,
        cancelled_subscribers: subscriberResult.cancelled_subscribers || 0,
        expired_subscribers: subscriberResult.expired_subscribers || 0,
        total_revenue: totalRevenue,
        total_paying_customers: revenueResult.total_paying_customers || 0,
        period_paying_customers: revenueResult.period_paying_customers || 0,
        average_revenue_per_user: activeSubscribers > 0 ? totalRevenue / activeSubscribers : 0,
        growth_metrics: {
          new_subscriptions: growthResult.new_subscriptions || 0,
          cancellations: growthResult.cancellations || 0,
          net_growth: (growthResult.new_subscriptions || 0) - (growthResult.cancellations || 0)
        }
      };
    } catch (error) {
      console.error('Error in getOverviewStats:', error);
      throw error;
    }
  }

  // Get revenue trends over time
  static async getRevenueTrends(dateRange) {
    const sql = `
      SELECT 
        DATE(pt.created_at) as date,
        SUM(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE 0 END) as daily_revenue,
        COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.user_id END) as paying_customers,
        COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.id END) as transaction_count,
        AVG(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE NULL END) as average_transaction_value
      FROM payment_transactions pt
      WHERE DATE(pt.created_at) BETWEEN ? AND ?
      GROUP BY DATE(pt.created_at)
      ORDER BY date ASC
    `;

    try {
      const results = await query(sql, [dateRange.startDate, dateRange.endDate]);
      
      // Fill in missing dates with zero values
      const filledResults = SubscriptionAnalyticsController.fillMissingDates(
        results, 
        dateRange.startDate, 
        dateRange.endDate,
        { 
          daily_revenue: 0, 
          paying_customers: 0, 
          transaction_count: 0,
          average_transaction_value: 0 
        }
      );
      
      return filledResults.map(row => ({
        date: row.date,
        revenue: parseFloat(row.daily_revenue) || 0,
        paying_customers: row.paying_customers || 0,
        transaction_count: row.transaction_count || 0,
        average_transaction_value: parseFloat(row.average_transaction_value) || 0
      }));
    } catch (error) {
      console.error('Error in getRevenueTrends:', error);
      return [];
    }
  }

  // Get plan distribution analytics
  static async getPlanDistribution(dateRange) {
    const sql = `
      SELECT 
        s.type as plan_type,
        s.name as plan_name,
        s.price as plan_price,
        COUNT(DISTINCT us.user_id) as total_subscribers,
        COUNT(DISTINCT CASE 
          WHEN us.status = 'active' AND us.end_date > UTC_TIMESTAMP() 
          THEN us.user_id 
        END) as active_subscribers,
        COALESCE(SUM(CASE 
          WHEN pt.status = 'completed' AND DATE(pt.created_at) BETWEEN ? AND ? 
          THEN pt.amount ELSE 0 
        END), 0) as plan_revenue,
        COUNT(DISTINCT CASE 
          WHEN pt.status = 'completed' AND DATE(pt.created_at) BETWEEN ? AND ? 
          THEN pt.user_id 
        END) as paying_customers
      FROM subscriptions s
      LEFT JOIN user_subscriptions us ON s.id = us.subscription_id
      LEFT JOIN payment_transactions pt ON us.id = pt.user_subscription_id
      WHERE s.is_active = true
      GROUP BY s.id, s.type, s.name, s.price
      ORDER BY active_subscribers DESC
    `;

    try {
      const results = await query(sql, [
        dateRange.startDate, dateRange.endDate,
        dateRange.startDate, dateRange.endDate
      ]);

      return results.map(row => ({
        plan_type: row.plan_type,
        plan_name: row.plan_name,
        plan_price: parseFloat(row.plan_price) || 0,
        total_subscribers: row.total_subscribers || 0,
        active_subscribers: row.active_subscribers || 0,
        revenue: parseFloat(row.plan_revenue) || 0,
        paying_customers: row.paying_customers || 0
      }));
    } catch (error) {
      console.error('Error in getPlanDistribution:', error);
      return [];
    }
  }

  // Get revenue by plan
  static async getRevenueByPlan(dateRange) {
    const sql = `
      SELECT 
        COALESCE(s.type, 'other') as plan_type,
        COALESCE(s.name, 'Other Plans') as plan_name,
        COALESCE(SUM(pt.amount), 0) as total_revenue,
        COUNT(DISTINCT pt.user_id) as unique_customers,
        COUNT(DISTINCT pt.id) as total_transactions,
        AVG(pt.amount) as avg_transaction_value
      FROM payment_transactions pt
      LEFT JOIN user_subscriptions us ON pt.user_subscription_id = us.id
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE pt.status = 'completed'
        AND DATE(pt.created_at) BETWEEN ? AND ?
      GROUP BY s.type, s.name
      ORDER BY total_revenue DESC
    `;

    try {
      const results = await query(sql, [dateRange.startDate, dateRange.endDate]);
      return results.map(row => ({
        plan_type: row.plan_type,
        plan_name: row.plan_name,
        total_revenue: parseFloat(row.total_revenue) || 0,
        unique_customers: row.unique_customers || 0,
        total_transactions: row.total_transactions || 0,
        avg_transaction_value: parseFloat(row.avg_transaction_value) || 0
      }));
    } catch (error) {
      console.error('Error in getRevenueByPlan:', error);
      return [];
    }
  }

  // Get subscriber growth over time
  static async getSubscriberGrowth(dateRange) {
    const sql = `
      SELECT 
        DATE(us.created_at) as date,
        COUNT(DISTINCT us.user_id) as new_subscribers,
        COUNT(DISTINCT CASE 
          WHEN us.status = 'cancelled' AND DATE(us.cancelled_at) = DATE(us.created_at) 
          THEN us.user_id 
        END) as immediate_cancellations,
        SUM(COUNT(DISTINCT us.user_id)) OVER (ORDER BY DATE(us.created_at)) as cumulative_subscribers
      FROM user_subscriptions us
      WHERE DATE(us.created_at) BETWEEN ? AND ?
      GROUP BY DATE(us.created_at)
      ORDER BY date ASC
    `;

    try {
      const results = await query(sql, [dateRange.startDate, dateRange.endDate]);
      
      const filledResults = SubscriptionAnalyticsController.fillMissingDates(
        results, 
        dateRange.startDate, 
        dateRange.endDate,
        { new_subscribers: 0, immediate_cancellations: 0, cumulative_subscribers: 0 }
      );
      
      return filledResults.map(row => ({
        date: row.date,
        new_subscribers: row.new_subscribers || 0,
        immediate_cancellations: row.immediate_cancellations || 0,
        cumulative_subscribers: row.cumulative_subscribers || 0
      }));
    } catch (error) {
      console.error('Error in getSubscriberGrowth:', error);
      return [];
    }
  }

  // Get user growth metrics
  static async getUserGrowth(dateRange) {
    const sql = `
      SELECT 
        DATE(u.created_at) as date,
        COUNT(DISTINCT u.id) as new_users,
        COUNT(DISTINCT CASE 
          WHEN us.status = 'active' AND us.end_date > UTC_TIMESTAMP() 
          THEN us.user_id 
        END) as subscribed_users,
        COUNT(DISTINCT CASE 
          WHEN us.id IS NULL THEN u.id 
        END) as free_users
      FROM users u
      LEFT JOIN user_subscriptions us ON u.id = us.user_id
      WHERE DATE(u.created_at) BETWEEN ? AND ?
      GROUP BY DATE(u.created_at)
      ORDER BY date ASC
    `;

    try {
      const results = await query(sql, [dateRange.startDate, dateRange.endDate]);
      
      const filledResults = SubscriptionAnalyticsController.fillMissingDates(
        results, 
        dateRange.startDate, 
        dateRange.endDate,
        { new_users: 0, subscribed_users: 0, free_users: 0 }
      );
      
      return filledResults.map(row => ({
        date: row.date,
        new_users: row.new_users || 0,
        subscribed_users: row.subscribed_users || 0,
        free_users: row.free_users || 0
      }));
    } catch (error) {
      console.error('Error in getUserGrowth:', error);
      return [];
    }
  }

  // Get cancellation statistics
  static async getCancellationStats(dateRange) {
    const sql = `
      SELECT 
        COALESCE(us.cancellation_reason, 'user_cancelled') as cancellation_reason,
        COUNT(*) as cancellation_count,
        AVG(DATEDIFF(us.cancelled_at, us.start_date)) as avg_subscription_duration,
        COUNT(DISTINCT CASE WHEN us.auto_renew = true THEN us.user_id END) as auto_renew_cancelled
      FROM user_subscriptions us
      WHERE us.status = 'cancelled' 
        AND DATE(us.cancelled_at) BETWEEN ? AND ?
      GROUP BY us.cancellation_reason
      ORDER BY cancellation_count DESC
    `;

    try {
      const results = await query(sql, [dateRange.startDate, dateRange.endDate]);
      return results.map(row => ({
        reason: row.cancellation_reason,
        count: row.cancellation_count || 0,
        avg_duration_days: parseFloat(row.avg_subscription_duration) || 0,
        auto_renew_cancelled: row.auto_renew_cancelled || 0
      }));
    } catch (error) {
      console.error('Error in getCancellationStats:', error);
      return [];
    }
  }

  // Get payment method distribution
  static async getPaymentMethods(dateRange) {
    const sql = `
      SELECT 
        pt.provider,
        COUNT(DISTINCT pt.user_id) as user_count,
        COUNT(DISTINCT pt.id) as transaction_count,
        COALESCE(SUM(pt.amount), 0) as total_processed,
        AVG(pt.amount) as avg_transaction_value,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
        SUM(CASE WHEN pt.status = 'failed' THEN 1 ELSE 0 END) as failed_transactions
      FROM payment_transactions pt
      WHERE DATE(pt.created_at) BETWEEN ? AND ?
      GROUP BY pt.provider
      ORDER BY total_processed DESC
    `;

    try {
      const results = await query(sql, [dateRange.startDate, dateRange.endDate]);
      
      return results.map(row => ({
        provider: row.provider,
        user_count: row.user_count || 0,
        transaction_count: row.transaction_count || 0,
        total_processed: parseFloat(row.total_processed) || 0,
        avg_transaction_value: parseFloat(row.avg_transaction_value) || 0,
        success_rate: row.transaction_count > 0 ? 
          (row.successful_transactions / row.transaction_count) * 100 : 0
      }));
    } catch (error) {
      console.error('Error in getPaymentMethods:', error);
      return [];
    }
  }

  // Get retention metrics
  static async getRetentionMetrics(dateRange) {
    const sql = `
      SELECT 
        (COUNT(DISTINCT CASE 
          WHEN us.status = 'active' AND us.end_date > DATE_ADD(us.start_date, INTERVAL 30 DAY) 
          THEN us.user_id 
        END) * 100.0 / 
        NULLIF(COUNT(DISTINCT CASE 
          WHEN us.start_date <= DATE_SUB(?, INTERVAL 30 DAY) 
          THEN us.user_id 
        END), 0)) as monthly_retention_rate,
        
        (COUNT(DISTINCT CASE 
          WHEN us.status = 'cancelled' AND DATE(us.cancelled_at) BETWEEN ? AND ? 
          THEN us.user_id 
        END) * 100.0 / 
        NULLIF(COUNT(DISTINCT CASE 
          WHEN us.status = 'active' AND us.start_date <= ? 
          THEN us.user_id 
        END), 0)) as monthly_churn_rate,
        
        AVG(CASE 
          WHEN us.status = 'active' THEN DATEDIFF(UTC_TIMESTAMP(), us.start_date)
          WHEN us.status = 'cancelled' THEN DATEDIFF(us.cancelled_at, us.start_date)
        END) as avg_subscription_duration,
        
        (COUNT(DISTINCT CASE 
          WHEN us.auto_renew = true THEN us.user_id 
        END) * 100.0 / 
        NULLIF(COUNT(DISTINCT us.user_id), 0)) as auto_renewal_rate
      FROM user_subscriptions us
      WHERE DATE(us.created_at) BETWEEN ? AND ?
    `;

    const params = [
      dateRange.endDate,
      dateRange.startDate, dateRange.endDate,
      dateRange.startDate,
      dateRange.startDate, dateRange.endDate
    ];

    try {
      const [result] = await query(sql, params);
      
      return {
        monthly_retention_rate: parseFloat(result.monthly_retention_rate) || 0,
        monthly_churn_rate: parseFloat(result.monthly_churn_rate) || 0,
        avg_subscription_duration: parseFloat(result.avg_subscription_duration) || 0,
        auto_renewal_rate: parseFloat(result.auto_renewal_rate) || 0
      };
    } catch (error) {
      console.error('Error in getRetentionMetrics:', error);
      return {
        monthly_retention_rate: 0,
        monthly_churn_rate: 0,
        avg_subscription_duration: 0,
        auto_renewal_rate: 0
      };
    }
  }

  // Get churn analysis
  static async getChurnAnalysis(dateRange) {
    const sql = `
      SELECT 
        s.type as plan_type,
        COUNT(DISTINCT CASE WHEN us.status = 'cancelled' THEN us.user_id END) as churned_users,
        COUNT(DISTINCT us.user_id) as total_users,
        (COUNT(DISTINCT CASE WHEN us.status = 'cancelled' THEN us.user_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT us.user_id), 0)) as churn_rate,
        AVG(CASE WHEN us.status = 'cancelled' THEN DATEDIFF(us.cancelled_at, us.start_date) END) as avg_days_to_churn,
        COALESCE(SUM(CASE WHEN us.status = 'cancelled' THEN pt.amount ELSE 0 END), 0) as lost_revenue
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      LEFT JOIN payment_transactions pt ON us.id = pt.user_subscription_id
      WHERE DATE(us.created_at) BETWEEN ? AND ?
      GROUP BY s.type
      ORDER BY churn_rate DESC
    `;

    try {
      const results = await query(sql, [dateRange.startDate, dateRange.endDate]);
      
      return results.map(row => ({
        plan_type: row.plan_type,
        churned_users: row.churned_users || 0,
        total_users: row.total_users || 0,
        churn_rate: parseFloat(row.churn_rate) || 0,
        avg_days_to_churn: parseFloat(row.avg_days_to_churn) || 0,
        lost_revenue: parseFloat(row.lost_revenue) || 0
      }));
    } catch (error) {
      console.error('Error in getChurnAnalysis:', error);
      return [];
    }
  }

  // Get real-time data
  static async getRealTimeData() {
    const today = new Date().toISOString().split('T')[0];
    
    const [todayStats, weeklyTrends, activeNow, todayRevenueBreakdown] = await Promise.all([
      SubscriptionAnalyticsController.getTodayStats(today),
      SubscriptionAnalyticsController.getWeeklyTrends(),
      SubscriptionAnalyticsController.getActiveSubscribersNow(),
      SubscriptionAnalyticsController.getTodayRevenueBreakdown(today)
    ]);

    return {
      today: todayStats,
      weekly_trends: weeklyTrends,
      active_now: activeNow,
      revenue_breakdown: todayRevenueBreakdown
    };
  }

  // Get today's stats
  static async getTodayStats(today) {
    try {
      // Get today's new subscriptions
      const newSubsSql = `
        SELECT COUNT(DISTINCT us.user_id) as new_subscriptions_today
        FROM user_subscriptions us
        WHERE DATE(us.created_at) = ?
      `;
      const [newSubsResult] = await query(newSubsSql, [today]);

      // Get today's payment stats
      const paymentSql = `
        SELECT 
          COUNT(DISTINCT pt.user_id) as paying_customers_today,
          COALESCE(SUM(pt.amount), 0) as revenue_today,
          COUNT(DISTINCT pt.id) as transactions_today
        FROM payment_transactions pt
        WHERE DATE(pt.created_at) = ? AND pt.status = 'completed'
      `;
      const [paymentResult] = await query(paymentSql, [today]);

      // Get today's cancellations
      const cancelSql = `
        SELECT COUNT(DISTINCT us.user_id) as cancellations_today
        FROM user_subscriptions us
        WHERE DATE(us.cancelled_at) = ? AND us.status = 'cancelled'
      `;
      const [cancelResult] = await query(cancelSql, [today]);

      return {
        new_subscriptions: newSubsResult.new_subscriptions_today || 0,
        paying_customers: paymentResult.paying_customers_today || 0,
        revenue: parseFloat(paymentResult.revenue_today) || 0,
        transactions: paymentResult.transactions_today || 0,
        cancellations: cancelResult.cancellations_today || 0
      };
    } catch (error) {
      console.error('Error in getTodayStats:', error);
      return {
        new_subscriptions: 0,
        paying_customers: 0,
        revenue: 0,
        transactions: 0,
        cancellations: 0
      };
    }
  }

  // Get today's revenue breakdown
  static async getTodayRevenueBreakdown(today) {
    const sql = `
      SELECT 
        pt.provider,
        COUNT(DISTINCT pt.id) as transaction_count,
        COALESCE(SUM(pt.amount), 0) as total_amount,
        COUNT(DISTINCT pt.user_id) as unique_customers
      FROM payment_transactions pt
      WHERE DATE(pt.created_at) = ? AND pt.status = 'completed'
      GROUP BY pt.provider
      ORDER BY total_amount DESC
    `;

    try {
      const results = await query(sql, [today]);
      return results.map(row => ({
        provider: row.provider,
        transaction_count: row.transaction_count || 0,
        total_amount: parseFloat(row.total_amount) || 0,
        unique_customers: row.unique_customers || 0
      }));
    } catch (error) {
      console.error('Error in getTodayRevenueBreakdown:', error);
      return [];
    }
  }

  static async getWeeklyTrends() {
    const sql = `
      SELECT 
        DATE(pt.created_at) as date,
        COUNT(DISTINCT pt.user_id) as daily_customers,
        COALESCE(SUM(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE 0 END), 0) as daily_revenue,
        COUNT(DISTINCT pt.id) as daily_transactions
      FROM payment_transactions pt
      WHERE pt.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
      GROUP BY DATE(pt.created_at)
      ORDER BY date ASC
    `;

    try {
      const results = await query(sql);
      return results.map(row => ({
        date: row.date,
        customers: row.daily_customers || 0,
        revenue: parseFloat(row.daily_revenue) || 0,
        transactions: row.daily_transactions || 0
      }));
    } catch (error) {
      console.error('Error in getWeeklyTrends:', error);
      return [];
    }
  }

  static async getActiveSubscribersNow() {
    const sql = `
      SELECT COUNT(DISTINCT user_id) as active_count
      FROM user_subscriptions 
      WHERE status = 'active' 
        AND start_date <= UTC_TIMESTAMP() 
        AND end_date > UTC_TIMESTAMP()
    `;

    try {
      const [result] = await query(sql);
      return result.active_count || 0;
    } catch (error) {
      console.error('Error in getActiveSubscribersNow:', error);
      return 0;
    }
  }

  // Helper function to fill missing dates in time series data
  static fillMissingDates(data, startDate, endDate, defaultValue = {}) {
    const dateMap = new Map();
    data.forEach(item => {
      dateMap.set(item.date, item);
    });

    const filledData = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      filledData.push({
        date: dateStr,
        ...defaultValue,
        ...(dateMap.get(dateStr) || {})
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledData;
  }

  // Get real-time dashboard metrics
  static async getRealTimeMetrics(req, res) {
    try {
      const realTimeData = await SubscriptionAnalyticsController.getRealTimeData();

      res.status(200).json({
        success: true,
        data: realTimeData
      });

    } catch (error) {
      console.error('❌ Error fetching real-time metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch real-time metrics',
        error: error.message
      });
    }
  }
}

module.exports = SubscriptionAnalyticsController;