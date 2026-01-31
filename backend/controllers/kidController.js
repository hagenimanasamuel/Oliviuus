// controllers/kidController.js
const { query } = require("../config/dbConfig");

// Cache configuration for kid content
const kidCacheConfig = {
  landingContent: 10 * 60 * 1000, // 10 minutes
  contentList: 5 * 60 * 1000,    // 5 minutes
  singleContent: 2 * 60 * 1000,  // 2 minutes
};

// In-memory cache for kid content
const kidContentCache = new Map();

// Generate cache keys for kid content
const generateKidCacheKey = (type, identifier = '', kidProfileId = '') => {
  return `kid:${type}:${identifier}:profile_${kidProfileId}`;
};

// Check if cache is stale
const isCacheStale = (cacheEntry, cacheDuration) => {
  if (!cacheEntry || !cacheEntry.timestamp) return true;
  return Date.now() - cacheEntry.timestamp > cacheDuration;
};

// Clear related kid cache entries
const clearKidRelatedCache = (contentId = null, kidProfileId = '') => {
  const keysToDelete = [];

  for (const key of kidContentCache.keys()) {
    if (key.includes(`profile_${kidProfileId}`) ||
      (contentId && key.includes(contentId))) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => kidContentCache.delete(key));
  console.log(`Cleared ${keysToDelete.length} kid cache entries`);
};

// Safe data parsing function
const safeDataParse = (dataString, defaultValue = []) => {
  if (!dataString) return defaultValue;

  if (Array.isArray(dataString)) return dataString;
  if (typeof dataString === 'object') return dataString;
  if (typeof dataString !== 'string') return defaultValue;

  try {
    const parsed = JSON.parse(dataString);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (jsonError) {
    try {
      if (dataString.includes(',')) {
        return dataString.split(',').map(item => item.trim()).filter(item => item);
      }
      return [dataString.trim()];
    } catch (error) {
      console.error('Data parse error:', error);
      return defaultValue;
    }
  }
};

// Age rating system for kids
// Kids only see content rated "all", "G", "TV-Y", "TV-Y7", "TV-G", "PG" (for older kids)
const KID_ALLOWED_AGE_RATINGS = [
  'all',        // For all ages
  'G',          // General Audience
  'TV-Y',       // All Children
  'TV-Y7',      // Older Children (7+)
  'TV-G',       // General Audience
  'PG',         // Parental Guidance (for older kids)
  '1+','2+','3+','4+','5+','6+','7+', '8+', '9+', '10+', '11+', '12+', '13+', '14+' // Custom age ratings
];

// Blocked age ratings for kids (never show these)
const KID_BLOCKED_AGE_RATINGS = [
  'TV-14',
  'TV-MA',
  'R',
  'NC-17',
  '18+',
  '16+',
  '15+',
  '14+',
  '13+',
  'MA'
];

// Educational/Learning content detection
const EDUCATIONAL_CATEGORIES = [
  'Educational',
  'Documentary',
  'Science',
  'History',
  'Nature',
  'Learning',
  'Education'
];

const EDUCATIONAL_GENRES = [
  'Educational',
  'Documentary',
  'Science',
  'History',
  'Nature',
  'Learning'
];

const EDUCATIONAL_KEYWORDS = [
  'learn',
  'education',
  'educational',
  'science',
  'history',
  'nature',
  'documentary',
  'school',
  'study',
  'knowledge'
];

// Fun/Entertainment content detection
const FUN_CATEGORIES = [
  'Animation',
  'Comedy',
  'Adventure',
  'Fantasy',
  'Family',
  'Kids',
  'Music',
  'Sports',
  'Action',
  'Fun'
];

const FUN_GENRES = [
  'Animation',
  'Comedy',
  'Adventure',
  'Fantasy',
  'Family',
  'Kids',
  'Music',
  'Sports',
  'Action'
];

// Educational categories and genres for learning page
const EDUCATIONAL_CATEGORIES_FULL = [
  'Educational', 'Documentary', 'Science', 'History',
  'Nature', 'Learning', 'Education', 'Technology',
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Geography', 'Language', 'Literature', 'Art',
  'Music', 'Crafts', 'Cooking', 'Sports'
];

const EDUCATIONAL_GENRES_FULL = [
  'Educational', 'Documentary', 'Science', 'History',
  'Nature', 'Learning', 'Technology', 'Mathematics',
  'Physics', 'Chemistry', 'Biology', 'Geography',
  'Language', 'Literature', 'Art', 'Music',
  'Crafts', 'Cooking', 'Sports'
];

// Filter and sanitize content for kids
const sanitizeKidContent = (content) => {
  return {
    id: content.id,
    title: content.title,
    content_type: content.content_type,
    description: content.short_description || content.description,
    short_description: content.short_description,
    duration_minutes: content.duration_minutes,
    release_date: content.release_date,
    age_rating: content.age_rating,
    average_rating: content.average_rating,
    view_count: content.view_count,
    is_featured: content.featured,
    is_trending: content.trending,
    kid_safe: true,
    media_assets: content.media_assets || [],
    genres: content.genres || [],
    categories: content.categories || [],
    trailer: content.trailer || null,
    primary_image_url: content.primary_image_url,
    // Add educational/fun flags for frontend
    is_educational: content.is_educational || false,
    is_fun: content.is_fun || false
  };
};

// Check if content is educational
const isContentEducational = (content) => {
  try {
    // Check categories
    if (content.category_names) {
      const categories = content.category_names.split(',').map(c => c.trim().toLowerCase());
      if (EDUCATIONAL_CATEGORIES.some(cat =>
        categories.includes(cat.toLowerCase())
      )) {
        return true;
      }
    }

    // Check genres
    if (content.genre_names) {
      const genres = content.genre_names.split(',').map(g => g.trim().toLowerCase());
      if (EDUCATIONAL_GENRES.some(genre =>
        genres.includes(genre.toLowerCase())
      )) {
        return true;
      }
    }

    // Check title and description for educational keywords
    const searchText = (content.title + ' ' + (content.description || '') + ' ' + (content.short_description || '')).toLowerCase();

    return EDUCATIONAL_KEYWORDS.some(keyword =>
      searchText.includes(keyword.toLowerCase())
    );
  } catch (error) {
    console.error('Error checking educational content:', error);
    return false;
  }
};

// Check if content is fun/entertainment
const isContentFun = (content) => {
  try {
    // Check categories
    if (content.category_names) {
      const categories = content.category_names.split(',').map(c => c.trim().toLowerCase());
      if (FUN_CATEGORIES.some(cat =>
        categories.includes(cat.toLowerCase())
      )) {
        return true;
      }
    }

    // Check genres
    if (content.genre_names) {
      const genres = content.genre_names.split(',').map(g => g.trim().toLowerCase());
      if (FUN_GENRES.some(genre =>
        genres.includes(genre.toLowerCase())
      )) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking fun content:', error);
    return false;
  }
};

// Get trailer for kid content
const getTrailerForKidContent = async (contentId) => {
  try {
    const trailers = await query(`
      SELECT 
        ma.*,
        CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path) as url
      FROM media_assets ma 
      WHERE ma.content_id = ? 
        AND ma.asset_type = 'trailer'
        AND ma.upload_status = 'completed'
      ORDER BY ma.is_primary DESC, ma.created_at DESC
      LIMIT 1
    `, [process.env.R2_PUBLIC_URL_ID, contentId]);

    return trailers[0] || null;
  } catch (error) {
    console.error('Error fetching trailer for kid content:', contentId, error);
    return null;
  }
};

// Build age rating condition (GENERAL FOR ALL KIDS)
const buildAgeRatingCondition = () => {
  // KIDS ONLY SEE THESE RATINGS - NO EXCEPTIONS
  const allowedRatings = KID_ALLOWED_AGE_RATINGS.map(() => '?').join(',');
  const blockedRatings = KID_BLOCKED_AGE_RATINGS.map(() => '?').join(',');

  return {
    condition: `(c.age_rating IN (${allowedRatings}) OR c.age_rating IS NULL) AND (c.age_rating NOT IN (${blockedRatings}) OR c.age_rating IS NULL)`,
    params: [...KID_ALLOWED_AGE_RATINGS, ...KID_BLOCKED_AGE_RATINGS]
  };
};

// Build blocked genres condition
const buildGenreExclusionCondition = (blockedGenres) => {
  if (!blockedGenres || blockedGenres.length === 0) {
    return { condition: '1=1', params: [] };
  }

  const conditions = ['(g.name IS NULL OR g.name NOT IN (?))'];
  const params = [blockedGenres];

  return { condition: conditions.join(' AND '), params };
};

// Get kid hero content - SIMPLIFIED VERSION
const getKidHeroContent = async (kidProfile) => {
  try {
    const blockedGenres = safeDataParse(kidProfile.blocked_genres, []);

    // Build conditions
    const ageCondition = buildAgeRatingCondition();
    const genreCondition = buildGenreExclusionCondition(blockedGenres);

    const allParams = [
      process.env.R2_PUBLIC_URL_ID,
      ...ageCondition.params,
      ...genreCondition.params
    ];

    // Try to get featured content first
    let heroContent = null;

    // 1. Try featured content
    const featuredResult = await query(`
      SELECT DISTINCT
        c.*,
        cr.license_type,
        cr.downloadable,
        cr.shareable,
        GROUP_CONCAT(DISTINCT g.name) as genre_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT cat.name) as category_names,
        GROUP_CONCAT(DISTINCT cat.id) as category_ids,
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC, ma.created_at DESC
          LIMIT 1
        ) as primary_image_url
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
        AND ${ageCondition.condition}
        AND ${genreCondition.condition}
        AND (c.featured = TRUE OR c.featured = 1)
      GROUP BY c.id
      ORDER BY c.featured_order DESC, c.view_count DESC, RAND()
      LIMIT 1
    `, allParams);

    if (featuredResult.length > 0) {
      heroContent = featuredResult[0];
    } else {
      // 2. Try any kid-safe content
      const anyContent = await query(`
        SELECT DISTINCT
          c.*,
          cr.license_type,
          cr.downloadable,
          cr.shareable,
          GROUP_CONCAT(DISTINCT g.name) as genre_names,
          GROUP_CONCAT(DISTINCT g.id) as genre_ids,
          GROUP_CONCAT(DISTINCT cat.name) as category_names,
          GROUP_CONCAT(DISTINCT cat.id) as category_ids,
          (
            SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
            FROM media_assets ma 
            WHERE ma.content_id = c.id 
              AND ma.asset_type IN ('thumbnail', 'poster')
              AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
              AND ma.upload_status = 'completed'
            ORDER BY ma.is_primary DESC, ma.created_at DESC
            LIMIT 1
          ) as primary_image_url
        FROM contents c
        LEFT JOIN content_rights cr ON c.id = cr.content_id
        LEFT JOIN content_genres cg ON c.id = cg.content_id
        LEFT JOIN genres g ON cg.genre_id = g.id
        LEFT JOIN content_categories cc ON c.id = cc.content_id
        LEFT JOIN categories cat ON cc.category_id = cat.id
        WHERE c.status = 'published' 
          AND c.visibility = 'public'
          AND ${ageCondition.condition}
          AND ${genreCondition.condition}
        GROUP BY c.id
        ORDER BY c.view_count DESC, RAND()
        LIMIT 1
      `, allParams);

      heroContent = anyContent[0] || null;
    }

    if (heroContent) {
      // Get trailer
      heroContent.trailer = await getTrailerForKidContent(heroContent.id);
    }

    return heroContent;
  } catch (error) {
    console.error('Error getting kid hero content:', error);
    return null;
  }
};

// Get ALL kid-safe content (for all sections)
const getKidSafeContent = async (kidProfile, limit = 20) => {
  try {
    const blockedGenres = safeDataParse(kidProfile.blocked_genres, []);

    // Build conditions - SAME FOR ALL KIDS
    const ageCondition = buildAgeRatingCondition();
    const genreCondition = buildGenreExclusionCondition(blockedGenres);

    const allParams = [
      process.env.R2_PUBLIC_URL_ID,
      ...ageCondition.params,
      ...genreCondition.params,
      limit
    ];

    const results = await query(`
      SELECT DISTINCT
        c.*,
        cr.license_type,
        cr.downloadable,
        cr.shareable,
        GROUP_CONCAT(DISTINCT g.name) as genre_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT cat.name) as category_names,
        GROUP_CONCAT(DISTINCT cat.id) as category_ids,
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC, ma.created_at DESC
          LIMIT 1
        ) as primary_image_url
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
        AND ${ageCondition.condition}
        AND ${genreCondition.condition}
      GROUP BY c.id
      ORDER BY 
        c.featured DESC,
        c.view_count DESC,
        c.created_at DESC
      LIMIT ?
    `, allParams);

    // Get trailers and categorize content
    if (results.length > 0) {
      for (let item of results) {
        item.trailer = await getTrailerForKidContent(item.id);
        // Add educational/fun flags
        item.is_educational = isContentEducational(item);
        item.is_fun = isContentFun(item);
      }
    }

    return results;
  } catch (error) {
    console.error('Error getting kid-safe content:', error);
    return [];
  }
};

// Categorize content into sections
const categorizeKidContent = (allContent) => {
  const featured = [];
  const educational = [];
  const fun = [];
  const recent = [];

  // Sort by recency for recent section
  const sortedByRecency = [...allContent].sort((a, b) =>
    new Date(b.created_at || b.release_date || 0) - new Date(a.created_at || a.release_date || 0)
  );

  // Categorize each content
  allContent.forEach(content => {
    // Featured: Has featured flag OR high views
    if (content.featured || content.view_count > 100) {
      featured.push(content);
    }

    // Educational: Has educational flag
    if (content.is_educational) {
      educational.push(content);
    }

    // Fun: Has fun flag AND not educational (to avoid duplicates)
    if (content.is_fun && !content.is_educational) {
      fun.push(content);
    }
  });

  // Recent: Top 12 most recent
  recent.push(...sortedByRecency.slice(0, 12));

  // Remove duplicates between featured and other sections
  const featuredIds = new Set(featured.map(c => c.id));

  const filteredEducational = educational.filter(c => !featuredIds.has(c.id));
  const filteredFun = fun.filter(c => !featuredIds.has(c.id));

  // Ensure we have enough content in each section
  const ensureSection = (section, minCount, backupSource) => {
    if (section.length < minCount && backupSource.length > 0) {
      const needed = minCount - section.length;
      const backupContent = backupSource
        .filter(c => !section.some(s => s.id === c.id))
        .slice(0, needed);
      section.push(...backupContent);
    }
    return section.slice(0, 12); // Limit to 12 items
  };

  return {
    featured: ensureSection(featured, 8, allContent),
    educational: ensureSection(filteredEducational, 8, allContent),
    fun: ensureSection(filteredFun, 8, allContent),
    recent: ensureSection(recent, 12, allContent)
  };
};

// Get kid landing page content
const getKidLandingContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const kidProfileId = kidProfile.kid_profile_id;
    const cacheKey = generateKidCacheKey('landing', kidProfileId, kidProfileId);
    const cacheEntry = kidContentCache.get(cacheKey);
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && cacheEntry && !isCacheStale(cacheEntry, kidCacheConfig.landingContent)) {
      console.log('Serving kid landing content from cache');
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp
      });
    }

    // Get ALL kid-safe content
    const allKidContent = await getKidSafeContent(kidProfile, 50); // Get up to 50 items

    if (allKidContent.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No suitable content found for kids'
      });
    }

    // Get hero content (first featured or random from all)
    const heroContent = await getKidHeroContent(kidProfile);

    // Categorize content into sections
    const categorized = categorizeKidContent(allKidContent);

    // Process genres and categories for all content
    const processContentGenresCategories = (contentArray) => {
      return contentArray.map(content => {
        if (content.genre_names) {
          content.genres = content.genre_names.split(',').map((name, index) => ({
            id: content.genre_ids ? content.genre_ids.split(',')[index] : index,
            name: name.trim()
          }));
        } else {
          content.genres = [];
        }

        if (content.category_names) {
          content.categories = content.category_names.split(',').map((name, index) => ({
            id: content.category_ids ? content.category_ids.split(',')[index] : index,
            name: name.trim()
          }));
        } else {
          content.categories = [];
        }

        return content;
      });
    };

    // Process all content sections
    const processedHero = heroContent ? processContentGenresCategories([heroContent])[0] : null;
    const processedFeatured = processContentGenresCategories(categorized.featured);
    const processedEducational = processContentGenresCategories(categorized.educational);
    const processedFun = processContentGenresCategories(categorized.fun);
    const processedRecent = processContentGenresCategories(categorized.recent);

    // Create response data
    const responseData = {
      hero: processedHero ? sanitizeKidContent(processedHero) : null,
      featured: processedFeatured.map(item => sanitizeKidContent(item)),
      educational: processedEducational.map(item => sanitizeKidContent(item)),
      fun: processedFun.map(item => sanitizeKidContent(item)),
      recent: processedRecent.map(item => sanitizeKidContent(item)),
      kid_info: {
        name: kidProfile.name,
        max_age_rating: '12+ (Kid Safe)', // General for all kids
        theme_color: kidProfile.theme_color || 'blue',
        is_family_member: kidProfile.is_family_member || false,
        allowed_ratings: KID_ALLOWED_AGE_RATINGS,
        blocked_ratings: KID_BLOCKED_AGE_RATINGS
      },
      last_updated: new Date().toISOString(),
      sections_count: {
        hero: processedHero ? 1 : 0,
        featured: processedFeatured.length,
        educational: processedEducational.length,
        fun: processedFun.length,
        recent: processedRecent.length
      }
    };

    // Update cache
    kidContentCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: responseData,
      cached: false,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching kid landing content:', error);
    res.status(500).json({
      error: 'Unable to load kid content at this time',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all kid content (listing)
const getAllKidContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    // For now, return empty response with info about landing-only functionality
    res.json({
      success: true,
      message: 'Kid content listing will be implemented in next update. Use landing-content endpoint for now.',
      data: {
        contents: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        },
        kid_info: {
          name: kidProfile.name,
          max_age_rating: kidProfile.max_age_rating || '7+'
        }
      }
    });

  } catch (error) {
    console.error('Error in getAllKidContent:', error);
    res.status(500).json({
      error: 'Unable to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get kid content by ID
const getKidContentById = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const { contentId } = req.params;

    // For now, return info about landing-only functionality
    res.json({
      success: true,
      message: 'Single kid content view will be implemented in next update. Use landing-content endpoint for now.',
      data: {
        content_id: contentId,
        kid_info: {
          name: kidProfile.name,
          max_age_rating: kidProfile.max_age_rating || '7+'
        }
      }
    });

  } catch (error) {
    console.error('Error in getKidContentById:', error);
    res.status(500).json({
      error: 'Unable to process request'
    });
  }
};

// Track kid content view
const trackKidContentView = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    // For now, return success message
    res.json({
      success: true,
      message: 'View tracking will be implemented in next update.',
      data: {
        content_id: req.params.contentId,
        tracked: true
      }
    });

  } catch (error) {
    console.error('Error in trackKidContentView:', error);
    res.status(500).json({
      error: 'Unable to track view'
    });
  }
};

// Determine kid profile type
const getKidProfileType = (kidProfile) => {
  // Method 1: Check explicit flags FIRST
  if (kidProfile.is_family_member === true) {
    return 'family_member';
  }
  
  if (kidProfile.dashboard_type === 'kid') {
    return 'family_member';
  }
  
  // Method 2: Check for user_id (family members should have this)
  if (kidProfile.user_id) {
    return 'family_member';
  }
  
  // Method 3: Check for kid-specific fields
  if (kidProfile.kid_profile_id) {
    // Convert to string to safely check if it starts with 'family_'
    const kidProfileIdStr = String(kidProfile.kid_profile_id);
    if (kidProfileIdStr.startsWith('family_')) {
      return 'family_member';
    }
  }
  
  // Method 4: Regular kid profile
  if (kidProfile.kid_profile_id && !kidProfile.user_id) {
    return 'kid_profile';
  }
  
  // Method 5: Check parent_user_id (kid profiles have this)
  if (kidProfile.parent_user_id && !kidProfile.user_id) {
    return 'kid_profile';
  }
  
  // Method 6: Check if it's a synthetic ID from family member
  if (kidProfile.id && typeof kidProfile.id === 'string' && kidProfile.id.startsWith('family_')) {
    return 'family_member';
  }
  
  // Method 7: Default based on ID type
  if (kidProfile.id) {
    if (typeof kidProfile.id === 'number' || /^\d+$/.test(String(kidProfile.id))) {
      return 'family_member';
    }
  }
  
  return 'kid_profile'; // Default
};

// Get kid liked content (from kids_ratings_feedback)
const getKidLikedContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    
    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const profileType = getKidProfileType(kidProfile);
    
    let likedContent = [];
    let queryParams = [];

    if (profileType === 'kid_profile') {
      // Kid profile created by parent - use kids_ratings_feedback table
      const kidProfileId = kidProfile.kid_profile_id || kidProfile.id;
      
      if (!kidProfileId) {
        return res.status(400).json({
          success: false,
          error: 'Kid profile ID not found'
        });
      }
      
      const likesQuery = `
        SELECT 
          c.*,
          krf.reaction,
          krf.updated_at as liked_at,
          (
            SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
            FROM media_assets ma 
            WHERE ma.content_id = c.id 
              AND ma.asset_type IN ('thumbnail', 'poster')
              AND ma.upload_status = 'completed'
            ORDER BY ma.is_primary DESC, ma.created_at DESC
            LIMIT 1
          ) as primary_image_url,
          GROUP_CONCAT(DISTINCT g.name) as genre_names,
          GROUP_CONCAT(DISTINCT g.id) as genre_ids,
          GROUP_CONCAT(DISTINCT cat.name) as category_names,
          GROUP_CONCAT(DISTINCT cat.id) as category_ids
        FROM kids_ratings_feedback krf
        INNER JOIN contents c ON krf.content_id = c.id
        LEFT JOIN content_genres cg ON c.id = cg.content_id
        LEFT JOIN genres g ON cg.genre_id = g.id
        LEFT JOIN content_categories cc ON c.id = cc.content_id
        LEFT JOIN categories cat ON cc.category_id = cat.id
        WHERE krf.kid_profile_id = ?
          AND krf.reaction IN ('like', 'love')
          AND c.status = 'published'
          AND c.visibility = 'public'
        GROUP BY c.id, krf.reaction, krf.updated_at
        ORDER BY krf.updated_at DESC
      `;
      
      queryParams = [process.env.R2_PUBLIC_URL_ID, kidProfileId];
      likedContent = await query(likesQuery, queryParams);
      
    } else {
      // Family member - use normal user_likes table
      const userId = kidProfile.user_id || kidProfile.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID not found for family member'
        });
      }
      
      const likesQuery = `
        SELECT 
          c.*,
          ul.liked_at,
          (
            SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
            FROM media_assets ma 
            WHERE ma.content_id = c.id 
              AND ma.asset_type IN ('thumbnail', 'poster')
              AND ma.upload_status = 'completed'
            ORDER BY ma.is_primary DESC, ma.created_at DESC
            LIMIT 1
          ) as primary_image_url,
          GROUP_CONCAT(DISTINCT g.name) as genre_names,
          GROUP_CONCAT(DISTINCT g.id) as genre_ids,
          GROUP_CONCAT(DISTINCT cat.name) as category_names,
          GROUP_CONCAT(DISTINCT cat.id) as category_ids
        FROM user_likes ul
        INNER JOIN contents c ON ul.content_id = c.id
        LEFT JOIN content_genres cg ON c.id = cg.content_id
        LEFT JOIN genres g ON cg.genre_id = g.id
        LEFT JOIN content_categories cc ON c.id = cc.content_id
        LEFT JOIN categories cat ON cc.category_id = cat.id
        WHERE ul.user_id = ?
          AND ul.is_active = TRUE
          AND c.status = 'published'
          AND c.visibility = 'public'
        GROUP BY c.id, ul.liked_at
        ORDER BY ul.liked_at DESC
      `;
      
      queryParams = [process.env.R2_PUBLIC_URL_ID, userId];
      likedContent = await query(likesQuery, queryParams);
    }

    // Sanitize for kids
    const sanitizeContent = (content) => {
      // Process genres
      let genres = [];
      if (content.genre_names) {
        genres = content.genre_names.split(',').map((name, index) => ({
          id: content.genre_ids ? content.genre_ids.split(',')[index] : index,
          name: name.trim()
        }));
      }
      
      // Process categories
      let categories = [];
      if (content.category_names) {
        categories = content.category_names.split(',').map((name, index) => ({
          id: content.category_ids ? content.category_ids.split(',')[index] : index,
          name: name.trim()
        }));
      }
      
      // Ensure content is kid-safe
      const isKidSafe = !KID_BLOCKED_AGE_RATINGS.includes(content.age_rating || '');
      const allowedAgeRating = KID_ALLOWED_AGE_RATINGS.includes(content.age_rating || 'G');
      
      return {
        id: content.id,
        title: content.title,
        content_type: content.content_type,
        description: content.short_description || content.description || '',
        short_description: content.short_description || '',
        duration_minutes: content.duration_minutes,
        release_date: content.release_date,
        age_rating: content.age_rating || 'G',
        average_rating: content.average_rating || 0,
        view_count: content.view_count || 0,
        primary_image_url: content.primary_image_url,
        genres: genres,
        categories: categories,
        liked_at: content.liked_at,
        reaction: content.reaction || 'like',
        is_kid_safe: isKidSafe && allowedAgeRating,
        media_assets: content.primary_image_url ? [{
          asset_type: 'thumbnail',
          url: content.primary_image_url,
          is_primary: 1,
          upload_status: 'completed'
        }] : []
      };
    };

    const processedContent = likedContent.map(sanitizeContent);

    res.json({
      success: true,
      data: {
        favorites: processedContent, // Changed from 'liked_content' to 'favorites' for frontend compatibility
        total: processedContent.length,
        profile_type: profileType,
        kid_info: {
          name: kidProfile.name,
          total_liked: processedContent.length,
          user_id: kidProfile.user_id,
          kid_profile_id: kidProfile.kid_profile_id,
          parent_user_id: kidProfile.parent_user_id,
          is_family_member: kidProfile.is_family_member || false
        }
      }
    });

  } catch (error) {
    console.error('Error fetching kid liked content:', error);
    
    if (error.sql) {
      console.error('SQL Error:', error.sql);
      console.error('SQL Parameters:', error.params);
    }
    
    res.status(500).json({
      success: false,
      error: 'Unable to fetch liked content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get kid watch later content
const getKidWatchLaterContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    
    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const profileType = getKidProfileType(kidProfile);
    
    let watchLaterContent = [];
    let queryParams = [];

    if (profileType === 'kid_profile') {
      // Kid profile created by parent - use kids_watchlist table
      const kidProfileId = kidProfile.id || kidProfile.kid_profile_id;
      
      if (!kidProfileId) {
        return res.status(400).json({
          success: false,
          error: 'Kid profile ID not found'
        });
      }
      
      const watchlistQuery = `
        SELECT 
          c.*,
          kw.added_at as watchlist_added_at,
          (
            SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
            FROM media_assets ma 
            WHERE ma.content_id = c.id 
              AND ma.asset_type IN ('thumbnail', 'poster')
              AND ma.upload_status = 'completed'
            ORDER BY ma.is_primary DESC, ma.created_at DESC
            LIMIT 1
          ) as primary_image_url,
          GROUP_CONCAT(DISTINCT g.name) as genre_names,
          GROUP_CONCAT(DISTINCT g.id) as genre_ids,
          GROUP_CONCAT(DISTINCT cat.name) as category_names,
          GROUP_CONCAT(DISTINCT cat.id) as category_ids
        FROM kids_watchlist kw
        INNER JOIN contents c ON kw.content_id = c.id
        LEFT JOIN content_genres cg ON c.id = cg.content_id
        LEFT JOIN genres g ON cg.genre_id = g.id
        LEFT JOIN content_categories cc ON c.id = cc.content_id
        LEFT JOIN categories cat ON cc.category_id = cat.id
        WHERE kw.kid_profile_id = ?
          AND c.status = 'published'
          AND c.visibility = 'public'
        GROUP BY c.id, kw.added_at
        ORDER BY kw.added_at DESC
      `;
      
      queryParams = [process.env.R2_PUBLIC_URL_ID, kidProfileId];
      watchLaterContent = await query(watchlistQuery, queryParams);
      
    } else {
      // Family member - use normal user_watchlist table
      const userId = kidProfile.user_id || kidProfile.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID not found for family member'
        });
      }
      
      const watchlistQuery = `
        SELECT 
          c.*,
          uw.added_at as watchlist_added_at,
          (
            SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
            FROM media_assets ma 
            WHERE ma.content_id = c.id 
              AND ma.asset_type IN ('thumbnail', 'poster')
              AND ma.upload_status = 'completed'
            ORDER BY ma.is_primary DESC, ma.created_at DESC
            LIMIT 1
          ) as primary_image_url,
          GROUP_CONCAT(DISTINCT g.name) as genre_names,
          GROUP_CONCAT(DISTINCT g.id) as genre_ids,
          GROUP_CONCAT(DISTINCT cat.name) as category_names,
          GROUP_CONCAT(DISTINCT cat.id) as category_ids
        FROM user_watchlist uw
        INNER JOIN contents c ON uw.content_id = c.id
        LEFT JOIN content_genres cg ON c.id = cg.content_id
        LEFT JOIN genres g ON cg.genre_id = g.id
        LEFT JOIN content_categories cc ON c.id = cc.content_id
        LEFT JOIN categories cat ON cc.category_id = cat.id
        WHERE uw.user_id = ?
          AND c.status = 'published'
          AND c.visibility = 'public'
        GROUP BY c.id, uw.added_at
        ORDER BY uw.added_at DESC
      `;
      
      queryParams = [process.env.R2_PUBLIC_URL_ID, userId];
      watchLaterContent = await query(watchlistQuery, queryParams);
    }

    // Sanitize for kids
    const sanitizeContent = (content) => {
      // Process genres
      let genres = [];
      if (content.genre_names) {
        genres = content.genre_names.split(',').map((name, index) => ({
          id: content.genre_ids ? content.genre_ids.split(',')[index] : index,
          name: name.trim()
        }));
      }
      
      // Process categories
      let categories = [];
      if (content.category_names) {
        categories = content.category_names.split(',').map((name, index) => ({
          id: content.category_ids ? content.category_ids.split(',')[index] : index,
          name: name.trim()
        }));
      }
      
      return {
        id: content.id,
        title: content.title,
        content_type: content.content_type,
        description: content.short_description || content.description || '',
        short_description: content.short_description || '',
        duration_minutes: content.duration_minutes,
        release_date: content.release_date,
        age_rating: content.age_rating || 'G',
        average_rating: content.average_rating || 0,
        view_count: content.view_count || 0,
        primary_image_url: content.primary_image_url,
        genres: genres,
        categories: categories,
        added_to_watchlist: content.watchlist_added_at,
        is_kid_safe: true,
        media_assets: content.primary_image_url ? [{
          asset_type: 'thumbnail',
          url: content.primary_image_url,
          is_primary: 1,
          upload_status: 'completed'
        }] : []
      };
    };

    const processedContent = watchLaterContent.map(sanitizeContent);

    res.json({
      success: true,
      data: {
        watchlist: processedContent,
        total: watchLaterContent.length,
        kid_info: {
          name: kidProfile.name,
          profile_type: profileType,
          total_watchlist: watchLaterContent.length,
          user_id: kidProfile.user_id || kidProfile.id,
          kid_profile_id: kidProfile.kid_profile_id,
          parent_user_id: kidProfile.parent_user_id
        }
      }
    });

  } catch (error) {
    console.error('Error fetching kid watchlist:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch watchlist',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add/Remove from kid liked content
const toggleKidLikedContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { contentId, reaction = 'like' } = req.body;

    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required'
      });
    }

    // Validate reaction for kids
    const validReactions = ['like', 'love', 'dislike', 'meh'];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reaction. Use: like, love, dislike, or meh'
      });
    }

    const profileType = getKidProfileType(kidProfile);
    let existingQuery;
    let deleteOrUpdateQuery;
    let insertQuery;
    let queryParams;

    if (profileType === 'kid_profile') {
      // Kid profile - use kids_ratings_feedback table
      const kidProfileId = kidProfile.id || kidProfile.kid_profile_id;
      
      // Check if already has a reaction
      existingQuery = 'SELECT id, reaction FROM kids_ratings_feedback WHERE kid_profile_id = ? AND content_id = ?';
      
      // Update or delete based on reaction
      if (reaction === 'dislike' || reaction === 'meh') {
        // For dislike/meh, update the reaction
        deleteOrUpdateQuery = 'UPDATE kids_ratings_feedback SET reaction = ?, updated_at = NOW() WHERE kid_profile_id = ? AND content_id = ?';
        queryParams = [reaction, kidProfileId, contentId];
      } else if (reaction === 'like' || reaction === 'love') {
        // For like/love, upsert
        insertQuery = `
          INSERT INTO kids_ratings_feedback (kid_profile_id, content_id, reaction, updated_at) 
          VALUES (?, ?, ?, NOW()) 
          ON DUPLICATE KEY UPDATE reaction = ?, updated_at = NOW()
        `;
        queryParams = [kidProfileId, contentId, reaction, reaction];
      }
    } else {
      // Family member - use user_likes table
      const userId = kidProfile.user_id || kidProfile.id;
      
      existingQuery = 'SELECT id FROM user_likes WHERE user_id = ? AND content_id = ? AND is_active = TRUE';
      
      if (reaction === 'like' || reaction === 'love') {
        // Add or update like
        insertQuery = `
          INSERT INTO user_likes (user_id, content_id, liked_at, is_active) 
          VALUES (?, ?, NOW(), TRUE) 
          ON DUPLICATE KEY UPDATE liked_at = NOW(), is_active = TRUE, unliked_at = NULL
        `;
        deleteOrUpdateQuery = 'UPDATE user_likes SET is_active = FALSE, unliked_at = NOW() WHERE user_id = ? AND content_id = ? AND is_active = TRUE';
        queryParams = [userId, contentId];
      } else {
        // For dislike/meh in family member context, just unlike
        deleteOrUpdateQuery = 'UPDATE user_likes SET is_active = FALSE, unliked_at = NOW() WHERE user_id = ? AND content_id = ? AND is_active = TRUE';
        queryParams = [userId, contentId];
      }
    }

    const existing = await query(existingQuery, profileType === 'kid_profile' ? [kidProfile.id || kidProfile.kid_profile_id, contentId] : [kidProfile.user_id || kidProfile.id, contentId]);

    if (existing.length > 0) {
      // Already has a reaction - update or remove
      if ((reaction === 'dislike' || reaction === 'meh') && profileType === 'kid_profile') {
        // Update reaction for kids
        await query(deleteOrUpdateQuery, queryParams);
        res.json({
          success: true,
          action: 'updated',
          message: `Reaction updated to ${reaction}`,
          reaction: reaction
        });
      } else {
        // Remove like/unlike
        await query(deleteOrUpdateQuery, queryParams);
        res.json({
          success: true,
          action: 'removed',
          message: 'Removed reaction',
          reaction: null
        });
      }
    } else {
      // Add new reaction
      await query(insertQuery, queryParams);
      res.json({
        success: true,
        action: 'added',
        message: reaction === 'like' || reaction === 'love' ? 'Added to liked videos' : `Reaction set to ${reaction}`,
        reaction: reaction
      });
    }

  } catch (error) {
    console.error('Error updating kid liked content:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update liked content'
    });
  }
};

// Add/Remove from kid watch later content
const toggleKidWatchLaterContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { contentId } = req.body;
    
    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required'
      });
    }

    const profileType = getKidProfileType(kidProfile);
    let existingQuery;
    let deleteQuery;
    let insertQuery;
    let queryParams;

    if (profileType === 'kid_profile') {
      const kidProfileId = kidProfile.id || kidProfile.kid_profile_id;
      existingQuery = 'SELECT id FROM kids_watchlist WHERE kid_profile_id = ? AND content_id = ?';
      deleteQuery = 'DELETE FROM kids_watchlist WHERE kid_profile_id = ? AND content_id = ?';
      insertQuery = 'INSERT INTO kids_watchlist (kid_profile_id, content_id, added_at) VALUES (?, ?, NOW())';
      queryParams = [kidProfileId, contentId];
    } else {
      const userId = kidProfile.user_id || kidProfile.id;
      existingQuery = 'SELECT id FROM user_watchlist WHERE user_id = ? AND content_id = ?';
      deleteQuery = 'DELETE FROM user_watchlist WHERE user_id = ? AND content_id = ?';
      insertQuery = 'INSERT INTO user_watchlist (user_id, content_id, added_at) VALUES (?, ?, NOW())';
      queryParams = [userId, contentId];
    }

    const existing = await query(existingQuery, queryParams);

    if (existing.length > 0) {
      await query(deleteQuery, queryParams);
      
      res.json({
        success: true,
        action: 'removed',
        message: 'Removed from watch later'
      });
    } else {
      await query(insertQuery, queryParams);
      
      res.json({
        success: true,
        action: 'added',
        message: 'Added to watch later'
      });
    }

  } catch (error) {
    console.error('Error updating kid watchlist:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update watchlist'
    });
  }
};

// Remove from kid liked content
const removeKidLikedContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { contentId } = req.params;

    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    const profileType = getKidProfileType(kidProfile);
    let deleteQuery;
    let queryParams;

    if (profileType === 'kid_profile') {
      const kidProfileId = kidProfile.id || kidProfile.kid_profile_id;
      deleteQuery = 'DELETE FROM kids_ratings_feedback WHERE kid_profile_id = ? AND content_id = ?';
      queryParams = [kidProfileId, contentId];
    } else {
      const userId = kidProfile.user_id || kidProfile.id;
      deleteQuery = 'UPDATE user_likes SET is_active = FALSE, unliked_at = NOW() WHERE user_id = ? AND content_id = ?';
      queryParams = [userId, contentId];
    }

    await query(deleteQuery, queryParams);

    res.json({
      success: true,
      message: 'Removed from liked videos'
    });

  } catch (error) {
    console.error('Error removing from kid liked content:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to remove from liked content'
    });
  }
};

// Remove from kid watch later content
const removeKidWatchLaterContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { contentId } = req.params;
    
    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    const profileType = getKidProfileType(kidProfile);
    let deleteQuery;
    let queryParams;

    if (profileType === 'kid_profile') {
      const kidProfileId = kidProfile.id || kidProfile.kid_profile_id;
      deleteQuery = 'DELETE FROM kids_watchlist WHERE kid_profile_id = ? AND content_id = ?';
      queryParams = [kidProfileId, contentId];
    } else {
      const userId = kidProfile.user_id || kidProfile.id;
      deleteQuery = 'DELETE FROM user_watchlist WHERE user_id = ? AND content_id = ?';
      queryParams = [userId, contentId];
    }

    await query(deleteQuery, queryParams);
    
    res.json({
      success: true,
      message: 'Removed from watch later'
    });

  } catch (error) {
    console.error('Error removing from kid watchlist:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to remove from watchlist'
    });
  }
};

// Get batch kid likes status
const getBatchKidLikesStatus = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { contentIds } = req.query;

    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content IDs array is required'
      });
    }

    const profileType = getKidProfileType(kidProfile);
    const status = {};

    if (profileType === 'kid_profile') {
      // Check kids_ratings_feedback and kids_watchlist
      const kidProfileId = kidProfile.id || kidProfile.kid_profile_id;
      const placeholders = contentIds.map(() => '?').join(',');

      // Check kids_ratings_feedback for likes/loves
      const likesQuery = `
        SELECT content_id, reaction FROM kids_ratings_feedback 
        WHERE kid_profile_id = ? AND content_id IN (${placeholders}) AND reaction IN ('like', 'love')
      `;
      const likes = await query(likesQuery, [kidProfileId, ...contentIds]);

      // Check kids_watchlist
      const watchlistQuery = `
        SELECT content_id FROM kids_watchlist 
        WHERE kid_profile_id = ? AND content_id IN (${placeholders})
      `;
      const watchlist = await query(watchlistQuery, [kidProfileId, ...contentIds]);

      contentIds.forEach(id => {
        const likeEntry = likes.find(like => like.content_id === id);
        status[id] = {
          isLiked: !!likeEntry,
          reaction: likeEntry ? likeEntry.reaction : null,
          isWatchLater: watchlist.some(item => item.content_id === id)
        };
      });
    } else {
      // Check user_likes and user_watchlist
      const userId = kidProfile.user_id || kidProfile.id;
      const placeholders = contentIds.map(() => '?').join(',');

      // Check likes
      const likesQuery = `
        SELECT content_id FROM user_likes 
        WHERE user_id = ? AND content_id IN (${placeholders}) AND is_active = TRUE
      `;
      const likes = await query(likesQuery, [userId, ...contentIds]);

      // Check watchlist
      const watchlistQuery = `
        SELECT content_id FROM user_watchlist 
        WHERE user_id = ? AND content_id IN (${placeholders})
      `;
      const watchlist = await query(watchlistQuery, [userId, ...contentIds]);

      contentIds.forEach(id => {
        status[id] = {
          isLiked: likes.some(like => like.content_id === id),
          reaction: likes.some(like => like.content_id === id) ? 'like' : null,
          isWatchLater: watchlist.some(item => item.item.content_id === id)
        };
      });
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error fetching likes status:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch likes status'
    });
  }
};

// Get kid filters
const getKidFilters = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const maxAgeRating = kidProfile.max_age_rating || '7+';

    // Simple function to get age ratings
    const getKidAgeRatings = (maxAgeRating) => {
      if (!maxAgeRating) return ['all', '3+', '4+', '5+', '6+', '7+', '8+', '9+', '10+', '11+', '12+', '13+', '14+'];
      if (maxAgeRating.toLowerCase() === 'all') {
        return ['all', '3+', '4+', '5+', '6+', '7+', '8+', '9+', '10+', '11+', '12+', '13+', '14+'];
      }
      const age = parseInt(maxAgeRating.replace('+', ''));
      const allowedRatings = ['all'];
      for (let i = 3; i <= Math.min(age, 12); i++) {
        allowedRatings.push(`${i}+`);
      }
      return allowedRatings;
    };

    res.json({
      success: true,
      message: 'Filters will be implemented in next update.',
      data: {
        categories: [],
        genres: [],
        content_types: [],
        age_ratings: getKidAgeRatings(maxAgeRating),
        kid_name: kidProfile.name,
        max_age_rating: maxAgeRating,
        is_family_member: kidProfile.is_family_member || false
      }
    });

  } catch (error) {
    console.error('Error in getKidFilters:', error);
    res.status(500).json({
      error: 'Unable to load filters'
    });
  }
};

// Get kid viewing history
const getKidViewingHistory = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    res.json({
      success: true,
      message: 'Viewing history will be implemented in next update.',
      data: {
        history: [],
        total: 0,
        kid_info: {
          name: kidProfile.name
        }
      }
    });

  } catch (error) {
    console.error('Error in getKidViewingHistory:', error);
    res.status(500).json({
      error: 'Unable to fetch viewing history'
    });
  }
};

// Clear kid viewing history
const clearKidViewingHistory = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    res.json({
      success: true,
      message: 'Clear viewing history will be implemented in next update.',
      data: {
        cleared: true
      }
    });

  } catch (error) {
    console.error('Error in clearKidViewingHistory:', error);
    res.status(500).json({
      error: 'Unable to clear viewing history'
    });
  }
};

// Get kid recommendations
const getKidRecommendations = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    res.json({
      success: true,
      message: 'Recommendations will be implemented in next update.',
      data: {
        recommendations: [],
        total: 0,
        kid_info: {
          name: kidProfile.name
        }
      }
    });

  } catch (error) {
    console.error('Error in getKidRecommendations:', error);
    res.status(500).json({
      error: 'Unable to fetch recommendations'
    });
  }
};

// Get kid dashboard stats
const getKidDashboardStats = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    res.json({
      success: true,
      message: 'Dashboard stats will be implemented in next update.',
      data: {
        stats: {
          total_watch_time: 0,
          favorite_genres: [],
          recent_activity: []
        },
        kid_info: {
          name: kidProfile.name
        }
      }
    });

  } catch (error) {
    console.error('Error in getKidDashboardStats:', error);
    res.status(500).json({
      error: 'Unable to fetch dashboard stats'
    });
  }
};

// Get kid content preferences
const getKidContentPreferences = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { contentId } = req.params;

    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Content preferences will be implemented in next update.',
      data: {
        content_id: contentId,
        preferences: {
          isLiked: false,
          isWatchLater: false,
          viewedRecently: false,
          parentApproved: false,
          kid_safe: true,
          age_appropriate: true
        }
      }
    });

  } catch (error) {
    console.error('Error in getKidContentPreferences:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch preferences'
    });
  }
};

// Get batch kid preferences
const getBatchKidPreferences = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { contentIds } = req.body;

    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content IDs array is required'
      });
    }

    const preferences = {};
    contentIds.forEach(contentId => {
      preferences[contentId] = {
        isLiked: false,
        isWatchLater: false,
        viewedRecently: false,
        parentApproved: false,
        kid_safe: true,
        age_appropriate: true
      };
    });

    res.json({
      success: true,
      message: 'Batch preferences will be implemented in next update.',
      data: preferences
    });

  } catch (error) {
    console.error('Error in getBatchKidPreferences:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch batch preferences'
    });
  }
};

// Search kid content
const searchKidContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { q: searchQuery, page = 1, limit = 20 } = req.query;

    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    res.json({
      success: true,
      message: 'Kid search will be implemented in next update.',
      data: {
        results: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        },
        search_query: searchQuery,
        kid_info: {
          name: kidProfile.name,
          max_age_rating: kidProfile.max_age_rating || '7+'
        }
      }
    });

  } catch (error) {
    console.error('Error in searchKidContent:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to perform search'
    });
  }
};

// Get kid trending content
const getKidTrendingContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    const { limit = 12, category } = req.query;

    if (!kidProfile) {
      return res.status(403).json({
        success: false,
        error: 'Kid profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Kid trending content will be implemented in next update.',
      data: {
        trending: [],
        count: 0,
        category: category || 'all',
        kid_info: {
          name: kidProfile.name,
          max_age_rating: kidProfile.max_age_rating || '7+'
        }
      }
    });

  } catch (error) {
    console.error('Error in getKidTrendingContent:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch trending content'
    });
  }
};

// Get kid learning content
const getKidLearningContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      genre,
      type,
      sort = 'popular',
      q: searchQuery
    } = req.query;

    const offset = (page - 1) * limit;
    const blockedGenres = safeDataParse(kidProfile.blocked_genres, []);

    // Build age rating condition
    const ageCondition = buildAgeRatingCondition();

    // Build WHERE conditions
    let whereConditions = [
      "c.status = 'published'",
      "c.visibility = 'public'",
      ageCondition.condition,
      // Educational content filter
      `(
        cat.name IN (${EDUCATIONAL_CATEGORIES_FULL.map(() => '?').join(',')}) 
        OR g.name IN (${EDUCATIONAL_GENRES_FULL.map(() => '?').join(',')})
        OR c.title LIKE ?
        OR c.short_description LIKE ?
        OR c.description LIKE ?
        OR EXISTS (
          SELECT 1 
          FROM content_categories cc2 
          JOIN categories cat2 ON cc2.category_id = cat2.id
          WHERE cc2.content_id = c.id 
            AND (
              cat2.name LIKE '%learn%' 
              OR cat2.name LIKE '%educat%' 
              OR cat2.name LIKE '%science%'
            )
        )
      )`
    ];

    let queryParams = [
      ...ageCondition.params,
      ...EDUCATIONAL_CATEGORIES_FULL,
      ...EDUCATIONAL_GENRES_FULL,
      `%learn%`,
      `%educat%`,
      `%science%`
    ];

    // Add blocked genres filter
    if (blockedGenres.length > 0) {
      whereConditions.push("(g.name IS NULL OR g.name NOT IN (?))");
      queryParams.push(blockedGenres);
    }

    // Add search filter if provided
    if (searchQuery && searchQuery.trim().length >= 2) {
      whereConditions.push("(c.title LIKE ? OR c.short_description LIKE ? OR c.description LIKE ?)");
      queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    // Add category filter
    if (category && EDUCATIONAL_CATEGORIES_FULL.includes(category)) {
      whereConditions.push("cat.name = ?");
      queryParams.push(category);
    }

    // Add genre filter
    if (genre && EDUCATIONAL_GENRES_FULL.includes(genre)) {
      whereConditions.push("g.name = ?");
      queryParams.push(genre);
    }

    // Add content type filter
    if (type && ['movie', 'series', 'documentary', 'short_film'].includes(type)) {
      whereConditions.push("c.content_type = ?");
      queryParams.push(type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build sort order
    let sortOrder = "c.view_count DESC, c.average_rating DESC";
    switch (sort) {
      case 'recent':
        sortOrder = "c.created_at DESC, c.release_date DESC";
        break;
      case 'rating':
        sortOrder = "c.average_rating DESC, c.view_count DESC";
        break;
      case 'featured':
        sortOrder = "c.featured DESC, c.featured_order DESC";
        break;
      case 'trending':
        sortOrder = "(SELECT COUNT(*) FROM kids_viewing_history WHERE content_id = c.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) DESC";
        break;
      case 'alphabetical':
        sortOrder = "c.title ASC";
        break;
    }

    // Get educational content
    const educationalContent = await query(`
      SELECT DISTINCT
        c.*,
        cr.license_type,
        cr.downloadable,
        cr.shareable,
        GROUP_CONCAT(DISTINCT g.name) as genre_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT cat.name) as category_names,
        GROUP_CONCAT(DISTINCT cat.id) as category_ids,
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC, ma.created_at DESC
          LIMIT 1
        ) as primary_image_url,
        (
          SELECT COUNT(*) 
          FROM kids_viewing_history kvh 
          WHERE kvh.content_id = c.id 
            AND kvh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ) as recent_views,
        -- Educational score calculation
        (
          CASE 
            WHEN cat.name IN (${EDUCATIONAL_CATEGORIES_FULL.map(() => '?').join(',')}) THEN 3
            WHEN g.name IN (${EDUCATIONAL_GENRES_FULL.map(() => '?').join(',')}) THEN 2
            WHEN c.title LIKE ? OR c.short_description LIKE ? OR c.description LIKE ? THEN 1
            ELSE 0
          END
        ) as educational_score
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY educational_score DESC, ${sortOrder}
      LIMIT ? OFFSET ?
    `, [
      process.env.R2_PUBLIC_URL_ID,
      ...EDUCATIONAL_CATEGORIES_FULL,
      ...EDUCATIONAL_GENRES_FULL,
      `%learn%`,
      `%educat%`,
      `%science%`,
      ...queryParams,
      parseInt(limit),
      parseInt(offset)
    ]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(DISTINCT c.id) as total 
      FROM contents c
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      ${whereClause}
    `, queryParams);

    // Get available filters
    const categories = await query(`
      SELECT DISTINCT cat.id, cat.name, cat.description
      FROM categories cat
      JOIN content_categories cc ON cat.id = cc.category_id
      JOIN contents c ON cc.content_id = c.id
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND cat.name IN (?)
      ORDER BY cat.name ASC
    `, [EDUCATIONAL_CATEGORIES_FULL]);

    const genres = await query(`
      SELECT DISTINCT g.id, g.name, g.description
      FROM genres g
      JOIN content_genres cg ON g.id = cg.genre_id
      JOIN contents c ON cg.content_id = c.id
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND g.name IN (?)
      ORDER BY g.name ASC
    `, [EDUCATIONAL_GENRES_FULL]);

    const contentTypes = await query(`
      SELECT DISTINCT content_type
      FROM contents c
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND EXISTS (
          SELECT 1 FROM content_categories cc 
          JOIN categories cat ON cc.category_id = cat.id
          WHERE cc.content_id = c.id 
            AND cat.name IN (?)
        )
      ORDER BY content_type ASC
    `, [EDUCATIONAL_CATEGORIES_FULL]);

    // Process and sanitize content for kids
    const processedContent = educationalContent.map(content => sanitizeKidContent(content));

    res.json({
      success: true,
      data: {
        contents: processedContent,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0]?.total || 0,
          pages: Math.ceil((countResult[0]?.total || 0) / limit)
        },
        filters: {
          categories,
          genres,
          content_types: contentTypes.map(row => row.content_type),
          sort_options: [
            { value: 'popular', label: 'Most Popular' },
            { value: 'recent', label: 'Recently Added' },
            { value: 'rating', label: 'Highest Rated' },
            { value: 'trending', label: 'Trending Now' },
            { value: 'featured', label: 'Featured' },
            { value: 'alphabetical', label: 'A to Z' }
          ]
        },
        search_query: searchQuery || null,
        kid_info: {
          name: kidProfile.name,
          max_age_rating: '12+ (Kid Safe)',
          is_family_member: kidProfile.is_family_member || false
        },
        metadata: {
          total_results: countResult[0]?.total || 0,
          educational_categories_count: categories.length,
          educational_genres_count: genres.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching kid learning content:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch learning content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get kid songs and music content
const getKidSongsMusicContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      genre,
      type,
      sort = 'popular',
      q: searchQuery
    } = req.query;

    const offset = (page - 1) * limit;
    const blockedGenres = safeDataParse(kidProfile.blocked_genres, []);

    // Build age rating condition
    const ageCondition = buildAgeRatingCondition();

    // Songs and Music related categories and genres
    const MUSIC_CATEGORIES = [
      'Music', 'Musical', 'Concert', 'Performance',
      'Dance', 'Rhythm', 'Singing', 'Karaoke',
      'Instrumental', 'Classical', 'Kids Music',
      'Nursery Rhymes', 'Children Songs', 'Educational Music'
    ];

    const MUSIC_GENRES = [
      'Music', 'Musical', 'Concert', 'Performance',
      'Dance', 'Rhythm', 'Singing', 'Karaoke',
      'Instrumental', 'Classical', 'Kids',
      'Children', 'Educational', 'Animation'
    ];

    // Build WHERE conditions
    let whereConditions = [
      "c.status = 'published'",
      "c.visibility = 'public'",
      ageCondition.condition,
      // Music content filter
      `(
        cat.name IN (${MUSIC_CATEGORIES.map(() => '?').join(',')}) 
        OR g.name IN (${MUSIC_GENRES.map(() => '?').join(',')})
        OR c.title LIKE ?
        OR c.short_description LIKE ?
        OR c.description LIKE ?
        OR EXISTS (
          SELECT 1 
          FROM content_categories cc2 
          JOIN categories cat2 ON cc2.category_id = cat2.id
          WHERE cc2.content_id = c.id 
            AND (
              cat2.name LIKE '%music%' 
              OR cat2.name LIKE '%song%' 
              OR cat2.name LIKE '%dance%'
            )
        )
      )`
    ];

    let queryParams = [
      ...ageCondition.params,
      ...MUSIC_CATEGORIES,
      ...MUSIC_GENRES,
      `%music%`,
      `%song%`,
      `%dance%`
    ];

    // Add blocked genres filter
    if (blockedGenres.length > 0) {
      whereConditions.push("(g.name IS NULL OR g.name NOT IN (?))");
      queryParams.push(blockedGenres);
    }

    // Add search filter if provided
    if (searchQuery && searchQuery.trim().length >= 2) {
      whereConditions.push("(c.title LIKE ? OR c.short_description LIKE ? OR c.description LIKE ?)");
      queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    // Add category filter
    if (category && MUSIC_CATEGORIES.includes(category)) {
      whereConditions.push("cat.name = ?");
      queryParams.push(category);
    }

    // Add genre filter
    if (genre && MUSIC_GENRES.includes(genre)) {
      whereConditions.push("g.name = ?");
      queryParams.push(genre);
    }

    // Add content type filter
    if (type && ['movie', 'series', 'short_film'].includes(type)) {
      whereConditions.push("c.content_type = ?");
      queryParams.push(type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build sort order
    let sortOrder = "c.view_count DESC, c.average_rating DESC";
    switch (sort) {
      case 'recent':
        sortOrder = "c.created_at DESC, c.release_date DESC";
        break;
      case 'rating':
        sortOrder = "c.average_rating DESC, c.view_count DESC";
        break;
      case 'featured':
        sortOrder = "c.featured DESC, c.featured_order DESC";
        break;
      case 'trending':
        sortOrder = "(SELECT COUNT(*) FROM kids_viewing_history WHERE content_id = c.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) DESC";
        break;
      case 'alphabetical':
        sortOrder = "c.title ASC";
        break;
      case 'duration':
        sortOrder = "c.duration_minutes ASC";
        break;
    }

    // Get music content
    const musicContent = await query(`
      SELECT DISTINCT
        c.*,
        cr.license_type,
        cr.downloadable,
        cr.shareable,
        GROUP_CONCAT(DISTINCT g.name) as genre_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT cat.name) as category_names,
        GROUP_CONCAT(DISTINCT cat.id) as category_ids,
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND (ma.is_primary = 1 OR ma.is_primary IS NULL)
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC, ma.created_at DESC
          LIMIT 1
        ) as primary_image_url,
        (
          SELECT COUNT(*) 
          FROM kids_viewing_history kvh 
          WHERE kvh.content_id = c.id 
            AND kvh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ) as recent_views,
        -- Music score calculation
        (
          CASE 
            WHEN cat.name IN (${MUSIC_CATEGORIES.map(() => '?').join(',')}) THEN 3
            WHEN g.name IN (${MUSIC_GENRES.map(() => '?').join(',')}) THEN 2
            WHEN c.title LIKE ? OR c.short_description LIKE ? OR c.description LIKE ? THEN 1
            ELSE 0
          END
        ) as music_score,
        -- Check if has audio/video format
        (
          SELECT COUNT(*) 
          FROM media_assets ma2 
          WHERE ma2.content_id = c.id 
            AND ma2.asset_type = 'mainVideo'
            AND ma2.upload_status = 'completed'
        ) as has_video
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY music_score DESC, ${sortOrder}
      LIMIT ? OFFSET ?
    `, [
      process.env.R2_PUBLIC_URL_ID,
      ...MUSIC_CATEGORIES,
      ...MUSIC_GENRES,
      `%music%`,
      `%song%`,
      `%dance%`,
      ...queryParams,
      parseInt(limit),
      parseInt(offset)
    ]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(DISTINCT c.id) as total 
      FROM contents c
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      ${whereClause}
    `, queryParams);

    // Get available filters
    const categories = await query(`
      SELECT DISTINCT cat.id, cat.name, cat.description
      FROM categories cat
      JOIN content_categories cc ON cat.id = cc.category_id
      JOIN contents c ON cc.content_id = c.id
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND cat.name IN (?)
      ORDER BY cat.name ASC
    `, [MUSIC_CATEGORIES]);

    const genres = await query(`
      SELECT DISTINCT g.id, g.name, g.description
      FROM genres g
      JOIN content_genres cg ON g.id = cg.genre_id
      JOIN contents c ON cg.content_id = c.id
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND g.name IN (?)
      ORDER BY g.name ASC
    `, [MUSIC_GENRES]);

    const contentTypes = await query(`
      SELECT DISTINCT content_type
      FROM contents c
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND EXISTS (
          SELECT 1 FROM content_categories cc 
          JOIN categories cat ON cc.category_id = cat.id
          WHERE cc.content_id = c.id 
            AND cat.name IN (?)
        )
      ORDER BY content_type ASC
    `, [MUSIC_CATEGORIES]);

    // Process and sanitize content for kids
    const processedContent = musicContent.map(content => {
      const sanitized = sanitizeKidContent(content);
      // Add music-specific fields
      sanitized.music_score = content.music_score || 0;
      sanitized.has_video = content.has_video > 0;
      sanitized.is_music = true;
      return sanitized;
    });

    // Get popular music categories
    const popularCategories = await query(`
      SELECT cat.name, COUNT(*) as content_count
      FROM categories cat
      JOIN content_categories cc ON cat.id = cc.category_id
      JOIN contents c ON cc.content_id = c.id
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND cat.name IN (?)
      GROUP BY cat.name
      ORDER BY content_count DESC
      LIMIT 6
    `, [MUSIC_CATEGORIES]);

    res.json({
      success: true,
      data: {
        contents: processedContent,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0]?.total || 0,
          pages: Math.ceil((countResult[0]?.total || 0) / limit)
        },
        filters: {
          categories,
          genres,
          content_types: contentTypes.map(row => row.content_type),
          sort_options: [
            { value: 'popular', label: 'Most Popular' },
            { value: 'recent', label: 'Recently Added' },
            { value: 'rating', label: 'Highest Rated' },
            { value: 'trending', label: 'Trending Now' },
            { value: 'featured', label: 'Featured' },
            { value: 'alphabetical', label: 'A to Z' },
            { value: 'duration', label: 'Shortest First' }
          ]
        },
        popular_categories: popularCategories,
        search_query: searchQuery || null,
        kid_info: {
          name: kidProfile.name,
          max_age_rating: '12+ (Kid Safe)',
          is_family_member: kidProfile.is_family_member || false
        },
        metadata: {
          total_results: countResult[0]?.total || 0,
          music_categories_count: categories.length,
          music_genres_count: genres.length,
          total_videos_with_music: countResult[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching kid songs and music content:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch songs and music content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all controller functions
module.exports = {
  getKidLandingContent,
  getAllKidContent,
  getKidContentById,
  trackKidContentView,
  getKidLikedContent,
  getKidWatchLaterContent,
  getKidFilters,
  getKidViewingHistory,
  clearKidViewingHistory,
  getKidRecommendations,
  getKidDashboardStats,
  getKidContentPreferences,
  getBatchKidPreferences,
  searchKidContent,
  getKidTrendingContent,
  getKidLearningContent,
  toggleKidLikedContent,
  toggleKidWatchLaterContent,
  removeKidLikedContent,
  removeKidWatchLaterContent,
  getBatchKidLikesStatus,
  getKidSongsMusicContent,
  // Export constants for frontend if needed
  KID_ALLOWED_AGE_RATINGS,
  KID_BLOCKED_AGE_RATINGS
};