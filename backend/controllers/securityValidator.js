const { query } = require("../config/dbConfig");
const crypto = require("crypto");

/**
 * PRODUCTION-READY SECURITY VALIDATOR
 * PROPER subscription validation
 */
class SecurityValidator {
  constructor() {
    this.ageRatings = {
      'G': 0, 'PG': 1, '7+': 2, 'PG-13': 3, 
      '13+': 3, 'R': 4, 'NC-17': 5, '18+': 5, 'A': 6
    };
  }

  /**
   * MAIN VALIDATION ENTRY POINT
   * PROPER subscription checking
   */
  async validateContentStreamAccess(userId, contentId, deviceId, deviceType, ipAddress = null) {
    try {
      console.log(`🔐 [VALIDATION] User: ${userId}, Content: ${contentId}`);

      // 1. USER VALIDATION
      const userValidation = await this.validateUserBasic(userId);
      if (!userValidation.valid) {
        console.log(`❌ User check failed: ${userValidation.message}`);
        return this.buildErrorResponse('USER_INVALID', userValidation.message, userValidation.details);
      }

      // 2. CONTENT VALIDATION
      const contentValidation = await this.validateContentBasic(contentId);
      if (!contentValidation.valid) {
        console.log(`❌ Content check failed: ${contentValidation.message}`);
        return this.buildErrorResponse('CONTENT_INVALID', contentValidation.message, contentValidation.details);
      }

      // 3. SUBSCRIPTION VALIDATION - PROPER CHECK
      const subscriptionValidation = await this.validateSubscriptionProper(userId);
      if (!subscriptionValidation.valid) {
        console.log(`❌ Subscription check failed: ${subscriptionValidation.message}`);
        return this.buildErrorResponse(
          subscriptionValidation.code || 'SUBSCRIPTION_REQUIRED',
          subscriptionValidation.message,
          subscriptionValidation.details
        );
      }

      // 4. ALL CHECKS PASSED
      console.log(`✅ Access granted for user ${userId} (${subscriptionValidation.subscription.plan_name})`);
      
      return {
        success: true,
        valid: true,
        message: 'Access granted',
        details: {
          user: userValidation.user,
          content: contentValidation.content,
          subscription: subscriptionValidation.subscription,
          timestamp: new Date().toISOString(),
          session: {
            sessionId: `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
            created: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      console.error('❌ Validation system error:', error);
      
      // DO NOT allow playback on system errors - require subscription
      return {
        success: false,
        valid: false,
        code: 'SYSTEM_ERROR',
        message: 'Validation system error',
        details: {
          error: 'System error occurred',
          requires_subscription: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * USER VALIDATION
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

      // Check security logs for suspicious activity
      const securityEvents = await query(`
        SELECT COUNT(*) as failed_count
        FROM security_logs 
        WHERE user_id = ? 
          AND status = 'failed'
          AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `, [userId]);

      if (securityEvents[0]?.failed_count > 10) {
        console.warn(`⚠️ User ${userId} has ${securityEvents[0].failed_count} failed security events`);
        // Log but don't block for security events
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
      console.error('User validation error:', error);
      return { 
        valid: false,
        message: 'User validation failed',
        details: { validation_error: true }
      };
    }
  }

  /**
   * PROPER SUBSCRIPTION VALIDATION
   * Checks ALL subscription sources
   */
  async validateSubscriptionProper(userId) {
    try {
      console.log(`🔍 [SUBSCRIPTION] Checking user ${userId}`);
      
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
        console.log(`✅ User ${userId} has active subscription: ${sub.plan_name}`);
        
        // Check if trial has ended
        if (sub.trial_end_date && new Date(sub.trial_end_date) < new Date()) {
          console.log(`❌ User ${userId} trial ended: ${sub.trial_end_date}`);
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
            max_family_members: sub.max_family_members,
            end_date: sub.end_date,
            days_remaining: sub.days_remaining,
            source: 'user_subscriptions'
          }
        };
      }

      // No personal subscription found, check family access
      console.log(`🔍 [SUBSCRIPTION] No personal subscription for user ${userId}, checking family...`);
      
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
        console.log(`✅ User ${userId} has family access via ${family.owner_email}`);
        
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
            end_date: family.owner_subscription_end,
            source: 'family_members'
          }
        };
      }

      // Check users table subscription_plan as fallback (for old users)
      console.log(`🔍 [SUBSCRIPTION] Checking users.subscription_plan for user ${userId}`);
      const user = await query(`
        SELECT subscription_plan 
        FROM users 
        WHERE id = ?
      `, [userId]);

      const userPlan = user[0]?.subscription_plan;
      
      // Only allow if it's a paid plan (not 'none')
      const paidPlans = ['free_trial', 'basic', 'standard', 'premium', 'custom', 'family'];
      
      if (userPlan && paidPlans.includes(userPlan)) {
        console.log(`⚠️ User ${userId} has subscription_plan: ${userPlan} but no active user_subscription`);
        
        // For free_trial, check if it's a new user (within 7 days)
        if (userPlan === 'free_trial') {
          const userAge = await query(`
            SELECT TIMESTAMPDIFF(DAY, created_at, NOW()) as days_old
            FROM users 
            WHERE id = ?
          `, [userId]);

          if (userAge[0]?.days_old > 7) {
            console.log(`❌ User ${userId} free trial expired (${userAge[0].days_old} days old)`);
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
          
          console.log(`✅ User ${userId} is within free trial period (${userAge[0]?.days_old} days)`);
          return { 
            valid: true, 
            subscription: {
              plan_name: 'Free Trial',
              is_trial: true,
              days_remaining: 7 - (userAge[0]?.days_old || 0),
              source: 'users_table_trial'
            }
          };
        }
        
        // For other paid plans in users table but no user_subscription
        console.log(`❌ User ${userId} has plan ${userPlan} but no active subscription record`);
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
      console.log(`❌ User ${userId} has NO subscription`);
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
      console.error('Subscription validation error:', error);
      return { 
        valid: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Unable to verify subscription',
        details: { validation_error: true }
      };
    }
  }

  /**
   * CONTENT VALIDATION
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
      console.error('Content validation error:', error);
      return { 
        valid: false,
        message: 'Content validation failed',
        details: { validation_error: true }
      };
    }
  }

  /**
   * DEBUG METHOD - Shows EXACTLY what's happening
   */
  async debugValidationFlow(userId, contentId, deviceId, deviceType, ipAddress) {
    try {
      console.log('\n🔍🔍🔍 [DEEP DEBUG] Starting validation debug for user:', userId);
      
      // Get user details
      const user = await query(`
        SELECT id, email, is_active, email_verified, subscription_plan, created_at
        FROM users 
        WHERE id = ?
      `, [userId]);

      if (user.length === 0) {
        return { error: 'USER_NOT_FOUND', details: { userId } };
      }

      console.log('📋 USER DETAILS:', user[0]);

      // Check active user_subscriptions
      const activeSubs = await query(`
        SELECT us.*, s.name as plan_name
        FROM user_subscriptions us
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
          AND us.status = 'active'
          AND (us.end_date IS NULL OR us.end_date > NOW())
      `, [userId]);

      console.log('💳 ACTIVE SUBSCRIPTIONS:', activeSubs.length);
      if (activeSubs.length > 0) {
        console.log('📄 Subscription details:', activeSubs[0]);
      }

      // Check family access
      const familyAccess = await query(`
        SELECT fm.*, u.email as owner_email
        FROM family_members fm
        INNER JOIN users u ON fm.family_owner_id = u.id
        WHERE fm.user_id = ?
          AND fm.invitation_status = 'accepted'
          AND fm.is_active = TRUE
      `, [userId]);

      console.log('👪 FAMILY ACCESS:', familyAccess.length);
      if (familyAccess.length > 0) {
        console.log('📄 Family details:', familyAccess[0]);
      }

      // Check if family owner has active subscription
      if (familyAccess.length > 0) {
        const familyOwnerSub = await query(`
          SELECT us.*, s.name as plan_name
          FROM user_subscriptions us
          LEFT JOIN subscriptions s ON us.subscription_id = s.id
          WHERE us.user_id = ?
            AND us.status = 'active'
            AND (us.end_date IS NULL OR us.end_date > NOW())
            AND s.is_family_plan = TRUE
        `, [familyAccess[0].family_owner_id]);

        console.log('👑 FAMILY OWNER SUBSCRIPTION:', familyOwnerSub.length);
        if (familyOwnerSub.length > 0) {
          console.log('📄 Family owner subscription:', familyOwnerSub[0]);
        }
      }

      // Run the actual validation
      console.log('\n🔍 RUNNING ACTUAL VALIDATION...');
      const subscriptionCheck = await this.validateSubscriptionProper(userId);
      
      console.log('\n📊 VALIDATION RESULT:', {
        valid: subscriptionCheck.valid,
        code: subscriptionCheck.code,
        message: subscriptionCheck.message,
        details: subscriptionCheck.details
      });

      return {
        success: true,
        user: user[0],
        active_subscriptions: activeSubs,
        family_access: familyAccess,
        subscription_validation: subscriptionCheck,
        should_have_access: subscriptionCheck.valid,
        debug_timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [DEBUG] Debug error:', error);
      return { error: 'DEBUG_ERROR', message: error.message };
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
      console.error('Failed to log security event:', error);
    }
  }
}

module.exports = new SecurityValidator();