const { query } = require("../config/dbConfig");

// Cache configuration
const cacheConfig = {
  landingContent: 5 * 60 * 1000, // 5 minutes
  contentList: 2 * 60 * 1000,   // 2 minutes
  singleContent: 1 * 60 * 1000,  // 1 minute
  watchHistory: 0,               // No cache - always fresh
};

// Security configuration
const securityConfig = {
  maxDevicesPerUser: 5,
  allowedDeviceTypes: ['web', 'mobile', 'tablet', 'smarttv'],
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxConcurrentStreams: 3,
  geoCheckEnabled: true
};

// In-memory cache with timestamp tracking
const contentCache = new Map();

// Trending algorithm configuration for intelligent content recommendations
const TRENDING_CONFIG = {
  weights: {
    viewCount: 0.35,
    recentViews: 0.30,
    engagementRate: 0.20,
    likeRatio: 0.10,
    ratingScore: 0.05,
  },
  timeWindows: {
    recentViews: 7,     // Days for recent views calculation
    engagement: 30,     // Days for engagement calculation
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

// Trending cache for performance optimization
const trendingCache = new Map();
const TRENDING_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Cache cleanup every hour to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of trendingCache.entries()) {
    if (now - value.timestamp > TRENDING_CACHE_DURATION * 6) {
      trendingCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

// Kid content configuration - defines what is considered kid-friendly
const KID_CONTENT_CONFIG = {
  // Age ratings allowed for kids (in order of strictness)
  allowedAgeRatings: ['G', 'PG', '7+', '13+'],

  // Categories considered kid-friendly
  kidFriendlyCategories: ['Family', 'Animation', 'Cartoons', 'Educational'],

  // Genres considered kid-friendly
  kidFriendlyGenres: ['Family', 'Animation', 'Children'],

  // Categories that are ALWAYS restricted for kids
  restrictedCategories: ['Horror', 'Thriller', 'Crime', 'War', 'Adult'],

  // Genres that are ALWAYS restricted for kids
  restrictedGenres: ['Horror', 'Thriller', 'Crime', 'War', 'Adult'],

  // Age ratings that are NEVER allowed for kids
  restrictedAgeRatings: ['R', 'NC-17', '18+', 'A'],

  // Content types that may be restricted
  restrictedContentTypes: ['documentary'] // Some documentaries may have mature content
};

/**
 * Generates a unique cache key for different content types
 * @param {string} type - Cache type (landing, contentList, singleContent)
 * @param {string} identifier - Additional identifier (user ID, content ID, etc.)
 * @returns {string} Unique cache key
 */
const generateCacheKey = (type, identifier = '') => {
  return `${type}:${identifier}`;
};

/**
 * Checks if a cache entry is stale based on its duration
 * @param {Object} cacheEntry - The cached data with timestamp
 * @param {number} cacheDuration - Duration in milliseconds
 * @returns {boolean} True if cache is stale
 */
const isCacheStale = (cacheEntry, cacheDuration) => {
  if (!cacheEntry || !cacheEntry.timestamp) return true;
  return Date.now() - cacheEntry.timestamp > cacheDuration;
};

/**
 * Clears related cache entries when content is updated
 * @param {string|null} contentId - Specific content ID to clear (optional)
 */
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
};

/**
 * Calculates trending score for content based on multiple factors
 * @param {Object} content - Content object with metrics
 * @returns {number} Trending score between 0.1 and 1
 */
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

    // Time decay - older content gets lower scores
    const contentAgeDays = Math.max(1, Math.floor((new Date() - new Date(content.release_date || content.created_at)) / (1000 * 60 * 60 * 24)));
    const timeDecay = calculateTimeDecay(contentAgeDays);

    const finalScore = score * timeDecay;

    return Math.max(0.1, Math.min(1, finalScore));

  } catch (error) {
    console.error('Error calculating trending score:', error);
    return 0.1;
  }
};

/**
 * Calculates time decay factor for content age
 * @param {number} ageInDays - Age of content in days
 * @returns {number} Decay factor between 0.6 and 1.0
 */
const calculateTimeDecay = (ageInDays) => {
  if (ageInDays <= 7) return 1.0;
  if (ageInDays <= 30) return 0.9;
  if (ageInDays <= 90) return 0.8;
  if (ageInDays <= 365) return 0.7;
  return 0.6;
};

/**
 * Fetches trending content with kid content filtering
 * @param {number} limit - Number of results to return
 * @param {boolean} excludeKidContent - Whether to exclude kid content
 * @returns {Promise<Array>} Array of trending content
 */
const getUniversalTrendingContent = async (limit = 12, excludeKidContent = true) => {
  try {
    let whereClause = `
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
        AND c.content_type IN ('movie', 'series')
    `;

    if (excludeKidContent) {
      whereClause += `
        AND NOT EXISTS (
          SELECT 1 FROM content_categories cc
          INNER JOIN categories cat ON cc.category_id = cat.id
          WHERE cc.content_id = c.id 
            AND cat.slug IN ('family', 'animation', 'cartoons', 'educational')
            AND cat.name IN ('Family', 'Animation', 'Cartoons', 'Educational')
        )
      `;
    }

    const sql = `
      SELECT 
        c.*,
        c.view_count as total_views,
        c.like_count,
        c.share_count,
        c.average_rating,
        c.rating_count,
        COALESCE((
          SELECT COUNT(*) 
          FROM content_view_history cvh
          WHERE cvh.content_id = c.id 
            AND cvh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ), 0) as recent_views_7d,
        COALESCE((
          SELECT AVG(percentage_watched) 
          FROM content_view_history cvh
          WHERE cvh.content_id = c.id
        ), 0) as avg_completion_rate,
        (c.trending = TRUE OR c.trending = 1) as is_trending,
        GROUP_CONCAT(DISTINCT g.name) as genre_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT cat.name) as category_names,
        GROUP_CONCAT(DISTINCT cat.id) as category_ids,
        (
          SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
          FROM media_assets ma 
          WHERE ma.content_id = c.id 
            AND ma.asset_type IN ('thumbnail', 'poster')
            AND ma.upload_status = 'completed'
          ORDER BY ma.is_primary DESC, ma.created_at DESC
          LIMIT 1
        ) as primary_image_url,
        DATEDIFF(NOW(), COALESCE(c.release_date, c.created_at)) as content_age_days
        
      FROM contents c
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      
      ${whereClause}
        
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

    const scoredContent = results.map(content => {
      const trendingScore = calculateTrendingScore(content);
      return {
        ...content,
        trending_score: parseFloat(trendingScore.toFixed(4)),
        trending_rank: 0
      };
    });

    scoredContent.sort((a, b) => b.trending_score - a.trending_score);

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
    console.error('Error fetching trending content:', error);
    throw new Error('Failed to fetch trending content');
  }
};

/**
 * Determines if a user is an actual kid profile vs family member with kid dashboard
 * @param {Object} req - Express request object
 * @returns {Object} Kid status information
 */
const isActualKidProfile = (req) => {
  // Family members with kid dashboard are NOT actual kid profiles
  if (req.user?.is_family_member && req.user?.dashboard_type === 'kid') {
    return {
      isKid: false,
      userId: req.user.id,
      type: 'family_member_kid_dashboard'
    };
  }

  // Check if session_mode is 'kid' (actual kid profile from kids_profiles table)
  if (req.sessionMode === 'kid' && req.activeKidProfile) {
    return {
      isKid: true,
      kidProfileId: req.activeKidProfile.id,
      parentUserId: req.user.id,
      type: 'kid_profile'
    };
  }

  // Check if user is flagged as kid in their user record
  if (req.user && req.user.role === 'kid') {
    return {
      isKid: true,
      kidProfileId: req.user.id,
      parentUserId: req.user.parent_id || req.user.id,
      type: 'kid_user'
    };
  }

  // Regular user
  return {
    isKid: false,
    userId: req.user.id,
    type: 'regular_user'
  };
};

/**
 * Checks if content is kid-friendly based on age ratings, categories, and genres
 * @param {Object} content - Content object to check
 * @returns {boolean} True if content is kid-friendly
 */
const isKidFriendlyContent = (content) => {
  // Check if content has restricted age ratings
  if (content.age_rating && KID_CONTENT_CONFIG.restrictedAgeRatings.includes(content.age_rating)) {
    return false;
  }

  // Check if content has allowed age ratings
  if (content.age_rating && KID_CONTENT_CONFIG.allowedAgeRatings.includes(content.age_rating)) {
    return true;
  }

  // Check categories for kid-friendly categories
  if (content.categories && content.categories.some(cat =>
    KID_CONTENT_CONFIG.kidFriendlyCategories.includes(cat.name)
  )) {
    return true;
  }

  // Check genres for kid-friendly genres
  if (content.genres && content.genres.some(genre =>
    KID_CONTENT_CONFIG.kidFriendlyGenres.includes(genre.name)
  )) {
    return true;
  }

  return false;
};

/**
 * Checks if content is restricted for kids based on strict criteria
 * @param {Object} content - Content object to check
 * @returns {Object} Restriction check result with reason
 */
const isContentRestrictedForKids = (content) => {
  // Check restricted age ratings
  if (content.age_rating && KID_CONTENT_CONFIG.restrictedAgeRatings.includes(content.age_rating)) {
    return {
      restricted: true,
      reason: `Content has restricted age rating: ${content.age_rating}`,
      restrictionType: 'age_rating'
    };
  }

  // Check restricted categories
  if (content.categories && content.categories.some(cat =>
    KID_CONTENT_CONFIG.restrictedCategories.includes(cat.name)
  )) {
    const restrictedCat = content.categories.find(cat =>
      KID_CONTENT_CONFIG.restrictedCategories.includes(cat.name)
    );
    return {
      restricted: true,
      reason: `Content has restricted category: ${restrictedCat.name}`,
      restrictionType: 'category'
    };
  }

  // Check restricted genres
  if (content.genres && content.genres.some(genre =>
    KID_CONTENT_CONFIG.restrictedGenres.includes(genre.name)
  )) {
    const restrictedGenre = content.genres.find(genre =>
      KID_CONTENT_CONFIG.restrictedGenres.includes(genre.name)
    );
    return {
      restricted: true,
      reason: `Content has restricted genre: ${restrictedGenre.name}`,
      restrictionType: 'genre'
    };
  }

  // Check content warnings for mature themes
  if (content.content_warnings && content.content_warnings.some(warning =>
    warning.severity === 'strong' ||
    warning.warning_type.toLowerCase().includes('violence') ||
    warning.warning_type.toLowerCase().includes('sexual') ||
    warning.warning_type.toLowerCase().includes('drug') ||
    warning.warning_type.toLowerCase().includes('language')
  )) {
    return {
      restricted: true,
      reason: 'Content contains mature themes or strong content warnings',
      restrictionType: 'content_warnings'
    };
  }

  return {
    restricted: false,
    reason: 'Content is appropriate for viewing',
    restrictionType: 'none'
  };
};

/**
 * Validates if a kid profile can access specific content
 * @param {Object} kidProfile - Kid profile object
 * @param {Object} content - Content object to check
 * @returns {Object} Access validation result
 */
const validateKidContentAccess = (kidProfile, content) => {
  const restrictionCheck = isContentRestrictedForKids(content);

  if (restrictionCheck.restricted) {
    return {
      allowed: false,
      ...restrictionCheck
    };
  }

  // Check kid's age rating limit
  if (kidProfile.max_content_age_rating) {
    const allowedRatings = KID_CONTENT_CONFIG.allowedAgeRatings;
    const kidMaxIndex = allowedRatings.indexOf(kidProfile.max_content_age_rating);
    const contentIndex = allowedRatings.indexOf(content.age_rating);

    if (kidMaxIndex !== -1 && contentIndex !== -1 && contentIndex > kidMaxIndex) {
      return {
        allowed: false,
        reason: `Content age rating (${content.age_rating}) exceeds your allowed maximum (${kidProfile.max_content_age_rating})`,
        restrictionType: 'age_limit'
      };
    }
  }

  return {
    allowed: true,
    reason: 'Content is appropriate for this kid profile',
    restrictionType: 'none'
  };
};

// Security checks module for subscription and device validation
const securityChecks = {
  /**
   * Validates user subscription (personal or family shared)
   * @param {number} userId - User ID to validate
   * @returns {Promise<Object>} Subscription details
   */
  validateSubscription: async (userId) => {
    try {
      const userSubscription = await query(`
        SELECT 
          us.*,
          s.name as plan_name,
          s.max_sessions as max_devices,
          s.video_quality as max_quality,
          s.max_sessions as concurrent_streams,
          s.offline_downloads as download_enabled,
          s.type as subscription_type,
          s.supported_platforms
        FROM user_subscriptions us
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [userId]);

      if (userSubscription.length > 0) {
        const sub = userSubscription[0];
        if (sub.status !== 'active') {
          throw new Error('Subscription is not active');
        }
        if (sub.end_date && new Date(sub.end_date) < new Date()) {
          throw new Error('Subscription has expired');
        }
        return sub;
      }

      const familyAccess = await query(`
        SELECT 
          fm.*,
          us.id as owner_subscription_id,
          us.status as owner_subscription_status,
          us.start_date as owner_subscription_start,
          us.end_date as owner_subscription_end,
          s.name as owner_plan_name,
          s.type as owner_plan_type,
          s.max_sessions as owner_max_devices,
          s.video_quality as owner_max_quality,
          s.max_sessions as owner_concurrent_streams,
          s.offline_downloads as owner_download_enabled,
          s.supported_platforms as owner_supported_platforms
        FROM family_members fm
        INNER JOIN user_subscriptions us ON fm.family_owner_id = us.user_id
        INNER JOIN subscriptions s ON us.subscription_id = s.id
        WHERE fm.user_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
          AND fm.is_suspended = FALSE
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
          AND s.type = 'family'
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [userId]);

      if (familyAccess.length > 0) {
        const family = familyAccess[0];
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0];

        // Check sleep time restrictions
        if (family.enforce_sleep_time && family.sleep_time_start && family.sleep_time_end) {
          if (currentTime >= family.sleep_time_start && currentTime <= family.sleep_time_end) {
            throw new Error('Access restricted during sleep hours. Please try again later.');
          }
        }

        // Check access window restrictions
        if (family.enforce_access_window && family.allowed_access_start && family.allowed_access_end) {
          if (currentTime < family.allowed_access_start || currentTime > family.allowed_access_end) {
            throw new Error('Access restricted outside allowed hours. Please try again during access hours.');
          }
        }

        // Check if member is suspended
        if (family.is_suspended) {
          if (family.suspended_until && new Date(family.suspended_until) > now) {
            throw new Error(`Your family access is suspended until ${new Date(family.suspended_until).toLocaleString()}. Reason: ${family.suspension_reason || 'Not specified'}`);
          } else {
            await query(`
              UPDATE family_members 
              SET is_suspended = FALSE, suspended_until = NULL, suspension_reason = NULL
              WHERE id = ?
            `, [family.id]);
          }
        }

        return {
          id: family.owner_subscription_id,
          user_id: family.family_owner_id,
          subscription_id: family.owner_subscription_id,
          status: family.owner_subscription_status,
          start_date: family.owner_subscription_start,
          end_date: family.owner_subscription_end,
          plan_name: family.owner_plan_name,
          max_devices: family.owner_max_devices,
          max_quality: family.owner_max_quality,
          concurrent_streams: family.owner_concurrent_streams,
          download_enabled: family.owner_download_enabled,
          subscription_type: family.owner_plan_type,
          supported_platforms: family.owner_supported_platforms,
          is_family_shared: true,
          family_member_id: family.id,
          member_role: family.member_role,
          dashboard_type: family.dashboard_type
        };
      }

      throw new Error('No active subscription found');

    } catch (error) {
      console.error('Subscription validation error:', error);
      throw error;
    }
  },

  /**
   * Checks device limits for user
   * @param {number} userId - User ID
   * @param {string} deviceId - Device identifier
   * @param {string} deviceType - Type of device
   * @returns {Promise<Object>} Device check result
   */
  checkDeviceLimits: async (userId, deviceId, deviceType) => {
    try {
      if (!securityConfig.allowedDeviceTypes.includes(deviceType)) {
        throw new Error(`Device type '${deviceType}' is not supported`);
      }

      const subscription = await securityChecks.validateSubscription(userId);
      const maxDevices = subscription.max_devices;

      if (subscription.supported_platforms) {
        const supportedPlatforms = JSON.parse(subscription.supported_platforms);
        if (!supportedPlatforms.includes(deviceType)) {
          const deviceTypeNames = {
            'web': 'desktop browsers',
            'mobile': 'mobile devices',
            'tablet': 'tablets',
            'smarttv': 'smart TVs'
          };
          throw new Error(`Your current plan only supports watching on ${deviceTypeNames[deviceType] || deviceType}. Please upgrade to watch on ${deviceTypeNames[deviceType] || 'this device'}.`);
        }
      }

      let activeSessions;
      if (subscription.is_family_shared) {
        activeSessions = await query(`
          SELECT us.id, us.device_id, us.device_type, us.last_activity
          FROM user_session us
          INNER JOIN family_members fm ON us.user_id = fm.user_id
          WHERE fm.family_owner_id = ?
            AND fm.invitation_status = 'accepted'
            AND fm.is_active = TRUE
            AND us.is_active = TRUE
          ORDER BY us.last_activity DESC
        `, [subscription.user_id]);
      } else {
        activeSessions = await query(`
          SELECT id, device_id, device_type, last_activity
          FROM user_session 
          WHERE user_id = ? 
            AND is_active = TRUE
          ORDER BY last_activity DESC
        `, [userId]);
      }

      const existingSession = activeSessions.find(session => session.device_id === deviceId);

      if (existingSession) {
        await query(`
          UPDATE user_session 
          SET last_activity = NOW()
          WHERE id = ?
        `, [existingSession.id]);

        return {
          withinLimit: true,
          isNewDevice: false,
          currentDevices: activeSessions.length,
          maxDevices: maxDevices,
          isFamilyShared: subscription.is_family_shared || false
        };
      }

      if (maxDevices === 0) {
        throw new Error(`Your current plan does not allow any active sessions. Please upgrade your plan to watch content.`);
      }

      if (activeSessions.length <= maxDevices) {
        return {
          withinLimit: true,
          isNewDevice: true,
          currentDevices: activeSessions.length + 1,
          maxDevices: maxDevices,
          isFamilyShared: subscription.is_family_shared || false
        };
      } else {
        const message = subscription.is_family_shared
          ? `Your family has ${activeSessions.length} active sessions out of ${maxDevices} allowed. Please ask family members to sign out from other devices to continue watching.`
          : `You have ${activeSessions.length} active sessions out of ${maxDevices} allowed. Please sign out from other devices to continue watching.`;

        throw new Error(message);
      }
    } catch (error) {
      console.error('Device limit check error:', error);
      throw error;
    }
  },

  /**
   * Checks concurrent streams for user
   * @param {number} userId - User ID
   * @param {string} contentId - Content ID
   * @returns {Promise<Object>} Stream check result
   */
  checkConcurrentStreams: async (userId, contentId) => {
    try {
      const subscription = await securityChecks.validateSubscription(userId);
      const maxStreams = subscription.concurrent_streams || securityConfig.maxConcurrentStreams;

      const activeStreams = await query(`
        SELECT COUNT(*) as active_count
        FROM content_watch_sessions 
        WHERE user_id = ? 
          AND last_activity_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      `, [userId]);

      const currentStreams = activeStreams[0]?.active_count || 0;

      if (currentStreams < maxStreams) {
        return {
          withinLimit: true,
          currentStreams: currentStreams + 1,
          maxStreams: maxStreams
        };
      } else {
        throw new Error(`You have ${currentStreams} active streams out of ${maxStreams} allowed. Please close other video players to continue watching.`);
      }
    } catch (error) {
      console.error('Concurrent stream check error:', error);
      throw error;
    }
  },

  /**
   * Validates content access rights
   * @param {number} userId - User ID
   * @param {string} contentId - Content ID
   * @returns {Promise<Object>} Content access validation
   */
  validateContentAccess: async (userId, contentId) => {
    try {
      const [content] = await query(`
        SELECT 
          c.*,
          cr.license_type,
          cr.allowed_regions,
          cr.blocked_countries,
          cr.start_date,
          cr.end_date
        FROM contents c
        LEFT JOIN content_rights cr ON c.id = cr.content_id
        WHERE c.id = ? 
          AND c.status = 'published'
          AND c.visibility = 'public'
      `, [contentId]);

      if (!content) {
        throw new Error('Content not found or not accessible');
      }

      if (content.start_date && new Date(content.start_date) > new Date()) {
        throw new Error('Content is not yet available');
      }

      if (content.end_date && new Date(content.end_date) < new Date()) {
        throw new Error('Content access has expired');
      }

      if (securityConfig.geoCheckEnabled) {
        const geoCheck = await securityChecks.checkGeoRestrictions(userId, content);
        if (!geoCheck.allowed) {
          throw new Error(`Content not available in your region: ${geoCheck.reason}`);
        }
      }

      return { allowed: true, content };
    } catch (error) {
      console.error('Content access validation error:', error);
      throw error;
    }
  },

  /**
   * Checks geographic restrictions for content
   * @param {number} userId - User ID
   * @param {Object} content - Content object
   * @returns {Promise<Object>} Geo restriction check
   */
  checkGeoRestrictions: async (userId, content) => {
    try {
      const [userSession] = await query(`
        SELECT location 
        FROM user_session 
        WHERE user_id = ? AND is_active = TRUE
        ORDER BY last_activity DESC
        LIMIT 1
      `, [userId]);

      const userLocation = userSession?.location;

      if (!userLocation) {
        return { allowed: true, reason: 'No location data' };
      }

      if (content.blocked_countries) {
        const blockedCountries = JSON.parse(content.blocked_countries);
        if (blockedCountries.includes(userLocation)) {
          return { allowed: false, reason: 'Country blocked' };
        }
      }

      if (content.allowed_regions) {
        const allowedRegions = JSON.parse(content.allowed_regions);
        if (allowedRegions.length > 0 && !allowedRegions.includes(userLocation)) {
          return { allowed: false, reason: 'Region not allowed' };
        }
      }

      return { allowed: true, reason: 'Region allowed' };
    } catch (error) {
      console.error('Geo restriction check error:', error);
      return { allowed: true, reason: 'Geo check failed' };
    }
  },

  /**
   * Logs security events for auditing
   * @param {number} userId - User ID
   * @param {string} action - Security action
   * @param {string} status - Action status
   * @param {Object} details - Additional details
   */
  logSecurityEvent: async (userId, action, status, details = {}) => {
    try {
      await query(`
        INSERT INTO security_logs (user_id, action, ip_address, device_info, status, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, action, details.ipAddress || 'unknown', JSON.stringify(details.deviceInfo || {}), status, JSON.stringify(details)]);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  },

  /**
   * Enhanced security wrapper for content streaming
   * @param {Function} contentHandler - Original content handler
   * @returns {Function} Secured content handler
   */
  secureContentStream: (contentHandler) => {
    return async (req, res) => {
      try {
        const userId = req.user.id;
        const { contentId } = req.params;
        const deviceId = req.headers['x-device-id'] || req.deviceInfo?.id || `web_${userId}`;
        const deviceType = req.headers['x-device-type'] || req.deviceInfo?.type || 'web';

        // Validate user subscription
        const subscription = await securityChecks.validateSubscription(userId);

        // Check device limits
        const deviceCheck = await securityChecks.checkDeviceLimits(userId, deviceId, deviceType);

        // Validate content access
        const contentAccess = await securityChecks.validateContentAccess(userId, contentId);

        // Check concurrent streams
        const streamCheck = await securityChecks.checkConcurrentStreams(userId, contentId);

        // Check kid content restrictions if user is in kid mode
        const kidCheck = isActualKidProfile(req);
        if (kidCheck.isKid) {
          const kidProfile = req.activeKidProfile;
          const accessValidation = validateKidContentAccess(kidProfile, contentAccess.content);

          if (!accessValidation.allowed) {
            throw new Error(`Content restricted for kids: ${accessValidation.reason}`);
          }
        }

        // Log successful security check
        await securityChecks.logSecurityEvent(userId, 'content_access', 'success', {
          contentId,
          deviceId,
          deviceType,
          ipAddress: req.ip,
          deviceInfo: req.deviceInfo,
          subscription: subscription.plan_name,
          isFamilyShared: subscription.is_family_shared || false,
          isKidMode: kidCheck.isKid
        });

        // Store security context in request
        req.securityContext = {
          userId,
          contentId,
          deviceId,
          deviceType,
          subscription,
          deviceCheck,
          contentAccess,
          streamCheck,
          securityPassed: true,
          timestamp: new Date().toISOString(),
          isKidMode: kidCheck.isKid
        };

        return await contentHandler(req, res);

      } catch (error) {
        let errorCode = 'ACCESS_DENIED';
        let userMessage = error.message;
        let isFamilyShared = false;

        if (error.message.includes('No active subscription')) {
          errorCode = 'SUBSCRIPTION_REQUIRED';
          userMessage = 'You need an active subscription to watch this content.';
        } else if (error.message.includes('active sessions out of')) {
          errorCode = 'DEVICE_LIMIT_REACHED';
          isFamilyShared = error.message.includes('family');
        } else if (error.message.includes('active streams out of')) {
          errorCode = 'STREAM_LIMIT_REACHED';
          isFamilyShared = error.message.includes('family');
        } else if (error.message.includes('only supports watching on')) {
          errorCode = 'PLAN_RESTRICTION';
        } else if (error.message.includes('Content not available in your region')) {
          errorCode = 'GEO_RESTRICTED';
          userMessage = 'This content is not available in your region.';
        } else if (error.message.includes('Access restricted during sleep hours') || error.message.includes('Access restricted outside allowed hours')) {
          errorCode = 'TIME_RESTRICTION';
        } else if (error.message.includes('family access is suspended') || error.message.includes('family access has been restricted')) {
          errorCode = 'FAMILY_ACCESS_RESTRICTED';
        } else if (error.message.includes('Your current plan does not allow any active sessions')) {
          errorCode = 'PLAN_RESTRICTION';
        } else if (error.message.includes('Content restricted for kids')) {
          errorCode = 'KID_CONTENT_RESTRICTED';
          userMessage = 'This content is not available for kids. Please switch to parent mode to access this content.';
        }

        // Log failed security check
        if (req.user && req.user.id) {
          await securityChecks.logSecurityEvent(req.user.id, 'content_access', 'failed', {
            contentId: req.params.contentId,
            error: error.message,
            errorCode: errorCode,
            ipAddress: req.ip,
            deviceInfo: req.deviceInfo,
            isFamilyShared: isFamilyShared
          });
        }

        return res.status(403).json({
          success: false,
          error: userMessage,
          details: error.message,
          code: errorCode,
          isFamilyShared: isFamilyShared,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
};

/**
 * Extracts device information from request headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const extractDeviceInfo = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  let deviceType = 'web';

  if (/mobile|android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())) {
    deviceType = 'mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(userAgent.toLowerCase())) {
    deviceType = 'tablet';
  } else if (/smart-tv|smarttv|googletv|appletv|hbbtv|roku/i.test(userAgent.toLowerCase())) {
    deviceType = 'smarttv';
  }

  const deviceId = req.headers['x-device-id'] || req.deviceInfo?.id || `device_${deviceType}_${Math.random().toString(36).substr(2, 9)}`;

  req.deviceInfo = {
    id: deviceId,
    type: deviceType,
    userAgent: userAgent,
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
    screen: {
      width: req.headers['x-screen-width'] || 'unknown',
      height: req.headers['x-screen-height'] || 'unknown'
    }
  };

  req.geoLocation = {
    country: req.headers['x-country-code'] || req.headers['cf-ipcountry'],
    region: req.headers['x-region'],
    city: req.headers['x-city']
  };

  next();
};

/**
 * API endpoint for trending movies with kid content filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrendingMovies = async (req, res) => {
  try {
    const {
      limit = 12,
      refresh = false,
      min_score = 0.01,
      include_kid_content = false
    } = req.query;

    const validatedLimit = Math.min(Math.max(parseInt(limit), 1), TRENDING_CONFIG.queryLimits.maxResults);
    const validatedMinScore = Math.min(Math.max(parseFloat(min_score), 0), 1);
    const includeKidContent = include_kid_content === 'true';

    const cacheKey = `trending:${validatedLimit}:${validatedMinScore}:${includeKidContent}`;
    const cachedData = trendingCache.get(cacheKey);

    if (!refresh && cachedData && (Date.now() - cachedData.timestamp < TRENDING_CACHE_DURATION)) {
      return res.json({
        success: true,
        data: cachedData.data,
        cached: true,
        timestamp: cachedData.timestamp,
        algorithm: 'universal',
        kid_content_included: includeKidContent
      });
    }

    const trendingContent = await getUniversalTrendingContent(validatedLimit, !includeKidContent);

    const filteredContent = trendingContent.filter(content =>
      content.trending_score >= validatedMinScore
    );

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
      count: filteredContent.length,
      kid_content_included: includeKidContent
    });

  } catch (error) {
    console.error('Error fetching trending movies:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch trending content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * API endpoint for trending insights and statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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
    console.error('Error fetching trending insights:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch trending insights'
    });
  }
};

/**
 * API endpoint for trending system health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrendingHealth = async (req, res) => {
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
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: "Service unavailable"
    });
  }
};

/**
 * Helper function to get trailer for content
 * @param {string} contentId - Content ID
 * @returns {Promise<Object|null>} Trailer object or null
 */
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
    console.error('Error fetching trailer:', error);
    return null;
  }
};

/**
 * Helper function to get content with trailer and kid content filtering
 * @param {string} sqlQuery - SQL query template
 * @param {Array} params - Query parameters
 * @param {boolean} excludeKidContent - Whether to exclude kid content
 * @returns {Promise<Array>} Array of content with trailers
 */
const getContentWithTrailer = async (sqlQuery, params = [], excludeKidContent = true) => {
  try {
    let modifiedSql = sqlQuery;
    if (excludeKidContent) {
      modifiedSql = modifiedSql.replace(
        'GROUP BY c.id',
        `AND NOT EXISTS (
          SELECT 1 FROM content_categories cc
          INNER JOIN categories cat ON cc.category_id = cat.id
          WHERE cc.content_id = c.id 
            AND cat.slug IN ('family', 'animation', 'cartoons', 'educational')
            AND cat.name IN ('Family', 'Animation', 'Cartoons', 'Educational')
        )
        GROUP BY c.id`
      );
    }

    const content = await query(modifiedSql, params);

    if (content.length > 0) {
      for (let item of content) {
        item.trailer = await getTrailerForContent(item.id);

        const castCount = await query(`
          SELECT COUNT(*) as count 
          FROM content_people 
          WHERE content_id = ? AND role_type = 'actor'
        `, [item.id]);
        item.cast_count = castCount[0]?.count || 0;

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
    console.error('Error fetching content with trailer:', error);
    return [];
  }
};

/**
 * API endpoint for viewer landing page content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getViewerLandingContent = async (req, res) => {
  try {
    const userId = req.user?.id;
    const cacheKey = generateCacheKey('landing', userId || 'public');
    const cacheEntry = contentCache.get(cacheKey);
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && cacheEntry && !isCacheStale(cacheEntry, cacheConfig.landingContent)) {
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp
      });
    }

    let heroContent = [];
    let heroContentId = null;

    // Try featured AND trending content (highest priority)
    if (heroContent.length === 0) {
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
        `, [process.env.R2_PUBLIC_URL_ID], true);
    }

    // Fallback: Featured content only
    if (heroContent.length === 0) {
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
        `, [process.env.R2_PUBLIC_URL_ID], true);
    }

    // Fallback: Use trending algorithm for hero
    if (heroContent.length === 0) {
      const trendingContent = await getUniversalTrendingContent(1, true);
      if (trendingContent.length > 0) {
        const trendingHero = trendingContent[0];
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
          WHERE c.id = ?
          `, [process.env.R2_PUBLIC_URL_ID, trendingHero.id], true);
      }
    }

    // Fallback: Trending content
    if (heroContent.length === 0) {
      heroContent = await getContentWithTrailer(`
        SELECT 
          c.*,
          cr.license_type,
          cr.downloadable,
          cr.shareable,
          GROUP_CONCAT(DISTINCT g.name) as genre_names,
          GROUP_CONCAT(DISTINCT g.id) as genre_ids,
          GROUP_CONCAT(DISTINCT cat.name) as category_names,
          GROUP_CONCAT(DISTINCT cat.id) as genre_ids,
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
        `, [process.env.R2_PUBLIC_URL_ID], true);
    }

    // Fallback: Recent content
    if (heroContent.length === 0) {
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
        `, [process.env.R2_PUBLIC_URL_ID], true);
    }

    // Final fallback: Any published content
    if (heroContent.length === 0) {
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
        `, [process.env.R2_PUBLIC_URL_ID], true);
    }

    heroContentId = heroContent[0]?.id || null;

    const getSectionContent = async (sqlQuery, params = [], excludeKidContent = true) => {
      try {
        let modifiedSql = sqlQuery;
        if (excludeKidContent) {
          modifiedSql = modifiedSql.replace(
            'GROUP BY c.id',
            `AND NOT EXISTS (
              SELECT 1 FROM content_categories cc
              INNER JOIN categories cat ON cc.category_id = cat.id
              WHERE cc.content_id = c.id 
                AND cat.slug IN ('family', 'animation', 'cartoons', 'educational')
                AND cat.name IN ('Family', 'Animation', 'Cartoons', 'Educational')
            )
            GROUP BY c.id`
          );
        }

        const content = await query(modifiedSql, params);

        for (let item of content) {
          item.trailer = await getTrailerForContent(item.id);
        }

        return content;
      } catch (error) {
        console.error('Error fetching section content:', error);
        return [];
      }
    };

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
        `, [process.env.R2_PUBLIC_URL_ID, heroContentId], true);
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
        `, [process.env.R2_PUBLIC_URL_ID], true);
    }

    const trendingContent = await getUniversalTrendingContent(12, true);

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
      `, [process.env.R2_PUBLIC_URL_ID], true);

    const processContent = (contentArray) => {
      return contentArray.map(content => {
        let imageUrl = content.primary_image_url;
        if (!imageUrl || imageUrl.includes('null')) {
          imageUrl = '/api/placeholder/300/450';
        }

        return {
          ...content,
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
          trailer: content.trailer || null,
          last_updated: content.updated_at || content.created_at,
          cast_count: content.cast_count || 0,
          is_kid_friendly: isKidFriendlyContent(content),
          kid_access_restricted: isContentRestrictedForKids(content).restricted
        };
      });
    };

    const processedHero = processContent(heroContent)[0] || null;
    const processedFeatured = processContent(featuredContent);
    const processedTrending = trendingContent.map(content => ({
      ...content,
      is_kid_friendly: isKidFriendlyContent(content),
      kid_access_restricted: isContentRestrictedForKids(content).restricted
    }));
    const processedRecent = processContent(recentContent);

    const responseData = {
      hero: processedHero,
      featured: processedFeatured,
      trending: processedTrending,
      recent: processedRecent,
      last_updated: new Date().toISOString(),
      kid_content_filter: {
        applied: true,
        message: 'Kid content is filtered out by default. Use include_kid_content=true parameter to include.',
        kid_friendly_count: processedTrending.filter(c => c.is_kid_friendly).length,
        restricted_count: processedTrending.filter(c => c.kid_access_restricted).length
      }
    };

    contentCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: responseData,
      cached: false,
      timestamp: Date.now(),
      kid_content_filtered: true
    });

  } catch (error) {
    console.error('Error fetching landing content:', error);
    res.status(500).json({
      error: 'Unable to load content at this time',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * API endpoint for all viewer content with filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllViewerContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      refresh,
      include_kid_content = false,
      category,
      genre
    } = req.query;

    const offset = (page - 1) * limit;
    const includeKidContent = include_kid_content === 'true';

    const cacheKey = generateCacheKey('contentList', `page_${page}_limit_${limit}_kid_${includeKidContent}_cat_${category || 'none'}_genre_${genre || 'none'}`);
    const cacheEntry = contentCache.get(cacheKey);

    if (!refresh && cacheEntry && !isCacheStale(cacheEntry, cacheConfig.contentList)) {
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp,
        kid_content_included: includeKidContent
      });
    }

    let whereClause = `
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
    `;

    if (!includeKidContent) {
      whereClause += `
        AND NOT EXISTS (
          SELECT 1 FROM content_categories cc
          INNER JOIN categories cat ON cc.category_id = cat.id
          WHERE cc.content_id = c.id 
            AND cat.slug IN ('family', 'animation', 'cartoons', 'educational')
            AND cat.name IN ('Family', 'Animation', 'Cartoons', 'Educational')
        )
      `;
    }

    if (category) {
      whereClause += `
        AND EXISTS (
          SELECT 1 FROM content_categories cc
          INNER JOIN categories cat ON cc.category_id = cat.id
          WHERE cc.content_id = c.id 
            AND (cat.slug = ? OR cat.name = ?)
        )
      `;
    }

    if (genre) {
      whereClause += `
        AND EXISTS (
          SELECT 1 FROM content_genres cg
          INNER JOIN genres g ON cg.genre_id = g.id
          WHERE cg.content_id = c.id 
            AND (g.slug = ? OR g.name = ?)
        )
      `;
    }

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
      ${whereClause}
      GROUP BY c.id
      ORDER BY content_recency DESC, c.created_at DESC
      LIMIT ? OFFSET ?
    `, [
      process.env.R2_PUBLIC_URL_ID,
      ...(category ? [category, category] : []),
      ...(genre ? [genre, genre] : []),
      parseInt(limit),
      parseInt(offset)
    ]);

    let countWhereClause = `WHERE status = 'published' AND visibility = 'public'`;

    if (!includeKidContent) {
      countWhereClause += `
        AND NOT EXISTS (
          SELECT 1 FROM content_categories cc
          INNER JOIN categories cat ON cc.category_id = cat.id
          WHERE cc.content_id = contents.id 
            AND cat.slug IN ('family', 'animation', 'cartoons', 'educational')
            AND cat.name IN ('Family', 'Animation', 'Cartoons', 'Educational')
        )
      `;
    }

    if (category) {
      countWhereClause += `
        AND EXISTS (
          SELECT 1 FROM content_categories cc
          INNER JOIN categories cat ON cc.category_id = cat.id
          WHERE cc.content_id = contents.id 
            AND (cat.slug = ? OR cat.name = ?)
        )
      `;
    }

    if (genre) {
      countWhereClause += `
        AND EXISTS (
          SELECT 1 FROM content_genres cg
          INNER JOIN genres g ON cg.genre_id = g.id
          WHERE cg.content_id = contents.id 
            AND (g.slug = ? OR g.name = ?)
        )
      `;
    }

    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM contents 
      ${countWhereClause}
    `, [
      ...(category ? [category, category] : []),
      ...(genre ? [genre, genre] : [])
    ]);

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
        last_updated: content.updated_at || content.created_at,
        is_kid_friendly: isKidFriendlyContent(content),
        kid_access_restricted: isContentRestrictedForKids(content).restricted
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
      last_updated: new Date().toISOString(),
      filters: {
        kid_content_included: includeKidContent,
        category: category || null,
        genre: genre || null,
        kid_friendly_count: processedContents.filter(c => c.is_kid_friendly).length,
        restricted_count: processedContents.filter(c => c.kid_access_restricted).length
      }
    };

    contentCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: responseData,
      cached: false,
      timestamp: Date.now(),
      kid_content_included: includeKidContent
    });

  } catch (error) {
    console.error('Error fetching all viewer content:', error);
    res.status(500).json({
      error: 'Unable to load content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * API endpoint for single content by ID with security and kid restrictions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getViewerContentById = async (req, res) => {
  try {
    const { contentId } = req.params;

    // Check if user is authenticated (req.user is set by authMiddleware)
    const isAuthenticated = req.user && req.user.id;
    const userId = isAuthenticated ? req.user.id : null;

    const cacheKey = generateCacheKey('singleContent', contentId, userId);
    const cacheEntry = contentCache.get(cacheKey);
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && cacheEntry && !isCacheStale(cacheEntry, cacheConfig.singleContent)) {
      return res.json({
        success: true,
        data: cacheEntry.data,
        cached: true,
        timestamp: cacheEntry.timestamp,
        is_authenticated: isAuthenticated
      });
    }

    // Get basic content data (always public)
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
        success: false,
        error: 'Content not found'
      });
    }

    const content = contentRows[0];

    // Get genres (public)
    const genres = await query(`
      SELECT g.* 
      FROM content_genres cg 
      JOIN genres g ON cg.genre_id = g.id 
      WHERE cg.content_id = ?
      ORDER BY cg.is_primary DESC, g.name ASC
    `, [contentId]);
    content.genres = genres;

    // Get categories (public)
    const categories = await query(`
      SELECT cat.* 
      FROM content_categories cc 
      JOIN categories cat ON cc.category_id = cat.id 
      WHERE cc.content_id = ?
      ORDER BY cat.name ASC
    `, [contentId]);
    content.categories = categories;

    // Get media assets (FIXED: removed visibility column)
    const mediaAssets = await query(`
      SELECT 
        ma.*,
        CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path) as url
      FROM media_assets ma 
      WHERE ma.content_id = ? 
        AND ma.upload_status = 'completed'
        -- visibility column doesn't exist, use content.visibility instead
      ORDER BY 
        ma.is_primary DESC,
        FIELD(ma.asset_type, 'poster', 'thumbnail', 'trailer', 'mainVideo'),
        ma.season_number,
        ma.episode_number,
        ma.created_at DESC
    `, [process.env.R2_PUBLIC_URL_ID, contentId]);
    content.media_assets = mediaAssets;

    const trailerAsset = mediaAssets.find(asset => asset.asset_type === 'trailer');
    content.trailer = trailerAsset || null;

    const primaryImage = mediaAssets.find(asset =>
      asset.is_primary && (asset.asset_type === 'poster' || asset.asset_type === 'thumbnail')
    ) || mediaAssets.find(asset =>
      asset.asset_type === 'poster' || asset.asset_type === 'thumbnail'
    );
    content.primary_image_url = primaryImage?.url || null;

    // Get content warnings (if table exists)
    try {
      const warnings = await query(`
        SELECT * FROM content_warnings 
        WHERE content_id = ?
        ORDER BY severity DESC, warning_type ASC
      `, [contentId]);
      content.content_warnings = warnings;
    } catch (error) {
      content.content_warnings = [];
    }

    // Get languages (if table exists)
    try {
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
    } catch (error) {
      content.available_languages = [];
    }

    // Get cast and crew
    try {
      const castCrew = await query(`
        SELECT 
          cp.*,
          p.full_name,
          p.display_name,
          p.primary_role,
          p.profile_image_url
        FROM content_people cp
        JOIN people p ON cp.person_id = p.id
        WHERE cp.content_id = ?
        ORDER BY 
          cp.billing_order ASC,
          FIELD(cp.role_type, 'director', 'producer', 'writer', 'actor'),
          cp.character_name IS NULL,
          cp.character_name ASC
        LIMIT 20
      `, [contentId]);
      content.cast_crew = castCrew;
      content.cast = castCrew.filter(person => person.role_type === 'actor');
      content.crew = castCrew.filter(person => person.role_type !== 'actor');
    } catch (error) {
      content.cast_crew = [];
      content.cast = [];
      content.crew = [];
    }

    // Get ratings stats
    try {
      const ratingStats = await query(`
        SELECT 
          AVG(rating) as current_rating,
          COUNT(*) as current_rating_count
        FROM content_ratings 
        WHERE content_id = ?
      `, [contentId]);

      content.current_rating = parseFloat(ratingStats[0].current_rating || 0).toFixed(2);
      content.current_rating_count = ratingStats[0].current_rating_count || 0;
    } catch (error) {
      content.current_rating = "0.00";
      content.current_rating_count = 0;
    }

    // Handle series content
    if (content.content_type === 'series') {
      const seasonNumbers = [...new Set(mediaAssets
        .filter(asset => asset.season_number !== null && asset.season_number !== undefined)
        .map(asset => asset.season_number)
      )].sort((a, b) => a - b);

      const seasons = [];

      for (const seasonNumber of seasonNumbers) {
        const seasonPoster = mediaAssets.find(asset =>
          asset.season_number === seasonNumber &&
          (asset.asset_type === 'season_poster' || asset.asset_type === 'poster')
        );

        // Find all episodes for this season (using episode_number field)
        const episodeAssets = mediaAssets.filter(asset =>
          asset.season_number === seasonNumber &&
          asset.episode_number !== null &&
          asset.episode_number !== undefined
        );

        // Get unique episode numbers
        const episodeNumbers = [...new Set(episodeAssets
          .map(asset => asset.episode_number)
        )].sort((a, b) => a - b);

        const episodes = [];

        for (const episodeNumber of episodeNumbers) {
          // Find episode-specific assets
          const episodeVideo = episodeAssets.find(asset =>
            asset.episode_number === episodeNumber &&
            (asset.asset_type === 'episodeVideo' || asset.asset_type === 'mainVideo')
          );

          const episodeThumbnail = episodeAssets.find(asset =>
            asset.episode_number === episodeNumber &&
            asset.asset_type === 'episodeThumbnail'
          );

          const episodeTrailer = episodeAssets.find(asset =>
            asset.episode_number === episodeNumber &&
            asset.asset_type === 'episodeTrailer'
          );

          // Get any asset for this episode to extract episode metadata
          const anyEpisodeAsset = episodeAssets.find(asset => asset.episode_number === episodeNumber);

          episodes.push({
            id: `season-${seasonNumber}-episode-${episodeNumber}`,
            episode_number: episodeNumber,
            title: anyEpisodeAsset?.episode_title || `Episode ${episodeNumber}`,
            description: anyEpisodeAsset?.episode_description || null,
            duration_minutes: episodeVideo?.duration_seconds ? Math.floor(episodeVideo.duration_seconds / 60) : null,
            release_date: anyEpisodeAsset?.created_at || null,
            episode_thumbnail_url: episodeThumbnail?.url || null,
            episode_video_url: episodeVideo?.url || null,
            has_trailer: !!episodeTrailer,
            episode_trailer_url: episodeTrailer?.url || null
          });
        }

        seasons.push({
          id: `season-${seasonNumber}`,
          season_number: seasonNumber,
          title: `Season ${seasonNumber}`,
          description: null,
          release_date: null,
          season_poster_url: seasonPoster?.url || null,
          episode_count: episodes.length,
          episodes: isAuthenticated ? episodes : episodes.slice(0, 3) // Show more episodes for authenticated users
        });
      }

      content.seasons = seasons;
    } else {
      content.seasons = [];
    }

    // Get similar content
    try {
      const similarContent = await query(`
        SELECT 
          c.id,
          c.title,
          c.content_type,
          c.duration_minutes,
          c.release_date,
          c.average_rating,
          c.age_rating,
          (
            SELECT CONCAT('https://pub-', ?, '.r2.dev/', ma.file_path)
            FROM media_assets ma 
            WHERE ma.content_id = c.id 
              AND ma.asset_type IN ('thumbnail', 'poster')
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
        ORDER BY COUNT(cg.genre_id) DESC
        LIMIT 6
      `, [process.env.R2_PUBLIC_URL_ID, contentId, contentId]);

      content.similar_content = similarContent;
    } catch (error) {
      content.similar_content = [];
    }

    // USER-SPECIFIC DATA (only for authenticated users)
    if (isAuthenticated) {
      try {
        // Get user rating
        const userRating = await query(`
          SELECT rating, review_text 
          FROM content_ratings 
          WHERE content_id = ? AND user_id = ?
        `, [contentId, userId]);

        if (userRating.length > 0) {
          content.user_rating = userRating[0].rating;
          content.user_review = userRating[0].review_text;
        }

        // Check if in watchlist
        const watchlistCheck = await query(`
          SELECT 1 FROM user_watchlist 
          WHERE content_id = ? AND user_id = ?
        `, [contentId, userId]);
        content.in_watchlist = watchlistCheck.length > 0;

        // Check if liked
        const likeCheck = await query(`
          SELECT 1 FROM user_likes 
          WHERE content_id = ? AND user_id = ?
        `, [contentId, userId]);
        content.is_liked = likeCheck.length > 0;

        // Get watch history
        const watchHistory = await query(`
          SELECT 
            percentage_watched,
            watch_duration_seconds,
            last_watched_at
          FROM content_view_history 
          WHERE content_id = ? AND user_id = ?
          ORDER BY last_watched_at DESC
          LIMIT 1
        `, [contentId, userId]);

        if (watchHistory.length > 0) {
          content.watch_history = {
            percentage_watched: watchHistory[0].percentage_watched,
            watch_duration_seconds: watchHistory[0].watch_duration_seconds,
            last_watched_at: watchHistory[0].last_watched_at
          };
        }
      } catch (error) {
        console.error('Error fetching user-specific data:', error.message);
      }
    }

    // Add context info
    content.context = {
      is_authenticated: isAuthenticated,
      can_access: isAuthenticated || content.visibility === 'public',
      requires_subscription: !isAuthenticated,
      last_updated: new Date().toISOString()
    };

    // Update cache
    contentCache.set(cacheKey, {
      data: content,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: content,
      cached: false,
      timestamp: Date.now(),
      is_authenticated: isAuthenticated,
      requires_subscription: !isAuthenticated
    });

  } catch (error) {
    console.error('Error fetching content by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to load content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * API endpoint to track content views with kid profile support
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const trackContentView = securityChecks.secureContentStream(async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;
    const { watch_duration_seconds = 0, percentage_watched = 0, device_type = 'web' } = req.body;

    const kidCheck = isActualKidProfile(req);
    const securityContext = req.securityContext;

    if (kidCheck.isKid) {
      await query(`
        INSERT INTO kids_viewing_history 
        (kid_profile_id, content_id, watch_duration_seconds, percentage_watched, device_type, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [kidCheck.kidProfileId, contentId, watch_duration_seconds, percentage_watched, device_type, `kid_secure_${Date.now()}`]);
    } else {
      await query(`
        INSERT INTO content_view_history 
        (content_id, user_id, watch_duration_seconds, percentage_watched, device_type, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [contentId, userId, watch_duration_seconds, percentage_watched, device_type, `secure_${Date.now()}`]);

      await query(`
        UPDATE contents 
        SET view_count = view_count + 1
        WHERE id = ?
      `, [contentId]);
    }

    clearRelatedCache(contentId);

    res.json({
      success: true,
      message: 'View tracked successfully',
      userType: kidCheck.isKid ? 'kid_profile' : 'regular_user',
      kidProfileId: kidCheck.isKid ? kidCheck.kidProfileId : null,
      security: {
        device_id: securityContext.deviceId,
        subscription: securityContext.subscription.plan_name
      }
    });

  } catch (error) {
    console.error('Error tracking content view:', error);
    res.status(500).json({
      error: 'Unable to track view',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * API endpoint to rate content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

    const existingRating = await query(`
      SELECT id FROM content_ratings 
      WHERE content_id = ? AND user_id = ?
    `, [contentId, userId]);

    if (existingRating.length > 0) {
      await query(`
        UPDATE content_ratings 
        SET rating = ?, review_title = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE content_id = ? AND user_id = ?
      `, [rating, review_title, review_text, contentId, userId]);
    } else {
      await query(`
        INSERT INTO content_ratings 
        (content_id, user_id, rating, review_title, review_text)
        VALUES (?, ?, ?, ?, ?)
      `, [contentId, userId, rating, review_title, review_text]);
    }

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

/**
 * API endpoint to get user's watch history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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
        c.age_rating,
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

    const processedHistory = history.map(item => ({
      ...item,
      is_kid_friendly: isKidFriendlyContent(item),
      kid_access_restricted: isContentRestrictedForKids(item).restricted
    }));

    res.json({
      success: true,
      data: {
        history: processedHistory,
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

/**
 * API endpoint to toggle watchlist items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleWatchlist = async (req, res) => {
  try {
    const { contentId, action } = req.body;
    const userId = req.user.id;

    const kidCheck = isActualKidProfile(req);

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required'
      });
    }

    const content = await query(`
      SELECT id FROM contents 
      WHERE id = ? AND status = 'published' AND visibility = 'public'
    `, [contentId]);

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Check kid content restrictions if adding to watchlist
    if (action === 'add' && kidCheck.isKid) {
      const contentDetails = await query(`
        SELECT * FROM contents WHERE id = ?
      `, [contentId]);

      if (contentDetails.length > 0) {
        const restrictionCheck = isContentRestrictedForKids(contentDetails[0]);
        if (restrictionCheck.restricted) {
          return res.status(403).json({
            success: false,
            error: `Cannot add to watchlist: ${restrictionCheck.reason}`,
            code: 'KID_CONTENT_RESTRICTED'
          });
        }
      }
    }

    if (kidCheck.isKid && kidCheck.type === 'kid_profile') {
      if (action === 'add') {
        await query(`
          INSERT IGNORE INTO kids_watchlist (kid_profile_id, content_id, added_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [kidCheck.kidProfileId, contentId]);
      } else if (action === 'remove') {
        await query(`
          DELETE FROM kids_watchlist 
          WHERE kid_profile_id = ? AND content_id = ?
        `, [kidCheck.kidProfileId, contentId]);
      }
    } else {
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
    }

    res.json({
      success: true,
      message: action === 'add' ? 'Added to watchlist' : 'Removed from watchlist',
      action: action === 'add' ? 'added' : 'removed',
      data: { isInList: action === 'add' },
      userType: kidCheck.type
    });

  } catch (error) {
    console.error('Error updating watchlist:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update watchlist'
    });
  }
};

/**
 * API endpoint to toggle content likes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleLike = async (req, res) => {
  try {
    const { contentId, action } = req.body;
    const userId = req.user.id;

    const kidCheck = isActualKidProfile(req);

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required'
      });
    }

    const content = await query(`
      SELECT id FROM contents 
      WHERE id = ? AND status = 'published' AND visibility = 'public'
    `, [contentId]);

    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Check kid content restrictions if liking content
    if (action === 'like' && kidCheck.isKid) {
      const contentDetails = await query(`
        SELECT * FROM contents WHERE id = ?
      `, [contentId]);

      if (contentDetails.length > 0) {
        const restrictionCheck = isContentRestrictedForKids(contentDetails[0]);
        if (restrictionCheck.restricted) {
          return res.status(403).json({
            success: false,
            error: `Cannot like content: ${restrictionCheck.reason}`,
            code: 'KID_CONTENT_RESTRICTED'
          });
        }
      }
    }

    if (kidCheck.isKid && kidCheck.type === 'kid_profile') {
      if (action === 'like') {
        await query(`
          INSERT INTO kids_ratings_feedback (kid_profile_id, content_id, reaction)
          VALUES (?, ?, 'like')
          ON DUPLICATE KEY UPDATE reaction = 'like', updated_at = CURRENT_TIMESTAMP
        `, [kidCheck.kidProfileId, contentId]);
      } else if (action === 'unlike') {
        await query(`
          UPDATE kids_ratings_feedback 
          SET reaction = 'dislike', updated_at = CURRENT_TIMESTAMP
          WHERE kid_profile_id = ? AND content_id = ?
        `, [kidCheck.kidProfileId, contentId]);
      }
    } else {
      if (action === 'like') {
        await query(`
          INSERT INTO user_likes (user_id, content_id, liked_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP, is_active = TRUE, unliked_at = NULL
        `, [userId, contentId]);

        await query(`
          UPDATE contents 
          SET like_count = like_count + 1 
          WHERE id = ?
        `, [contentId]);
      } else if (action === 'unlike') {
        await query(`
          UPDATE user_likes 
          SET is_active = FALSE, unliked_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND content_id = ? AND is_active = TRUE
        `, [userId, contentId]);

        await query(`
          UPDATE contents 
          SET like_count = GREATEST(0, like_count - 1) 
          WHERE id = ?
        `, [contentId]);
      }
    }

    res.json({
      success: true,
      message: action === 'like' ? 'Content liked' : 'Content unliked',
      action: action === 'like' ? 'liked' : 'unliked',
      data: { isLiked: action === 'like' },
      userType: kidCheck.type
    });

  } catch (error) {
    console.error('Error updating like:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to update like status'
    });
  }
};

/**
 * API endpoint to get user content preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserContentPreferences = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    const kidCheck = isActualKidProfile(req);

    let watchlist = null;
    let like = null;

    if (kidCheck.isKid) {
      [watchlist] = await query(`
        SELECT 1 as in_list 
        FROM kids_watchlist 
        WHERE kid_profile_id = ? AND content_id = ?
      `, [kidCheck.kidProfileId, contentId]);

      [like] = await query(`
        SELECT 1 as is_liked 
        FROM kids_ratings_feedback 
        WHERE kid_profile_id = ? AND content_id = ? AND reaction IN ('like', 'love')
      `, [kidCheck.kidProfileId, contentId]);
    } else {
      [watchlist] = await query(`
        SELECT 1 as in_list 
        FROM user_watchlist 
        WHERE user_id = ? AND content_id = ?
      `, [userId, contentId]);

      [like] = await query(`
        SELECT 1 as is_liked 
        FROM user_likes 
        WHERE user_id = ? AND content_id = ? AND is_active = TRUE
      `, [userId, contentId]);
    }

    res.json({
      success: true,
      data: {
        isInList: !!watchlist,
        isLiked: !!like,
        userType: kidCheck.isKid ? 'kid_profile' : 'regular_user',
        kidProfileId: kidCheck.isKid ? kidCheck.kidProfileId : null
      }
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch user preferences'
    });
  }
};

/**
 * API endpoint to get batch user preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBatchUserPreferences = async (req, res) => {
  try {
    const { contentIds } = req.body;
    const userId = req.user.id;

    const kidCheck = isActualKidProfile(req);

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content IDs array is required'
      });
    }

    const placeholders = contentIds.map(() => '?').join(',');

    let watchlistResults = [];
    let likeResults = [];

    if (kidCheck.isKid) {
      watchlistResults = await query(`
        SELECT content_id 
        FROM kids_watchlist 
        WHERE kid_profile_id = ? AND content_id IN (${placeholders})
      `, [kidCheck.kidProfileId, ...contentIds]);

      likeResults = await query(`
        SELECT content_id 
        FROM kids_ratings_feedback 
        WHERE kid_profile_id = ? AND content_id IN (${placeholders}) AND reaction IN ('like', 'love')
      `, [kidCheck.kidProfileId, ...contentIds]);
    } else {
      watchlistResults = await query(`
        SELECT content_id 
        FROM user_watchlist 
        WHERE user_id = ? AND content_id IN (${placeholders})
      `, [userId, ...contentIds]);

      likeResults = await query(`
        SELECT content_id 
        FROM user_likes 
        WHERE user_id = ? AND content_id IN (${placeholders}) AND is_active = TRUE
      `, [userId, ...contentIds]);
    }

    const watchlistSet = new Set(watchlistResults.map(row => row.content_id));
    const likeSet = new Set(likeResults.map(row => row.content_id));

    const preferences = {};
    contentIds.forEach(contentId => {
      preferences[contentId] = {
        isInList: watchlistSet.has(contentId),
        isLiked: likeSet.has(contentId),
        userType: kidCheck.isKid ? 'kid_profile' : 'regular_user'
      };
    });

    res.json({
      success: true,
      data: preferences,
      userType: kidCheck.isKid ? 'kid_profile' : 'regular_user'
    });

  } catch (error) {
    console.error('Error fetching batch preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch batch preferences'
    });
  }
};

/**
 * API endpoint to get user watchlist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const kidCheck = isActualKidProfile(req);

    let watchlist = [];

    if (kidCheck.isKid) {
      watchlist = await query(`
        SELECT 
          kw.*,
          c.id as content_id,
          c.title,
          c.content_type,
          c.description,
          c.short_description,
          c.duration_minutes,
          c.release_date,
          c.age_rating,
          c.average_rating,
          c.view_count,
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
        ORDER BY kw.added_at DESC
      `, [process.env.R2_PUBLIC_URL_ID, kidCheck.kidProfileId]);
    } else {
      watchlist = await query(`
        SELECT 
          uw.*,
          c.id as content_id,
          c.title,
          c.content_type,
          c.description,
          c.short_description,
          c.duration_minutes,
          c.release_date,
          c.age_rating,
          c.average_rating,
          c.view_count,
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
        ORDER BY uw.added_at DESC
      `, [process.env.R2_PUBLIC_URL_ID, userId]);
    }

    const processedWatchlist = watchlist.map(item => ({
      id: item.id,
      added_at: item.added_at,
      content: {
        id: item.content_id,
        title: item.title,
        content_type: item.content_type,
        description: item.description,
        short_description: item.short_description,
        duration_minutes: item.duration_minutes,
        release_date: item.release_date,
        age_rating: item.age_rating,
        average_rating: item.average_rating,
        view_count: item.view_count,
        media_assets: item.primary_image_url ? [{
          asset_type: 'thumbnail',
          url: item.primary_image_url,
          is_primary: 1,
          upload_status: 'completed'
        }] : [],
        is_kid_friendly: isKidFriendlyContent(item),
        kid_access_restricted: isContentRestrictedForKids(item).restricted
      }
    }));

    res.json({
      success: true,
      data: processedWatchlist,
      count: processedWatchlist.length,
      userType: kidCheck.isKid ? 'kid_profile' : 'regular_user',
      kidProfileId: kidCheck.isKid ? kidCheck.kidProfileId : null,
      kid_friendly_count: processedWatchlist.filter(item => item.content.is_kid_friendly).length,
      restricted_count: processedWatchlist.filter(item => item.content.kid_access_restricted).length
    });

  } catch (error) {
    console.error('Error fetching user watchlist:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch watchlist'
    });
  }
};

/**
 * API endpoint specifically for kid-friendly content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getKidFriendlyContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      age_rating = null
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = `
      WHERE c.status = 'published' 
        AND c.visibility = 'public'
        AND (
          c.age_rating IN ('G', 'PG', '7+', '13+')
          OR
          EXISTS (
            SELECT 1 FROM content_categories cc
            INNER JOIN categories cat ON cc.category_id = cat.id
            WHERE cc.content_id = c.id 
              AND cat.slug IN ('family', 'animation', 'cartoons', 'educational')
              AND cat.name IN ('Family', 'Animation', 'Cartoons', 'Educational')
          )
          OR
          EXISTS (
            SELECT 1 FROM content_genres cg
            INNER JOIN genres g ON cg.genre_id = g.id
            WHERE cg.content_id = c.id 
              AND g.name IN ('Family', 'Animation', 'Children')
          )
        )
        -- Explicitly exclude restricted content
        AND NOT (
          c.age_rating IN ('R', 'NC-17', '18+', 'A')
          OR EXISTS (
            SELECT 1 FROM content_categories cc
            INNER JOIN categories cat ON cc.category_id = cat.id
            WHERE cc.content_id = c.id 
              AND cat.name IN ('Horror', 'Thriller', 'Crime', 'War', 'Adult')
          )
          OR EXISTS (
            SELECT 1 FROM content_genres cg
            INNER JOIN genres g ON cg.genre_id = g.id
            WHERE cg.content_id = c.id 
              AND g.name IN ('Horror', 'Thriller', 'Crime', 'War', 'Adult')
          )
        )
    `;

    if (age_rating) {
      whereClause += ` AND c.age_rating = ?`;
    }

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
        ) as primary_image_url
      FROM contents c
      LEFT JOIN content_rights cr ON c.id = cr.content_id
      LEFT JOIN content_genres cg ON c.id = cg.content_id
      LEFT JOIN genres g ON cg.genre_id = g.id
      LEFT JOIN content_categories cc ON c.id = cc.content_id
      LEFT JOIN categories cat ON cc.category_id = cat.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.view_count DESC, c.created_at DESC
      LIMIT ? OFFSET ?
    `, [
      process.env.R2_PUBLIC_URL_ID,
      ...(age_rating ? [age_rating] : []),
      parseInt(limit),
      parseInt(offset)
    ]);

    let countWhereClause = `
      WHERE status = 'published' 
        AND visibility = 'public'
        AND (
          age_rating IN ('G', 'PG', '7+', '13+')
          OR EXISTS (
            SELECT 1 FROM content_categories cc
            INNER JOIN categories cat ON cc.category_id = cat.id
            WHERE cc.content_id = contents.id 
              AND cat.slug IN ('family', 'animation', 'cartoons', 'educational')
              AND cat.name IN ('Family', 'Animation', 'Cartoons', 'Educational')
          )
          OR EXISTS (
            SELECT 1 FROM content_genres cg
            INNER JOIN genres g ON cg.genre_id = g.id
            WHERE cg.content_id = contents.id 
              AND g.name IN ('Family', 'Animation', 'Children')
          )
        )
        AND NOT (
          age_rating IN ('R', 'NC-17', '18+', 'A')
          OR EXISTS (
            SELECT 1 FROM content_categories cc
            INNER JOIN categories cat ON cc.category_id = cat.id
            WHERE cc.content_id = contents.id 
              AND cat.name IN ('Horror', 'Thriller', 'Crime', 'War', 'Adult')
          )
          OR EXISTS (
            SELECT 1 FROM content_genres cg
            INNER JOIN genres g ON cg.genre_id = g.id
            WHERE cg.content_id = contents.id 
              AND g.name IN ('Horror', 'Thriller', 'Crime', 'War', 'Adult')
          )
        )
    `;

    if (age_rating) {
      countWhereClause += ` AND age_rating = ?`;
    }

    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM contents 
      ${countWhereClause}
    `, age_rating ? [age_rating] : []);

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
        last_updated: content.updated_at || content.created_at,
        is_kid_friendly: true,
        kid_access_restricted: false,
        kid_safe: true
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
      last_updated: new Date().toISOString(),
      filters: {
        age_rating: age_rating || 'all',
        content_type: 'kid_friendly',
        safety_level: 'guaranteed_kid_safe'
      }
    };

    res.json({
      success: true,
      data: responseData,
      cached: false,
      timestamp: Date.now(),
      message: 'Kid-friendly content retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching kid-friendly content:', error);
    res.status(500).json({
      error: 'Unable to load kid-friendly content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getViewerLandingContent,
  getAllViewerContent,
  getViewerContentById,
  trackContentView,
  rateContent,
  getWatchHistory,
  toggleWatchlist,
  toggleLike,
  getUserContentPreferences,
  getBatchUserPreferences,
  getUserWatchlist,
  extractDeviceInfo,
  securityChecks,
  getTrendingMovies,
  getTrendingInsights,
  getTrendingHealth,
  calculateTrendingScore,
  TRENDING_CONFIG,
  isActualKidProfile,
  isKidFriendlyContent,
  isContentRestrictedForKids,
  validateKidContentAccess,
  getKidFriendlyContent,
  KID_CONTENT_CONFIG
};