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

// Helper function to generate cache keys for kid content
const generateKidCacheKey = (type, identifier = '', kidProfileId = '') => {
  return `kid:${type}:${identifier}:profile_${kidProfileId}`;
};

// Helper function to check if cache is stale
const isCacheStale = (cacheEntry, cacheDuration) => {
  if (!cacheEntry || !cacheEntry.timestamp) return true;
  return Date.now() - cacheEntry.timestamp > cacheDuration;
};

// Helper function to clear related kid cache entries
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

// Safe data parsing function - handles both JSON arrays and comma-separated strings
const safeDataParse = (dataString, defaultValue = []) => {
  if (!dataString) return defaultValue;

  // If it's already an array or object, return it directly
  if (Array.isArray(dataString)) return dataString;
  if (typeof dataString === 'object') return dataString;

  // If it's not a string, return defaultValue
  if (typeof dataString !== 'string') return defaultValue;

  try {
    // First try to parse as JSON
    const parsed = JSON.parse(dataString);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (jsonError) {
    try {
      // If JSON fails, try to parse as comma-separated string
      if (dataString.includes(',')) {
        return dataString.split(',').map(item => item.trim()).filter(item => item);
      }
      // If it's a single string, return as array
      return [dataString.trim()];
    } catch (error) {
      console.error('Data parse error:', error);
      return defaultValue;
    }
  }
};

// Get age-appropriate content rating for kid based on your CUSTOM age ratings
const getKidAgeRating = (maxAgeRating) => {
  if (!maxAgeRating) return ['3+', '4+', '5+', '6+', '7+'];

  // Convert your custom age rating to appropriate content age ratings
  const age = parseInt(maxAgeRating);

  if (age <= 5) return ['3+', '4+', '5+'];
  if (age <= 7) return ['3+', '4+', '5+', '6+', '7+'];
  if (age <= 9) return ['3+', '4+', '5+', '6+', '7+', '8+', '9+'];
  if (age <= 12) return ['3+', '4+', '5+', '6+', '7+', '8+', '9+', '10+', '11+', '12+'];

  // Default safe ratings
  return ['3+', '4+', '5+', '6+', '7+'];
};

// Get kid-friendly categories from your categories table
const getKidFriendlyCategories = () => [
  'Animation', 'Family', 'Kids', 'Educational', 'Music',
  'Adventure', 'Fantasy', 'Comedy'
];

// Get kid-friendly genres from your genres table
const getKidFriendlyGenres = () => [
  'Animation', 'Family', 'Adventure', 'Fantasy', 'Educational',
  'Music', 'Comedy', 'Action'
];

// Filter and sanitize content for kids using your exact table structure
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
    primary_image_url: content.primary_image_url
  };
};

// 🆕 Track viewing history based on user type
const trackViewingHistory = async (userId, contentId, watchData, isFamilyMember = false) => {
  try {
    if (isFamilyMember) {
      // Family members use normal viewing history
      await query(`
        INSERT INTO content_view_history 
        (content_id, user_id, session_id, watch_duration_seconds, percentage_watched, device_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [contentId, userId, watchData.session_id, watchData.watch_duration_seconds, watchData.percentage_watched, watchData.device_type]);
    } else {
      // Regular kid profiles use kids viewing history
      await query(`
        INSERT INTO kids_viewing_history 
        (kid_profile_id, content_id, watch_duration_seconds, percentage_watched, device_type, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, contentId, watchData.watch_duration_seconds, watchData.percentage_watched, watchData.device_type, watchData.session_id]);
    }

    // Always update content view count
    await query(`
      UPDATE contents 
      SET view_count = view_count + 1
      WHERE id = ?
    `, [contentId]);

    return true;
  } catch (error) {
    console.error('Error tracking viewing history:', error);
    return false;
  }
};

// 🆕 Get favorites based on user type
const getFavorites = async (userId, isFamilyMember = false, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;

    if (isFamilyMember) {
      // Family members use normal watchlist
      const favorites = await query(`
        SELECT 
          uw.*,
          c.id as content_id,
          c.title,
          c.content_type,
          c.short_description,
          c.duration_minutes,
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
        FROM user_watchlist uw
        JOIN contents c ON uw.content_id = c.id
        WHERE uw.user_id = ?
          AND c.status = 'published'
          AND c.visibility = 'public'
        ORDER BY uw.added_at DESC
        LIMIT ? OFFSET ?
      `, [process.env.R2_PUBLIC_URL_ID, userId, parseInt(limit), parseInt(offset)]);

      const countResult = await query(`
        SELECT COUNT(*) as total 
        FROM user_watchlist 
        WHERE user_id = ?
      `, [userId]);

      return {
        favorites: favorites.map(item => ({
          id: item.id,
          added_at: item.added_at,
          content: sanitizeKidContent({
            ...item,
            id: item.content_id
          })
        })),
        total: countResult[0].total
      };
    } else {
      // Regular kid profiles use kids watchlist
      const favorites = await query(`
        SELECT 
          kw.*,
          c.id as content_id,
          c.title,
          c.content_type,
          c.short_description,
          c.duration_minutes,
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
        FROM kids_watchlist kw
        JOIN contents c ON kw.content_id = c.id
        WHERE kw.kid_profile_id = ?
          AND c.status = 'published'
          AND c.visibility = 'public'
        ORDER BY kw.added_at DESC
        LIMIT ? OFFSET ?
      `, [process.env.R2_PUBLIC_URL_ID, userId, parseInt(limit), parseInt(offset)]);

      const countResult = await query(`
        SELECT COUNT(*) as total 
        FROM kids_watchlist 
        WHERE kid_profile_id = ?
      `, [userId]);

      return {
        favorites: favorites.map(item => ({
          id: item.id,
          added_at: item.added_at,
          content: sanitizeKidContent({
            ...item,
            id: item.content_id
          })
        })),
        total: countResult[0].total
      };
    }
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return { favorites: [], total: 0 };
  }
};

// 🆕 Toggle favorites based on user type
const toggleFavorite = async (userId, contentId, action, isFamilyMember = false) => {
  try {
    if (isFamilyMember) {
      if (action === 'add') {
        await query(`
          INSERT IGNORE INTO user_watchlist (user_id, content_id, added_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [userId, contentId]);
      } else if (action === 'remove') {
        await query(`
          DELETE FROM user_watchlist 
          WHERE user_id = ? AND content_id = ?
        `, [userId, contentId]);
      }
    } else {
      if (action === 'add') {
        await query(`
          INSERT IGNORE INTO kids_watchlist (kid_profile_id, content_id, added_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [userId, contentId]);
      } else if (action === 'remove') {
        await query(`
          DELETE FROM kids_watchlist 
          WHERE kid_profile_id = ? AND content_id = ?
        `, [userId, contentId]);
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating favorites:', error);
    return false;
  }
};

// Get kid landing page content using your exact tables
const getKidLandingContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    if (!kidProfile) {
      return res.status(403).json({
        error: 'kid_profile_required',
        message: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    // 🆕 Special handling for family members
    if (kidProfile.is_family_member) {
      console.log('👨‍👩‍👧‍👦 Serving kid content for family member:', kidProfile.name);
      // Family members get access to kid content without strict session validation
    }

    const kidProfileId = kidProfile.kid_profile_id;
    const maxAgeRating = kidProfile.max_age_rating || '7+';
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

    console.log('Fetching fresh kid landing content from database');

    const ageRatings = getKidAgeRating(maxAgeRating);
    const kidCategories = getKidFriendlyCategories();
    const kidGenres = getKidFriendlyGenres();

    // Get blocked genres and allowed content types - USING SAFE DATA PARSE
    const blockedGenres = safeDataParse(kidProfile.blocked_genres, []);
    const allowedContentTypes = safeDataParse(kidProfile.allowed_content_types, ['cartoons', 'educational', 'family']);

    console.log('Kid profile data:', {
      maxAgeRating,
      blockedGenres,
      allowedContentTypes,
      ageRatings,
      is_family_member: kidProfile.is_family_member
    });

    // Helper function to get trailer for kid content
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
        res.status(500).json({
          error: 'Unable to load kid content at this time',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
        return null;

      }
    };

    // Helper function to get kid content with trailer
    const getKidContentWithTrailer = async (sqlQuery, params = []) => {
      try {
        const content = await query(sqlQuery, params);

        if (content.length > 0) {
          for (let item of content) {
            // Get trailer
            item.trailer = await getTrailerForKidContent(item.id);

            // Process genres and categories from your exact tables
            if (item.genre_names) {
              item.genres = item.genre_names.split(',').map((name, index) => ({
                id: item.genre_ids ? item.genre_ids.split(',')[index] : index,
                name: name.trim()
              }));
            } else {
              item.genres = [];
            }

            if (item.category_names) {
              item.categories = item.category_names.split(',').map((name, index) => ({
                id: item.category_ids ? item.category_ids.split(',')[index] : index,
                name: name.trim()
              }));
            } else {
              item.categories = [];
            }
          }
        }
        return content;
      } catch (error) {
        console.error('Error in getKidContentWithTrailer:', error);
        return [];
      }
    };

    // Get hero content for kid (featured and age-appropriate)
    let heroContent = await getKidContentWithTrailer(`
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
        AND c.age_rating IN (?)
        AND (c.featured = TRUE OR c.featured = 1)
        AND (c.trending = TRUE OR c.trending = 1)
        AND (cat.name IN (?) OR g.name IN (?))
        ${blockedGenres.length > 0 ? 'AND g.name NOT IN (?)' : ''}
      GROUP BY c.id
      ORDER BY c.featured_order DESC, c.view_count DESC, RAND()
      LIMIT 1
    `, [process.env.R2_PUBLIC_URL_ID, ageRatings, kidCategories, kidGenres, ...(blockedGenres.length > 0 ? [blockedGenres] : [])]);

    // Fallback: Any featured kid content
    if (heroContent.length === 0) {
      heroContent = await getKidContentWithTrailer(`
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
          AND c.age_rating IN (?)
          AND (c.featured = TRUE OR c.featured = 1)
          ${blockedGenres.length > 0 ? 'AND (g.name IS NULL OR g.name NOT IN (?))' : ''}
        GROUP BY c.id
        ORDER BY c.featured_order DESC, c.view_count DESC, RAND()
        LIMIT 1
      `, [process.env.R2_PUBLIC_URL_ID, ageRatings, ...(blockedGenres.length > 0 ? [blockedGenres] : [])]);
    }

    // Get featured kid content (excluding hero)
    const featuredContent = await getKidContentWithTrailer(`
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
        AND c.age_rating IN (?)
        AND (c.featured = TRUE OR c.featured = 1)
        AND c.id != ?
        ${blockedGenres.length > 0 ? 'AND (g.name IS NULL OR g.name NOT IN (?))' : ''}
      GROUP BY c.id
      ORDER BY c.featured_order DESC, c.view_count DESC
      LIMIT 8
    `, [process.env.R2_PUBLIC_URL_ID, ageRatings, heroContent[0]?.id || 0, ...(blockedGenres.length > 0 ? [blockedGenres] : [])]);

    // Get educational content
    const educationalContent = await getKidContentWithTrailer(`
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
        AND c.age_rating IN (?)
        AND (cat.name IN ('Animation', 'Documentary', 'Educational') OR g.name IN ('Animation', 'Educational'))
        ${blockedGenres.length > 0 ? 'AND (g.name IS NULL OR g.name NOT IN (?))' : ''}
      GROUP BY c.id
      ORDER BY c.view_count DESC, c.average_rating DESC
      LIMIT 8
    `, [process.env.R2_PUBLIC_URL_ID, ageRatings, ...(blockedGenres.length > 0 ? [blockedGenres] : [])]);

    // Get fun content
    const funContent = await getKidContentWithTrailer(`
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
        AND c.age_rating IN (?)
        AND (cat.name IN ('Comedy', 'Adventure', 'Fantasy', 'Family') OR g.name IN ('Comedy', 'Adventure', 'Fantasy'))
        ${blockedGenres.length > 0 ? 'AND (g.name IS NULL OR g.name NOT IN (?))' : ''}
      GROUP BY c.id
      ORDER BY c.view_count DESC, c.created_at DESC
      LIMIT 8
    `, [process.env.R2_PUBLIC_URL_ID, ageRatings, ...(blockedGenres.length > 0 ? [blockedGenres] : [])]);

    // Get recently added kid content
    const recentContent = await getKidContentWithTrailer(`
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
        AND c.age_rating IN (?)
        ${blockedGenres.length > 0 ? 'AND (g.name IS NULL OR g.name NOT IN (?))' : ''}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 12
    `, [process.env.R2_PUBLIC_URL_ID, ageRatings, ...(blockedGenres.length > 0 ? [blockedGenres] : [])]);

    // Process and sanitize all content for kids
    const processKidContent = (contentArray) => {
      return contentArray.map(content => sanitizeKidContent(content));
    };

    const responseData = {
      hero: processKidContent(heroContent)[0] || null,
      featured: processKidContent(featuredContent),
      educational: processKidContent(educationalContent),
      fun: processKidContent(funContent),
      recent: processKidContent(recentContent),
      kid_info: {
        name: kidProfile.name,
        max_age_rating: maxAgeRating,
        age_ratings: ageRatings,
        theme_color: kidProfile.theme_color || 'blue',
        is_family_member: kidProfile.is_family_member || false
      },
      last_updated: new Date().toISOString()
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

// Get all kid content with filtering using your exact tables
const getAllKidContent = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    if (!kidProfile) {
      return res.status(401).json({
        error: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const kidProfileId = kidProfile.kid_profile_id;
    const maxAgeRating = kidProfile.max_age_rating || '7+';
    const {
      page = 1,
      limit = 20,
      category,
      genre,
      type,
      sort = 'recent',
      refresh
    } = req.query;

    const offset = (page - 1) * limit;
    const cacheKey = generateKidCacheKey('contentList', `page_${page}_limit_${limit}_cat_${category}_genre_${genre}_type_${type}_sort_${sort}`, kidProfileId);
    const cacheEntry = kidContentCache.get(cacheKey);

    if (!refresh && cacheEntry && !isCacheStale(cacheEntry, kidCacheConfig.contentList)) {
      console.log('Serving kid content list from cache');
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp
      });
    }

    console.log('Fetching fresh kid content list from database');

    const ageRatings = getKidAgeRating(maxAgeRating);
    const blockedGenres = safeDataParse(kidProfile.blocked_genres, []);

    let whereConditions = [
      "c.status = 'published'",
      "c.visibility = 'public'",
      `c.age_rating IN (${ageRatings.map(() => '?').join(',')})`
    ];
    let queryParams = [...ageRatings];

    // Add filters
    if (category) {
      whereConditions.push("cat.name = ?");
      queryParams.push(category);
    }

    if (genre) {
      whereConditions.push("g.name = ?");
      queryParams.push(genre);
    }

    if (type) {
      whereConditions.push("c.content_type = ?");
      queryParams.push(type);
    }

    // Add blocked genres filter
    if (blockedGenres.length > 0) {
      whereConditions.push("(g.name IS NULL OR g.name NOT IN (?))");
      queryParams.push(blockedGenres);
    }

    // Build sort order
    let sortOrder = "c.created_at DESC";
    switch (sort) {
      case 'popular':
        sortOrder = "c.view_count DESC, c.average_rating DESC";
        break;
      case 'rating':
        sortOrder = "c.average_rating DESC, c.view_count DESC";
        break;
      case 'featured':
        sortOrder = "c.featured_order DESC, c.view_count DESC";
        break;
      case 'trending':
        sortOrder = "c.trending DESC, c.view_count DESC";
        break;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const contents = await query(`
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
      ${whereClause}
      GROUP BY c.id
      ORDER BY ${sortOrder}
      LIMIT ? OFFSET ?
    `, [process.env.R2_PUBLIC_URL_ID, ...queryParams, parseInt(limit), parseInt(offset)]);

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

    // Process and sanitize content
    const processedContents = contents.map(content => sanitizeKidContent(content));

    const responseData = {
      contents: processedContents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      },
      filters: {
        category,
        genre,
        type,
        sort,
        age_ratings: ageRatings
      },
      last_updated: new Date().toISOString()
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
    console.error('Error fetching kid content:', error);
    res.status(500).json({
      error: 'Unable to load kid content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single kid content by ID with age verification
const getKidContentById = async (req, res) => {
  try {
    const { contentId } = req.params;
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(401).json({
        error: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const kidProfileId = kidProfile.kid_profile_id;
    const maxAgeRating = kidProfile.max_age_rating || '7+';
    const cacheKey = generateKidCacheKey('singleContent', contentId, kidProfileId);
    const cacheEntry = kidContentCache.get(cacheKey);
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && cacheEntry && !isCacheStale(cacheEntry, kidCacheConfig.singleContent)) {
      console.log('Serving kid single content from cache');
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp
      });
    }

    console.log('Fetching fresh kid single content from database');

    const ageRatings = getKidAgeRating(maxAgeRating);
    const blockedGenres = safeDataParse(kidProfile.blocked_genres, []);

    // Get content with age restriction check using your exact tables
    const contentRows = await query(`
      SELECT 
        c.*,
        cr.license_type,
        cr.downloadable,
        cr.shareable
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      WHERE c.id = ? 
        AND c.status = 'published' 
        AND c.visibility = 'public'
        AND c.age_rating IN (?)
    `, [contentId, ageRatings]);

    if (contentRows.length === 0) {
      return res.status(404).json({
        error: 'Content not found or not appropriate for this age'
      });
    }

    let content = contentRows[0];

    // Check if content is in blocked genres
    if (blockedGenres.length > 0) {
      const contentGenres = await query(`
        SELECT g.name 
        FROM content_genres cg 
        JOIN genres g ON cg.genre_id = g.id 
        WHERE cg.content_id = ?
      `, [contentId]);

      const hasBlockedGenre = contentGenres.some(genre => blockedGenres.includes(genre.name));
      if (hasBlockedGenre) {
        return res.status(403).json({
          error: 'This content is restricted for your kid profile'
        });
      }
    }

    // Get media assets
    const mediaAssets = await query(`
      SELECT 
        ma.*,
        CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path) as url
      FROM media_assets ma 
      WHERE ma.content_id = ? 
        AND ma.upload_status = 'completed'
      ORDER BY 
        ma.is_primary DESC,
        FIELD(ma.asset_type, 'mainVideo', 'trailer', 'poster', 'thumbnail'),
        ma.created_at DESC
    `, [process.env.R2_PUBLIC_URL_ID, contentId]);
    content.media_assets = mediaAssets;

    // Get trailer
    content.trailer = mediaAssets.find(asset => asset.asset_type === 'trailer') || null;

    // Get primary image
    const primaryImage = mediaAssets.find(asset =>
      asset.is_primary && (asset.asset_type === 'poster' || asset.asset_type === 'thumbnail')
    ) || mediaAssets.find(asset =>
      asset.asset_type === 'poster' || asset.asset_type === 'thumbnail'
    );
    content.primary_image_url = primaryImage?.url || null;

    // Get genres and categories from your exact tables
    const genres = await query(`
      SELECT g.* 
      FROM content_genres cg 
      JOIN genres g ON cg.genre_id = g.id 
      WHERE cg.content_id = ?
      ORDER BY cg.is_primary DESC, g.name ASC
    `, [contentId]);
    content.genres = genres;

    const categories = await query(`
      SELECT cat.* 
      FROM content_categories cc 
      JOIN categories cat ON cc.category_id = cat.id 
      WHERE cc.content_id = ?
      ORDER BY cat.name ASC
    `, [contentId]);
    content.categories = categories;

    // Get similar kid content
    const similarContent = await query(`
      SELECT DISTINCT
        c.id,
        c.title,
        c.content_type,
        c.duration_minutes,
        c.short_description,
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
      JOIN content_genres cg ON c.id = cg.content_id
      WHERE cg.genre_id IN (
        SELECT genre_id FROM content_genres WHERE content_id = ?
      )
      AND c.id != ?
      AND c.status = 'published'
      AND c.visibility = 'public'
      AND c.age_rating IN (?)
      ${blockedGenres.length > 0 ? 'AND (g.name IS NULL OR g.name NOT IN (?))' : ''}
      GROUP BY c.id
      ORDER BY COUNT(cg.genre_id) DESC, c.view_count DESC
      LIMIT 6
    `, [process.env.R2_PUBLIC_URL_ID, contentId, contentId, ageRatings, ...(blockedGenres.length > 0 ? [blockedGenres] : [])]);
    content.similar_content = similarContent.map(item => sanitizeKidContent(item));

    // Sanitize the main content
    content = sanitizeKidContent(content);
    content.last_updated = new Date().toISOString();

    // Update cache
    kidContentCache.set(cacheKey, {
      data: content,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: content,
      cached: false,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching kid content by ID:', error);
    res.status(500).json({
      error: 'Unable to load content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Track kid content view using appropriate table based on user type
const trackKidContentView = async (req, res) => {
  try {
    const { contentId } = req.params;
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(401).json({
        error: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const { watch_duration_seconds = 0, percentage_watched = 0, device_type = 'web' } = req.body;

    // Verify content exists and is age-appropriate
    const ageRatings = getKidAgeRating(kidProfile.max_age_rating || '7+');
    const content = await query(`
      SELECT id FROM contents 
      WHERE id = ? 
        AND status = 'published' 
        AND visibility = 'public'
        AND age_rating IN (?)
    `, [contentId, ageRatings]);

    if (content.length === 0) {
      return res.status(404).json({
        error: 'Content not found or not appropriate'
      });
    }

    // Track viewing history based on user type
    const userId = kidProfile.is_family_member ? req.user.id : kidProfile.kid_profile_id;
    const success = await trackViewingHistory(
      userId,
      contentId,
      {
        watch_duration_seconds,
        percentage_watched,
        device_type,
        session_id: req.sessionID
      },
      kidProfile.is_family_member
    );

    if (!success) {
      return res.status(500).json({
        error: 'Unable to track view'
      });
    }

    // Clear related cache
    clearKidRelatedCache(contentId, kidProfile.kid_profile_id);

    res.json({
      success: true,
      message: 'View tracked successfully',
      user_type: kidProfile.is_family_member ? 'family_member' : 'kid_profile'
    });

  } catch (error) {
    console.error('Error tracking kid content view:', error);
    res.status(500).json({
      error: 'Unable to track view'
    });
  }
};

// Get kid's favorite content using appropriate table based on user type
const getKidFavorites = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    if (!kidProfile) {
      return res.status(401).json({
        error: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const { page = 1, limit = 20 } = req.query;

    const userId = kidProfile.is_family_member ? req.user.id : kidProfile.kid_profile_id;
    const favoritesData = await getFavorites(userId, kidProfile.is_family_member, page, limit);

    res.json({
      success: true,
      data: {
        favorites: favoritesData.favorites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: favoritesData.total,
          pages: Math.ceil(favoritesData.total / limit)
        },
        user_type: kidProfile.is_family_member ? 'family_member' : 'kid_profile'
      }
    });

  } catch (error) {
    console.error('Error fetching kid favorites:', error);
    res.status(500).json({
      error: 'Unable to fetch favorites'
    });
  }
};

// Add/Remove from kid favorites using appropriate table based on user type
const toggleKidFavorite = async (req, res) => {
  try {
    const { contentId, action } = req.body;
    const kidProfile = req.kid_profile;

    if (!kidProfile) {
      return res.status(401).json({
        error: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required'
      });
    }

    // Verify content exists and is age-appropriate
    const ageRatings = getKidAgeRating(kidProfile.max_age_rating || '7+');
    const content = await query(`
      SELECT id FROM contents 
      WHERE id = ? 
        AND status = 'published' 
        AND visibility = 'public'
        AND age_rating IN (?)
    `, [contentId, ageRatings]);

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found or not appropriate'
      });
    }

    const userId = kidProfile.is_family_member ? req.user.id : kidProfile.kid_profile_id;
    const success = await toggleFavorite(userId, contentId, action, kidProfile.is_family_member);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Unable to update favorites'
      });
    }

    res.json({
      success: true,
      message: action === 'add' ? 'Added to favorites' : 'Removed from favorites',
      action: action === 'add' ? 'added' : 'removed',
      data: { isFavorite: action === 'add' },
      user_type: kidProfile.is_family_member ? 'family_member' : 'kid_profile'
    });

  } catch (error) {
    console.error('Error updating kid favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update favorites'
    });
  }
};

// Get kid categories and genres for filtering using your exact tables
const getKidFilters = async (req, res) => {
  try {
    const kidProfile = req.kid_profile;
    if (!kidProfile) {
      return res.status(401).json({
        error: 'Kid profile not found. Please enter kid mode first.'
      });
    }

    const maxAgeRating = kidProfile.max_age_rating || '7+';
    const ageRatings = getKidAgeRating(maxAgeRating);
    const blockedGenres = safeDataParse(kidProfile.blocked_genres, []);

    // Get kid-friendly categories from your categories table
    const categories = await query(`
      SELECT DISTINCT cat.id, cat.name, cat.description
      FROM categories cat
      JOIN content_categories cc ON cat.id = cc.category_id
      JOIN contents c ON cc.content_id = c.id
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND c.age_rating IN (?)
        AND cat.name IN (?)
      ORDER BY cat.name ASC
    `, [ageRatings, getKidFriendlyCategories()]);

    // Get kid-friendly genres from your genres table
    const genres = await query(`
      SELECT DISTINCT g.id, g.name, g.description
      FROM genres g
      JOIN content_genres cg ON g.id = cg.genre_id
      JOIN contents c ON cg.content_id = c.id
      WHERE c.status = 'published'
        AND c.visibility = 'public'
        AND c.age_rating IN (?)
        AND g.name IN (?)
        ${blockedGenres.length > 0 ? 'AND g.name NOT IN (?)' : ''}
      ORDER BY g.name ASC
    `, [ageRatings, getKidFriendlyGenres(), ...(blockedGenres.length > 0 ? [blockedGenres] : [])]);

    // Get content types available for kids
    const contentTypes = await query(`
      SELECT DISTINCT content_type
      FROM contents
      WHERE status = 'published'
        AND visibility = 'public'
        AND age_rating IN (?)
      ORDER BY content_type ASC
    `, [ageRatings]);

    res.json({
      success: true,
      data: {
        categories,
        genres,
        content_types: contentTypes.map(row => row.content_type),
        age_ratings: ageRatings,
        kid_name: kidProfile.name,
        max_age_rating: maxAgeRating,
        is_family_member: kidProfile.is_family_member || false
      }
    });

  } catch (error) {
    console.error('Error fetching kid filters:', error);
    res.status(500).json({
      error: 'Unable to load filters'
    });
  }
};

module.exports = {
  getKidLandingContent,
  getAllKidContent,
  getKidContentById,
  trackKidContentView,
  getKidFavorites,
  toggleKidFavorite,
  getKidFilters
};