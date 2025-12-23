const { query } = require("../config/dbConfig");
const crypto = require("crypto");
const geoip = require("geoip-lite");

/**
 * PRODUCTION SECURITY VALIDATOR - KID-FRIENDLY VERSION
 */
class SecurityValidator {
  constructor() {
    // Custom age ratings based on your system
    this.ageRatings = {
      'all': 0,
      '3+': 1,
      '7+': 2,
      '10+': 3,
      '13+': 4,
      '16+': 5,
      '18+': 6,
      'mature': 7
    };
    
    // Time constants (in minutes)
    this.SESSION_INACTIVITY_LIMIT = 30;
    this.MAX_FAMILY_DEVICES = {
      'family': 6,
      'premium': 4,
      'standard': 3,
      'basic': 2,
      'mobile': 1,
      'free_trial': 1,
      'free': 1,
      'custom': 10
    };
    
    this.MAX_SIMULTANEOUS_STREAMS = {
      'family': 4,
      'premium': 3,
      'standard': 2,
      'basic': 1,
      'mobile': 1,
      'free_trial': 1,
      'free': 1,
      'custom': 5
    };
    
    // GENERAL GENRES/CATEGORIES TO BLOCK FOR KIDS
    this.KID_BLOCKED_CATEGORIES = [
      'Horror', 'Thriller', 'Crime', 'War', 'Mature', '18+'
    ];
  }

  /**
   * MAIN VALIDATION ENTRY POINT
   */
  async validateContentStreamAccess(userId, contentId, deviceId, deviceType, ipAddress = null) {
    try {
      console.log(`🔐 [SECURITY] Starting validation for user: ${userId}, content: ${contentId}`);

      // 1. USER VALIDATION
      const userValidation = await this.validateUserBasic(userId);
      if (!userValidation.valid) {
        return this.buildErrorResponse('USER_INVALID', userValidation.message, userValidation.details);
      }

      // 2. CONTENT VALIDATION
      const contentValidation = await this.validateContentBasic(contentId);
      if (!contentValidation.valid) {
        return this.buildErrorResponse('CONTENT_INVALID', contentValidation.message, contentValidation.details);
      }

      // 3. SUBSCRIPTION VALIDATION
      const subscriptionValidation = await this.validateSubscriptionProper(userId);
      if (!subscriptionValidation.valid) {
        return this.buildErrorResponse(
          subscriptionValidation.code || 'SUBSCRIPTION_REQUIRED',
          subscriptionValidation.message,
          subscriptionValidation.details
        );
      }

      const subscription = subscriptionValidation.subscription;

      // 4. DEVICE LIMIT CHECK
      const deviceLimitCheck = await this.checkDeviceLimits(userId, subscription, deviceId, deviceType);
      if (!deviceLimitCheck.valid) {
        return this.buildErrorResponse(
          'DEVICE_LIMIT_REACHED',
          deviceLimitCheck.message,
          deviceLimitCheck.details
        );
      }

      // 5. SIMULTANEOUS STREAM LIMIT CHECK
      const streamLimitCheck = await this.checkSimultaneousStreams(userId, subscription);
      if (!streamLimitCheck.valid) {
        return this.buildErrorResponse(
          'STREAM_LIMIT_REACHED',
          streamLimitCheck.message,
          streamLimitCheck.details
        );
      }

      // 6. KID/FAMILY RESTRICTIONS - Only check if user is actually a kid
      const isKidUser = await this.isUserAKid(userId);
      if (isKidUser) {
        const kidRestrictionCheck = await this.checkKidAndFamilyRestrictions(
          userId, 
          contentId, 
          contentValidation.content,
          subscription
        );
        if (!kidRestrictionCheck.valid) {
          return this.buildErrorResponse(
            kidRestrictionCheck.code || 'KID_CONTENT_RESTRICTED',
            kidRestrictionCheck.message,
            kidRestrictionCheck.details
          );
        }
      } else {
        console.log(`✅ [SECURITY] User ${userId} is not a kid profile, skipping kid restrictions`);
      }

      // 7. TIME RESTRICTIONS CHECK
      const timeRestrictionCheck = await this.checkTimeRestrictions(userId);
      if (!timeRestrictionCheck.valid) {
        return this.buildErrorResponse(
          'TIME_RESTRICTION',
          timeRestrictionCheck.message,
          timeRestrictionCheck.details
        );
      }

      // 8. GEOGRAPHICAL RESTRICTIONS CHECK
      const geoRestrictionCheck = await this.checkGeographicalRestrictions(contentId, contentValidation.content, ipAddress);
      if (!geoRestrictionCheck.valid) {
        return this.buildErrorResponse(
          'GEO_RESTRICTED',
          geoRestrictionCheck.message,
          geoRestrictionCheck.details
        );
      }

      // 9. CONTENT RIGHTS & LICENSE CHECK
      const contentRightsCheck = await this.checkContentRights(contentId, subscription);
      if (!contentRightsCheck.valid) {
        return this.buildErrorResponse(
          'CONTENT_RIGHTS_RESTRICTED',
          contentRightsCheck.message,
          contentRightsCheck.details
        );
      }

      // ALL CHECKS PASSED
      console.log(`✅ [SECURITY] All checks passed for user ${userId}`);
      
      return {
        success: true,
        valid: true,
        message: 'Access granted',
        details: {
          user: userValidation.user,
          content: contentValidation.content,
          subscription: subscription,
          device_limit: deviceLimitCheck.limits || { active: 1, maximum: 1, limit_reached: false },
          stream_limit: streamLimitCheck.limits || { active: 0, maximum: 1, limit_reached: false },
          is_kid_user: isKidUser,
          timestamp: new Date().toISOString(),
          session: {
            sessionId: `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
            created: new Date().toISOString(),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          security_level: 'enhanced'
        }
      };

    } catch (error) {
      console.error('❌ [SECURITY] System error:', error);
      
      return {
        success: false,
        valid: false,
        code: 'SYSTEM_ERROR',
        message: 'Security validation failed',
        details: {
          error: 'System error occurred',
          requires_subscription: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * CHECK IF USER IS A KID - SIMPLIFIED
   */
  async isUserAKid(userId) {
    try {
      // Check if user is a family member with dashboard_type = 'kid'
      const kidFamilyMember = await query(`
        SELECT id FROM family_members 
        WHERE user_id = ? 
          AND invitation_status = 'accepted'
          AND is_active = TRUE
          AND is_suspended = FALSE
          AND dashboard_type = 'kid'
        LIMIT 1
      `, [userId]);

      if (kidFamilyMember.length > 0) {
        console.log(`👶 [SECURITY] User ${userId} is a kid family member`);
        return true;
      }

      // Check if user is in kid mode via user_session
      const kidSession = await query(`
        SELECT id FROM user_session 
        WHERE user_id = ? 
          AND is_active = TRUE
          AND (session_mode = 'kid' OR active_kid_profile_id IS NOT NULL)
        LIMIT 1
      `, [userId]);

      if (kidSession.length > 0) {
        console.log(`👶 [SECURITY] User ${userId} is in kid mode`);
        return true;
      }

      console.log(`✅ [SECURITY] User ${userId} is NOT a kid`);
      return false;

    } catch (error) {
      console.error('❌ [SECURITY] Kid check error:', error);
      return false;
    }
  }

  /**
   * KID & FAMILY RESTRICTIONS CHECK - KID-FRIENDLY VERSION
   * Only checks age rating and general blocked categories
   */
  async checkKidAndFamilyRestrictions(userId, contentId, content, subscription) {
    try {
      console.log(`👶 [SECURITY] SIMPLE KID CHECK for user ${userId}`);

      // Determine what type of kid user this is
      let kidType = null;
      let kidData = null;
      let kidProfileId = null;

      // Check if family member kid
      const familyMemberKid = await query(`
        SELECT 
          fm.*,
          fm.content_restrictions,
          fm.dashboard_type
        FROM family_members fm
        WHERE fm.user_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
          AND fm.is_suspended = FALSE
          AND fm.dashboard_type = 'kid'
        LIMIT 1
      `, [userId]);

      if (familyMemberKid.length > 0) {
        kidType = 'family_member';
        kidData = familyMemberKid[0];
        console.log(`👶 [SECURITY] User ${userId} is a family member kid`);
      } else {
        // Check if user is in kid mode via user_session
        const userSession = await query(`
          SELECT 
            us.session_mode,
            us.active_kid_profile_id,
            kp.max_content_age_rating,
            kp.calculated_age
          FROM user_session us
          LEFT JOIN kids_profiles kp ON us.active_kid_profile_id = kp.id
          WHERE us.user_id = ?
            AND us.is_active = TRUE
            AND (us.session_mode = 'kid' OR us.active_kid_profile_id IS NOT NULL)
          LIMIT 1
        `, [userId]);

        if (userSession.length > 0 && userSession[0].active_kid_profile_id) {
          kidType = 'kid_profile';
          kidData = userSession[0];
          kidProfileId = kidData.active_kid_profile_id;
          console.log(`👶 [SECURITY] User ${userId} is in kid mode with profile ID: ${kidProfileId}, age: ${kidData.calculated_age}`);
        }
      }

      if (!kidType || !kidData) {
        console.log(`⚠️ [SECURITY] User ${userId} marked as kid but no kid data found`);
        return { valid: true };
      }

      // 1. AGE RATING CHECK - SIMPLIFIED
      let maxAgeRating = '10+'; // Default safe rating for kids
      
      if (kidData.max_content_age_rating) {
        maxAgeRating = kidData.max_content_age_rating;
        console.log(`📊 [SECURITY] Using custom age rating: ${maxAgeRating}`);
      } else if (kidData.calculated_age) {
        // Auto-determine based on kid's age - KID FRIENDLY DEFAULT
        const kidAge = kidData.calculated_age;
        if (kidAge >= 16) maxAgeRating = '16+';
        else if (kidAge >= 13) maxAgeRating = '13+';
        else if (kidAge >= 10) maxAgeRating = '10+';
        else if (kidAge >= 7) maxAgeRating = '7+';
        else if (kidAge >= 3) maxAgeRating = '3+';
        else maxAgeRating = 'all';
        
        console.log(`📊 [SECURITY] Auto age rating based on kid age ${kidAge}: ${maxAgeRating}`);
      } else {
        // Default to kid-friendly rating
        maxAgeRating = '10+';
        console.log(`📊 [SECURITY] Using default age rating: ${maxAgeRating}`);
      }

      console.log(`📊 [SECURITY] Age check - Content: ${content.age_rating}, Kid max: ${maxAgeRating}`);

      // KID FRIENDLY: Allow all content with age rating 'all' or lower than 16+
      if (!content.age_rating || content.age_rating === 'all') {
        console.log(`✅ [SECURITY] Content has no age rating or is 'all', allowing access`);
        return { valid: true };
      }

      // Convert age ratings to numbers for comparison
      const contentRating = content.age_rating.toLowerCase();
      const kidMaxRating = maxAgeRating.toLowerCase();
      
      // Get numeric values
      const contentRatingValue = this.ageRatings[contentRating] || 0;
      const kidMaxRatingValue = this.ageRatings[kidMaxRating] || 0;
      
      console.log(`📊 [SECURITY] Age rating values - Content: ${contentRatingValue}, Kid max: ${kidMaxRatingValue}`);

      // KID FRIENDLY: Only block if content rating is higher than allowed
      if (contentRatingValue > kidMaxRatingValue) {
        console.log(`❌ [SECURITY] Content age rating ${content.age_rating} exceeds kid's max ${maxAgeRating}`);
        return {
          valid: false,
          code: 'KID_CONTENT_RESTRICTED',
          message: 'This content is not suitable for your age',
          details: {
            content_age_rating: content.age_rating,
            allowed_max_age_rating: maxAgeRating,
            kid_type: kidType
          }
        };
      }

      // 2. CHECK GENERAL BLOCKED CATEGORIES (Horror, etc.)
      const contentCategories = await query(`
        SELECT ccat.category_id, cat.name, cat.slug
        FROM content_categories ccat
        JOIN categories cat ON ccat.category_id = cat.id
        WHERE ccat.content_id = ?
      `, [contentId]);

      console.log(`📊 [SECURITY] Content categories:`, contentCategories.map(c => c.name));

      // Check if any category is in the blocked list
      for (const category of contentCategories) {
        if (this.KID_BLOCKED_CATEGORIES.some(blocked => 
          category.name.toLowerCase().includes(blocked.toLowerCase()) ||
          category.slug.toLowerCase().includes(blocked.toLowerCase())
        )) {
          console.log(`❌ [SECURITY] Content has blocked category: ${category.name}`);
          return {
            valid: false,
            code: 'CONTENT_CATEGORY_RESTRICTED',
            message: `This content category (${category.name}) is not suitable for kids`,
            details: {
              blocked_category: category.name,
              kid_type: kidType
            }
          };
        }
      }

      // 3. Check approved content overrides (parents can approve specific content)
      if (kidProfileId) {
        const approvedOverride = await query(`
          SELECT id FROM approved_content_overrides
          WHERE kid_profile_id = ? AND content_id = ?
          AND (parent_user_id = ? OR parent_user_id = ?)
          AND (approved_until IS NULL OR approved_until >= CURDATE())
        `, [kidProfileId, contentId, subscription.family_owner_id || userId, userId]);

        if (approvedOverride.length > 0) {
          console.log(`✅ [SECURITY] Content ${contentId} is approved for kid profile ${kidProfileId}`);
          return { valid: true };
        }
      }

      console.log(`✅ [SECURITY] Kid restrictions passed for user ${userId}`);
      return { valid: true };

    } catch (error) {
      console.error('❌ [SECURITY] Kid restrictions error:', error);
      return { 
        valid: true // Allow access on error to not block legitimate viewing
      };
    }
  }

  /**
   * TIME RESTRICTIONS CHECK - FIXED VERSION
   */
  async checkTimeRestrictions(userId) {
    try {
      console.log(`⏰ [SECURITY] Checking time restrictions for user ${userId}`);
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // 1. Check family member restrictions
      const familyMember = await query(`
        SELECT 
          sleep_time_start,
          sleep_time_end,
          allowed_access_start,
          allowed_access_end,
          enforce_access_window,
          enforce_sleep_time,
          dashboard_type
        FROM family_members
        WHERE user_id = ?
          AND invitation_status = 'accepted'
          AND is_active = TRUE
          AND is_suspended = FALSE
        LIMIT 1
      `, [userId]);

      if (familyMember.length > 0) {
        const member = familyMember[0];
        console.log(`⏰ [SECURITY] User ${userId} has family member restrictions`);

        // Check sleep time
        if (member.enforce_sleep_time && member.sleep_time_start && member.sleep_time_end) {
          const sleepStart = this.timeToMinutes(member.sleep_time_start);
          const sleepEnd = this.timeToMinutes(member.sleep_time_end);
          
          if (this.isTimeInWindow(currentTime, sleepStart, sleepEnd)) {
            return {
              valid: false,
              message: 'Access restricted during sleep time',
              details: {
                sleep_time_start: member.sleep_time_start,
                sleep_time_end: member.sleep_time_end,
                current_time: this.minutesToTime(currentTime),
                restriction_type: 'sleep_time'
              }
            };
          }
        }

        // Check allowed access window
        if (member.enforce_access_window && member.allowed_access_start && member.allowed_access_end) {
          const allowedStart = this.timeToMinutes(member.allowed_access_start);
          const allowedEnd = this.timeToMinutes(member.allowed_access_end);
          
          if (!this.isTimeInWindow(currentTime, allowedStart, allowedEnd)) {
            return {
              valid: false,
              message: 'Access restricted outside allowed hours',
              details: {
                allowed_access_start: member.allowed_access_start,
                allowed_access_end: member.allowed_access_end,
                current_time: this.minutesToTime(currentTime),
                restriction_type: 'access_window'
              }
            };
          }
        }
      }

      // 2. Check if user is in kid mode
      const kidSession = await query(`
        SELECT 
          us.session_mode,
          us.active_kid_profile_id,
          kp.bedtime_start,
          kp.bedtime_end
        FROM user_session us
        LEFT JOIN kids_profiles kp ON us.active_kid_profile_id = kp.id
        WHERE us.user_id = ?
          AND us.is_active = TRUE
          AND (us.session_mode = 'kid' OR us.active_kid_profile_id IS NOT NULL)
        ORDER BY us.last_activity DESC
        LIMIT 1
      `, [userId]);

      if (kidSession.length > 0 && kidSession[0].active_kid_profile_id) {
        const session = kidSession[0];
        console.log(`👶 [SECURITY] User ${userId} is in kid mode with profile ID: ${session.active_kid_profile_id}`);

        // Check bedtime for kid profile
        if (session.bedtime_start && session.bedtime_end) {
          const bedtimeStart = this.timeToMinutes(session.bedtime_start);
          const bedtimeEnd = this.timeToMinutes(session.bedtime_end);
          
          if (this.isTimeInWindow(currentTime, bedtimeStart, bedtimeEnd)) {
            return {
              valid: false,
              message: 'Access restricted during bedtime hours',
              details: {
                bedtime_start: session.bedtime_start,
                bedtime_end: session.bedtime_end,
                current_time: this.minutesToTime(currentTime),
                restriction_type: 'bedtime'
              }
            };
          }
        }

        // For kid profiles, also check viewing time limits
        if (session.active_kid_profile_id) {
          const timeLimits = await query(`
            SELECT 
              daily_time_limit_minutes,
              current_daily_usage,
              allowed_start_time,
              allowed_end_time,
              last_reset_date
            FROM viewing_time_limits
            WHERE kid_profile_id = ?
          `, [session.active_kid_profile_id]);

          if (timeLimits.length > 0) {
            const limits = timeLimits[0];
            
            // Reset daily usage if it's a new day
            if (limits.last_reset_date && new Date(limits.last_reset_date).toDateString() !== now.toDateString()) {
              await query(`
                UPDATE viewing_time_limits 
                SET current_daily_usage = 0, last_reset_date = CURDATE()
                WHERE kid_profile_id = ?
              `, [session.active_kid_profile_id]);
              limits.current_daily_usage = 0;
            }

            // Check daily time limit
            if (limits.daily_time_limit_minutes > 0 && limits.current_daily_usage >= limits.daily_time_limit_minutes) {
              return {
                valid: false,
                message: 'Daily viewing time limit reached',
                details: {
                  current_usage: limits.current_daily_usage,
                  daily_limit: limits.daily_time_limit_minutes,
                  restriction_type: 'daily_time_limit'
                }
              };
            }

            // Check allowed time window for kid profiles
            if (limits.allowed_start_time && limits.allowed_end_time) {
              const allowedStart = this.timeToMinutes(limits.allowed_start_time);
              const allowedEnd = this.timeToMinutes(limits.allowed_end_time);
              
              if (!this.isTimeInWindow(currentTime, allowedStart, allowedEnd)) {
                return {
                  valid: false,
                  message: 'Access restricted outside allowed hours',
                  details: {
                    allowed_start: limits.allowed_start_time,
                    allowed_end: limits.allowed_end_time,
                    current_time: this.minutesToTime(currentTime),
                    restriction_type: 'kid_access_window'
                  }
                };
              }
            }
          }
        }
      }

      console.log(`✅ [SECURITY] No time restrictions for user ${userId}`);
      return { valid: true };

    } catch (error) {
      console.error('❌ [SECURITY] Time restrictions error:', error);
      return { valid: true };
    }
  }

  /**
   * DEVICE LIMIT CHECK
   */
async checkDeviceLimits(userId, subscription, deviceId, deviceType) {
  try {
    console.log(`📱 [SECURITY] Checking device limits for user ${userId}, device type: ${deviceType}`);
    
    const isFamilyShared = subscription.is_family_shared || false;
    let maxDevices = 1;
    
    if (subscription.plan_type) {
      maxDevices = this.MAX_FAMILY_DEVICES[subscription.plan_type] || 1;
    } else if (subscription.max_devices) {
      maxDevices = subscription.max_devices;
    }

    // 1. CHECK DEVICE TYPE RESTRICTIONS FOR MOBILE PLANS
    if (subscription.plan_type === 'mobile') {
      console.log(`📱 [SECURITY] User ${userId} has mobile plan, checking device restrictions`);
      
      // Mobile plans only allow mobile and tablet devices
      const allowedDevices = ['mobile', 'tablet'];
      if (!allowedDevices.includes(deviceType.toLowerCase())) {
        console.log(`❌ [SECURITY] Mobile plan users cannot use ${deviceType} devices`);
        return {
          valid: false,
          message: `Mobile plans only support mobile and tablet devices. You're using ${deviceType}.`,
          details: {
            plan_type: 'mobile',
            current_device: deviceType,
            allowed_devices: allowedDevices,
            restriction_type: 'device_type_restriction'
          }
        };
      }
    }

    // 2. CHECK ALLOWED DEVICES FROM SUBSCRIPTIONS TABLE
    if (subscription.devices_allowed) {
      try {
        const devicesAllowed = JSON.parse(subscription.devices_allowed);
        console.log(`📱 [SECURITY] Plan has specific device restrictions:`, devicesAllowed);
        
        if (devicesAllowed.length > 0) {
          // Normalize device type for comparison
          const normalizedDeviceType = deviceType.toLowerCase();
          const normalizedAllowedDevices = devicesAllowed.map(d => d.toLowerCase());
          
          if (!normalizedAllowedDevices.includes(normalizedDeviceType)) {
            console.log(`❌ [SECURITY] Device type ${deviceType} not allowed for this plan`);
            return {
              valid: false,
              message: `Your subscription plan does not support ${deviceType} devices.`,
              details: {
                current_device: deviceType,
                allowed_devices: devicesAllowed,
                plan_type: subscription.plan_type,
                restriction_type: 'plan_device_restriction'
              }
            };
          }
        }
      } catch (parseError) {
        console.error('❌ [SECURITY] Error parsing devices_allowed:', parseError);
      }
    }

    // 3. CHECK SUPPORTED PLATFORMS FROM SUBSCRIPTIONS TABLE
    if (subscription.supported_platforms) {
      try {
        const supportedPlatforms = JSON.parse(subscription.supported_platforms);
        console.log(`📱 [SECURITY] Plan supported platforms:`, supportedPlatforms);
        
        if (supportedPlatforms.length > 0) {
          // Map device types to platform names
          const deviceToPlatform = {
            'mobile': 'mobile',
            'tablet': 'tablet',
            'desktop': 'web',
            'web': 'web',
            'smarttv': 'smarttv'
          };
          
          const currentPlatform = deviceToPlatform[deviceType.toLowerCase()] || deviceType.toLowerCase();
          const normalizedPlatforms = supportedPlatforms.map(p => p.toLowerCase());
          
          if (!normalizedPlatforms.includes(currentPlatform)) {
            console.log(`❌ [SECURITY] Platform ${currentPlatform} not supported for this plan`);
            return {
              valid: false,
              message: `Your subscription plan does not support ${deviceType} devices.`,
              details: {
                current_device: deviceType,
                current_platform: currentPlatform,
                supported_platforms: supportedPlatforms,
                plan_type: subscription.plan_type,
                restriction_type: 'platform_restriction'
              }
            };
          }
        }
      } catch (parseError) {
        console.error('❌ [SECURITY] Error parsing supported_platforms:', parseError);
      }
    }

    // If user already has session for this device, update it and allow
    const existingDeviceSession = await query(`
      SELECT id, last_activity
      FROM user_session
      WHERE user_id = ? 
        AND device_id = ?
        AND is_active = TRUE
        AND logout_time IS NULL
      LIMIT 1
    `, [userId, deviceId]);

    if (existingDeviceSession.length > 0) {
      // Update existing session
      await query(`
        UPDATE user_session 
        SET last_activity = NOW()
        WHERE id = ?
      `, [existingDeviceSession[0].id]);
      
      console.log(`✅ [SECURITY] Device ${deviceId} session updated`);
      return { 
        valid: true, 
        limits: {
          active: 1,
          maximum: maxDevices,
          limit_reached: false,
          is_family_shared: isFamilyShared,
          device_type_allowed: true
        }
      };
    }

    // Count ACTIVE sessions (last activity within inactivity limit)
    const activeSessions = await query(`
      SELECT COUNT(*) as active_count
      FROM user_session
      WHERE user_id = ? 
        AND is_active = TRUE
        AND logout_time IS NULL
        AND last_activity > DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `, [userId, this.SESSION_INACTIVITY_LIMIT]);

    const activeCount = activeSessions[0]?.active_count || 0;
    
    console.log(`📱 [SECURITY] User ${userId} has ${activeCount} active sessions, max: ${maxDevices}`);

    // If at limit, check for inactive sessions to expire
    if (activeCount >= maxDevices) {
      // Find oldest inactive session
      const inactiveSession = await query(`
        SELECT id, last_activity
        FROM user_session
        WHERE user_id = ?
          AND is_active = TRUE
          AND logout_time IS NULL
          AND last_activity <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ORDER BY last_activity ASC
        LIMIT 1
      `, [userId, this.SESSION_INACTIVITY_LIMIT]);

      if (inactiveSession.length > 0) {
        // Expire the inactive session
        await query(`
          UPDATE user_session 
          SET is_active = FALSE, logout_time = NOW()
          WHERE id = ?
        `, [inactiveSession[0].id]);
        
        console.log(`🔄 [SECURITY] Expired inactive session ${inactiveSession[0].id}`);
        
        // Create new session for this device
        await this.createUserSession(userId, deviceId, deviceType);
        
        return { 
          valid: true, 
          limits: {
            active: activeCount,
            maximum: maxDevices,
            limit_reached: false,
            is_family_shared: isFamilyShared,
            device_type_allowed: true
          }
        };
      } else {
        // All sessions are active, deny new device
        const message = isFamilyShared 
          ? 'Your family has reached the maximum number of active devices. Please log out from another device.'
          : 'You have reached the maximum number of active devices. Please log out from another device.';
        
        console.log(`❌ [SECURITY] Device limit reached: ${activeCount}/${maxDevices}`);
        
        return { 
          valid: false, 
          message,
          details: {
            active: activeCount,
            maximum: maxDevices,
            limit_reached: true,
            is_family_shared: isFamilyShared,
            device_type_allowed: true
          }
        };
      }
    }

    // Create new session for this device
    await this.createUserSession(userId, deviceId, deviceType);
    
    return { 
      valid: true, 
      limits: {
        active: activeCount + 1,
        maximum: maxDevices,
        limit_reached: false,
        is_family_shared: isFamilyShared,
        device_type_allowed: true
      }
    };

  } catch (error) {
    console.error('❌ [SECURITY] Device limit error:', error);
    return { 
      valid: true,
      limits: {
        active: 1,
        maximum: 1,
        limit_reached: false,
        device_type_allowed: true,
        error: true
      }
    };
  }
}

  /**
   * CREATE USER SESSION HELPER
   */
  async createUserSession(userId, deviceId, deviceType) {
    try {
      await query(`
        INSERT INTO user_session (
          user_id, session_token, device_type, 
          device_name, device_id, token_expires, is_active,
          last_activity, created_at
        ) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), TRUE, NOW(), NOW())
      `, [
        userId,
        `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        deviceType,
        `${deviceType}_${deviceId.substring(0, 8)}`,
        deviceId
      ]);
      
      console.log(`✅ [SECURITY] Created new session for device ${deviceId}`);
    } catch (error) {
      console.error('❌ [SECURITY] Session creation error:', error);
    }
  }

  /**
   * SIMULTANEOUS STREAM LIMIT CHECK
   */
  async checkSimultaneousStreams(userId, subscription) {
    try {
      console.log(`📺 [SECURITY] Checking simultaneous streams for user ${userId}`);
      
      const isFamilyShared = subscription.is_family_shared || false;
      let maxStreams = 1;
      
      if (subscription.plan_type) {
        maxStreams = this.MAX_SIMULTANEOUS_STREAMS[subscription.plan_type] || 1;
      } else if (subscription.max_simultaneous_streams) {
        maxStreams = subscription.max_simultaneous_streams;
      }

      let activeStreams = 0;

      if (isFamilyShared && subscription.family_owner_id) {
        // For family plans, check all family members
        const familyMembers = await query(`
          SELECT fm.user_id
          FROM family_members fm
          INNER JOIN users u ON fm.user_id = u.id
          WHERE fm.family_owner_id = ?
            AND fm.invitation_status = 'accepted'
            AND fm.is_active = TRUE
            AND fm.is_suspended = FALSE
        `, [subscription.family_owner_id]);

        for (const member of familyMembers) {
          const memberStreams = await query(`
            SELECT COUNT(*) as count
            FROM content_watch_sessions cws
            WHERE cws.user_id = ?
              AND cws.last_activity_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
          `, [member.user_id]);
          
          activeStreams += memberStreams[0]?.count || 0;
        }
      } else {
        // For individual plans
        const userStreams = await query(`
          SELECT COUNT(*) as count
          FROM content_watch_sessions cws
          WHERE cws.user_id = ?
            AND cws.last_activity_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        `, [userId]);
        
        activeStreams = userStreams[0]?.count || 0;
      }

      console.log(`📺 [SECURITY] Active streams: ${activeStreams}/${maxStreams}`);

      if (activeStreams >= maxStreams) {
        const message = isFamilyShared
          ? 'Maximum simultaneous streams reached for your family plan'
          : 'Maximum simultaneous streams reached for your account';
        
        return { 
          valid: false, 
          message,
          details: {
            active: activeStreams,
            maximum: maxStreams,
            limit_reached: true,
            is_family_shared: isFamilyShared
          }
        };
      }

      return { 
        valid: true, 
        limits: {
          active: activeStreams,
          maximum: maxStreams,
          limit_reached: false,
          is_family_shared: isFamilyShared
        }
      };

    } catch (error) {
      console.error('❌ [SECURITY] Stream limit error:', error);
      return { 
        valid: true,
        limits: {
          active: 0,
          maximum: 1,
          limit_reached: false,
          error: true
        }
      };
    }
  }

  /**
   * GEOGRAPHICAL RESTRICTIONS CHECK
   */
  async checkGeographicalRestrictions(contentId, content, ipAddress) {
    try {
      if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
        console.log('🌍 [SECURITY] Local IP, skipping geo check');
        return { valid: true };
      }

      console.log(`🌍 [SECURITY] Checking geographical restrictions for content ${contentId}`);

      const contentRights = await query(`
        SELECT allowed_regions, blocked_countries, georestricted
        FROM content_rights
        WHERE content_id = ?
      `, [contentId]);

      if (contentRights.length === 0 || !contentRights[0].georestricted) {
        return { valid: true };
      }

      const rights = contentRights[0];
      const geo = geoip.lookup(ipAddress);
      
      if (!geo || !geo.country) {
        console.log('⚠️ [SECURITY] Could not determine location');
        return { valid: true };
      }

      const userCountry = geo.country;
      console.log(`📍 [SECURITY] User location: ${userCountry}`);

      // Check blocked countries
      if (rights.blocked_countries) {
        const blockedCountries = JSON.parse(rights.blocked_countries);
        if (blockedCountries.includes(userCountry)) {
          return {
            valid: false,
            message: 'Content not available in your country',
            details: { user_country: userCountry }
          };
        }
      }

      // Check allowed regions
      if (rights.allowed_regions) {
        const allowedRegions = JSON.parse(rights.allowed_regions);
        if (allowedRegions.length > 0 && !allowedRegions.includes(userCountry)) {
          return {
            valid: false,
            message: 'Content only available in specific regions',
            details: { 
              user_country: userCountry,
              allowed_regions: allowedRegions 
            }
          };
        }
      }

      return { valid: true };

    } catch (error) {
      console.error('❌ [SECURITY] Geographical restrictions error:', error);
      return { valid: true };
    }
  }

  /**
   * CONTENT RIGHTS CHECK
   */
  async checkContentRights(contentId, subscription) {
    try {
      console.log(`📜 [SECURITY] Checking content rights for content ${contentId}`);

      const contentRights = await query(`
        SELECT end_date, start_date, license_fee
        FROM content_rights
        WHERE content_id = ?
      `, [contentId]);

      if (contentRights.length === 0) {
        return { valid: true };
      }

      const rights = contentRights[0];
      const now = new Date();

      // Check license expiration
      if (rights.end_date && new Date(rights.end_date) < now) {
        return {
          valid: false,
          message: 'Content license has expired',
          details: { license_end_date: rights.end_date }
        };
      }

      // Check license start date
      if (rights.start_date && new Date(rights.start_date) > now) {
        return {
          valid: false,
          message: 'Content will be available soon',
          details: { license_start_date: rights.start_date }
        };
      }

      // Check if free trial user trying to access premium content
      if (rights.license_fee > 0 && subscription.plan_type === 'free_trial') {
        return {
          valid: false,
          message: 'Premium content requires paid subscription',
          details: { 
            license_fee: rights.license_fee,
            subscription_plan: subscription.plan_name
          }
        };
      }

      return { valid: true };

    } catch (error) {
      console.error('❌ [SECURITY] Content rights error:', error);
      return { valid: true };
    }
  }

  /**
   * TIME CONVERSION HELPERS
   */
  timeToMinutes(timeString) {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  isTimeInWindow(currentTime, windowStart, windowEnd) {
    if (windowStart <= windowEnd) {
      return currentTime >= windowStart && currentTime < windowEnd;
    } else {
      return currentTime >= windowStart || currentTime < windowEnd;
    }
  }

  /**
   * USER BASIC VALIDATION
   */
  async validateUserBasic(userId) {
    try {
      const users = await query(`
        SELECT 
          id, 
          email, 
          is_active, 
          email_verified,
          subscription_plan,
          role,
          created_at,
          updated_at
        FROM users 
        WHERE id = ?
      `, [userId]);

      if (users.length === 0) {
        return { 
          valid: false, 
          message: 'User account not found',
          details: { user_exists: false }
        };
      }

      const user = users[0];

      // Account active check
      if (!user.is_active) {
        return { 
          valid: false, 
          message: 'Account has been deactivated',
          details: { 
            is_active: false,
            contact_support: true
          }
        };
      }

      // Email verification check
      if (!user.email_verified) {
        return { 
          valid: false, 
          message: 'Email verification required',
          details: { 
            email_verified: false,
            email: user.email
          }
        };
      }

      return { 
        valid: true, 
        user: {
          id: user.id,
          email: user.email,
          is_active: user.is_active,
          email_verified: user.email_verified,
          subscription_plan: user.subscription_plan,
          role: user.role,
          account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
        }
      };
    } catch (error) {
      console.error('❌ [SECURITY] User validation error:', error);
      return { 
        valid: false,
        message: 'User validation failed',
        details: { validation_error: true }
      };
    }
  }

  /**
   * SUBSCRIPTION VALIDATION
   */
  async validateSubscriptionProper(userId) {
    try {
      console.log(`🔍 [SECURITY] Checking subscription for user ${userId}`);
      
      // Check if user has ANY active subscription in user_subscriptions table
      const activeSubscriptions = await query(`
        SELECT 
          us.*, 
          s.name as plan_name,
          s.type as plan_type,
          s.max_sessions,
          s.max_family_members,
          s.is_family_plan,
          DATEDIFF(us.end_date, NOW()) as days_remaining
        FROM user_subscriptions us
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
          AND us.cancelled_at IS NULL
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [userId]);

      if (activeSubscriptions.length > 0) {
        const sub = activeSubscriptions[0];
        console.log(`✅ [SECURITY] User ${userId} has active subscription: ${sub.plan_name}`);
        
        // Check if trial has ended
        if (sub.trial_end_date && new Date(sub.trial_end_date) < new Date()) {
          console.log(`❌ [SECURITY] User ${userId} trial ended: ${sub.trial_end_date}`);
          return { 
            valid: false, 
            message: 'Your free trial has ended',
            code: 'SUBSCRIPTION_REQUIRED',
            details: { 
              trial_end_date: sub.trial_end_date,
              trial_expired: true
            }
          };
        }

        return { 
          valid: true, 
          subscription: {
            id: sub.id,
            plan_name: sub.plan_name,
            plan_type: sub.plan_type,
            is_family_plan: sub.is_family_plan,
            max_devices: sub.max_sessions,
            max_simultaneous_streams: sub.max_sessions,
            max_family_members: sub.max_family_members,
            end_date: sub.end_date,
            days_remaining: sub.days_remaining,
            source: 'user_subscriptions'
          }
        };
      }

      // No personal subscription found, check family access
      console.log(`🔍 [SECURITY] No personal subscription for user ${userId}, checking family...`);
      
      const familyAccess = await query(`
        SELECT 
          fm.*,
          us.id as owner_subscription_id,
          us.status as owner_subscription_status,
          us.end_date as owner_subscription_end,
          s.name as owner_plan_name,
          s.type as owner_plan_type,
          s.is_family_plan,
          u.email as owner_email
        FROM family_members fm
        INNER JOIN user_subscriptions us ON fm.family_owner_id = us.user_id
        INNER JOIN subscriptions s ON us.subscription_id = s.id
        INNER JOIN users u ON fm.family_owner_id = u.id
        WHERE fm.user_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
          AND fm.is_suspended = FALSE
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
          AND s.is_family_plan = TRUE
        LIMIT 1
      `, [userId]);

      if (familyAccess.length > 0) {
        const family = familyAccess[0];
        console.log(`✅ [SECURITY] User ${userId} has family access via ${family.owner_email}`);
        
        return { 
          valid: true, 
          subscription: {
            id: family.owner_subscription_id,
            plan_name: family.owner_plan_name,
            plan_type: family.owner_plan_type,
            is_family_plan: true,
            is_family_shared: true,
            family_owner_id: family.family_owner_id,
            family_owner_email: family.owner_email,
            max_devices: this.MAX_FAMILY_DEVICES[family.owner_plan_type] || 6,
            max_simultaneous_streams: this.MAX_SIMULTANEOUS_STREAMS[family.owner_plan_type] || 4,
            end_date: family.owner_subscription_end,
            source: 'family_members'
          }
        };
      }

      // Check users table subscription_plan as fallback
      console.log(`🔍 [SECURITY] Checking users.subscription_plan for user ${userId}`);
      const user = await query(`
        SELECT subscription_plan 
        FROM users 
        WHERE id = ?
      `, [userId]);

      const userPlan = user[0]?.subscription_plan;
      
      const paidPlans = ['free_trial', 'basic', 'standard', 'premium', 'custom', 'family'];
      
      if (userPlan && paidPlans.includes(userPlan)) {
        console.log(`⚠️ [SECURITY] User ${userId} has subscription_plan: ${userPlan} but no active user_subscription`);
        
        // For free_trial, check if it's a new user (within 7 days)
        if (userPlan === 'free_trial') {
          const userAge = await query(`
            SELECT TIMESTAMPDIFF(DAY, created_at, NOW()) as days_old
            FROM users 
            WHERE id = ?
          `, [userId]);

          if (userAge[0]?.days_old > 7) {
            console.log(`❌ [SECURITY] User ${userId} free trial expired (${userAge[0].days_old} days old)`);
            return { 
              valid: false, 
              message: 'Your free trial has expired',
              code: 'SUBSCRIPTION_REQUIRED',
              details: { 
                trial_expired: true,
                days_old: userAge[0].days_old
              }
            };
          }
          
          console.log(`✅ [SECURITY] User ${userId} is within free trial period (${userAge[0]?.days_old} days)`);
          return { 
            valid: true, 
            subscription: {
              plan_name: 'Free Trial',
              plan_type: 'free_trial',
              is_trial: true,
              max_devices: 1,
              max_simultaneous_streams: 1,
              days_remaining: 7 - (userAge[0]?.days_old || 0),
              source: 'users_table_trial'
            }
          };
        }
        
        // For other paid plans in users table but no user_subscription
        console.log(`❌ [SECURITY] User ${userId} has plan ${userPlan} but no active subscription record`);
        return { 
          valid: false, 
          message: 'Subscription payment required',
          code: 'SUBSCRIPTION_REQUIRED',
          details: { 
            user_plan: userPlan,
            missing_subscription_record: true,
            requires_payment: true
          }
        };
      }

      // NO SUBSCRIPTION FOUND ANYWHERE
      console.log(`❌ [SECURITY] User ${userId} has NO subscription`);
      return { 
        valid: false, 
        message: 'Subscription required to access content',
        code: 'SUBSCRIPTION_REQUIRED',
        details: { 
          has_personal_subscription: false,
          has_family_access: false,
          user_plan: userPlan || 'none',
          subscription_required: true,
          allow_subscription: true,
          trial_available: userPlan === 'none'
        }
      };

    } catch (error) {
      console.error('❌ [SECURITY] Subscription validation error:', error);
      return { 
        valid: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Unable to verify subscription',
        details: { validation_error: true }
      };
    }
  }

  /**
   * CONTENT BASIC VALIDATION
   */
  async validateContentBasic(contentId) {
    try {
      const contents = await query(`
        SELECT 
          id,
          title,
          content_type,
          status,
          visibility,
          age_rating,
          duration_minutes,
          has_subtitles,
          has_dubbing,
          release_date,
          published_at
        FROM contents 
        WHERE id = ?
      `, [contentId]);

      if (contents.length === 0) {
        return { 
          valid: false, 
          message: 'Content not found',
          details: { content_exists: false }
        };
      }

      const content = contents[0];

      // Content status check
      if (content.status !== 'published') {
        const statusMessages = {
          'draft': 'Content is not yet available',
          'archived': 'Content has been archived',
          'scheduled': 'Content will be available soon'
        };
        
        return { 
          valid: false, 
          message: statusMessages[content.status] || 'Content is not available',
          details: { status: content.status }
        };
      }

      // Visibility check
      if (content.visibility !== 'public') {
        return { 
          valid: false, 
          message: 'Content access is restricted',
          details: { visibility: content.visibility }
        };
      }

      // Check if content has media assets
      const videoAssets = await query(`
        SELECT COUNT(*) as asset_count
        FROM media_assets 
        WHERE content_id = ? 
          AND upload_status = 'completed'
          AND asset_type IN ('mainVideo', 'episodeVideo')
      `, [contentId]);

      if (videoAssets[0]?.asset_count === 0) {
        return { 
          valid: false, 
          message: 'Content is not ready for streaming',
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
          duration_minutes: content.duration_minutes,
          has_subtitles: content.has_subtitles,
          has_dubbing: content.has_dubbing,
          is_available: true
        }
      };
    } catch (error) {
      console.error('❌ [SECURITY] Content validation error:', error);
      return { 
        valid: false,
        message: 'Content validation failed',
        details: { validation_error: true }
      };
    }
  }

  /**
   * HELPER METHODS
   */
  buildErrorResponse(code, message, details = {}) {
    return {
      success: false,
      valid: false,
      code,
      message,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    };
  }

  async logSecurityEvent(userId, action, status, details = {}) {
    try {
      await query(`
        INSERT INTO security_logs (
          user_id, action, status, details, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `, [userId, action, status, JSON.stringify(details)]);
    } catch (error) {
      console.error('❌ [SECURITY] Failed to log security event:', error);
    }
  }

  /**
   * DEBUG METHOD
   */
  async debugValidationFlow(userId, contentId, deviceId, deviceType, ipAddress) {
    try {
      console.log('\n🔍🔍🔍 [SECURITY DEBUG] Starting debug for user:', userId);
      
      const results = {
        user_basic: await this.validateUserBasic(userId),
        subscription: await this.validateSubscriptionProper(userId),
        content_basic: await this.validateContentBasic(contentId),
        is_kid_user: await this.isUserAKid(userId),
        device_limits: null,
        stream_limits: null,
        kid_restrictions: null,
        time_restrictions: null,
        geo_restrictions: null,
        content_rights: null
      };

      if (results.subscription.valid) {
        results.device_limits = await this.checkDeviceLimits(userId, results.subscription.subscription, deviceId, deviceType);
        results.stream_limits = await this.checkSimultaneousStreams(userId, results.subscription.subscription);
        
        if (results.is_kid_user && results.content_basic.valid) {
          results.kid_restrictions = await this.checkKidAndFamilyRestrictions(
            userId, 
            contentId, 
            results.content_basic.content,
            results.subscription.subscription
          );
        }
        
        results.time_restrictions = await this.checkTimeRestrictions(userId);
        
        if (results.content_basic.valid) {
          results.geo_restrictions = await this.checkGeographicalRestrictions(contentId, results.content_basic.content, ipAddress);
          results.content_rights = await this.checkContentRights(contentId, results.subscription.subscription);
        }
      }

      console.log('\n📊 [SECURITY DEBUG] RESULTS:');
      console.log(JSON.stringify(results, null, 2));

      const shouldHaveAccess = Object.values(results).every(result => result?.valid !== false);

      return {
        success: true,
        results,
        should_have_access: shouldHaveAccess,
        debug_timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [SECURITY DEBUG] Debug error:', error);
      return { error: 'DEBUG_ERROR', message: error.message };
    }
  }
}

module.exports = new SecurityValidator();