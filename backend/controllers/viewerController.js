const { query } = require("../config/dbConfig");

// Cache configuration
const cacheConfig = {
  landingContent: 5 * 60 * 1000, // 5 minutes
  contentList: 2 * 60 * 1000,   // 2 minutes
  singleContent: 1 * 60 * 1000,  // 1 minute
  watchHistory: 0,               // No cache - always fresh
};

// In-memory cache with timestamp tracking
const contentCache = new Map();

// Helper function to generate cache keys
const generateCacheKey = (type, identifier = '') => {
  return `${type}:${identifier}`;
};

// Helper function to check if cache is stale
const isCacheStale = (cacheEntry, cacheDuration) => {
  if (!cacheEntry || !cacheEntry.timestamp) return true;
  return Date.now() - cacheEntry.timestamp > cacheDuration;
};

// Helper function to clear related cache entries
const clearRelatedCache = (contentId = null) => {
  const keysToDelete = [];

  for (const key of contentCache.keys()) {
    if (key.startsWith('landing') ||
      key.startsWith('contentList') ||
      (contentId && key.includes(contentId))) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => contentCache.delete(key));
  console.log(`Cleared ${keysToDelete.length} cache entries`);
};

// Get viewer landing page content - FIXED VERSION
const getViewerLandingContent = async (req, res) => {
  try {
    const userId = req.user?.id;
    const cacheKey = generateCacheKey('landing', userId || 'public');
    const cacheEntry = contentCache.get(cacheKey);

    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && cacheEntry && !isCacheStale(cacheEntry, cacheConfig.landingContent)) {
      console.log('Serving landing content from cache');
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp
      });
    }

    console.log('Fetching fresh landing content from database');

    // Helper function to get trailer for a single content item
    const getTrailerForContent = async (contentId) => {
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
        console.error('Error fetching trailer for content:', contentId, error);
        return null;
      }
    };

    // Helper function to get content with trailer
    const getContentWithTrailer = async (sqlQuery, params = []) => {
      try {
        const content = await query(sqlQuery, params);

        if (content.length > 0) {
          for (let item of content) {
            // Get trailer
            item.trailer = await getTrailerForContent(item.id);

            // Get cast count for frontend display
            const castCount = await query(`
          SELECT COUNT(*) as count 
          FROM content_people 
          WHERE content_id = ? AND role_type = 'actor'
        `, [item.id]);
            item.cast_count = castCount[0]?.count || 0;

            // Process genres and categories properly
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
        console.error('Error in getContentWithTrailer:', error);
        return [];
      }
    };

    let heroContent = [];
    let heroContentId = null;

    // Try: Featured AND Trending content (highest priority)
    if (heroContent.length === 0) {
      console.log('Trying featured + trending content for hero...');
      heroContent = await getContentWithTrailer(`
        SELECT 
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
          AND (c.featured = TRUE OR c.featured = 1)
          AND (c.trending = TRUE OR c.trending = 1)
        GROUP BY c.id
        ORDER BY RAND()
        LIMIT 1
      `, [process.env.R2_PUBLIC_URL_ID]);
    }

    // Fallback: Featured content only
    if (heroContent.length === 0) {
      console.log('Trying featured content for hero...');
      heroContent = await getContentWithTrailer(`
        SELECT 
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
          AND (c.featured = TRUE OR c.featured = 1)
        GROUP BY c.id
        ORDER BY RAND()
        LIMIT 1
      `, [process.env.R2_PUBLIC_URL_ID]);
    }

    // Fallback: Trending content
    if (heroContent.length === 0) {
      console.log('Trying trending content for hero...');
      heroContent = await getContentWithTrailer(`
        SELECT 
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
          AND (c.trending = TRUE OR c.trending = 1 OR c.view_count > 50)
        GROUP BY c.id
        ORDER BY RAND()
        LIMIT 1
      `, [process.env.R2_PUBLIC_URL_ID]);
    }

    // Fallback: Recent content
    if (heroContent.length === 0) {
      console.log('Trying recent content for hero...');
      heroContent = await getContentWithTrailer(`
        SELECT 
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
          AND c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY c.id
        ORDER BY RAND()
        LIMIT 1
      `, [process.env.R2_PUBLIC_URL_ID]);
    }

    // Final fallback: Any published content
    if (heroContent.length === 0) {
      console.log('Trying any published content for hero...');
      heroContent = await getContentWithTrailer(`
        SELECT 
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
        GROUP BY c.id
        ORDER BY RAND()
        LIMIT 1
      `, [process.env.R2_PUBLIC_URL_ID]);
    }

    heroContentId = heroContent[0]?.id || null;

    // Get other content sections with trailers
    const getSectionContent = async (sqlQuery, params = []) => {
      try {
        const content = await query(sqlQuery, params);

        // Get trailers for all content in this section
        for (let item of content) {
          item.trailer = await getTrailerForContent(item.id);
        }

        return content;
      } catch (error) {
        console.error('Error in getSectionContent:', error);
        return [];
      }
    };

    // Get featured content (excluding hero if found)
    let featuredContent;
    if (heroContentId) {
      featuredContent = await getSectionContent(`
        SELECT 
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
          AND (c.featured = TRUE OR c.featured = 1)
          AND c.id != ?
        GROUP BY c.id
        ORDER BY c.featured_order DESC, c.view_count DESC
        LIMIT 5
      `, [process.env.R2_PUBLIC_URL_ID, heroContentId]);
    } else {
      featuredContent = await getSectionContent(`
        SELECT 
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
          AND (c.featured = TRUE OR c.featured = 1)
        GROUP BY c.id
        ORDER BY c.featured_order DESC, c.view_count DESC
        LIMIT 5
      `, [process.env.R2_PUBLIC_URL_ID]);
    }

    // Get trending content
    const trendingContent = await getSectionContent(`
      SELECT 
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
        AND (c.trending = TRUE OR c.trending = 1 OR c.view_count > 100)
      GROUP BY c.id
      ORDER BY c.trending DESC, c.view_count DESC
      LIMIT 12
    `, [process.env.R2_PUBLIC_URL_ID]);

    // Get recently added content
    const recentContent = await getSectionContent(`
      SELECT 
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
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 16
    `, [process.env.R2_PUBLIC_URL_ID]);

    console.log('Content Stats with Trailers:', {
      hero: heroContent.length,
      featured: featuredContent.length,
      trending: trendingContent.length,
      recent: recentContent.length,
      timestamp: new Date().toISOString()
    });

    // Process content data
    const processContent = (contentArray) => {
      return contentArray.map(content => {
        let imageUrl = content.primary_image_url;
        if (!imageUrl || imageUrl.includes('null')) {
          imageUrl = '/api/placeholder/300/450';
        }

        const processedContent = {
          ...content,
          // Ensure genres and categories are properly structured
          genres: content.genres || (content.genre_names ? content.genre_names.split(',').map((name, index) => ({
            id: content.genre_ids ? content.genre_ids.split(',')[index] : index,
            name: name.trim()
          })) : []),
          categories: content.categories || (content.category_names ? content.category_names.split(',').map((name, index) => ({
            id: content.category_ids ? content.category_ids.split(',')[index] : index,
            name: name.trim()
          })) : []),
          media_assets: imageUrl ? [{
            asset_type: 'thumbnail',
            file_path: imageUrl.replace(`https://pub-${process.env.R2_PUBLIC_URL_ID}.r2.dev/`, ''),
            url: imageUrl,
            is_primary: 1,
            upload_status: 'completed'
          }] : [],
          // Explicitly include the trailer
          trailer: content.trailer || null,
          last_updated: content.updated_at || content.created_at,
          // Additional fields for frontend
          cast_count: content.cast_count || 0
        };

        return processedContent;
      });
    };

    const processedHero = processContent(heroContent)[0] || null;
    const processedFeatured = processContent(featuredContent);
    const processedTrending = processContent(trendingContent);
    const processedRecent = processContent(recentContent);

    // DEBUG: Final check before sending response
    console.log('🔍 DEBUG Final Response - Hero ID:', processedHero?.id);
    console.log('🔍 DEBUG Final Response - Hero trailer exists:', !!processedHero?.trailer);
    console.log('🔍 DEBUG Final Response - Hero trailer URL:', processedHero?.trailer?.url);
    console.log('🔍 DEBUG Final Response - Hero trailer data:', processedHero?.trailer);

    const responseData = {
      hero: processedHero,
      featured: processedFeatured,
      trending: processedTrending,
      recent: processedRecent,
      last_updated: new Date().toISOString()
    };

    // Update cache
    contentCache.set(cacheKey, {
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
    console.error('Error fetching viewer landing content:', error);
    res.status(500).json({
      error: 'Unable to load content at this time',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all published content for viewer
const getAllViewerContent = async (req, res) => {
  try {
    const { page = 1, limit = 50, refresh } = req.query;
    const offset = (page - 1) * limit;
    const cacheKey = generateCacheKey('contentList', `page_${page}_limit_${limit}`);
    const cacheEntry = contentCache.get(cacheKey);

    // Force refresh or check cache staleness
    if (!refresh && cacheEntry && !isCacheStale(cacheEntry, cacheConfig.contentList)) {
      console.log('Serving content list from cache');
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp
      });
    }

    console.log('Fetching fresh content list from database');

    const contents = await query(`
      SELECT 
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
        GREATEST(c.updated_at, c.created_at) as content_recency
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
      GROUP BY c.id
      ORDER BY content_recency DESC, c.created_at DESC
      LIMIT ? OFFSET ?
    `, [process.env.R2_PUBLIC_URL_ID, parseInt(limit), parseInt(offset)]);

    // Get total count for pagination
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM contents 
      WHERE status = 'published' AND visibility = 'public'
    `);

    // Process content data
    const processedContents = contents.map(content => {
      let imageUrl = content.primary_image_url;
      if (!imageUrl || imageUrl.includes('null')) {
        imageUrl = '/api/placeholder/300/450';
      }

      return {
        ...content,
        genres: content.genre_names ? content.genre_names.split(',').map((name, index) => ({
          id: content.genre_ids ? content.genre_ids.split(',')[index] : index,
          name: name.trim()
        })) : [],
        categories: content.category_names ? content.category_names.split(',').map((name, index) => ({
          id: content.category_ids ? content.category_ids.split(',')[index] : index,
          name: name.trim()
        })) : [],
        media_assets: imageUrl ? [{
          asset_type: 'thumbnail',
          file_path: imageUrl.replace(`https://pub-${process.env.R2_PUBLIC_URL_ID}.r2.dev/`, ''),
          url: imageUrl,
          is_primary: 1,
          upload_status: 'completed'
        }] : [],
        last_updated: content.updated_at || content.created_at
      };
    });

    const responseData = {
      contents: processedContents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      },
      last_updated: new Date().toISOString()
    };

    // Update cache
    contentCache.set(cacheKey, {
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
    console.error('Error fetching all viewer content:', error);
    res.status(500).json({
      error: 'Unable to load content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single content for viewer
const getViewerContentById = async (req, res) => {
  try {
    const { contentId } = req.params;
    const cacheKey = generateCacheKey('singleContent', contentId);
    const cacheEntry = contentCache.get(cacheKey);
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && cacheEntry && !isCacheStale(cacheEntry, cacheConfig.singleContent)) {
      console.log('Serving single content from cache');
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp
      });
    }

    console.log('Fetching fresh single content from database');

    // Get main content with latest metrics
    const contentRows = await query(`
      SELECT 
        c.*,
        cr.license_type,
        cr.downloadable,
        cr.shareable,
        cr.allowed_regions,
        cr.blocked_countries,
        cr.license_fee,
        cr.revenue_share_percentage,
        cr.start_date,
        cr.end_date,
        (
          SELECT COUNT(*) 
          FROM content_view_history 
          WHERE content_id = c.id 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ) as recent_views_24h
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      WHERE c.id = ? 
        AND c.status = 'published' 
        AND c.visibility = 'public'
    `, [contentId]);

    if (contentRows.length === 0) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    const content = contentRows[0];

    // Get fresh genres with proper structure
    const genres = await query(`
      SELECT g.* 
      FROM content_genres cg 
      JOIN genres g ON cg.genre_id = g.id 
      WHERE cg.content_id = ?
      ORDER BY cg.is_primary DESC, g.name ASC
    `, [contentId]);
    content.genres = genres;

    // Get fresh categories with proper structure
    const categories = await query(`
      SELECT cat.* 
      FROM content_categories cc 
      JOIN categories cat ON cc.category_id = cat.id 
      WHERE cc.content_id = ?
      ORDER BY cat.name ASC
    `, [contentId]);
    content.categories = categories;

    // Get ALL media assets including trailers, posters, thumbnails, etc.
    const mediaAssets = await query(`
      SELECT 
        ma.*,
        CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path) as url
      FROM media_assets ma 
      WHERE ma.content_id = ? 
        AND ma.upload_status = 'completed'
      ORDER BY 
        ma.is_primary DESC,
        FIELD(ma.asset_type, 'mainVideo', 'trailer', 'poster', 'thumbnail', 'behind_scenes', 'screenshot', 'teaser', 'key_art'),
        ma.season_number,
        ma.episode_number,
        ma.created_at DESC
    `, [process.env.R2_PUBLIC_URL_ID, contentId]);
    content.media_assets = mediaAssets;

    // Get specific trailer asset (for easy access)
    const trailerAsset = mediaAssets.find(asset => asset.asset_type === 'trailer');
    content.trailer = trailerAsset || null;

    // Get primary image (poster or thumbnail)
    const primaryImage = mediaAssets.find(asset =>
      asset.is_primary && (asset.asset_type === 'poster' || asset.asset_type === 'thumbnail')
    ) || mediaAssets.find(asset =>
      asset.asset_type === 'poster' || asset.asset_type === 'thumbnail'
    );
    content.primary_image_url = primaryImage?.url || null;

    // Get content warnings
    const warnings = await query(`
      SELECT * FROM content_warnings 
      WHERE content_id = ?
      ORDER BY severity DESC, warning_type ASC
    `, [contentId]);
    content.content_warnings = warnings;

    // FIXED: Escape reserved keyword 'default'
    const languages = await query(`
      SELECT 
        cs.*,
        cs.language_code as code,
        cs.is_default as \`default\`
      FROM content_subtitles cs 
      WHERE cs.content_id = ?
      ORDER BY cs.is_default DESC, cs.language_code ASC
    `, [contentId]);
    content.available_languages = languages;

    // Get cast and crew with people details
    const castCrew = await query(`
      SELECT 
        cp.*,
        p.full_name,
        p.display_name,
        p.primary_role,
        p.profile_image_url,
        p.bio,
        p.date_of_birth,
        p.nationality,
        p.gender
      FROM content_people cp
      JOIN people p ON cp.person_id = p.id
      WHERE cp.content_id = ?
      ORDER BY 
        cp.billing_order ASC,
        FIELD(cp.role_type, 'director', 'producer', 'writer', 'actor', 'cinematographer', 'composer', 'editor', 'crew'),
        cp.character_name IS NULL,
        cp.character_name ASC
    `, [contentId]);
    content.cast_crew = castCrew;

    // Separate cast from crew for easier frontend usage
    content.cast = castCrew.filter(person => person.role_type === 'actor');
    content.crew = castCrew.filter(person => person.role_type !== 'actor');

    // Get real-time ratings stats with reviews
    const ratingStats = await query(`
      SELECT 
        AVG(rating) as current_rating,
        COUNT(*) as current_rating_count,
        COUNT(CASE WHEN review_text IS NOT NULL AND review_text != '' THEN 1 END) as review_count
      FROM content_ratings 
      WHERE content_id = ?
    `, [contentId]);

    content.current_rating = parseFloat(ratingStats[0].current_rating || 0).toFixed(2);
    content.current_rating_count = ratingStats[0].current_rating_count || 0;
    content.review_count = ratingStats[0].review_count || 0;

    // For series content, get detailed seasons and episodes
    if (content.content_type === 'series') {
      const seasons = await query(`
        SELECT 
          s.*,
          (
            SELECT COUNT(*) 
            FROM episodes e 
            WHERE e.season_id = s.id
          ) as actual_episode_count,
          (
            SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
            FROM media_assets ma 
            WHERE ma.content_id = s.content_id 
              AND ma.season_number = s.season_number
              AND ma.asset_type = 'season_poster'
              AND ma.upload_status = 'completed'
            LIMIT 1
          ) as season_poster_url
        FROM seasons s 
        WHERE s.content_id = ? 
        ORDER BY s.season_number ASC
      `, [process.env.R2_PUBLIC_URL_ID, contentId]);

      // Get episodes for each season with media assets
      for (let season of seasons) {
        season.episodes = await query(`
          SELECT 
            e.*,
            (
              SELECT COUNT(*)
              FROM media_assets ma
              WHERE ma.content_id = ? 
                AND ma.season_number = e.season_number
                AND ma.episode_number = e.episode_number
                AND ma.upload_status = 'completed'
            ) as media_assets_count,
            (
              SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
              FROM media_assets ma 
              WHERE ma.content_id = ? 
                AND ma.season_number = e.season_number
                AND ma.episode_number = e.episode_number
                AND ma.asset_type = 'episodeThumbnail'
                AND ma.upload_status = 'completed'
              LIMIT 1
            ) as episode_thumbnail_url
          FROM episodes e 
          WHERE e.season_id = ?
          ORDER BY e.episode_number ASC
        `, [contentId, process.env.R2_PUBLIC_URL_ID, contentId, season.id]);
      }
      content.seasons = seasons;
    }

    // Get similar content based on genres
    const similarContent = await query(`
      SELECT 
        c.id,
        c.title,
        c.content_type,
        c.duration_minutes,
        c.release_date,
        c.average_rating,
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
      GROUP BY c.id
      ORDER BY COUNT(cg.genre_id) DESC, c.view_count DESC
      LIMIT 6
    `, [process.env.R2_PUBLIC_URL_ID, contentId, contentId]);
    content.similar_content = similarContent;

    // Get content statistics
    const contentStats = await query(`
      SELECT 
        COUNT(DISTINCT cvh.user_id) as unique_viewers,
        AVG(cvh.percentage_watched) as avg_completion_rate,
        SUM(cvh.watch_duration_seconds) as total_watch_time_seconds
      FROM content_view_history cvh
      WHERE cvh.content_id = ?
    `, [contentId]);
    content.stats = contentStats[0] || {};

    // Get awards and nominations for this content
    const awards = await query(`
      SELECT 
        pa.*,
        p.full_name as person_name,
        p.display_name as person_display_name
      FROM person_awards pa
      LEFT JOIN people p ON pa.person_id = p.id
      WHERE pa.content_id = ?
      ORDER BY pa.award_year DESC, pa.result DESC
    `, [contentId]);
    content.awards = awards;

    content.last_updated = new Date().toISOString();

    // Update cache
    contentCache.set(cacheKey, {
      data: content,
      timestamp: Date.now()
    });

    console.log('✅ Enhanced content data fetched successfully for ID:', contentId);
    console.log('📊 Content stats:', {
      media_assets: content.media_assets?.length || 0,
      cast_crew: content.cast_crew?.length || 0,
      genres: content.genres?.length || 0,
      categories: content.categories?.length || 0,
      seasons: content.seasons?.length || 0,
      similar_content: content.similar_content?.length || 0,
      languages: content.available_languages?.length || 0
    });

    res.json({
      success: true,
      data: content,
      cached: false,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching content by ID:', error);
    res.status(500).json({
      error: 'Unable to load content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Track content view
const trackContentView = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;
    const { watch_duration_seconds = 0, percentage_watched = 0, device_type = 'web' } = req.body;

    // Verify content exists and is accessible
    const content = await query(`
      SELECT id FROM contents 
      WHERE id = ? 
        AND status = 'published' 
        AND visibility = 'public'
    `, [contentId]);

    if (content.length === 0) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    // Insert view history
    await query(`
      INSERT INTO content_view_history 
      (content_id, user_id, watch_duration_seconds, percentage_watched, device_type)
      VALUES (?, ?, ?, ?, ?)
    `, [contentId, userId, watch_duration_seconds, percentage_watched, device_type]);

    // Update content view count - removed last_viewed_at
    await query(`
      UPDATE contents 
      SET view_count = view_count + 1
      WHERE id = ?
    `, [contentId]);

    // Clear related cache entries to ensure fresh data
    clearRelatedCache(contentId);

    res.json({
      success: true,
      message: 'View tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking content view:', error);
    res.status(500).json({
      error: 'Unable to track view',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Rate content
const rateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;
    const { rating, review_title, review_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Verify content exists and is accessible
    const content = await query(`
      SELECT id FROM contents 
      WHERE id = ? 
        AND status = 'published' 
        AND visibility = 'public'
    `, [contentId]);

    if (content.length === 0) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    // Check if user already rated this content
    const existingRating = await query(`
      SELECT id FROM content_ratings 
      WHERE content_id = ? AND user_id = ?
    `, [contentId, userId]);

    if (existingRating.length > 0) {
      // Update existing rating
      await query(`
        UPDATE content_ratings 
        SET rating = ?, review_title = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE content_id = ? AND user_id = ?
      `, [rating, review_title, review_text, contentId, userId]);
    } else {
      // Insert new rating
      await query(`
        INSERT INTO content_ratings 
        (content_id, user_id, rating, review_title, review_text)
        VALUES (?, ?, ?, ?, ?)
      `, [contentId, userId, rating, review_title, review_text]);
    }

    // Recalculate average rating
    const ratingStats = await query(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as rating_count
      FROM content_ratings 
      WHERE content_id = ?
    `, [contentId]);

    await query(`
      UPDATE contents 
      SET average_rating = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      parseFloat(ratingStats[0].avg_rating || 0).toFixed(2),
      ratingStats[0].rating_count || 0,
      contentId
    ]);

    // Clear related cache entries
    clearRelatedCache(contentId);

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Error rating content:', error);
    res.status(500).json({
      error: 'Unable to submit rating',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's watch history
const getWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const history = await query(`
      SELECT 
        cvh.*,
        c.title,
        c.content_type,
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
        ) as thumbnail_url
      FROM content_view_history cvh
      JOIN contents c ON cvh.content_id = c.id
      WHERE cvh.user_id = ?
      ORDER BY cvh.created_at DESC
      LIMIT ? OFFSET ?
    `, [process.env.R2_PUBLIC_URL_ID, userId, parseInt(limit), parseInt(offset)]);

    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM content_view_history 
      WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({
      error: 'Unable to fetch watch history'
    });
  }
};

module.exports = {
  getViewerLandingContent,
  getAllViewerContent,
  getViewerContentById,
  trackContentView,
  rateContent,
  getWatchHistory
};