const { query } = require("../config/dbConfig");

// Universal trending algorithm configuration
const TRENDING_CONFIG = {
  weights: {
    viewCount: 0.35,
    recentViews: 0.30,
    engagementRate: 0.20,
    likeRatio: 0.10,
    ratingScore: 0.05,
  },
  
  timeWindows: {
    recentViews: 7,
    engagement: 30,
  },
  
  thresholds: {
    minViews: 1,
    minRecentViews: 0,
    minCompletionRate: 0,
  },
  
  queryLimits: {
    initialFetch: 50,
    maxResults: 20,
  }
};

// Cache system
const trendingCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

// Cache cleanup every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of trendingCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 6) {
      trendingCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

// Universal trending score calculation
const calculateTrendingScore = (content) => {
  try {
    let score = 0;
    
    // 1. View Count Score (35%)
    const normalizedViews = Math.log10(content.total_views + 1) / Math.log10(100);
    const viewScore = Math.min(normalizedViews, 1) * TRENDING_CONFIG.weights.viewCount;
    score += viewScore;
    
    // 2. Recent Views Score (30%)
    const recentViewScore = Math.min(content.recent_views_7d / 10, 1) * TRENDING_CONFIG.weights.recentViews;
    score += recentViewScore;
    
    // 3. Engagement Rate Score (20%)
    const engagementScore = Math.min((content.avg_completion_rate || 0) / 100, 1) * TRENDING_CONFIG.weights.engagementRate;
    score += engagementScore;
    
    // 4. Like Ratio Score (10%)
    const likeRatio = content.total_views > 0 ? (content.like_count / content.total_views) : 0;
    const likeScore = Math.min(likeRatio * 10, 1) * TRENDING_CONFIG.weights.likeRatio;
    score += likeScore;
    
    // 5. Rating Score (5%)
    const ratingWeight = Math.min((content.rating_count || 0) / 5, 1);
    const ratingScore = Math.min((content.average_rating || 0) / 5, 1) * TRENDING_CONFIG.weights.ratingScore * ratingWeight;
    score += ratingScore;
    
    // Manual trending boost
    if (content.is_trending) {
      score += 0.3;
    }
    
    // Time decay
    const contentAgeDays = Math.max(1, Math.floor((new Date() - new Date(content.release_date || content.created_at)) / (1000 * 60 * 60 * 24)));
    const timeDecay = calculateTimeDecay(contentAgeDays);
    
    const finalScore = score * timeDecay;
    
    return Math.max(0.1, Math.min(1, finalScore));
    
  } catch (error) {
    console.error('Error calculating trending score for content:', content.id, error);
    return 0.1;
  }
};

// Time decay calculation
const calculateTimeDecay = (ageInDays) => {
  if (ageInDays <= 7) return 1.0;
  if (ageInDays <= 30) return 0.9;
  if (ageInDays <= 90) return 0.8;
  if (ageInDays <= 365) return 0.7;
  return 0.6;
};

// Main function to get trending movies
const getTrendingMovies = async (req, res) => {
  try {
    const { 
      limit = 12, 
      refresh = false,
      min_score = 0.01
    } = req.query;
    
    const validatedLimit = Math.min(Math.max(parseInt(limit), 1), TRENDING_CONFIG.queryLimits.maxResults);
    const validatedMinScore = Math.min(Math.max(parseFloat(min_score), 0), 1);
    
    const cacheKey = `trending:${validatedLimit}:${validatedMinScore}`;
    const cachedData = trendingCache.get(cacheKey);
    
    if (!refresh && cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      return res.json({
        success: true,
        data: cachedData.data,
        cached: true,
        timestamp: cachedData.timestamp,
        algorithm: 'universal'
      });
    }
    
    const trendingContent = await getUniversalTrendingContent(validatedLimit);
    
    // Filter by minimum score
    const filteredContent = trendingContent.filter(content => 
      content.trending_score >= validatedMinScore
    );
    
    // Cache the results
    trendingCache.set(cacheKey, {
      data: filteredContent,
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      data: filteredContent,
      cached: false,
      timestamp: Date.now(),
      algorithm: 'universal',
      count: filteredContent.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching trending movies:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch trending content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Universal trending algorithm
const getUniversalTrendingContent = async (limit = 12) => {
  try {
    const sql = `
      SELECT 
        c.*,
        
        -- Core metrics
        c.view_count as total_views,
        c.like_count,
        c.share_count,
        c.average_rating,
        c.rating_count,
        
        -- Recent views (last 7 days)
        COALESCE((
          SELECT COUNT(*) 
          FROM content_view_history cvh
          WHERE cvh.content_id = c.id 
            AND cvh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ), 0) as recent_views_7d,
        
        -- Average completion rate
        COALESCE((
          SELECT AVG(percentage_watched) 
          FROM content_view_history cvh
          WHERE cvh.content_id = c.id
        ), 0) as avg_completion_rate,
        
        -- Manual trending flag
        (c.trending = TRUE OR c.trending = 1) as is_trending,
        
        -- Genres
        GROUP_CONCAT(DISTINCT g.name) as genre_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        
        -- Categories
        GROUP_CONCAT(DISTINCT cat.name) as category_names,
        GROUP_CONCAT(DISTINCT cat.id) as category_ids,
        
        -- Primary image
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC, ma.created_at DESC
          LIMIT 1
        ) as primary_image_url,
        
        -- Content age
        DATEDIFF(NOW(), COALESCE(c.release_date, c.created_at)) as content_age_days
        
      FROM contents c
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
        AND c.content_type IN ('movie', 'series')
        
      GROUP BY c.id
      HAVING total_views >= 0
      ORDER BY 
        is_trending DESC,
        recent_views_7d DESC, 
        total_views DESC,
        c.created_at DESC
      LIMIT ?
    `;
    
    const results = await query(sql, [
      process.env.R2_PUBLIC_URL_ID,
      TRENDING_CONFIG.queryLimits.initialFetch
    ]);
    
    if (!results || results.length === 0) {
      return [];
    }
    
    // Calculate trending scores for ALL content
    const scoredContent = results.map(content => {
      const trendingScore = calculateTrendingScore(content);
      return {
        ...content,
        trending_score: parseFloat(trendingScore.toFixed(4)),
        trending_rank: 0
      };
    });
    
    // Sort by trending score (descending)
    scoredContent.sort((a, b) => b.trending_score - a.trending_score);
    
    // Return limited results
    return scoredContent.slice(0, limit).map((content, index) => ({
      ...content,
      trending_rank: index + 1,
      genres: content.genre_names ? content.genre_names.split(',').map((name, idx) => ({
        id: content.genre_ids ? content.genre_ids.split(',')[idx] : idx + 1,
        name: name.trim()
      })) : [],
      categories: content.category_names ? content.category_names.split(',').map((name, idx) => ({
        id: content.category_ids ? content.category_ids.split(',')[idx] : idx + 1,
        name: name.trim()
      })) : []
    }));
    
  } catch (error) {
    console.error('❌ Error in getUniversalTrendingContent:', error);
    throw new Error('Failed to fetch trending content');
  }
};

// Get trending insights
const getTrendingInsights = async (req, res) => {
  try {
    const insights = await query(`
      SELECT 
        (SELECT COUNT(*) FROM contents WHERE status = 'published' AND visibility = 'public') as total_content,
        (SELECT COUNT(*) FROM contents WHERE status = 'published' AND visibility = 'public' AND trending = TRUE) as manually_trending,
        (SELECT COUNT(*) FROM contents WHERE status = 'published' AND visibility = 'public' AND content_type = 'movie') as movie_count,
        (SELECT COUNT(*) FROM contents WHERE status = 'published' AND visibility = 'public' AND content_type = 'series') as series_count,
        (SELECT SUM(view_count) FROM contents) as total_views,
        (SELECT COUNT(*) FROM content_view_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as views_7d,
        (SELECT COUNT(DISTINCT user_id) FROM content_view_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_users_7d
    `);
    
    res.json({
      success: true,
      data: insights[0] || {},
      last_updated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching trending insights:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch trending insights'
    });
  }
};

// Health check
const getHealth = async (req, res) => {
  try {
    const dbTest = await query("SELECT 1 as test");
    const contentCount = await query("SELECT COUNT(*) as count FROM contents WHERE status = 'published' AND visibility = 'public'");
    const publishedCount = contentCount[0]?.count || 0;
    
    res.json({
      success: true,
      status: "healthy",
      database: "connected",
      published_content: publishedCount,
      cache_size: trendingCache.size,
      algorithm: "universal"
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: "Service unavailable"
    });
  }
};

module.exports = {
  getTrendingMovies,
  getTrendingInsights,
  getHealth,
  calculateTrendingScore,
  TRENDING_CONFIG
};