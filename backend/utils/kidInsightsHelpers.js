const { query } = require("../config/dbConfig");

/**
 * Group data by category
 */
const groupByCategory = (data, field = 'category') => {
  const grouped = {};
  data.forEach(item => {
    const category = item[field] || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = {
        name: category,
        count: 0,
        total_time: 0,
        items: []
      };
    }
    grouped[category].count++;
    grouped[category].total_time += item.duration_seconds || 0;
    grouped[category].items.push(item);
  });
  
  return Object.values(grouped).sort((a, b) => b.count - a.count);
};

/**
 * Group by time of day
 */
const groupByTimeOfDay = (sessions) => {
  const periods = {
    'Morning (6-12)': 0,
    'Afternoon (12-18)': 0,
    'Evening (18-22)': 0,
    'Night (22-6)': 0
  };
  
  sessions.forEach(session => {
    const hour = new Date(session.login_time).getHours();
    if (hour >= 6 && hour < 12) periods['Morning (6-12)']++;
    else if (hour >= 12 && hour < 18) periods['Afternoon (12-18)']++;
    else if (hour >= 18 && hour < 22) periods['Evening (18-22)']++;
    else periods['Night (22-6)']++;
  });
  
  return Object.entries(periods).map(([period, count]) => ({
    period,
    count,
    percentage: Math.round((count / sessions.length) * 100) || 0
  }));
};

/**
 * Calculate engagement score
 */
const calculateEngagementScore = (sessionData, watchtimeAnalysis) => {
  if (!sessionData || !watchtimeAnalysis) return 50;
  
  const factors = [
    sessionData.total_sessions > 10 ? 20 : 10,
    sessionData.average_session_minutes > 15 ? 20 : 10,
    watchtimeAnalysis.compliance_with_limits?.compliance_rate > 80 ? 30 : 15,
    watchtimeAnalysis.trends?.trend === 'stable' ? 20 : 10,
    sessionData.session_patterns?.consistency > 70 ? 10 : 5
  ];
  
  return Math.min(100, factors.reduce((sum, factor) => sum + factor, 0));
};

/**
 * Analyze content preferences
 */
const analyzeContentPreferences = (contentData) => {
  const preferences = {
    favorite_genres: [],
    favorite_categories: [],
    preferred_content_types: [],
    completion_rates: {},
    watch_patterns: {}
  };
  
  // Analyze genres
  const genreMap = {};
  contentData.forEach(item => {
    if (item.genres) {
      item.genres.split(',').forEach(genre => {
        genre = genre.trim();
        if (!genreMap[genre]) genreMap[genre] = 0;
        genreMap[genre]++;
      });
    }
  });
  
  preferences.favorite_genres = Object.entries(genreMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));
  
  // Analyze completion rates by content type
  const completionByType = {};
  contentData.forEach(item => {
    const type = item.content_type || 'unknown';
    if (!completionByType[type]) {
      completionByType[type] = { total: 0, sum: 0, count: 0 };
    }
    completionByType[type].sum += item.percentage_watched || 0;
    completionByType[type].count++;
  });
  
  preferences.completion_rates = Object.entries(completionByType).map(([type, data]) => ({
    type,
    average_completion: Math.round(data.sum / data.count)
  }));
  
  return preferences;
};

/**
 * Get recent high scores
 */
const getRecentHighScores = async (kidId, limit = 10) => {
  return await query(
    `SELECT gsc.*, g.title as game_title, g.icon_emoji
     FROM game_scores gsc
     JOIN games g ON gsc.game_id = g.id
     WHERE gsc.kid_profile_id = ? 
       AND gsc.is_high_score = TRUE
     ORDER BY gsc.created_at DESC
     LIMIT ?`,
    [kidId, limit]
  );
};

/**
 * Analyze skill development
 */
const analyzeSkillDevelopment = (gamesData) => {
  const skillMap = {};
  
  gamesData.forEach(game => {
    if (game.skills_developed) {
      game.skills_developed.split(',').forEach(skill => {
        skill = skill.trim();
        if (!skillMap[skill]) {
          skillMap[skill] = {
            skill,
            games: [],
            total_playtime: 0,
            average_score: 0
          };
        }
        skillMap[skill].games.push(game.title);
        skillMap[skill].total_playtime += (game.total_playtime_seconds || 0);
        skillMap[skill].average_score = Math.max(
          skillMap[skill].average_score,
          game.avg_score || 0
        );
      });
    }
  });
  
  return Object.values(skillMap)
    .sort((a, b) => b.total_playtime - a.total_playtime)
    .slice(0, 10);
};

/**
 * Combine daily data from different sources
 */
const combineDailyData = (contentData, gameData) => {
  const dateMap = {};
  
  // Process content data
  contentData.forEach(item => {
    const date = item.date;
    if (!dateMap[date]) {
      dateMap[date] = {
        date,
        content_minutes: 0,
        game_minutes: 0,
        total_sessions: 0
      };
    }
    dateMap[date].content_minutes += Math.round(item.total_seconds / 60);
    dateMap[date].total_sessions += item.session_count;
  });
  
  // Process game data
  gameData.forEach(item => {
    const date = item.date;
    if (!dateMap[date]) {
      dateMap[date] = {
        date,
        content_minutes: 0,
        game_minutes: 0,
        total_sessions: 0
      };
    }
    dateMap[date].game_minutes += Math.round(item.total_seconds / 60);
    dateMap[date].total_sessions += item.session_count;
  });
  
  // Convert to array and sort
  return Object.values(dateMap)
    .map(day => ({
      ...day,
      total_minutes: day.content_minutes + day.game_minutes
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Analyze watchtime trends
 */
const analyzeWatchtimeTrends = (dailyData) => {
  if (dailyData.length < 2) return { trend: 'insufficient_data' };
  
  const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
  const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, day) => sum + day.total_minutes, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, day) => sum + day.total_minutes, 0) / secondHalf.length;
  
  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (Math.abs(percentChange) < 10) return { trend: 'stable', change: percentChange };
  if (percentChange > 0) return { trend: 'increasing', change: percentChange };
  return { trend: 'decreasing', change: percentChange };
};

module.exports = {
  groupByCategory,
  groupByTimeOfDay,
  calculateEngagementScore,
  analyzeContentPreferences,
  getRecentHighScores,
  analyzeSkillDevelopment,
  combineDailyData,
  analyzeWatchtimeTrends
};