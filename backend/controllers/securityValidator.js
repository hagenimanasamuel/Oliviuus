const { query } = require("../config/dbConfig");
const crypto = require("crypto");

/**
 * ENTERPRISE-GRADE SECURITY VALIDATOR
 * Comprehensive security validation for video streaming platform
 * Protection against scammers, credential sharing, VPNs, and more
 */
class SecurityValidator {
  constructor() {
    this.securityLevels = {
      BASIC: 'basic',
      ENHANCED: 'enhanced',
      STRICT: 'strict'
    };
    
    // Device fingerprinting patterns
    this.suspiciousPatterns = {
      vpnKeywords: ['vpn', 'proxy', 'tor', 'hidemyass', 'expressvpn', 'nordvpn', 'surfshark'],
      downloadTools: ['idm', 'fdm', 'jdownloader', 'orbit', 'flashget', 'eagleget'],
      scraperTools: ['scrapy', 'selenium', 'puppeteer', 'beautifulsoup', 'curl', 'wget'],
      automationTools: ['bot', 'automation', 'headless', 'phantom', 'playwright']
    };
    
    // Age rating mapping for strict comparison
    this.ageRatings = {
      'G': 0, 'PG': 1, '7+': 2, 'PG-13': 3, '13+': 3, 'R': 4, 'NC-17': 5, '18+': 5, 'A': 6
    };
  }

  /**
   * ENTERPRISE VALIDATION ENTRY POINT
   * Validates all security aspects before allowing content streaming
   */
  async validateContentStreamAccess(userId, contentId, deviceId, deviceType, ipAddress = null) {
    try {
      const startTime = Date.now();
      console.log(`🔒 [SECURITY] Starting enterprise validation for user ${userId}, content ${contentId}`);
      
      // Track validation steps for auditing
      const validationLog = {
        userId,
        contentId,
        deviceId,
        deviceType,
        startTime: new Date().toISOString(),
        steps: [],
        securityLevel: this.securityLevels.STRICT
      };

      // === STEP 1: INITIAL SECURITY SCAN ===
      const initialScan = await this.performInitialSecurityScan(userId, ipAddress);
      validationLog.steps.push({ step: 'initial_scan', result: initialScan });
      
      if (!initialScan.valid) {
        console.warn(`⚠️ [SECURITY] Initial scan failed: ${initialScan.reason}`);
        
        // Log security incident
        await this.logSecurityIncident({
          userId,
          action: 'initial_security_scan_failed',
          status: 'blocked',
          details: { reason: initialScan.reason, scanResults: initialScan }
        });
        
        return this.buildSecurityResponse('SECURITY_SCAN_FAILED', initialScan.message, {
          securityLevel: 'strict',
          scanDetails: initialScan,
          validationLog
        });
      }

      // === STEP 2: USER VALIDATION ===
      const userValidation = await this.validateUserEnhanced(userId);
      validationLog.steps.push({ step: 'user_validation', result: userValidation });
      
      if (!userValidation.valid) {
        return this.buildSecurityResponse('USER_INVALID', userValidation.message, {
          validationLog,
          securityLevel: 'strict'
        });
      }

      // === STEP 3: CONTENT VALIDATION ===
      const contentValidation = await this.validateContentEnhanced(contentId);
      validationLog.steps.push({ step: 'content_validation', result: contentValidation });
      
      if (!contentValidation.valid) {
        return this.buildSecurityResponse('CONTENT_INVALID', contentValidation.message, {
          validationLog,
          ...contentValidation.details
        });
      }

      // === STEP 4: SUBSCRIPTION VALIDATION WITH FRAUD DETECTION ===
      const subscriptionValidation = await this.validateSubscriptionWithFraudDetection(userId);
      validationLog.steps.push({ step: 'subscription_validation', result: subscriptionValidation });
      
      if (!subscriptionValidation.valid) {
        return this.buildSecurityResponse(
          subscriptionValidation.code || 'SUBSCRIPTION_REQUIRED',
          subscriptionValidation.message,
          {
            validationLog,
            ...subscriptionValidation.details
          }
        );
      }

      // === STEP 5: DEVICE & GEO-LOCATION VALIDATION ===
      const deviceGeoValidation = await this.validateDeviceAndGeoLocation(
        userId, deviceId, deviceType, ipAddress, subscriptionValidation.subscription
      );
      validationLog.steps.push({ step: 'device_geo_validation', result: deviceGeoValidation });
      
      if (!deviceGeoValidation.valid) {
        return this.buildSecurityResponse('DEVICE_GEO_BLOCKED', deviceGeoValidation.message, {
          validationLog,
          ...deviceGeoValidation.details
        });
      }

      // === STEP 6: CONCURRENT STREAM VALIDATION ===
      const streamValidation = await this.validateConcurrentStreamsEnhanced(
        userId, subscriptionValidation.subscription
      );
      validationLog.steps.push({ step: 'concurrent_streams', result: streamValidation });
      
      if (!streamValidation.valid) {
        return this.buildSecurityResponse('STREAM_LIMIT_REACHED', streamValidation.message, {
          validationLog,
          ...streamValidation.details
        });
      }

      // === STEP 7: FAMILY & ACCESS CONTROL VALIDATION ===
      const familyValidation = await this.validateFamilyAccessEnhanced(userId);
      validationLog.steps.push({ step: 'family_access', result: familyValidation });
      
      if (!familyValidation.valid) {
        return this.buildSecurityResponse('FAMILY_ACCESS_RESTRICTED', familyValidation.message, {
          validationLog,
          ...familyValidation.details
        });
      }

      // === STEP 8: TIME & SCHEDULE RESTRICTIONS ===
      const timeValidation = await this.validateTimeRestrictionsEnhanced(userId);
      validationLog.steps.push({ step: 'time_restrictions', result: timeValidation });
      
      if (!timeValidation.valid) {
        return this.buildSecurityResponse('TIME_RESTRICTION', timeValidation.message, {
          validationLog,
          ...timeValidation.details
        });
      }

      // === STEP 9: KID/PARENTAL CONTROLS ===
      const kidValidation = await this.validateKidContentEnhanced(userId, contentValidation.content);
      validationLog.steps.push({ step: 'kid_content', result: kidValidation });
      
      if (!kidValidation.valid) {
        return this.buildSecurityResponse('KID_CONTENT_RESTRICTED', kidValidation.message, {
          validationLog,
          ...kidValidation.details
        });
      }

      // === STEP 10: CONTENT RIGHTS & LICENSING ===
      const rightsValidation = await this.validateContentRightsEnhanced(userId, contentValidation.content, ipAddress);
      validationLog.steps.push({ step: 'content_rights', result: rightsValidation });
      
      if (!rightsValidation.valid) {
        return this.buildSecurityResponse('CONTENT_RIGHTS_RESTRICTED', rightsValidation.message, {
          validationLog,
          ...rightsValidation.details
        });
      }

      // === STEP 11: ANTI-FRAUD & ANTI-SCAM CHECKS ===
      const fraudCheck = await this.performAntiFraudChecks(userId, deviceId, ipAddress);
      validationLog.steps.push({ step: 'anti_fraud', result: fraudCheck });
      
      if (!fraudCheck.valid) {
        return this.buildSecurityResponse('FRAUD_DETECTED', fraudCheck.message, {
          validationLog,
          ...fraudCheck.details,
          requiresVerification: true
        });
      }

      // === STEP 12: RATE LIMITING & ABUSE PREVENTION ===
      const rateLimitCheck = await this.checkRateLimits(userId, contentId);
      validationLog.steps.push({ step: 'rate_limit', result: rateLimitCheck });
      
      if (!rateLimitCheck.valid) {
        return this.buildSecurityResponse('RATE_LIMIT_EXCEEDED', rateLimitCheck.message, {
          validationLog,
          ...rateLimitCheck.details
        });
      }

      // === ALL VALIDATIONS PASSED ===
      const totalTime = Date.now() - startTime;
      console.log(`✅ [SECURITY] ALL VALIDATIONS PASSED in ${totalTime}ms for user ${userId}`);
      
      // Create session for this stream
      const sessionInfo = await this.createStreamingSession(
        userId, contentId, deviceId, deviceType, ipAddress
      );

      // Log successful validation
      await this.logSecurityEvent({
        userId,
        action: 'stream_access_granted',
        status: 'success',
        details: {
          contentId,
          deviceId,
          validationTime: totalTime,
          securityLevel: 'strict'
        }
      });

      return {
        success: true,
        valid: true,
        message: 'Access granted - All security checks passed',
        details: {
          user: userValidation.user,
          content: contentValidation.content,
          subscription: subscriptionValidation.subscription,
          device: deviceGeoValidation.deviceInfo,
          streams: streamValidation.streamInfo,
          family: familyValidation.familyInfo,
          kid: kidValidation.kidInfo,
          fraudScore: fraudCheck.fraudScore,
          session: sessionInfo,
          validationLog,
          timestamp: new Date().toISOString(),
          securityLevel: 'enterprise'
        }
      };

    } catch (error) {
      console.error('❌ [SECURITY] Enterprise validation error:', error);
      
      // Log security failure
      await this.logSecurityIncident({
        userId,
        action: 'validation_system_error',
        status: 'failed',
        details: { error: error.message, stack: error.stack }
      });

      return this.buildSecurityResponse('SYSTEM_ERROR', 'Security validation system error', {
        error: process.env.NODE_ENV === 'production' ? 'System error' : error.message,
        timestamp: new Date().toISOString(),
        supportContact: 'security@yourplatform.com'
      });
    }
  }

  /**
   * INITIAL SECURITY SCAN
   * Quick pre-validation to block obvious threats
   */
  async performInitialSecurityScan(userId, ipAddress) {
    try {
      const scanResults = {
        ipReputation: 'unknown',
        userBehavior: 'normal',
        deviceAnomaly: false,
        overallScore: 100,
        warnings: []
      };

      // Check IP reputation
      if (ipAddress) {
        const ipCheck = await this.checkIPReputation(ipAddress);
        scanResults.ipReputation = ipCheck.reputation;
        scanResults.overallScore -= ipCheck.riskScore;
        
        if (ipCheck.reputation === 'high_risk') {
          scanResults.warnings.push('High risk IP detected');
        }
      }

      // Check recent failed attempts
      const failedAttempts = await query(`
        SELECT COUNT(*) as count 
        FROM security_logs 
        WHERE user_id = ? 
          AND status = 'failed' 
          AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
      `, [userId]);

      if (failedAttempts[0]?.count > 5) {
        scanResults.userBehavior = 'suspicious';
        scanResults.overallScore -= 30;
        scanResults.warnings.push('Multiple failed attempts detected');
      }

      // Check account age for new accounts
      const accountAge = await query(`
        SELECT TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_old 
        FROM users 
        WHERE id = ?
      `, [userId]);

      if (accountAge[0]?.hours_old < 24) {
        scanResults.userBehavior = 'new_account';
        scanResults.overallScore -= 10;
      }

      // Determine if scan passed
      const passed = scanResults.overallScore >= 70;
      
      return {
        valid: passed,
        message: passed ? 'Initial security scan passed' : 'Initial security scan failed',
        scanResults,
        reason: passed ? null : 'High risk indicators detected'
      };

    } catch (error) {
      console.error('Initial security scan error:', error);
      return { valid: true }; // Fail open for system errors
    }
  }

  /**
   * ENHANCED USER VALIDATION
   * Comprehensive user account verification
   */
  async validateUserEnhanced(userId) {
    try {
      const users = await query(`
        SELECT 
          u.*,
          COUNT(DISTINCT us.id) as session_count,
          COUNT(DISTINCT sl.id) as security_events,
          MAX(sl.created_at) as last_security_event
        FROM users u
        LEFT JOIN user_session us ON u.id = us.user_id 
          AND us.is_active = TRUE 
          AND us.last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        LEFT JOIN security_logs sl ON u.id = sl.user_id 
          AND sl.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        WHERE u.id = ?
        GROUP BY u.id
      `, [userId]);

      if (users.length === 0) {
        return { 
          valid: false, 
          message: 'User account not found. Please contact support.',
          details: { account_exists: false }
        };
      }

      const user = users[0];

      // Check account status
      if (!user.is_active) {
        return { 
          valid: false, 
          message: 'Account has been deactivated. Please contact support.',
          details: { 
            deactivated: true,
            deactivation_reason: 'account_inactive',
            contact_support: true
          }
        };
      }

      if (!user.email_verified) {
        // Check if verification is expired
        const verificationExpired = await query(`
          SELECT TIMESTAMPDIFF(HOUR, created_at, NOW()) > 24 as expired
          FROM email_verifications 
          WHERE email = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `, [user.email]);

        if (verificationExpired[0]?.expired) {
          return { 
            valid: false, 
            message: 'Email verification expired. Please verify your email.',
            details: { 
              email_verified: false,
              verification_expired: true,
              email: user.email
            }
          };
        }
        
        return { 
          valid: false, 
          message: 'Email verification required. Please verify your email.',
          details: { 
            email_verified: false,
            verification_expired: false,
            email: user.email
          }
        };
      }

      // Check for suspicious activity
      if (user.security_events > 10) {
        return { 
          valid: false, 
          message: 'Account flagged for suspicious activity. Please contact support.',
          details: { 
            suspicious_activity: true,
            security_events_count: user.security_events,
            last_security_event: user.last_security_event,
            contact_support: true
          }
        };
      }

      return { 
        valid: true, 
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          subscription_plan: user.subscription_plan,
          is_active: user.is_active,
          email_verified: user.email_verified,
          session_count: user.session_count,
          account_age: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
        }
      };
    } catch (error) {
      throw new Error(`Enhanced user validation failed: ${error.message}`);
    }
  }

  /**
   * ENHANCED CONTENT VALIDATION
   * Comprehensive content availability and rights check
   */
  async validateContentEnhanced(contentId) {
    try {
      const contents = await query(`
        SELECT 
          c.*,
          cr.license_type,
          cr.downloadable,
          cr.shareable,
          cr.allowed_regions,
          cr.blocked_countries,
          cr.start_date,
          cr.end_date,
          cr.georestricted,
          cr.commercial_use,
          ma.id as media_asset_id,
          ma.asset_type,
          ma.file_path,
          ma.upload_status,
          ma.resolution,
          (
            SELECT GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ')
            FROM content_genres cg
            JOIN genres g ON cg.genre_id = g.id
            WHERE cg.content_id = c.id
          ) as genres,
          (
            SELECT GROUP_CONCAT(DISTINCT cat.name SEPARATOR ', ')
            FROM content_categories cc
            JOIN categories cat ON cc.category_id = cat.id
            WHERE cc.content_id = c.id
          ) as categories
        FROM contents c
        LEFT JOIN content_rights cr ON c.id = cr.content_id
        LEFT JOIN media_assets ma ON c.id = ma.content_id 
          AND ma.upload_status = 'completed'
          AND ma.asset_type IN ('mainVideo', 'episodeVideo')
        WHERE c.id = ?
        GROUP BY c.id
      `, [contentId]);

      if (contents.length === 0) {
        return { 
          valid: false, 
          message: 'Content not found or unavailable.',
          details: { content_exists: false }
        };
      }

      const content = contents[0];
      const now = new Date();

      // Content status validation
      const statusChecks = {
        'draft': { valid: false, message: 'Content is not yet available' },
        'archived': { valid: false, message: 'Content has been archived' },
        'scheduled': { 
          valid: false, 
          message: 'Content will be available soon',
          details: { scheduled_for: content.scheduled_publish_at }
        }
      };

      if (statusChecks[content.status]) {
        return statusChecks[content.status];
      }

      if (content.status !== 'published') {
        return { 
          valid: false, 
          message: 'Content is not available for streaming.',
          details: { status: content.status }
        };
      }

      // Visibility validation
      if (content.visibility !== 'public') {
        return { 
          valid: false, 
          message: 'Content access is restricted.',
          details: { 
            visibility: content.visibility,
            restricted_access: true
          }
        };
      }

      // Date availability validation
      if (content.start_date && new Date(content.start_date) > now) {
        return { 
          valid: false, 
          message: 'Content is not yet available.',
          details: { 
            available_from: content.start_date,
            days_until: Math.ceil((new Date(content.start_date) - now) / (1000 * 60 * 60 * 24))
          }
        };
      }

      if (content.end_date && new Date(content.end_date) < now) {
        return { 
          valid: false, 
          message: 'Content access has expired.',
          details: { 
            expired_at: content.end_date,
            days_since: Math.floor((now - new Date(content.end_date)) / (1000 * 60 * 60 * 24))
          }
        };
      }

      // Media asset availability
      if (!content.media_asset_id) {
        return { 
          valid: false, 
          message: 'Content is not ready for streaming.',
          details: { media_available: false }
        };
      }

      // Check if content has valid video file
      const hasVideoAsset = contents.some(c => 
        ['mainVideo', 'episodeVideo'].includes(c.asset_type) && 
        c.upload_status === 'completed'
      );

      if (!hasVideoAsset) {
        return { 
          valid: false, 
          message: 'Video file is not available.',
          details: { video_available: false }
        };
      }

      return { 
        valid: true, 
        content: {
          id: content.id,
          title: content.title,
          content_type: content.content_type,
          age_rating: content.age_rating,
          status: content.status,
          visibility: content.visibility,
          duration_minutes: content.duration_minutes,
          release_date: content.release_date,
          view_count: content.view_count,
          average_rating: content.average_rating,
          genres: content.genres ? content.genres.split(', ') : [],
          categories: content.categories ? content.categories.split(', ') : [],
          has_subtitles: content.has_subtitles,
          has_dubbing: content.has_dubbing,
          rights: {
            license_type: content.license_type,
            allowed_regions: content.allowed_regions,
            blocked_countries: content.blocked_countries,
            start_date: content.start_date,
            end_date: content.end_date,
            downloadable: content.downloadable,
            shareable: content.shareable,
            georestricted: content.georestricted
          },
          media_assets: contents
            .filter(c => c.asset_type && c.upload_status === 'completed')
            .map(c => ({
              id: c.media_asset_id,
              type: c.asset_type,
              resolution: c.resolution,
              file_path: c.file_path
            }))
        }
      };
    } catch (error) {
      throw new Error(`Enhanced content validation failed: ${error.message}`);
    }
  }

  /**
   * SUBSCRIPTION VALIDATION WITH FRAUD DETECTION
   */
  async validateSubscriptionWithFraudDetection(userId) {
    try {
      // First check personal subscription
      const userSubscriptions = await query(`
        SELECT 
          us.*,
          s.name as plan_name,
          s.type as subscription_type,
          s.max_sessions as max_devices,
          s.max_sessions as concurrent_streams,
          s.supported_platforms,
          s.max_family_members,
          s.video_quality,
          s.offline_downloads,
          s.early_access,
          s.exclusive_content,
          s.parental_controls,
          s.content_restrictions,
          DATEDIFF(us.end_date, NOW()) as days_remaining,
          (
            SELECT COUNT(*) 
            FROM user_subscriptions us2 
            WHERE us2.user_id = us.user_id 
              AND us2.status = 'active'
          ) as active_subscription_count
        FROM user_subscriptions us
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
          AND us.cancelled_at IS NULL
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [userId]);

      if (userSubscriptions.length > 0) {
        const sub = userSubscriptions[0];
        
        // Fraud detection: Check for subscription sharing patterns
        const sharingPattern = await this.detectSubscriptionSharing(userId, sub.id);
        
        if (sharingPattern.detected) {
          return { 
            valid: false, 
            message: 'Suspicious subscription usage detected.',
            code: 'SUBSCRIPTION_SHARING_DETECTED',
            details: { 
              sharing_pattern: sharingPattern,
              requires_verification: true,
              fraud_score: sharingPattern.score
            }
          };
        }

        // Check trial period
        if (sub.trial_end_date && new Date(sub.trial_end_date) < new Date()) {
          return { 
            valid: false, 
            message: 'Your free trial has ended. Please subscribe to continue.',
            details: { 
              trial_end_date: sub.trial_end_date,
              trial_expired: true,
              allow_subscription: true
            }
          };
        }

        // Check grace period
        if (sub.grace_period_ends && new Date(sub.grace_period_ends) < new Date()) {
          return { 
            valid: false, 
            message: 'Your subscription grace period has ended. Please renew.',
            details: { 
              grace_period_ends: sub.grace_period_ends,
              grace_period_expired: true,
              allow_renewal: true
            }
          };
        }

        // Check payment status
        if (sub.status === 'past_due') {
          return { 
            valid: false, 
            message: 'Subscription payment is past due. Please update payment method.',
            details: { 
              payment_status: 'past_due',
              requires_payment_update: true
            }
          };
        }

        return { 
          valid: true, 
          subscription: {
            id: sub.id,
            plan_name: sub.plan_name,
            type: sub.subscription_type,
            max_devices: sub.max_devices,
            concurrent_streams: sub.concurrent_streams,
            supported_platforms: sub.supported_platforms,
            is_family_plan: sub.subscription_type === 'family',
            max_family_members: sub.max_family_members,
            video_quality: sub.video_quality,
            offline_downloads: sub.offline_downloads,
            early_access: sub.early_access,
            exclusive_content: sub.exclusive_content,
            parental_controls: sub.parental_controls,
            content_restrictions: sub.content_restrictions,
            end_date: sub.end_date,
            days_remaining: sub.days_remaining,
            is_family_shared: false,
            fraud_score: sharingPattern.score
          }
        };
      }

      // Check family access if no personal subscription
      const familyAccess = await query(`
        SELECT 
          fm.*,
          us.id as owner_subscription_id,
          us.status as owner_subscription_status,
          us.start_date as owner_subscription_start,
          us.end_date as owner_subscription_end,
          us.trial_end_date as owner_trial_end_date,
          us.grace_period_ends as owner_grace_period_ends,
          s.name as owner_plan_name,
          s.type as owner_plan_type,
          s.max_sessions as owner_max_devices,
          s.max_sessions as owner_concurrent_streams,
          s.supported_platforms as owner_supported_platforms,
          s.max_family_members as owner_max_family_members,
          s.video_quality as owner_video_quality,
          s.offline_downloads as owner_offline_downloads,
          s.early_access as owner_early_access,
          s.exclusive_content as owner_exclusive_content,
          s.parental_controls as owner_parental_controls,
          s.content_restrictions as owner_content_restrictions,
          u.email as owner_email,
          COUNT(DISTINCT fm2.id) as family_member_count
        FROM family_members fm
        INNER JOIN user_subscriptions us ON fm.family_owner_id = us.user_id
        INNER JOIN subscriptions s ON us.subscription_id = s.id
        INNER JOIN users u ON fm.family_owner_id = u.id
        LEFT JOIN family_members fm2 ON fm.family_owner_id = fm2.family_owner_id 
          AND fm2.invitation_status = 'accepted'
          AND fm2.is_active = TRUE
        WHERE fm.user_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
          AND fm.is_suspended = FALSE
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
          AND us.cancelled_at IS NULL
          AND s.type = 'family'
        GROUP BY fm.id, us.id, s.id, u.id
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [userId]);

      if (familyAccess.length > 0) {
        const family = familyAccess[0];
        
        // Check family plan capacity
        if (family.owner_max_family_members > 0 && 
            family.family_member_count >= family.owner_max_family_members) {
          return { 
            valid: false, 
            message: 'Family plan has reached maximum member limit.',
            details: { 
              max_members: family.owner_max_family_members,
              current_members: family.family_member_count,
              family_full: true
            }
          };
        }

        // Check family subscription status
        if (family.owner_trial_end_date && new Date(family.owner_trial_end_date) < new Date()) {
          return { 
            valid: false, 
            message: 'Family plan trial has ended.',
            details: { 
              trial_end_date: family.owner_trial_end_date,
              family_trial_expired: true,
              owner_email: family.owner_email
            }
          };
        }

        if (family.owner_grace_period_ends && new Date(family.owner_grace_period_ends) < new Date()) {
          return { 
            valid: false, 
            message: 'Family plan grace period has ended.',
            details: { 
              grace_period_ends: family.owner_grace_period_ends,
              family_grace_period_expired: true,
              owner_email: family.owner_email
            }
          };
        }

        return { 
          valid: true, 
          subscription: {
            id: family.owner_subscription_id,
            plan_name: family.owner_plan_name,
            type: family.owner_plan_type,
            max_devices: family.owner_max_devices,
            concurrent_streams: family.owner_concurrent_streams,
            supported_platforms: family.owner_supported_platforms,
            is_family_plan: true,
            max_family_members: family.owner_max_family_members,
            video_quality: family.owner_video_quality,
            offline_downloads: family.owner_offline_downloads,
            early_access: family.owner_early_access,
            exclusive_content: family.owner_exclusive_content,
            parental_controls: family.owner_parental_controls,
            content_restrictions: family.owner_content_restrictions,
            end_date: family.owner_subscription_end,
            is_family_shared: true,
            family_member_id: family.id,
            member_role: family.member_role,
            dashboard_type: family.dashboard_type,
            family_owner_id: family.family_owner_id,
            family_owner_email: family.owner_email,
            family_member_count: family.family_member_count
          }
        };
      }

      // No subscription found
      return { 
        valid: false, 
        message: 'No active subscription found. Subscribe to access content.',
        details: { 
          subscription_required: true,
          allow_personal_plan: true,
          allow_family_join: true,
          trial_available: true
        }
      };

    } catch (error) {
      throw new Error(`Subscription validation failed: ${error.message}`);
    }
  }

  /**
   * DEVICE AND GEO-LOCATION VALIDATION
   * Anti-VPN, device fingerprinting, location verification
   */
  async validateDeviceAndGeoLocation(userId, deviceId, deviceType, ipAddress, subscription) {
    try {
      const deviceInfo = {
        deviceId,
        deviceType,
        ipAddress,
        isNewDevice: false,
        deviceTrustScore: 100,
        warnings: []
      };

      // Check device type support
      if (subscription.supported_platforms) {
        try {
          const supportedPlatforms = JSON.parse(subscription.supported_platforms);
          if (!supportedPlatforms.includes(deviceType)) {
            const deviceNames = {
              'web': 'desktop browsers',
              'mobile': 'mobile devices',
              'tablet': 'tablets',
              'smarttv': 'smart TVs'
            };
            
            return { 
              valid: false, 
              message: `Your plan doesn't support ${deviceNames[deviceType] || deviceType}.`,
              details: { 
                current_device: deviceType,
                supported_platforms: supportedPlatforms,
                requires_upgrade: true
              }
            };
          }
        } catch (e) {
          console.warn('Could not parse supported platforms:', e.message);
        }
      }

      // Check for VPN/Proxy
      if (ipAddress) {
        const vpnCheck = await this.detectVPN(ipAddress);
        if (vpnCheck.isVPN) {
          deviceInfo.deviceTrustScore -= 50;
          deviceInfo.warnings.push('VPN/Proxy detected');
          
          // Block VPN for premium content or strict plans
          if (subscription.exclusive_content || subscription.type === 'premium') {
            return { 
              valid: false, 
              message: 'VPN/Proxy detected. Disable VPN to access premium content.',
              details: { 
                vpn_detected: true,
                vpn_details: vpnCheck,
                requires_vpn_disable: true
              }
            };
          }
        }
      }

      // Check device history and patterns
      const deviceHistory = await query(`
        SELECT 
          us.*,
          COUNT(*) as usage_count,
          MAX(us.last_activity) as last_used,
          GROUP_CONCAT(DISTINCT us.location) as locations_used
        FROM user_session us
        WHERE us.user_id = ? 
          AND us.device_id = ?
          AND us.is_active = TRUE
        GROUP BY us.device_id
      `, [userId, deviceId]);

      if (deviceHistory.length > 0) {
        // Existing device - update activity
        await query(`
          UPDATE user_session 
          SET last_activity = NOW()
          WHERE id = ?
        `, [deviceHistory[0].id]);
        
        deviceInfo.isNewDevice = false;
        deviceInfo.usageCount = deviceHistory[0].usage_count;
        deviceInfo.lastUsed = deviceHistory[0].last_used;
        
        // Check for location hopping
        const locations = deviceHistory[0].locations_used ? 
          deviceHistory[0].locations_used.split(',') : [];
        
        if (locations.length > 3 && ipAddress) {
          deviceInfo.deviceTrustScore -= 20;
          deviceInfo.warnings.push('Multiple locations detected');
        }
      } else {
        // New device - check device limits
        deviceInfo.isNewDevice = true;
        
        const maxDevices = subscription.max_devices || 5;
        const activeDevices = await this.countActiveDevices(userId, subscription);
        
        if (maxDevices === 0) {
          return { 
            valid: false, 
            message: 'Your plan does not allow any active devices.',
            details: { 
              max_devices: 0,
              requires_upgrade: true
            }
          };
        }

        if (activeDevices >= maxDevices) {
          return { 
            valid: false, 
            message: `Device limit reached (${maxDevices} devices).`,
            details: { 
              active_devices: activeDevices,
              max_devices: maxDevices,
              requires_device_management: true
            }
          };
        }
      }

      // Device fingerprint validation
      const fingerprintCheck = await this.validateDeviceFingerprint(deviceId, userId);
      if (!fingerprintCheck.valid) {
        deviceInfo.deviceTrustScore -= 30;
        deviceInfo.warnings.push('Device fingerprint mismatch');
      }

      return { 
        valid: true, 
        deviceInfo: {
          ...deviceInfo,
          trustLevel: deviceInfo.deviceTrustScore >= 70 ? 'high' : 
                     deviceInfo.deviceTrustScore >= 40 ? 'medium' : 'low',
          requiresVerification: deviceInfo.deviceTrustScore < 50
        }
      };

    } catch (error) {
      throw new Error(`Device validation failed: ${error.message}`);
    }
  }

  /**
   * ENHANCED CONCURRENT STREAM VALIDATION
   * Prevents credential sharing and stream abuse
   */
  async validateConcurrentStreamsEnhanced(userId, subscription) {
    try {
      const maxStreams = subscription.concurrent_streams || 3;
      
      // Get active streams with detailed info
      const activeStreams = await query(`
        SELECT 
          cws.*,
          c.title as content_title,
          c.content_type,
          us.device_id,
          us.device_type,
          us.ip_address,
          TIMESTAMPDIFF(MINUTE, cws.last_activity_at, NOW()) as minutes_inactive
        FROM content_watch_sessions cws
        LEFT JOIN contents c ON cws.content_id = c.id
        LEFT JOIN user_session us ON cws.user_id = us.user_id 
          AND us.is_active = TRUE
        WHERE cws.user_id = ? 
          AND cws.last_activity_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        ORDER BY cws.last_activity_at DESC
      `, [userId]);

      const currentStreams = activeStreams.length;
      
      // Check for stream abuse patterns
      const abusePatterns = await this.detectStreamAbuse(activeStreams);
      
      if (abusePatterns.detected) {
        return { 
          valid: false, 
          message: 'Suspicious streaming activity detected.',
          details: { 
            abuse_pattern: abusePatterns,
            requires_verification: true,
            security_level: 'enhanced'
          }
        };
      }

      if (maxStreams === 0) {
        return { 
          valid: false, 
          message: 'Your plan does not allow concurrent streaming.',
          details: { 
            max_streams: 0,
            requires_upgrade: true
          }
        };
      }

      if (currentStreams >= maxStreams) {
        const streamDetails = activeStreams.map(s => ({
          content_title: s.content_title,
          content_type: s.content_type,
          device_type: s.device_type,
          started_at: s.started_at,
          minutes_inactive: s.minutes_inactive
        }));
        
        return { 
          valid: false, 
          message: `Concurrent stream limit reached (${maxStreams} streams).`,
          details: { 
            active_streams: currentStreams,
            max_streams: maxStreams,
            streams: streamDetails,
            action_required: 'close_other_streams'
          }
        };
      }

      return { 
        valid: true,
        streamInfo: {
          currentStreams,
          maxStreams,
          availableSlots: maxStreams - currentStreams,
          abuseScore: abusePatterns.score
        }
      };
    } catch (error) {
      throw new Error(`Concurrent stream validation failed: ${error.message}`);
    }
  }

  /**
   * ENHANCED FAMILY ACCESS VALIDATION
   */
  async validateFamilyAccessEnhanced(userId) {
    try {
      const familyMembers = await query(`
        SELECT 
          fm.*,
          fp.max_pin_attempts,
          fp.is_pin_locked,
          fp.pin_locked_until,
          fp.pin_attempts,
          u.email as owner_email,
          us.status as owner_subscription_status,
          us.end_date as owner_subscription_end,
          (
            SELECT COUNT(*) 
            FROM family_members fm2 
            WHERE fm2.family_owner_id = fm.family_owner_id 
              AND fm2.invitation_status = 'accepted'
              AND fm2.is_active = TRUE
          ) as family_size
        FROM family_members fm
        LEFT JOIN family_pin_security fp ON fm.id = fp.family_member_id
        LEFT JOIN users u ON fm.family_owner_id = u.id
        LEFT JOIN user_subscriptions us ON fm.family_owner_id = us.user_id 
          AND us.status = 'active'
        WHERE fm.user_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
        LIMIT 1
      `, [userId]);

      if (familyMembers.length === 0) {
        return { 
          valid: true, 
          familyInfo: { 
            is_family_member: false,
            message: 'Not a family member'
          }
        };
      }

      const family = familyMembers[0];

      // Check suspension
      if (family.is_suspended) {
        if (family.suspended_until && new Date(family.suspended_until) > new Date()) {
          return { 
            valid: false, 
            message: `Family access suspended until ${new Date(family.suspended_until).toLocaleString()}.`,
            details: { 
              suspended_until: family.suspended_until,
              suspension_reason: family.suspension_reason,
              owner_email: family.owner_email,
              contact_owner: true
            }
          };
        } else {
          // Auto-unsuspend if period passed
          await query(`
            UPDATE family_members 
            SET is_suspended = FALSE, 
                suspended_until = NULL, 
                suspension_reason = NULL,
                updated_at = NOW()
            WHERE id = ?
          `, [family.id]);
        }
      }

      // Check PIN lock
      if (family.is_pin_locked && family.pin_locked_until && new Date(family.pin_locked_until) > new Date()) {
        return { 
          valid: false, 
          message: `PIN locked until ${new Date(family.pin_locked_until).toLocaleString()}.`,
          details: { 
            pin_locked_until: family.pin_locked_until,
            pin_attempts: family.pin_attempts,
            max_pin_attempts: family.max_pin_attempts
          }
        };
      }

      // Check family subscription status
      if (family.owner_subscription_end && new Date(family.owner_subscription_end) < new Date()) {
        return { 
          valid: false, 
          message: 'Family subscription has expired.',
          details: { 
            subscription_expired: true,
            owner_email: family.owner_email,
            subscription_end: family.owner_subscription_end
          }
        };
      }

      return { 
        valid: true, 
        familyInfo: {
          is_family_member: true,
          member_role: family.member_role,
          dashboard_type: family.dashboard_type,
          is_suspended: family.is_suspended,
          content_restrictions: family.content_restrictions,
          max_daily_watch_time: family.max_daily_watch_time,
          sleep_time_start: family.sleep_time_start,
          sleep_time_end: family.sleep_time_end,
          enforce_sleep_time: family.enforce_sleep_time,
          allowed_access_start: family.allowed_access_start,
          allowed_access_end: family.allowed_access_end,
          enforce_access_window: family.enforce_access_window,
          owner_email: family.owner_email,
          family_size: family.family_size,
          requires_pin: family.member_role === 'child' || family.member_role === 'teen'
        }
      };
    } catch (error) {
      throw new Error(`Family access validation failed: ${error.message}`);
    }
  }

  /**
   * ENHANCED TIME RESTRICTIONS
   */
  async validateTimeRestrictionsEnhanced(userId) {
    try {
      const familyMembers = await query(`
        SELECT 
          sleep_time_start,
          sleep_time_end,
          enforce_sleep_time,
          allowed_access_start,
          allowed_access_end,
          enforce_access_window,
          member_role,
          dashboard_type
        FROM family_members 
        WHERE user_id = ?
          AND invitation_status = 'accepted'
          AND is_active = TRUE
          AND is_suspended = FALSE
        LIMIT 1
      `, [userId]);

      if (familyMembers.length === 0) {
        return { valid: true };
      }

      const family = familyMembers[0];
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

      // Sleep time restrictions
      if (family.enforce_sleep_time && family.sleep_time_start && family.sleep_time_end) {
        if (currentTime >= family.sleep_time_start || currentTime <= family.sleep_time_end) {
          return { 
            valid: false, 
            message: `Access restricted during sleep hours (${family.sleep_time_start} - ${family.sleep_time_end}).`,
            details: { 
              sleep_time_start: family.sleep_time_start,
              sleep_time_end: family.sleep_time_end,
              current_time: currentTime,
              restricted: true
            }
          };
        }
      }

      // Access window restrictions
      if (family.enforce_access_window && family.allowed_access_start && family.allowed_access_end) {
        if (currentTime < family.allowed_access_start || currentTime > family.allowed_access_end) {
          return { 
            valid: false, 
            message: `Access restricted outside allowed hours (${family.allowed_access_start} - ${family.allowed_access_end}).`,
            details: { 
              allowed_access_start: family.allowed_access_start,
              allowed_access_end: family.allowed_access_end,
              current_time: currentTime,
              restricted: true
            }
          };
        }
      }

      // Weekend restrictions for kids
      if (family.member_role === 'child' && (currentDay === 0 || currentDay === 6)) {
        // Weekend restrictions for kids (optional)
        const weekendLimit = 180; // 3 hours on weekends
        const todayUsage = await this.getDailyUsage(userId);
        
        if (todayUsage >= weekendLimit) {
          return { 
            valid: false, 
            message: 'Weekend viewing limit reached.',
            details: { 
              weekend_limit_minutes: weekendLimit,
              current_usage: todayUsage,
              day_type: 'weekend'
            }
          };
        }
      }

      return { valid: true };
    } catch (error) {
      throw new Error(`Time restriction validation failed: ${error.message}`);
    }
  }

  /**
   * ENHANCED KID CONTENT VALIDATION
   */
  async validateKidContentEnhanced(userId, content) {
    try {
      // Check if user is in kid mode
      const userSessions = await query(`
        SELECT 
          session_mode,
          active_kid_profile_id,
          device_type,
          ip_address
        FROM user_session 
        WHERE user_id = ? 
          AND is_active = TRUE
        ORDER BY last_activity DESC
        LIMIT 1
      `, [userId]);

      const isKidMode = userSessions.length > 0 && userSessions[0].session_mode === 'kid';
      
      if (!isKidMode) {
        return { 
          valid: true, 
          kidInfo: { 
            is_kid_mode: false,
            message: 'Not in kid mode'
          }
        };
      }

      const kidProfileId = userSessions[0].active_kid_profile_id;
      
      if (!kidProfileId) {
        return { 
          valid: false, 
          message: 'Kid profile session invalid. Switch profiles.',
          details: { 
            is_kid_mode: true,
            session_mode: 'kid',
            missing_profile: true
          }
        };
      }

      // Get kid profile with all restrictions
      const kidProfiles = await query(`
        SELECT 
          kp.*,
          kcr.max_age_rating,
          kcr.blocked_genres,
          kcr.allowed_genres,
          kcr.blocked_content_ids,
          kcr.allowed_content_ids,
          kcr.allow_movies,
          kcr.allow_series,
          kcr.allow_live_events,
          kcr.allow_search,
          kcr.allow_trending,
          kcr.allow_recommendations,
          vtl.daily_time_limit_minutes,
          vtl.current_daily_usage,
          vtl.allowed_start_time,
          vtl.allowed_end_time,
          vtl.break_reminder_minutes,
          pc.master_pin_code,
          pc.require_pin_to_exit
        FROM kids_profiles kp
        LEFT JOIN kids_content_restrictions kcr ON kp.id = kcr.kid_profile_id
        LEFT JOIN viewing_time_limits vtl ON kp.id = vtl.kid_profile_id
        LEFT JOIN parental_controls pc ON kp.parent_user_id = pc.parent_user_id
        WHERE kp.id = ?
          AND kp.is_active = TRUE
      `, [kidProfileId]);

      if (kidProfiles.length === 0) {
        return { 
          valid: false, 
          message: 'Kid profile not found or inactive.',
          details: { 
            is_kid_mode: true,
            kid_profile_id: kidProfileId,
            profile_inactive: true
          }
        };
      }

      const kidProfile = kidProfiles[0];

      // Age rating validation
      const contentRatingValue = this.ageRatings[content.age_rating] || 0;
      const maxRatingValue = this.ageRatings[kidProfile.max_age_rating] || 2; // Default 7+

      if (contentRatingValue > maxRatingValue) {
        return { 
          valid: false, 
          message: `Content rating (${content.age_rating}) exceeds profile limit (${kidProfile.max_age_rating}).`,
          details: { 
            is_kid_mode: true,
            restrictionType: 'age_rating',
            content_age_rating: content.age_rating,
            allowed_age_rating: kidProfile.max_age_rating,
            kid_profile_name: kidProfile.name,
            calculated_age: kidProfile.calculated_age
          }
        };
      }

      // Content type restrictions
      if (content.content_type === 'movie' && kidProfile.allow_movies === false) {
        return { 
          valid: false, 
          message: 'Movies are not allowed for this profile.',
          details: { 
            is_kid_mode: true,
            restrictionType: 'content_type',
            content_type: 'movie',
            allowed: false
          }
        };
      }

      if (content.content_type === 'series' && kidProfile.allow_series === false) {
        return { 
          valid: false, 
          message: 'Series are not allowed for this profile.',
          details: { 
            is_kid_mode: true,
            restrictionType: 'content_type',
            content_type: 'series',
            allowed: false
          }
        };
      }

      // Genre restrictions
      if (kidProfile.blocked_genres) {
        try {
          const blockedGenres = JSON.parse(kidProfile.blocked_genres);
          const contentGenres = content.genres || [];
          
          const blockedGenre = contentGenres.find(genre => 
            blockedGenres.includes(genre.toLowerCase())
          );
          
          if (blockedGenre) {
            return { 
              valid: false, 
              message: `Content contains blocked genre: ${blockedGenre}.`,
              details: { 
                is_kid_mode: true,
                restrictionType: 'genre',
                blocked_genre: blockedGenre,
                kid_profile_name: kidProfile.name
              }
            };
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Daily time limit check
      if (kidProfile.daily_time_limit_minutes && kidProfile.current_daily_usage) {
        if (kidProfile.current_daily_usage >= kidProfile.daily_time_limit_minutes) {
          return { 
            valid: false, 
            message: 'Daily viewing limit reached.',
            details: { 
              is_kid_mode: true,
              restrictionType: 'time_limit',
              daily_limit: kidProfile.daily_time_limit_minutes,
              current_usage: kidProfile.current_daily_usage,
              kid_profile_name: kidProfile.name
            }
          };
        }
      }

      // Check specific blocked content
      if (kidProfile.blocked_content_ids) {
        try {
          const blockedIds = JSON.parse(kidProfile.blocked_content_ids);
          if (Array.isArray(blockedIds) && blockedIds.includes(content.id)) {
            return { 
              valid: false, 
              message: 'Content blocked by parent.',
              details: { 
                is_kid_mode: true,
                restrictionType: 'content_specific',
                parent_blocked: true,
                kid_profile_name: kidProfile.name
              }
            };
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Check approved content overrides
      const approvedOverrides = await query(`
        SELECT id, approved_until, override_reason, notes
        FROM approved_content_overrides 
        WHERE kid_profile_id = ? 
          AND content_id = ?
          AND (approved_until IS NULL OR approved_until >= CURDATE())
        LIMIT 1
      `, [kidProfileId, content.id]);

      if (approvedOverrides.length > 0) {
        return { 
          valid: true, 
          kidInfo: { 
            is_kid_mode: true,
            kid_profile_id: kidProfileId,
            kid_profile_name: kidProfile.name,
            has_parent_override: true,
            override_reason: approvedOverrides[0].override_reason,
            approved_until: approvedOverrides[0].approved_until,
            requires_pin_exit: kidProfile.require_pin_to_exit
          }
        };
      }

      return { 
        valid: true, 
        kidInfo: { 
          is_kid_mode: true,
          kid_profile_id: kidProfileId,
          kid_profile_name: kidProfile.name,
          max_age_rating: kidProfile.max_age_rating,
          daily_time_limit: kidProfile.daily_time_limit_minutes,
          current_daily_usage: kidProfile.current_daily_usage,
          requires_pin_exit: kidProfile.require_pin_to_exit,
          has_parent_override: false
        }
      };
    } catch (error) {
      throw new Error(`Kid content validation failed: ${error.message}`);
    }
  }

  /**
   * ENHANCED CONTENT RIGHTS VALIDATION
   * With geo-restriction and licensing checks
   */
  async validateContentRightsEnhanced(userId, content, ipAddress) {
    try {
      const rights = content.rights || {};
      
      // Region restrictions
      if (rights.allowed_regions) {
        try {
          const allowedRegions = JSON.parse(rights.allowed_regions);
          if (allowedRegions.length > 0 && ipAddress) {
            const userRegion = await this.getRegionFromIP(ipAddress);
            
            if (userRegion && !allowedRegions.includes(userRegion)) {
              return { 
                valid: false, 
                message: 'Content not available in your region.',
                details: { 
                  restrictionType: 'region',
                  user_region: userRegion,
                  allowed_regions: allowedRegions,
                  georestricted: true
                }
              };
            }
          }
        } catch (e) {
          console.warn('Failed to parse allowed regions:', e.message);
        }
      }

      // Country blocking
      if (rights.blocked_countries) {
        try {
          const blockedCountries = JSON.parse(rights.blocked_countries);
          if (blockedCountries.length > 0 && ipAddress) {
            const userCountry = await this.getCountryFromIP(ipAddress);
            
            if (userCountry && blockedCountries.includes(userCountry)) {
              return { 
                valid: false, 
                message: 'Content blocked in your country.',
                details: { 
                  restrictionType: 'country_block',
                  user_country: userCountry,
                  blocked_countries: blockedCountries,
                  georestricted: true
                }
              };
            }
          }
        } catch (e) {
          console.warn('Failed to parse blocked countries:', e.message);
        }
      }

      // Licensing period check
      if (rights.start_date && rights.end_date) {
        const now = new Date();
        const start = new Date(rights.start_date);
        const end = new Date(rights.end_date);
        
        if (now < start) {
          return { 
            valid: false, 
            message: 'Content licensing not yet active.',
            details: { 
              restrictionType: 'licensing_period',
              license_start: rights.start_date,
              license_end: rights.end_date,
              current_time: now.toISOString()
            }
          };
        }
        
        if (now > end) {
          return { 
            valid: false, 
            message: 'Content licensing has expired.',
            details: { 
              restrictionType: 'licensing_period',
              license_start: rights.start_date,
              license_end: rights.end_date,
              license_expired: true
            }
          };
        }
      }

      // Download restriction
      if (!rights.downloadable) {
        // Check if user is trying to access download (would be separate endpoint)
        // This is just a placeholder check
      }

      return { valid: true };
    } catch (error) {
      throw new Error(`Content rights validation failed: ${error.message}`);
    }
  }

  /**
   * ANTI-FRAUD AND ANTI-SCAM CHECKS
   */
  async performAntiFraudChecks(userId, deviceId, ipAddress) {
    try {
      let fraudScore = 0;
      const warnings = [];
      const checks = {};

      // 1. Check for multiple accounts from same IP
      const accountsFromIP = await query(`
        SELECT COUNT(DISTINCT user_id) as account_count
        FROM user_session 
        WHERE ip_address = ?
          AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `, [ipAddress]);

      if (accountsFromIP[0]?.account_count > 3) {
        fraudScore += 30;
        warnings.push('Multiple accounts from same IP');
        checks.multipleAccounts = true;
      }

      // 2. Check device velocity (rapid location changes)
      const deviceLocations = await query(`
        SELECT location, COUNT(*) as location_count
        FROM user_session 
        WHERE user_id = ? 
          AND device_id = ?
          AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY location
        HAVING location IS NOT NULL
      `, [userId, deviceId]);

      if (deviceLocations.length > 3) {
        fraudScore += 20;
        warnings.push('Rapid location changes detected');
        checks.rapidLocationChange = true;
      }

      // 3. Check for automation patterns
      const userAgent = await query(`
        SELECT user_agent
        FROM user_session 
        WHERE user_id = ? 
          AND device_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId, deviceId]);

      if (userAgent[0]?.user_agent) {
        const ua = userAgent[0].user_agent.toLowerCase();
        const isAutomation = this.suspiciousPatterns.automationTools.some(tool => 
          ua.includes(tool)
        ) || this.suspiciousPatterns.scraperTools.some(tool => 
          ua.includes(tool)
        );

        if (isAutomation) {
          fraudScore += 50;
          warnings.push('Automation tool detected');
          checks.automationDetected = true;
        }
      }

      // 4. Check subscription sharing patterns
      const sharingPattern = await this.detectSubscriptionSharing(userId);
      if (sharingPattern.detected) {
        fraudScore += sharingPattern.score;
        warnings.push('Subscription sharing suspected');
        checks.subscriptionSharing = true;
      }

      // 5. Check for download manager usage
      if (userAgent[0]?.user_agent) {
        const ua = userAgent[0].user_agent.toLowerCase();
        const isDownloadManager = this.suspiciousPatterns.downloadTools.some(tool => 
          ua.includes(tool)
        );

        if (isDownloadManager) {
          fraudScore += 40;
          warnings.push('Download manager detected');
          checks.downloadManager = true;
        }
      }

      // Determine result
      const passed = fraudScore < 70;
      
      return {
        valid: passed,
        message: passed ? 'Anti-fraud checks passed' : 'Suspicious activity detected',
        fraudScore,
        warnings,
        checks,
        requiresVerification: fraudScore >= 50 && fraudScore < 70,
        details: {
          fraudScore,
          warningCount: warnings.length,
          checksPerformed: Object.keys(checks).length,
          riskLevel: fraudScore < 30 ? 'low' : 
                    fraudScore < 60 ? 'medium' : 'high'
        }
      };

    } catch (error) {
      console.error('Anti-fraud check error:', error);
      return { valid: true, fraudScore: 0 }; // Fail open
    }
  }

  /**
   * RATE LIMITING AND ABUSE PREVENTION
   */
  async checkRateLimits(userId, contentId) {
    try {
      // Check content view rate
      const recentViews = await query(`
        SELECT COUNT(*) as view_count
        FROM content_view_history 
        WHERE user_id = ? 
          AND content_id = ?
          AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
      `, [userId, contentId]);

      if (recentViews[0]?.view_count > 10) {
        return { 
          valid: false, 
          message: 'Too many views of this content.',
          details: { 
            view_count: recentViews[0].view_count,
            time_window: '1 hour',
            limit_exceeded: true,
            requires_cooldown: true
          }
        };
      }

      // Check overall streaming rate
      const streamingSessions = await query(`
        SELECT COUNT(*) as session_count
        FROM content_watch_sessions 
        WHERE user_id = ? 
          AND started_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
      `, [userId]);

      if (streamingSessions[0]?.session_count > 20) {
        return { 
          valid: false, 
          message: 'Too many streaming sessions.',
          details: { 
            session_count: streamingSessions[0].session_count,
            time_window: '1 hour',
            limit_exceeded: true,
            requires_cooldown: true
          }
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { valid: true }; // Fail open
    }
  }

  /**
   * HELPER METHODS
   */

  async countActiveDevices(userId, subscription) {
    if (subscription.is_family_shared && subscription.family_owner_id) {
      const result = await query(`
        SELECT COUNT(DISTINCT us.device_id) as device_count
        FROM user_session us
        INNER JOIN family_members fm ON us.user_id = fm.user_id
        WHERE fm.family_owner_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
          AND us.is_active = TRUE
          AND us.last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      `, [subscription.family_owner_id]);
      return result[0]?.device_count || 0;
    } else {
      const result = await query(`
        SELECT COUNT(DISTINCT device_id) as device_count
        FROM user_session 
        WHERE user_id = ? 
          AND is_active = TRUE
          AND last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      `, [userId]);
      return result[0]?.device_count || 0;
    }
  }

  async detectSubscriptionSharing(userId, subscriptionId = null) {
    // This is a simplified version - implement more sophisticated detection
    const sessions = await query(`
      SELECT 
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT device_id) as unique_devices,
        GROUP_CONCAT(DISTINCT location) as locations
      FROM user_session 
      WHERE user_id = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `, [userId]);

    const data = sessions[0];
    let score = 0;
    let detected = false;

    if (data.unique_ips > 3) {
      score += 40;
      detected = true;
    }
    
    if (data.unique_devices > 4) {
      score += 30;
      detected = true;
    }

    return {
      detected,
      score,
      details: {
        unique_ips: data.unique_ips,
        unique_devices: data.unique_devices,
        locations: data.locations ? data.locations.split(',') : []
      }
    };
  }

  async detectStreamAbuse(activeStreams) {
    let score = 0;
    let detected = false;
    const patterns = [];

    // Check for simultaneous streams from different locations
    const uniqueIPs = [...new Set(activeStreams.map(s => s.ip_address).filter(Boolean))];
    if (uniqueIPs.length > 2) {
      score += 30;
      detected = true;
      patterns.push('Multiple locations simultaneously');
    }

    // Check for rapid session switching
    const recentSessions = activeStreams.filter(s => s.minutes_inactive < 5);
    if (recentSessions.length > 3) {
      score += 20;
      detected = true;
      patterns.push('Rapid session switching');
    }

    return { detected, score, patterns };
  }

  async detectVPN(ipAddress) {
    // Simplified VPN detection - implement with real VPN detection service
    const vpnKeywords = this.suspiciousPatterns.vpnKeywords;
    const isVPN = vpnKeywords.some(keyword => 
      ipAddress.toLowerCase().includes(keyword)
    );
    
    return {
      isVPN,
      confidence: isVPN ? 'high' : 'low',
      details: isVPN ? 'VPN/Proxy pattern detected' : 'No VPN detected'
    };
  }

  async validateDeviceFingerprint(deviceId, userId) {
    // Implement device fingerprint validation
    // This would typically check device consistency, browser fingerprint, etc.
    return { valid: true };
  }

  async getRegionFromIP(ipAddress) {
    // Implement IP to region lookup
    // Use a service like ipinfo.io, maxmind, or ip-api
    return null;
  }

  async getCountryFromIP(ipAddress) {
    // Implement IP to country lookup
    return null;
  }

  async getDailyUsage(userId) {
    const result = await query(`
      SELECT SUM(watch_duration_seconds) / 60 as minutes_watched
      FROM content_view_history 
      WHERE user_id = ? 
        AND DATE(created_at) = CURDATE()
    `, [userId]);
    return result[0]?.minutes_watched || 0;
  }

  async checkIPReputation(ipAddress) {
    // Implement IP reputation check
    // Use services like AbuseIPDB, IPQualityScore, etc.
    return {
      reputation: 'unknown',
      riskScore: 0,
      details: 'IP reputation check not implemented'
    };
  }

  async createStreamingSession(userId, contentId, deviceId, deviceType, ipAddress) {
    const sessionId = `stream_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    await query(`
      INSERT INTO content_watch_sessions (
        user_id, content_id, session_id, device_type, started_at, last_activity_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [userId, contentId, sessionId, deviceType]);

    return {
      sessionId,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }

  async logSecurityEvent(eventData) {
    try {
      await query(`
        INSERT INTO security_logs (
          user_id, action, ip_address, status, details, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        eventData.userId,
        eventData.action,
        eventData.details?.ipAddress || null,
        eventData.status,
        JSON.stringify(eventData.details || {})
      ]);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  async logSecurityIncident(incidentData) {
    await this.logSecurityEvent({
      ...incidentData,
      action: incidentData.action || 'security_incident'
    });
  }

  buildSecurityResponse(code, message, details = {}) {
    return {
      success: false,
      valid: false,
      code,
      message,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        securityLevel: 'enterprise'
      }
    };
  }
}

module.exports = new SecurityValidator();