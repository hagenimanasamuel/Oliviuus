// middlewares/subscriptionMiddleware.js
const { query } = require("../config/dbConfig");

// Get device type from user agent
const getDeviceType = (userAgent) => {
  if (!userAgent) return 'web';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('smart-tv') || ua.includes('tv') || ua.includes('roku')) return 'smarttv';
  return 'web';
};

// Check if device is allowed for subscription
const isDeviceAllowed = (subscriptionDevices, currentDevice) => {
  if (!subscriptionDevices || typeof subscriptionDevices === 'string') {
    try {
      subscriptionDevices = JSON.parse(subscriptionDevices || '[]');
    } catch {
      subscriptionDevices = ['web', 'mobile', 'tablet', 'smarttv']; // Default allowed
    }
  }
  
  return subscriptionDevices.includes(currentDevice);
};

// Check if user has reached device limit
const hasReachedDeviceLimit = async (userId, subscriptionId, maxDevices) => {
  // Count active sessions for this user
  const activeSessions = await query(`
    SELECT COUNT(*) as active_count 
    FROM user_session 
    WHERE user_id = ? 
      AND is_active = TRUE 
      AND token_expires > NOW()
  `, [userId]);

  return activeSessions[0]?.active_count >= maxDevices;
};

// Check video quality restrictions
const isQualityAllowed = (subscriptionQuality, videoQuality) => {
  const qualityOrder = {
    'SD': 1,
    'HD': 2, 
    'FHD': 3,
    'UHD': 4
  };
  
  const subQuality = qualityOrder[subscriptionQuality] || 1;
  const vidQuality = qualityOrder[videoQuality] || 1;
  
  return vidQuality <= subQuality;
};

// Main subscription validation middleware
const validateSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userAgent = req.get('User-Agent');
    const deviceType = getDeviceType(userAgent);
    const { contentId, assetId } = req.params;

    // Get user's active subscription
    const userSubscription = await query(`
      SELECT 
        us.*,
        s.name as subscription_name,
        s.type as subscription_type,
        s.devices_allowed,
        s.max_devices_registered,
        s.max_sessions,
        s.video_quality,
        s.max_video_bitrate,
        s.supported_platforms,
        s.offline_downloads,
        s.content_restrictions
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status = 'active'
        AND us.end_date > NOW()
      ORDER BY us.start_date DESC
      LIMIT 1
    `, [userId]);

    // If no active subscription, check for free tier
    if (userSubscription.length === 0) {
      // Check if content is available for free users
      const freeContent = await query(`
        SELECT c.*, cr.license_type 
        FROM contents c
        LEFT JOIN content_rights cr ON c.id = cr.content_id
        WHERE c.id = ? 
          AND c.status = 'published'
          AND c.visibility = 'public'
      `, [contentId]);

      if (freeContent.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Content not found',
          code: 'CONTENT_NOT_FOUND'
        });
      }

      // Free tier restrictions
      req.subscription = {
        type: 'free',
        devices_allowed: ['web', 'mobile'],
        max_devices: 1,
        video_quality: 'SD',
        max_bitrate: 2000,
        supported_platforms: ['web', 'mobile']
      };
      
      return next();
    }

    const subscription = userSubscription[0];
    
    // Parse JSON fields
    let devicesAllowed = ['web', 'mobile', 'tablet', 'smarttv'];
    let supportedPlatforms = ['web', 'mobile', 'tablet', 'smarttv'];
    let contentRestrictions = [];
    
    try {
      devicesAllowed = JSON.parse(subscription.devices_allowed || '[]');
      supportedPlatforms = JSON.parse(subscription.supported_platforms || '[]');
      contentRestrictions = JSON.parse(subscription.content_restrictions || '[]');
    } catch (e) {
      console.warn('Error parsing subscription JSON fields:', e);
    }

    // Check device compatibility
    if (!isDeviceAllowed(devicesAllowed, deviceType)) {
      return res.status(403).json({
        success: false,
        error: `Your ${subscription.subscription_name} plan does not support ${deviceType} devices`,
        code: 'DEVICE_NOT_SUPPORTED',
        current_device: deviceType,
        allowed_devices: devicesAllowed
      });
    }

    // Check platform support
    if (!supportedPlatforms.includes(deviceType)) {
      return res.status(403).json({
        success: false,
        error: `${deviceType} platform not supported by your subscription`,
        code: 'PLATFORM_NOT_SUPPORTED'
      });
    }

    // Check device limits
    if (await hasReachedDeviceLimit(userId, subscription.subscription_id, subscription.max_devices_registered)) {
      return res.status(403).json({
        success: false,
        error: `Device limit reached. Maximum ${subscription.max_devices_registered} devices allowed.`,
        code: 'DEVICE_LIMIT_REACHED'
      });
    }

    // Check session limits
    const activeSessions = await query(`
      SELECT COUNT(*) as session_count 
      FROM content_watch_sessions 
      WHERE user_id = ? 
        AND last_activity_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [userId]);

    if (activeSessions[0]?.session_count >= subscription.max_sessions) {
      return res.status(403).json({
        success: false,
        error: `Maximum concurrent streams (${subscription.max_sessions}) reached`,
        code: 'SESSION_LIMIT_REACHED'
      });
    }

    // Get video quality for quality check
    if (assetId) {
      const videoAsset = await query(`
        SELECT resolution, bitrate 
        FROM media_assets 
        WHERE id = ? AND content_id = ?
      `, [assetId, contentId]);

      if (videoAsset.length > 0) {
        const asset = videoAsset[0];
        
        // Check quality restrictions
        if (!isQualityAllowed(subscription.video_quality, asset.resolution)) {
          return res.status(403).json({
            success: false,
            error: `Video quality (${asset.resolution}) not supported by your ${subscription.video_quality} plan`,
            code: 'QUALITY_NOT_SUPPORTED'
          });
        }

        // Check bitrate restrictions
        if (asset.bitrate > subscription.max_video_bitrate) {
          return res.status(403).json({
            success: false,
            error: `Video bitrate exceeds your plan limit of ${subscription.max_video_bitrate}kbps`,
            code: 'BITRATE_EXCEEDED'
          });
        }
      }
    }

    // Check content restrictions
    if (contentRestrictions.length > 0 && contentId) {
      const contentCheck = await query(`
        SELECT c.content_type, cg.genre_id 
        FROM contents c
        LEFT JOIN content_genres cg ON c.id = cg.content_id
        WHERE c.id = ?
      `, [contentId]);

      if (contentCheck.length > 0) {
        const content = contentCheck[0];
        const restrictedTypes = contentRestrictions.filter(r => r.type === 'content_type').map(r => r.value);
        const restrictedGenres = contentRestrictions.filter(r => r.type === 'genre').map(r => r.value);

        if (restrictedTypes.includes(content.content_type)) {
          return res.status(403).json({
            success: false,
            error: 'This content type is restricted by your subscription',
            code: 'CONTENT_TYPE_RESTRICTED'
          });
        }

        if (content.genre_id && restrictedGenres.includes(content.genre_id.toString())) {
          return res.status(403).json({
            success: false,
            error: 'This genre is restricted by your subscription',
            code: 'GENRE_RESTRICTED'
          });
        }
      }
    }

    // All checks passed - attach subscription info to request
    req.subscription = {
      type: subscription.subscription_type,
      name: subscription.subscription_name,
      devices_allowed: devicesAllowed,
      max_devices: subscription.max_devices_registered,
      max_sessions: subscription.max_sessions,
      video_quality: subscription.video_quality,
      max_bitrate: subscription.max_video_bitrate,
      supported_platforms: supportedPlatforms,
      offline_downloads: subscription.offline_downloads,
      content_restrictions: contentRestrictions
    };

    next();

  } catch (error) {
    console.error('Subscription validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Subscription validation failed',
      code: 'SUBSCRIPTION_VALIDATION_ERROR'
    });
  }
};

// Middleware for download validation
const validateDownload = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contentId } = req.params;

    // Get user subscription
    const userSubscription = await query(`
      SELECT 
        us.*,
        s.offline_downloads,
        s.max_downloads,
        s.download_quality,
        s.download_expiry_days,
        s.simultaneous_downloads
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status = 'active'
        AND us.end_date > NOW()
      LIMIT 1
    `, [userId]);

    if (userSubscription.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required for downloads',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    const subscription = userSubscription[0];

    // Check if downloads are allowed
    if (!subscription.offline_downloads) {
      return res.status(403).json({
        success: false,
        error: 'Offline downloads not included in your plan',
        code: 'DOWNLOADS_NOT_ALLOWED'
      });
    }

    // Check download count
    const userDownloads = await query(`
      SELECT COUNT(*) as download_count 
      FROM user_downloads 
      WHERE user_id = ? 
        AND download_status = 'completed'
        AND downloaded_at > DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [userId, subscription.download_expiry_days]);

    if (userDownloads[0]?.download_count >= subscription.max_downloads) {
      return res.status(403).json({
        success: false,
        error: `Download limit reached. Maximum ${subscription.max_downloads} downloads allowed.`,
        code: 'DOWNLOAD_LIMIT_REACHED'
      });
    }

    // Check content download rights
    const contentRights = await query(`
      SELECT downloadable 
      FROM content_rights 
      WHERE content_id = ?
    `, [contentId]);

    if (contentRights.length === 0 || !contentRights[0].downloadable) {
      return res.status(403).json({
        success: false,
        error: 'This content cannot be downloaded',
        code: 'CONTENT_NOT_DOWNLOADABLE'
      });
    }

    req.downloadInfo = {
      max_quality: subscription.download_quality,
      expiry_days: subscription.download_expiry_days,
      simultaneous_downloads: subscription.simultaneous_downloads
    };

    next();

  } catch (error) {
    console.error('Download validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Download validation failed',
      code: 'DOWNLOAD_VALIDATION_ERROR'
    });
  }
};

module.exports = {
  validateSubscription,
  validateDownload,
  getDeviceType,
  isDeviceAllowed,
  hasReachedDeviceLimit,
  isQualityAllowed
};