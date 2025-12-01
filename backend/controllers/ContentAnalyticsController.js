// controllers/contentAnalyticsController.js
const { query } = require("../config/dbConfig");

// Get content analytics
const getContentAnalytics = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { timeRange = '7d' } = req.query;

    // Calculate date ranges based on timeRange
    const dateRanges = {
      '24h': { current: '1 DAY', previous: '2 DAY' },
      '7d': { current: '7 DAY', previous: '14 DAY' },
      '30d': { current: '30 DAY', previous: '60 DAY' },
      '90d': { current: '90 DAY', previous: '180 DAY' },
      '1y': { current: '1 YEAR', previous: '2 YEAR' }
    };

    const dateRange = dateRanges[timeRange] || dateRanges['7d'];

    // Get overview metrics
    const overview = await getOverviewMetrics(contentId, dateRange);
    
    // Get trends data
    const trends = await getTrendsData(contentId, dateRange, timeRange);
    
    // Get demographics
    const demographics = await getDemographicsData(contentId, dateRange);
    
    // Get device data
    const devices = await getDeviceData(contentId, dateRange);
    
    // Get engagement metrics
    const engagement = await getEngagementData(contentId, dateRange);
    
    // Get insights
    const insights = await getInsightsData(contentId, dateRange);
    
    // Get ratings data
    const ratings = await getRatingsData(contentId);
    
    // Get retention data
    const retention = await getRetentionData(contentId, dateRange);
    
    // Get revenue data
    const revenue = await getRevenueData(contentId, dateRange);

    const analyticsData = {
      overview,
      trends,
      demographics,
      devices,
      engagement,
      insights,
      ratings,
      retention,
      revenue
    };

    res.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Error fetching content analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch analytics data'
    });
  }
};

// Helper functions for each analytics section
const getOverviewMetrics = async (contentId, dateRange) => {
  const [result] = await query(`
    SELECT 
      COUNT(*) as totalViews,
      COUNT(DISTINCT user_id) as uniqueViewers,
      AVG(watch_duration_seconds) as avgWatchTimeSeconds,
      AVG(percentage_watched) as completionRate,
      COUNT(DISTINCT CASE WHEN percentage_watched >= 75 THEN user_id END) as engagedViewers
    FROM content_view_history 
    WHERE content_id = ?
  `, [contentId]);

  // Get current period stats - build SQL with interval directly
  const currentPeriodQuery = `
    SELECT 
      COUNT(*) as periodViews,
      COUNT(DISTINCT user_id) as periodViewers,
      AVG(watch_duration_seconds) as periodWatchTime
    FROM content_view_history 
    WHERE content_id = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [currentPeriod] = await query(currentPeriodQuery, [contentId]);

  // Get previous period stats for trend calculation
  const previousPeriodQuery = `
    SELECT 
      COUNT(*) as previousViews,
      COUNT(DISTINCT user_id) as previousViewers,
      AVG(watch_duration_seconds) as previousWatchTime
    FROM content_view_history 
    WHERE content_id = ?
    AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL ${dateRange.previous}) AND DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [previousPeriod] = await query(previousPeriodQuery, [contentId]);

  const prev = previousPeriod || {};
  const current = currentPeriod || {};

  return {
    totalViews: result.totalViews || 0,
    uniqueViewers: result.uniqueViewers || 0,
    avgWatchTimeSeconds: result.avgWatchTimeSeconds || 0,
    completionRate: result.completionRate || 0,
    engagementScore: result.engagedViewers ? Math.round((result.engagedViewers / result.uniqueViewers) * 100) : 0,
    estimatedRevenue: (result.totalViews || 0) * 0.05,
    viewsTrend: prev.previousViews ? calculateTrend(current.periodViews, prev.previousViews) : 0,
    viewersTrend: prev.previousViewers ? calculateTrend(current.periodViewers, prev.previousViewers) : 0,
    watchTimeTrend: prev.previousWatchTime ? calculateTrend(current.periodWatchTime, prev.previousWatchTime) : 0,
    completionTrend: 0
  };
};

const getTrendsData = async (contentId, dateRange, timeRange) => {
  let groupBy;
  let dateFormat;
  
  switch (timeRange) {
    case '24h':
      groupBy = 'HOUR';
      dateFormat = '%H:00';
      break;
    case '7d':
      groupBy = 'DAY';
      dateFormat = '%Y-%m-%d';
      break;
    case '30d':
      groupBy = 'DAY';
      dateFormat = '%Y-%m-%d';
      break;
    case '90d':
      groupBy = 'WEEK';
      dateFormat = '%Y-%u';
      break;
    case '1y':
      groupBy = 'MONTH';
      dateFormat = '%Y-%m';
      break;
    default:
      groupBy = 'DAY';
      dateFormat = '%Y-%m-%d';
  }

  const viewsDataQuery = `
    SELECT 
      DATE_FORMAT(created_at, ?) as period,
      COUNT(*) as views
    FROM content_view_history 
    WHERE content_id = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
    GROUP BY period
    ORDER BY created_at
  `;
  const viewsData = await query(viewsDataQuery, [dateFormat, contentId]);

  const engagementDataQuery = `
    SELECT 
      DATE_FORMAT(created_at, ?) as period,
      AVG(percentage_watched) as engagement
    FROM content_view_history 
    WHERE content_id = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
    GROUP BY period
    ORDER BY created_at
  `;
  const engagementData = await query(engagementDataQuery, [dateFormat, contentId]);

  return {
    views: viewsData.map(row => row.views),
    engagement: engagementData.map(row => Math.round(row.engagement || 0)),
    revenue: viewsData.map(row => row.views * 0.05),
    labels: viewsData.map(row => row.period)
  };
};

const getDemographicsData = async (contentId, dateRange) => {
  const demographicsQuery = `
    SELECT 
      COALESCE(us.location, 'Unknown') as country,
      COUNT(DISTINCT cvh.user_id) as viewers,
      ROUND((COUNT(DISTINCT cvh.user_id) * 100.0 / (
        SELECT COUNT(DISTINCT user_id) 
        FROM content_view_history 
        WHERE content_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
      )), 1) as percentage
    FROM content_view_history cvh
    LEFT JOIN user_session us ON cvh.user_id = us.user_id 
      AND us.last_activity = (
        SELECT MAX(last_activity) 
        FROM user_session us2 
        WHERE us2.user_id = cvh.user_id
      )
    WHERE cvh.content_id = ?
    AND cvh.created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
    GROUP BY country
    ORDER BY viewers DESC
    LIMIT 10
  `;
  const demographics = await query(demographicsQuery, [contentId, contentId]);

  return demographics;
};

const getDeviceData = async (contentId, dateRange) => {
  const devicesQuery = `
    SELECT 
      COALESCE(device_type, 'Unknown') as device,
      COUNT(*) as views,
      ROUND((COUNT(*) * 100.0 / (
        SELECT COUNT(*) 
        FROM content_view_history 
        WHERE content_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
      )), 1) as percentage
    FROM content_view_history 
    WHERE content_id = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
    GROUP BY device_type
    ORDER BY views DESC
  `;
  const devices = await query(devicesQuery, [contentId, contentId]);

  return devices;
};

const getEngagementData = async (contentId, dateRange) => {
  const likesQuery = `
    SELECT COUNT(*) as count
    FROM user_likes 
    WHERE content_id = ? 
    AND is_active = TRUE
    AND liked_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [likes] = await query(likesQuery, [contentId]);

  const sharesQuery = `
    SELECT COUNT(*) as count
    FROM content_shares 
    WHERE content_id = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [shares] = await query(sharesQuery, [contentId]);

  const watchlistQuery = `
    SELECT COUNT(*) as count
    FROM user_watchlist 
    WHERE content_id = ?
    AND added_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [watchlist] = await query(watchlistQuery, [contentId]);

  const commentsQuery = `
    SELECT COUNT(*) as count
    FROM content_ratings 
    WHERE content_id = ?
    AND review_text IS NOT NULL
    AND review_text != ''
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [comments] = await query(commentsQuery, [contentId]);

  return {
    likes: likes?.count || 0,
    shares: shares?.count || 0,
    watchlistAdds: watchlist?.count || 0,
    comments: comments?.count || 0
  };
};

const getInsightsData = async (contentId, dateRange) => {
  const insightsQuery = `
    SELECT 
      AVG(watch_duration_seconds) as avgSessionDuration,
      AVG(percentage_watched) as completionRate,
      COUNT(DISTINCT user_id) as uniqueViewers,
      COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN user_id END) as returningViewers
    FROM content_view_history 
    WHERE content_id = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [sessionData] = await query(insightsQuery, [contentId]);

  const returnViewerRate = sessionData?.uniqueViewers > 0 
    ? Math.round((sessionData.returningViewers / sessionData.uniqueViewers) * 100)
    : 0;

  return {
    completionRate: Math.round(sessionData?.completionRate || 0),
    avgSessionDuration: formatDuration(sessionData?.avgSessionDuration || 0),
    returnViewerRate: `${returnViewerRate}%`,
    socialEngagement: '0%'
  };
};

const getRatingsData = async (contentId) => {
  const ratings = await query(`
    SELECT 
      rating,
      COUNT(*) as count
    FROM content_ratings 
    WHERE content_id = ?
    GROUP BY rating
    ORDER BY rating DESC
  `, [contentId]);

  const fiveStar = ratings.find(r => r.rating === 5)?.count || 0;

  return {
    fiveStar,
    distribution: ratings
  };
};

const getRetentionData = async (contentId, dateRange) => {
  const retentionQuery = `
    SELECT 
      MAX(
        (SELECT COUNT(DISTINCT user_id) 
         FROM content_view_history 
         WHERE content_id = ? 
         AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
         AND HOUR(created_at) = HOUR(NOW())
        )
      ) as peakConcurrent,
      AVG(
        CASE WHEN percentage_watched < 20 THEN 1 ELSE 0 END
      ) * 100 as bounceRate,
      AVG(
        CASE WHEN percentage_watched >= 90 THEN 1 ELSE 0 END
      ) * 100 as completionRate
    FROM content_view_history 
    WHERE content_id = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [retention] = await query(retentionQuery, [contentId, contentId]);

  return {
    peakConcurrent: retention?.peakConcurrent || 0,
    bounceRate: `${Math.round(retention?.bounceRate || 0)}%`,
    avgDropOff: '25%',
    completionRate: `${Math.round(retention?.completionRate || 0)}%`
  };
};

const getRevenueData = async (contentId, dateRange) => {
  const revenueQuery = `
    SELECT 
      COUNT(*) as totalViews,
      AVG(watch_duration_seconds) as avgWatchTime
    FROM content_view_history 
    WHERE content_id = ?
    AND created_at >= DATE_SUB(NOW(), INTERVAL ${dateRange.current})
  `;
  const [revenue] = await query(revenueQuery, [contentId]);

  const totalRevenue = (revenue?.totalViews || 0) * 0.05;
  const perView = revenue?.totalViews > 0 ? totalRevenue / revenue.totalViews : 0;
  const projectedMonthly = totalRevenue * 30;

  return {
    total: totalRevenue,
    perView: perView,
    projectedMonthly: projectedMonthly
  };
};

// Helper functions
const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

module.exports = {
  getContentAnalytics
};