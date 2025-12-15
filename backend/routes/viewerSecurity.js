const express = require("express");
const SecurityValidator = require("../controllers/securityValidator");
const authMiddleware = require("../middlewares/authMiddleware");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting for security endpoints
const securityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many security requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again later."
  }
});

/**
 * @route POST /api/security/validate-stream
 * @desc Enterprise security validation for content streaming
 * @access Private
 */
router.post("/validate-stream", authMiddleware, securityLimiter, async (req, res) => {
  try {
    const { contentId, deviceId, deviceType } = req.body;
    const userId = req.user.id;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: "Content ID is required",
        code: "MISSING_CONTENT_ID"
      });
    }

    // Use device info from request or headers
    const finalDeviceId = deviceId || 
                         req.headers['x-device-id'] || 
                         req.deviceInfo?.id || 
                         `device_${deviceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const finalDeviceType = deviceType || 
                           req.headers['x-device-type'] || 
                           req.deviceInfo?.type || 
                           'web';

    console.log(`🔒 [API] Enterprise security validation for user ${userId}, content ${contentId}`);
    console.log(`📱 Device: ${finalDeviceType} (${finalDeviceId})`);

    // Perform comprehensive security validation
    const validationResult = await SecurityValidator.validateContentStreamAccess(
      userId,
      contentId,
      finalDeviceId,
      finalDeviceType,
      ipAddress
    );

    // Log validation result
    await SecurityValidator.logSecurityEvent({
      userId,
      action: 'stream_validation_completed',
      status: validationResult.valid ? 'success' : 'failed',
      details: {
        contentId,
        deviceId: finalDeviceId,
        deviceType: finalDeviceType,
        ipAddress,
        valid: validationResult.valid,
        code: validationResult.code
      }
    });

    if (!validationResult.valid) {
      return res.status(403).json({
        success: false,
        ...validationResult,
        timestamp: new Date().toISOString()
      });
    }

    // Success response
    res.json({
      success: true,
      ...validationResult,
      timestamp: new Date().toISOString(),
      session: validationResult.details.session
    });

  } catch (error) {
    console.error("❌ [API] Security validation endpoint error:", error);
    
    // Log system error
    await SecurityValidator.logSecurityIncident({
      userId: req.user?.id,
      action: 'security_endpoint_error',
      status: 'failed',
      details: { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });

    res.status(500).json({
      success: false,
      error: "Security validation system error",
      code: "SYSTEM_ERROR",
      details: process.env.NODE_ENV === 'development' ? { message: error.message } : undefined,
      supportContact: "security@yourplatform.com",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/security/validate-content/:contentId
 * @desc Quick content validation (lightweight check)
 * @access Private
 */
router.get("/validate-content/:contentId", authMiddleware, securityLimiter, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: "Content ID is required",
        code: "MISSING_CONTENT_ID"
      });
    }

    console.log(`🔍 [API] Quick validation for content ${contentId}`);

    // Quick validation - check content exists and user has basic access
    const [content, subscription, user] = await Promise.all([
      // Content check
      query(`
        SELECT id, title, status, visibility, age_rating, content_type
        FROM contents 
        WHERE id = ? 
          AND status = 'published' 
          AND visibility = 'public'
          AND (start_date IS NULL OR start_date <= NOW())
          AND (end_date IS NULL OR end_date >= NOW())
      `, [contentId]),

      // Subscription check
      query(`
        SELECT us.*, s.name as plan_name, s.type as plan_type
        FROM user_subscriptions us
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
          AND us.cancelled_at IS NULL
        LIMIT 1
      `, [userId]),

      // User status check
      query(`
        SELECT id, email_verified, is_active
        FROM users 
        WHERE id = ?
      `, [userId])
    ]);

    // Validation checks
    if (content.length === 0) {
      return res.status(404).json({
        success: false,
        code: "CONTENT_NOT_FOUND",
        error: "Content not found or not accessible"
      });
    }

    if (user.length === 0 || !user[0].is_active) {
      return res.status(403).json({
        success: false,
        code: "USER_INACTIVE",
        error: "User account is not active"
      });
    }

    if (!user[0].email_verified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        error: "Email verification required"
      });
    }

    if (subscription.length === 0) {
      // Check family access as fallback
      const familyAccess = await query(`
        SELECT fm.*
        FROM family_members fm
        INNER JOIN user_subscriptions us ON fm.family_owner_id = us.user_id
        WHERE fm.user_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
          AND fm.is_suspended = FALSE
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
        LIMIT 1
      `, [userId]);

      if (familyAccess.length === 0) {
        return res.status(403).json({
          success: false,
          code: "SUBSCRIPTION_REQUIRED",
          error: "Subscription required to access content",
          details: {
            allow_subscription: true,
            allow_family_join: true
          }
        });
      }
    }

    // Quick kid mode check
    const kidModeCheck = await query(`
      SELECT session_mode, active_kid_profile_id
      FROM user_session 
      WHERE user_id = ? 
        AND is_active = TRUE
      ORDER BY last_activity DESC
      LIMIT 1
    `, [userId]);

    const isKidMode = kidModeCheck.length > 0 && kidModeCheck[0].session_mode === 'kid';
    
    if (isKidMode) {
      const ageRating = content[0].age_rating;
      if (this.ageRatings[ageRating] > 2) { // Default 7+ limit for kids
        return res.status(403).json({
          success: false,
          code: "KID_CONTENT_RESTRICTED",
          error: "Content not suitable for kid profile",
          details: {
            content_age_rating: ageRating,
            kid_max_rating: '7+'
          }
        });
      }
    }

    // All quick checks passed
    res.json({
      success: true,
      valid: true,
      message: "Quick validation passed",
      data: {
        content: {
          id: content[0].id,
          title: content[0].title,
          content_type: content[0].content_type,
          age_rating: content[0].age_rating
        },
        subscription: subscription.length > 0 ? {
          plan_name: subscription[0].plan_name,
          plan_type: subscription[0].plan_type,
          status: subscription[0].status
        } : null,
        user: {
          email_verified: user[0].email_verified,
          is_active: user[0].is_active
        },
        kid_mode: isKidMode,
        requires_full_validation: true // Indicate that full validation is still needed
      }
    });

  } catch (error) {
    console.error("❌ [API] Quick validation error:", error);
    res.status(500).json({
      success: false,
      error: "Quick validation failed",
      code: "VALIDATION_ERROR",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/security/device-register
 * @desc Register a new device with enhanced security
 * @access Private
 */
router.post("/device-register", authMiddleware, strictLimiter, async (req, res) => {
  try {
    const { deviceId, deviceType, deviceName, fingerprint } = req.body;
    const userId = req.user.id;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!deviceId || !deviceType) {
      return res.status(400).json({
        success: false,
        error: "Device ID and type are required"
      });
    }

    // Check device limit
    const subscription = await query(`
      SELECT s.max_sessions as max_devices
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status = 'active'
        AND (us.end_date IS NULL OR us.end_date > NOW())
      LIMIT 1
    `, [userId]);

    const maxDevices = subscription[0]?.max_devices || 5;
    const activeDevices = await query(`
      SELECT COUNT(DISTINCT device_id) as device_count
      FROM user_session 
      WHERE user_id = ? 
        AND is_active = TRUE
        AND last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `, [userId]);

    if (activeDevices[0]?.device_count >= maxDevices) {
      return res.status(403).json({
        success: false,
        code: "DEVICE_LIMIT_REACHED",
        error: `Device limit reached (${maxDevices} devices)`,
        details: {
          current_devices: activeDevices[0].device_count,
          max_devices: maxDevices,
          requires_device_management: true
        }
      });
    }

    // Register device
    await query(`
      INSERT INTO user_session (
        user_id, device_id, device_type, device_name, 
        ip_address, login_time, last_activity, is_active,
        user_agent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), TRUE, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        last_activity = NOW(),
        is_active = TRUE,
        updated_at = NOW()
    `, [userId, deviceId, deviceType, deviceName, ipAddress, req.headers['user-agent']]);

    // Log device registration
    await SecurityValidator.logSecurityEvent({
      userId,
      action: 'device_registered',
      status: 'success',
      details: {
        deviceId,
        deviceType,
        deviceName,
        ipAddress,
        maxDevices,
        currentDevices: activeDevices[0]?.device_count + 1
      }
    });

    res.json({
      success: true,
      message: "Device registered successfully",
      data: {
        deviceId,
        deviceType,
        registered: new Date().toISOString(),
        deviceLimit: {
          current: activeDevices[0]?.device_count + 1,
          max: maxDevices
        }
      }
    });

  } catch (error) {
    console.error("❌ Device registration error:", error);
    res.status(500).json({
      success: false,
      error: "Device registration failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/security/sessions
 * @desc Get active user sessions
 * @access Private
 */
router.get("/sessions", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await query(`
      SELECT 
        id, device_id, device_type, device_name,
        ip_address, login_time, last_activity,
        TIMESTAMPDIFF(MINUTE, last_activity, NOW()) as minutes_inactive
      FROM user_session 
      WHERE user_id = ? 
        AND is_active = TRUE
      ORDER BY last_activity DESC
    `, [userId]);

    res.json({
      success: true,
      data: {
        sessions,
        total: sessions.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Sessions fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sessions"
    });
  }
});

/**
 * @route DELETE /api/security/sessions/:sessionId
 * @desc Terminate a specific session
 * @access Private
 */
router.delete("/sessions/:sessionId", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      UPDATE user_session 
      SET is_active = FALSE, logout_time = NOW()
      WHERE id = ? AND user_id = ?
    `, [sessionId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found"
      });
    }

    await SecurityValidator.logSecurityEvent({
      userId,
      action: 'session_terminated',
      status: 'success',
      details: { sessionId }
    });

    res.json({
      success: true,
      message: "Session terminated successfully"
    });

  } catch (error) {
    console.error("❌ Session termination error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to terminate session"
    });
  }
});

/**
 * @route POST /api/security/logout-all
 * @desc Terminate all active sessions except current
 * @access Private
 */
router.post("/logout-all", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDeviceId = req.headers['x-device-id'] || req.body.currentDeviceId;

    await query(`
      UPDATE user_session 
      SET is_active = FALSE, logout_time = NOW()
      WHERE user_id = ? 
        AND is_active = TRUE
        ${currentDeviceId ? 'AND device_id != ?' : ''}
    `, currentDeviceId ? [userId, currentDeviceId] : [userId]);

    await SecurityValidator.logSecurityEvent({
      userId,
      action: 'all_sessions_terminated',
      status: 'success',
      details: { currentDeviceId, exceptCurrent: !!currentDeviceId }
    });

    res.json({
      success: true,
      message: "All other sessions terminated successfully"
    });

  } catch (error) {
    console.error("❌ Logout all error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to terminate sessions"
    });
  }
});

/**
 * @route GET /api/security/status
 * @desc Get security status and statistics
 * @access Private
 */
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [sessions, securityEvents, subscription] = await Promise.all([
      // Active sessions
      query(`
        SELECT COUNT(*) as active_sessions
        FROM user_session 
        WHERE user_id = ? 
          AND is_active = TRUE
      `, [userId]),

      // Recent security events
      query(`
        SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_events,
          MAX(created_at) as last_event
        FROM security_logs 
        WHERE user_id = ?
          AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      `, [userId]),

      // Subscription info
      query(`
        SELECT 
          s.name as plan_name,
          s.max_sessions as device_limit,
          s.max_sessions as stream_limit
        FROM user_subscriptions us
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
        LIMIT 1
      `, [userId])
    ]);

    res.json({
      success: true,
      data: {
        security: {
          activeSessions: sessions[0]?.active_sessions || 0,
          securityEvents: {
            total: securityEvents[0]?.total_events || 0,
            failed: securityEvents[0]?.failed_events || 0,
            lastEvent: securityEvents[0]?.last_event
          },
          riskLevel: securityEvents[0]?.failed_events > 5 ? 'medium' : 'low'
        },
        limits: subscription[0] ? {
          plan: subscription[0].plan_name,
          deviceLimit: subscription[0].device_limit,
          streamLimit: subscription[0].stream_limit
        } : null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Security status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch security status"
    });
  }
});

module.exports = router;