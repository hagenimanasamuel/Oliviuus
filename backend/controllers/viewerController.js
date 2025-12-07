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

// ADDED: Trending algorithm configuration
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

// ADDED: Trending cache
const trendingCache = new Map();
const TRENDING_CACHE_DURATION = 10 * 60 * 1000;

// ADDED: Cache cleanup every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of trendingCache.entries()) {
    if (now - value.timestamp > TRENDING_CACHE_DURATION * 6) {
      trendingCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

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

// ADDED: Universal trending score calculation
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

// ADDED: Time decay calculation
const calculateTimeDecay = (ageInDays) => {
  if (ageInDays <= 7) return 1.0;
  if (ageInDays <= 30) return 0.9;
  if (ageInDays <= 90) return 0.8;
  if (ageInDays <= 365) return 0.7;
  return 0.6;
};

// ADDED: Main trending content fetch
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

// ✅ UPDATED: Better kid detection function
const isActualKidProfile = (req) => {
  // Family members with kid dashboard are NOT actual kid profiles
  // They have their own user account and should use regular user tables
  
  // Check if user is a family member with kid dashboard
  if (req.user?.is_family_member && req.user?.dashboard_type === 'kid') {
    return {
      isKid: false,  // ← THIS IS THE FIX! They are NOT actual kid profiles
      userId: req.user.id,
      type: 'family_member_kid_dashboard'  // Special type for tracking
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

  // Option 2: Check if user is flagged as kid in their user record
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

// Enhanced security checks with proper device counting
const securityChecks = {
  // Validate user subscription
  validateSubscription: async (userId) => {
    try {
      // First, check if user has their own active subscription
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

      // If user has their own active subscription, use it
      if (userSubscription.length > 0) {
        const sub = userSubscription[0];

        // Check if subscription is valid
        if (sub.status !== 'active') {
          throw new Error('Subscription is not active');
        }

        // Check if subscription has expired
        if (sub.end_date && new Date(sub.end_date) < new Date()) {
          throw new Error('Subscription has expired');
        }

        console.log('✅ User has personal subscription:', sub.plan_name);
        return sub;
      }

      // If no personal subscription, check if user is part of a family with active Family Plan
      console.log('🔍 Checking family sharing for user:', userId);
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
        AND s.type = 'family'  -- Only Family Plan can share
      ORDER BY us.created_at DESC
      LIMIT 1
    `, [userId]);

      if (familyAccess.length > 0) {
        const family = familyAccess[0];

        // Check if family member is within access hours
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

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
            // Suspension period has ended, reactivate
            await query(`
            UPDATE family_members 
            SET is_suspended = FALSE, suspended_until = NULL, suspension_reason = NULL
            WHERE id = ?
          `, [family.id]);
          }
        }

        console.log('✅ User accessing via family sharing. Owner plan:', family.owner_plan_name);

        // Return family owner's subscription details
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
          is_family_shared: true, // Flag to indicate this is family access
          family_member_id: family.id,
          member_role: family.member_role,
          dashboard_type: family.dashboard_type
        };
      }

      // No personal subscription and no family access
      throw new Error('No active subscription found');

    } catch (error) {
      console.error('Subscription validation error:', error);
      throw error;
    }
  },

  // Check device limits - FIXED LOGIC: Only deny when active sessions > max devices
  checkDeviceLimits: async (userId, deviceId, deviceType) => {
    try {
      // Validate device type
      if (!securityConfig.allowedDeviceTypes.includes(deviceType)) {
        throw new Error(`Device type '${deviceType}' is not supported`);
      }

      // Get subscription (could be personal or family)
      const subscription = await securityChecks.validateSubscription(userId);
      const maxDevices = subscription.max_devices;

      // Check if device type is allowed for this subscription
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

      // For family members, we need to count devices across the entire family
      let activeSessions;
      if (subscription.is_family_shared) {
        // Count active sessions for all family members under this owner
        activeSessions = await query(`
        SELECT us.id, us.device_id, us.device_type, us.last_activity
        FROM user_session us
        INNER JOIN family_members fm ON us.user_id = fm.user_id
        WHERE fm.family_owner_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
          AND us.is_active = TRUE
        ORDER BY us.last_activity DESC
      `, [subscription.user_id]); // Use family owner's ID
      } else {
        // Personal subscription - count only user's sessions
        activeSessions = await query(`
        SELECT id, device_id, device_type, last_activity
        FROM user_session 
        WHERE user_id = ? 
          AND is_active = TRUE
        ORDER BY last_activity DESC
      `, [userId]);
      }

      console.log('🔍 DEBUG - Active sessions count:', activeSessions.length);
      console.log('🔍 DEBUG - Subscription type:', subscription.is_family_shared ? 'Family Shared' : 'Personal');
      console.log('🔍 DEBUG - Max devices:', maxDevices);

      // Check if device is already in active sessions
      const existingSession = activeSessions.find(session => session.device_id === deviceId);

      if (existingSession) {
        // Update last active timestamp for existing session
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

      // Handle 0 max devices case
      if (maxDevices === 0) {
        throw new Error(`Your current plan does not allow any active sessions. Please upgrade your plan to watch content.`);
      }

      // Allow when AT or BELOW limit, deny only when EXCEEDING
      if (activeSessions.length <= maxDevices) {
        return {
          withinLimit: true,
          isNewDevice: true,
          currentDevices: activeSessions.length + 1,
          maxDevices: maxDevices,
          isFamilyShared: subscription.is_family_shared || false
        };
      } else {
        // User has exceeded device limit - DENY access
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

  // Check concurrent streams - FIXED LOGIC
  checkConcurrentStreams: async (userId, contentId) => {
    try {
      const subscription = await securityChecks.validateSubscription(userId);
      const maxStreams = subscription.concurrent_streams || securityConfig.maxConcurrentStreams;

      // Count active streams in last 30 minutes
      const activeStreams = await query(`
        SELECT COUNT(*) as active_count
        FROM content_watch_sessions 
        WHERE user_id = ? 
          AND last_activity_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      `, [userId]);

      const currentStreams = activeStreams[0]?.active_count || 0;

      // Allow if current streams are LESS THAN max streams
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

  // Validate content access rights - ADDED MISSING FUNCTION
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

      // Check content rights dates
      if (content.start_date && new Date(content.start_date) > new Date()) {
        throw new Error('Content is not yet available');
      }

      if (content.end_date && new Date(content.end_date) < new Date()) {
        throw new Error('Content access has expired');
      }

      // Check geographic restrictions
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

  // Check geographic restrictions - ADDED MISSING FUNCTION
  checkGeoRestrictions: async (userId, content) => {
    try {
      // Get user's location from session
      const [userSession] = await query(`
        SELECT location 
        FROM user_session 
        WHERE user_id = ? AND is_active = TRUE
        ORDER BY last_activity DESC
        LIMIT 1
      `, [userId]);

      const userLocation = userSession?.location;

      if (!userLocation) {
        // If no location data, allow access
        return { allowed: true, reason: 'No location data' };
      }

      // Check blocked countries
      if (content.blocked_countries) {
        const blockedCountries = JSON.parse(content.blocked_countries);
        if (blockedCountries.includes(userLocation)) {
          return { allowed: false, reason: 'Country blocked' };
        }
      }

      // Check allowed regions
      if (content.allowed_regions) {
        const allowedRegions = JSON.parse(content.allowed_regions);
        if (allowedRegions.length > 0 && !allowedRegions.includes(userLocation)) {
          return { allowed: false, reason: 'Region not allowed' };
        }
      }

      return { allowed: true, reason: 'Region allowed' };
    } catch (error) {
      console.error('Geo restriction check error:', error);
      // Allow access if geo check fails
      return { allowed: true, reason: 'Geo check failed' };
    }
  },

  // Log security event - ADDED MISSING FUNCTION
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

  // Enhanced security wrapper with better error messages
  secureContentStream: (contentHandler) => {
    return async (req, res) => {
      try {
        const userId = req.user.id;
        const { contentId } = req.params;
        const deviceId = req.headers['x-device-id'] || req.deviceInfo?.id || `web_${userId}`;
        const deviceType = req.headers['x-device-type'] || req.deviceInfo?.type || 'web';

        console.log(`🔒 Security check for user ${userId}, content ${contentId}, device ${deviceId} (${deviceType})`);

        // 1. Validate user subscription (includes family sharing)
        const subscription = await securityChecks.validateSubscription(userId);
        console.log('✅ Subscription valid:', subscription.plan_name, subscription.is_family_shared ? '(Family Shared)' : '(Personal)');

        // 2. Check device limits with proper counting
        const deviceCheck = await securityChecks.checkDeviceLimits(userId, deviceId, deviceType);
        console.log('✅ Device check passed:', deviceCheck);

        // 3. Validate content access
        const contentAccess = await securityChecks.validateContentAccess(userId, contentId);
        console.log('✅ Content access granted for:', contentAccess.content.title);

        // 4. Check concurrent streams
        const streamCheck = await securityChecks.checkConcurrentStreams(userId, contentId);
        console.log('✅ Stream check passed:', `${streamCheck.currentStreams}/${streamCheck.maxStreams} streams`);

        // Log successful security check
        await securityChecks.logSecurityEvent(userId, 'content_access', 'success', {
          contentId,
          deviceId,
          deviceType,
          ipAddress: req.ip,
          deviceInfo: req.deviceInfo,
          subscription: subscription.plan_name,
          isFamilyShared: subscription.is_family_shared || false
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
          timestamp: new Date().toISOString()
        };

        // Proceed with original content handler
        return await contentHandler(req, res);

      } catch (error) {
        console.error('🔒 Security check failed:', error.message);

        // Enhanced error mapping with specific codes and messages
        let errorCode = 'ACCESS_DENIED';
        let userMessage = error.message;
        let additionalInfo = null;
        let isFamilyShared = false;

        if (error.message.includes('No active subscription')) {
          errorCode = 'SUBSCRIPTION_REQUIRED';
          userMessage = 'You need an active subscription to watch this content.';
        } else if (error.message.includes('active sessions out of')) {
          errorCode = 'DEVICE_LIMIT_REACHED';
          isFamilyShared = error.message.includes('family');
          // Keep the exact message with numbers
        } else if (error.message.includes('active streams out of')) {
          errorCode = 'STREAM_LIMIT_REACHED';
          isFamilyShared = error.message.includes('family');
          // Keep the exact message with numbers
        } else if (error.message.includes('only supports watching on')) {
          errorCode = 'PLAN_RESTRICTION';
          // Keep the exact device restriction message
        } else if (error.message.includes('Content not available in your region')) {
          errorCode = 'GEO_RESTRICTED';
          userMessage = 'This content is not available in your region.';
        } else if (error.message.includes('Access restricted during sleep hours') || error.message.includes('Access restricted outside allowed hours')) {
          errorCode = 'TIME_RESTRICTION';
          userMessage = error.message;
        } else if (error.message.includes('family access is suspended') || error.message.includes('family access has been restricted')) {
          errorCode = 'FAMILY_ACCESS_RESTRICTED';
          userMessage = error.message;
        } else if (error.message.includes('Your current plan does not allow any active sessions')) {
          errorCode = 'PLAN_RESTRICTION';
          userMessage = error.message;
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
          additionalInfo: additionalInfo,
          isFamilyShared: isFamilyShared,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
};

// Enhanced device info extraction
const extractDeviceInfo = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  let deviceType = 'web';

  // Enhanced device detection
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

  // Extract geo location from headers if available
  req.geoLocation = {
    country: req.headers['x-country-code'] || req.headers['cf-ipcountry'],
    region: req.headers['x-region'],
    city: req.headers['x-city']
  };

  next();
};

// ADDED: Get trending movies API endpoint
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

    if (!refresh && cachedData && (Date.now() - cachedData.timestamp < TRENDING_CACHE_DURATION)) {
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

// ADDED: Get trending insights
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

// ADDED: Trending health check
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
    console.error('❌ Health check error:', error);
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: "Service unavailable"
    });
  }
};

// Get viewer landing page content - ENHANCED WITH TRENDING ALGORITHM
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

    // Fallback: Use trending algorithm for hero
    if (heroContent.length === 0) {
      console.log('Using trending algorithm for hero...');
      const trendingContent = await getUniversalTrendingContent(1);
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
          GROUP BY c.id
        `, [process.env.R2_PUBLIC_URL_ID, trendingHero.id]);
      }
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

    // Get trending content using the trending algorithm
    const trendingContent = await getUniversalTrendingContent(12);

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
    const processedTrending = trendingContent; // Already processed by trending algorithm
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

// Get single content for viewer - SECURED VERSION
const getViewerContentById = securityChecks.secureContentStream(async (req, res) => {
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

    // FIXED: For series content, create seasons structure from media assets
    if (content.content_type === 'series') {
      console.log('🔍 Processing series content - creating seasons structure');

      // Get unique seasons from media assets
      const seasonNumbers = [...new Set(mediaAssets
        .filter(asset => asset.season_number !== null && asset.season_number !== undefined)
        .map(asset => asset.season_number)
      )].sort((a, b) => a - b);

      console.log('🔍 Found season numbers:', seasonNumbers);

      const seasons = [];

      for (const seasonNumber of seasonNumbers) {
        // Get season poster from media assets
        const seasonPoster = mediaAssets.find(asset =>
          asset.season_number === seasonNumber &&
          asset.asset_type === 'season_poster'
        );

        // Get episodes for this season from media assets
        const episodeNumbers = [...new Set(mediaAssets
          .filter(asset =>
            asset.season_number === seasonNumber &&
            asset.episode_number !== null &&
            asset.episode_number !== undefined
          )
          .map(asset => asset.episode_number)
        )].sort((a, b) => a - b);

        console.log(`🔍 Season ${seasonNumber} - episodes:`, episodeNumbers);

        const episodes = [];

        for (const episodeNumber of episodeNumbers) {
          // Get episode thumbnail
          const episodeThumbnail = mediaAssets.find(asset =>
            asset.season_number === seasonNumber &&
            asset.episode_number === episodeNumber &&
            asset.asset_type === 'episodeThumbnail'
          );

          // Get episode video asset to extract episode title and description
          const episodeVideoAsset = mediaAssets.find(asset =>
            asset.season_number === seasonNumber &&
            asset.episode_number === episodeNumber &&
            asset.asset_type === 'episodeVideo'
          );

          // Get episode trailer
          const episodeTrailer = mediaAssets.find(asset =>
            asset.season_number === seasonNumber &&
            asset.episode_number === episodeNumber &&
            asset.asset_type === 'episodeTrailer'
          );

          // Get episode media assets count
          const episodeMediaAssetsCount = mediaAssets.filter(asset =>
            asset.season_number === seasonNumber &&
            asset.episode_number === episodeNumber
          ).length;

          // Smart title selection with proper conditioning
          let episodeTitle = null;
          if (episodeVideoAsset?.episode_title) {
            episodeTitle = episodeVideoAsset.episode_title;
          } else if (episodeVideoAsset?.asset_title) {
            episodeTitle = episodeVideoAsset.asset_title;
          }

          // Smart description selection with proper conditioning
          let episodeDescription = null;
          if (episodeVideoAsset?.episode_description) {
            episodeDescription = episodeVideoAsset.episode_description;
          } else if (episodeVideoAsset?.asset_description) {
            episodeDescription = episodeVideoAsset.asset_description;
          }

          episodes.push({
            id: `season-${seasonNumber}-episode-${episodeNumber}`,
            episode_number: episodeNumber,
            title: episodeTitle, // Will be null if no data found
            description: episodeDescription, // Will be null if no data found
            duration_minutes: episodeVideoAsset?.duration_seconds ? Math.floor(episodeVideoAsset.duration_seconds / 60) : null,
            release_date: null,
            media_assets_count: episodeMediaAssetsCount,
            episode_thumbnail_url: episodeThumbnail?.url || null,
            has_trailer: !!episodeTrailer
          });
        }

        seasons.push({
          id: `season-${seasonNumber}`,
          season_number: seasonNumber,
          title: `Season ${seasonNumber}`,
          description: null,
          release_date: null,
          actual_episode_count: episodes.length,
          episode_count: episodes.length,
          season_poster_url: seasonPoster?.url || null,
          episodes: episodes
        });
      }

      content.seasons = seasons;
      console.log('🔍 Created seasons structure:', seasons);
    } else {
      // For non-series content, ensure seasons is an empty array
      content.seasons = [];
      console.log('🔍 Non-series content - setting empty seasons array');
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

    // Add security context to response
    content.security_context = {
      can_stream: true,
      subscription_tier: req.securityContext.subscription.plan_name,
      max_quality: req.securityContext.subscription.max_quality,
      download_enabled: req.securityContext.subscription.download_enabled,
      device_type: req.securityContext.deviceType,
      security_checked: true
    };

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
      languages: content.available_languages?.length || 0,
      content_type: content.content_type
    });

    res.json({
      success: true,
      data: content,
      cached: false,
      timestamp: Date.now(),
      security: {
        checked: true,
        passed: true,
        subscription: req.securityContext.subscription.plan_name
      }
    });

  } catch (error) {
    console.error('Error fetching content by ID:', error);
    res.status(500).json({
      error: 'Unable to load content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ UPDATED: Track content view - Separates kid vs regular user tracking
const trackContentView = securityChecks.secureContentStream(async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;
    const { watch_duration_seconds = 0, percentage_watched = 0, device_type = 'web' } = req.body;

    // Determine if user is an actual kid profile
    const kidCheck = isActualKidProfile(req);

    // Use security context from the middleware
    const securityContext = req.securityContext;

    if (kidCheck.isKid) {
      // ✅ Insert into kids_viewing_history for ACTUAL kid profiles only
      await query(`
        INSERT INTO kids_viewing_history 
        (kid_profile_id, content_id, watch_duration_seconds, percentage_watched, device_type, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [kidCheck.kidProfileId, contentId, watch_duration_seconds, percentage_watched, device_type, `kid_secure_${Date.now()}`]);

      console.log('✅ Tracked view for KID profile:', kidCheck.kidProfileId);
    } else {
      // ✅ Insert into content_view_history for REGULAR users (even family members with kid dashboard)
      await query(`
        INSERT INTO content_view_history 
        (content_id, user_id, watch_duration_seconds, percentage_watched, device_type, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [contentId, userId, watch_duration_seconds, percentage_watched, device_type, `secure_${Date.now()}`]);

      // ✅ Update content view count for REGULAR users only
      await query(`
        UPDATE contents 
        SET view_count = view_count + 1
        WHERE id = ?
      `, [contentId]);

      console.log('✅ Tracked view for REGULAR user:', userId);
    }

    // Clear related cache entries to ensure fresh data
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

// ✅ UPDATED: Add/Remove from watchlist - Fixed for family members with kid dashboard
const toggleWatchlist = async (req, res) => {
  try {
    const { contentId, action } = req.body;
    const userId = req.user.id;

    // Determine if user is an actual kid profile
    const kidCheck = isActualKidProfile(req);

    console.log('🔍 toggleWatchlist - kidCheck:', kidCheck);

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required'
      });
    }

    // Verify content exists
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

    // FAMILY MEMBERS WITH KID DASHBOARD USE REGULAR USER TABLES
    if (kidCheck.isKid && kidCheck.type === 'kid_profile') {
      // ACTUAL KID PROFILES use kids_watchlist
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
      // REGULAR USERS and FAMILY MEMBERS WITH KID DASHBOARD use user_watchlist
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

// ✅ UPDATED: Like/Unlike content - Fixed for family members with kid dashboard
const toggleLike = async (req, res) => {
  try {
    const { contentId, action } = req.body;
    const userId = req.user.id;

    // Determine if user is an actual kid profile
    const kidCheck = isActualKidProfile(req);

    console.log('🔍 toggleLike - kidCheck:', kidCheck);

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'Content ID is required'
      });
    }

    // Verify content exists
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

    // FAMILY MEMBERS WITH KID DASHBOARD USE REGULAR USER TABLES
    if (kidCheck.isKid && kidCheck.type === 'kid_profile') {
      // ACTUAL KID PROFILES use kids_ratings_feedback
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
      // REGULAR USERS and FAMILY MEMBERS WITH KID DASHBOARD use user_likes
      if (action === 'like') {
        await query(`
          INSERT INTO user_likes (user_id, content_id, liked_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP, is_active = TRUE, unliked_at = NULL
        `, [userId, contentId]);

        // Update content like count for regular users
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

        // Update content like count for regular users
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

// ✅ UPDATED: Get user preferences for specific content - Checks both tables
const getUserContentPreferences = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    // Determine if user is an actual kid profile
    const kidCheck = isActualKidProfile(req);

    let watchlist = null;
    let like = null;

    if (kidCheck.isKid) {
      // ✅ Check kids_watchlist for ACTUAL kid profiles
      [watchlist] = await query(`
        SELECT 1 as in_list 
        FROM kids_watchlist 
        WHERE kid_profile_id = ? AND content_id = ?
      `, [kidCheck.kidProfileId, contentId]);

      // ✅ Check kids_ratings_feedback for likes (kid profiles)
      [like] = await query(`
        SELECT 1 as is_liked 
        FROM kids_ratings_feedback 
        WHERE kid_profile_id = ? AND content_id = ? AND reaction IN ('like', 'love')
      `, [kidCheck.kidProfileId, contentId]);
    } else {
      // ✅ Check regular user tables for REGULAR users
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

// Batch get user preferences for multiple contents
const getBatchUserPreferences = async (req, res) => {
  try {
    const { contentIds } = req.body;
    const userId = req.user.id;

    // Determine if user is an actual kid profile
    const kidCheck = isActualKidProfile(req);

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content IDs array is required'
      });
    }

    // Get placeholders for SQL query
    const placeholders = contentIds.map(() => '?').join(',');

    let watchlistResults = [];
    let likeResults = [];

    if (kidCheck.isKid) {
      // ✅ Get from kids tables for ACTUAL kid profiles
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
      // ✅ Get from regular user tables for REGULAR users
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

// ✅ UPDATED: Get User watchlist - Separates kid vs regular user
const getUserWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;

    // Determine if user is an actual kid profile
    const kidCheck = isActualKidProfile(req);

    let watchlist = [];

    if (kidCheck.isKid) {
      // ✅ Get from kids_watchlist for ACTUAL kid profiles only
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

      console.log('✅ Fetching KID watchlist for profile:', kidCheck.kidProfileId);
    } else {
      // ✅ Get from user_watchlist for REGULAR users (even family members with kid dashboard)
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

      console.log('✅ Fetching REGULAR user watchlist for user:', userId);
    }

    // Process the data to match your frontend structure
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
        }] : []
      }
    }));

    res.json({
      success: true,
      data: processedWatchlist,
      count: processedWatchlist.length,
      userType: kidCheck.isKid ? 'kid_profile' : 'regular_user',
      kidProfileId: kidCheck.isKid ? kidCheck.kidProfileId : null
    });

  } catch (error) {
    console.error('Error fetching user watchlist:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch watchlist'
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
  // TRENDING FUNCTIONS
  getTrendingMovies,
  getTrendingInsights,
  getTrendingHealth,
  calculateTrendingScore,
  TRENDING_CONFIG,
  //Helper function for determining kid status
  isActualKidProfile
};