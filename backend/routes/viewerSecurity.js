const express = require("express");
const SecurityValidator = require("../controllers/securityValidator");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @route POST /api/security/validate-stream
 * @desc Main security validation endpoint
 * @access Private
 */
router.post("/validate-stream", authMiddleware, async (req, res) => {
  try {
    const { contentId, deviceId, deviceType, hasDownloadManager } = req.body;
    const userId = req.user.id;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: "Content ID is required",
        code: "MISSING_CONTENT_ID"
      });
    }


    const validationResult = await SecurityValidator.validateContentStreamAccess(
      userId,
      contentId,
      deviceId || `device_${Date.now()}`,
      deviceType || 'web',
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
        subscription_type: validationResult.details?.subscription?.plan_name,
        device_type: deviceType
      }
    );

    if (!validationResult.valid) {
      return res.status(403).json({
        success: false,
        ...validationResult,
        timestamp: new Date().toISOString()
      });
    }

    
    res.json({
      success: true,
      ...validationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ [SECURITY API] Validation endpoint error:", error);
    
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
 * @route POST /api/security/debug
 * @desc Debug security validation
 * @access Private
 */
router.post("/debug", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentId, deviceId, deviceType } = req.body;

    
    const debugResult = await SecurityValidator.debugValidationFlow(
      userId,
      contentId || 'test-content',
      deviceId || 'debug-device',
      deviceType || 'web',
      req.ip
    );

    res.json({
      success: true,
      debug: debugResult,
      timestamp: new Date().toISOString(),
      user_id: userId
    });

  } catch (error) {
    console.error('❌ [SECURITY API DEBUG] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;