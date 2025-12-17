const express = require("express");
const SecurityValidator = require("../controllers/securityValidator");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @route POST /api/security/validate-stream
 * @desc Main validation endpoint - STRICT subscription checking
 * @access Private
 */
router.post("/validate-stream", authMiddleware, async (req, res) => {
  try {
    const { contentId } = req.body;
    const userId = req.user.id;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: "Content ID is required",
        code: "MISSING_CONTENT_ID"
      });
    }

    console.log(`🔒 [API] STRICT validation for user ${userId}, content ${contentId}`);

    // Simple device info
    const deviceId = req.body.deviceId || `device_${Date.now()}`;
    const deviceType = req.body.deviceType || 'web';

    // Get STRICT validation result
    const validationResult = await SecurityValidator.validateContentStreamAccess(
      userId,
      contentId,
      deviceId,
      deviceType,
      req.ip
    );

    // Log the result
    await SecurityValidator.logSecurityEvent(
      userId,
      'stream_validation',
      validationResult.valid ? 'success' : 'failed',
      {
        contentId,
        valid: validationResult.valid,
        code: validationResult.code,
        subscription_type: validationResult.details?.subscription?.plan_name
      }
    );

    if (!validationResult.valid) {
      console.log(`❌ [API] Blocked user ${userId}: ${validationResult.code} - ${validationResult.message}`);
      return res.status(403).json({
        success: false,
        ...validationResult,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ [API] Allowed user ${userId}: ${validationResult.details?.subscription?.plan_name}`);
    
    // Success
    res.json({
      success: true,
      ...validationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ [API] Validation endpoint error:", error);
    
    res.status(500).json({
      success: false,
      valid: false,
      error: "Validation system error",
      code: "SYSTEM_ERROR",
      details: process.env.NODE_ENV === 'development' ? { message: error.message } : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/security/debug-subscription
 * @desc Deep debug subscription status
 * @access Private
 */
router.post("/debug-subscription", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🔍🔍🔍 [API DEEP DEBUG] Subscription debug for user:', userId);
    
    const debugResult = await SecurityValidator.debugValidationFlow(
      userId,
      'test-content',
      'debug-device',
      'web',
      req.ip
    );

    res.json({
      success: true,
      debug: debugResult,
      timestamp: new Date().toISOString(),
      user_id: userId
    });

  } catch (error) {
    console.error('❌ [API DEBUG] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/security/user-subscription-status
 * @desc Get user's subscription status
 * @access Private
 */
router.get("/user-subscription-status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all subscription data
    const [user, activeSubs, familyAccess] = await Promise.all([
      query(`
        SELECT id, email, subscription_plan, created_at
        FROM users 
        WHERE id = ?
      `, [userId]),

      query(`
        SELECT us.*, s.name as plan_name, s.type as plan_type, s.is_family_plan
        FROM user_subscriptions us
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
      `, [userId]),

      query(`
        SELECT fm.*, u.email as owner_email
        FROM family_members fm
        INNER JOIN users u ON fm.family_owner_id = u.id
        WHERE fm.user_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
          AND fm.is_suspended = FALSE
      `, [userId])
    ]);

    res.json({
      success: true,
      data: {
        user: user[0] || null,
        active_subscriptions: activeSubs,
        family_access: familyAccess,
        has_active_subscription: activeSubs.length > 0,
        has_family_access: familyAccess.length > 0,
        can_stream: activeSubs.length > 0 || familyAccess.length > 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status'
    });
  }
}); 

module.exports = router;