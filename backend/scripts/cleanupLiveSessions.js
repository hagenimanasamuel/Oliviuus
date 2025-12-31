// scripts/cleanupLiveSessions.js
const { query } = require('../config/dbConfig');

const cleanupExpiredSessions = async () => {
  try {
    // Mark expired sessions as inactive
    const result = await query(`
      UPDATE live_presence 
      SET is_active = FALSE,
          disconnected_at = NOW()
      WHERE expires_at < NOW() 
      AND is_active = TRUE
    `);

    console.log(`Cleaned up ${result.affectedRows} expired sessions at ${new Date().toISOString()}`);

    // Take snapshot of current stats
    const currentStats = await query(`
      SELECT 
        COUNT(*) as total_live_users,
        COUNT(CASE WHEN user_type = 'authenticated' THEN 1 END) as authenticated_users,
        COUNT(CASE WHEN user_type = 'anonymous' THEN 1 END) as anonymous_users,
        COUNT(CASE WHEN user_type = 'kid_profile' THEN 1 END) as kid_profiles,
        COUNT(CASE WHEN user_type = 'family_member' THEN 1 END) as family_members,
        COUNT(CASE WHEN session_type = 'viewing' THEN 1 END) as viewing_users,
        COUNT(CASE WHEN session_type = 'browsing' THEN 1 END) as browsing_users,
        COUNT(CASE WHEN session_type = 'idle' THEN 1 END) as idle_users,
        COUNT(CASE WHEN device_type = 'web' THEN 1 END) as web_users,
        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_users,
        COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_users,
        COUNT(CASE WHEN device_type = 'smarttv' THEN 1 END) as smarttv_users,
        COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_users,
        COUNT(CASE WHEN content_type = 'movie' THEN 1 END) as watching_movies,
        COUNT(CASE WHEN content_type = 'series' THEN 1 END) as watching_series,
        COUNT(CASE WHEN content_type = 'game' THEN 1 END) as playing_games,
        COUNT(DISTINCT country_code) as countries_count,
        JSON_ARRAYAGG(
          JSON_OBJECT('country', country_code, 'users', COUNT(*))
        ) as top_countries,
        AVG(bandwidth_estimate) as avg_bandwidth,
        AVG(network_latency) as avg_latency,
        AVG(CASE WHEN buffering_count > 0 THEN 1 ELSE 0 END) as avg_buffer_ratio,
        AVG(total_watch_time_seconds) / 60 as avg_watch_time_minutes,
        0 as peak_concurrent_users
      FROM live_presence 
      WHERE is_active = TRUE 
      AND expires_at > NOW()
      GROUP BY DATE(NOW())
    `);

    if (currentStats[0]) {
      await query(`
        INSERT INTO live_stats_snapshots (
          total_live_users,
          authenticated_users,
          anonymous_users,
          kid_profiles,
          family_members,
          viewing_users,
          browsing_users,
          idle_users,
          web_users,
          mobile_users,
          tablet_users,
          smarttv_users,
          desktop_users,
          watching_movies,
          watching_series,
          playing_games,
          countries_count,
          top_countries,
          avg_bandwidth,
          avg_latency,
          avg_buffer_ratio,
          avg_watch_time_minutes,
          peak_concurrent_users,
          snapshot_type,
          time_bucket
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'hourly', NOW())
      `, Object.values(currentStats[0]));
    }

  } catch (error) {
    console.error('Error in cleanup script:', error);
  }
};

// Run if called directly
if (require.main === module) {
  cleanupExpiredSessions();
}

module.exports = cleanupExpiredSessions;