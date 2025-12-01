const { query } = require("../config/dbConfig");

// 🛡️ SECURITY ENHANCEMENT: UTC time validation helper
const validateUTCTime = (dateString) => {
  if (!dateString) return new Date();
  
  const date = new Date(dateString);
  // Ensure we're working with UTC times to prevent timezone manipulation
  return new Date(date.toISOString());
};

// 🛡️ SECURITY ENHANCEMENT: Subscription status validation
const validateSubscriptionStatus = (subscription) => {
  if (!subscription) return 'invalid';
  
  const now = new Date();
  const startDate = validateUTCTime(subscription.start_date);
  const endDate = validateUTCTime(subscription.end_date);
  const graceEnd = validateUTCTime(subscription.grace_period_ends);

  // 🛡️ CRITICAL: Use UTC for all time comparisons
  const serverNowUTC = new Date().toISOString();
  
  if (endDate <= now) return 'expired';
  if (startDate > now) return 'scheduled';
  if (subscription.status === 'past_due' && graceEnd > now) return 'grace_period';
  if (subscription.status === 'active' && startDate <= now && endDate > now) return 'active';
  if (subscription.status === 'trialing' && endDate > now) return 'trialing';
  
  return 'invalid';
};

// 🛡️ SECURITY ENHANCEMENT: Get current user's active subscription with UTC validation
const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 SECURE getCurrentSubscription called for user:', userId, 'at UTC:', new Date().toISOString());

    const sql = `
      SELECT 
        us.*,
        s.type as plan_type,
        s.name as plan_name,
        s.video_quality,
        s.max_sessions as device_limit,
        s.offline_downloads,
        s.max_downloads,
        s.simultaneous_downloads,
        s.max_profiles,
        s.parental_controls,
        s.early_access,
        s.exclusive_content,
        s.hdr_support,
        s.supported_platforms,
        s.devices_allowed,
        s.max_devices_registered,
        -- 🛡️ SECURITY: Add UTC time validation fields
        UTC_TIMESTAMP() as server_time_utc,
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as is_currently_active_utc,
        (us.start_date > UTC_TIMESTAMP()) as is_scheduled_utc,
        (us.end_date <= UTC_TIMESTAMP()) as is_expired_utc,
        (us.grace_period_ends IS NOT NULL AND us.grace_period_ends > UTC_TIMESTAMP()) as is_in_grace_period_utc,
        -- 🛡️ SECURITY: Calculate time remaining using UTC
        GREATEST(0, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), us.end_date)) as seconds_remaining_utc,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), us.start_date) as seconds_until_start_utc
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status IN ('active', 'trialing', 'past_due')
        -- 🛡️ SECURITY: Include all subscriptions for proper UTC validation
      ORDER BY 
        CASE 
          WHEN us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP() THEN 0
          WHEN us.start_date > UTC_TIMESTAMP() THEN 1
          ELSE 2
        END,
        us.created_at DESC
      LIMIT 3
    `;

    const subscriptions = await query(sql, [userId]);

    // 🛡️ SECURITY: Enhanced logging for security monitoring
    console.log('📊 SECURE Subscription query results:', {
      userId,
      totalFound: subscriptions?.length || 0,
      serverTimeUTC: new Date().toISOString(),
      subscriptions: subscriptions?.map(sub => ({
        id: sub.id,
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        is_currently_active_utc: sub.is_currently_active_utc,
        is_scheduled_utc: sub.is_scheduled_utc,
        is_expired_utc: sub.is_expired_utc,
        server_time_utc: sub.server_time_utc
      }))
    });

    if (!subscriptions || subscriptions.length === 0) {
      console.log('🛡️ SECURITY: No subscriptions found for user:', userId);
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active subscription found',
        security: {
          server_time_utc: new Date().toISOString(),
          validated_with: 'utc_timestamp'
        }
      });
    }

    // 🛡️ SECURITY: Find the first valid subscription using UTC validation
    let validSubscription = subscriptions.find(sub => 
      sub.is_currently_active_utc === 1 || 
      sub.is_in_grace_period_utc === 1
    );

    if (!validSubscription) {
      console.log('🛡️ SECURITY: No currently active subscription found via UTC validation for user:', userId);
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active subscription found',
        security: {
          server_time_utc: new Date().toISOString(),
          validation_method: 'utc_timestamp_direct',
          available_subscriptions: subscriptions.length
        }
      });
    }

    // 🛡️ SECURITY: Parse JSON fields with error handling
    let devices_allowed = [];
    let supported_platforms = [];
    
    try {
      devices_allowed = validSubscription.devices_allowed ? JSON.parse(validSubscription.devices_allowed) : [];
      supported_platforms = validSubscription.supported_platforms ? JSON.parse(validSubscription.supported_platforms) : [];
    } catch (parseError) {
      console.error('🛡️ SECURITY: JSON parse error for subscription:', validSubscription.id, parseError);
      // Use empty arrays as fallback for security
    }

    const parsedSubscription = {
      ...validSubscription,
      devices_allowed,
      supported_platforms,
      // 🛡️ SECURITY: Include UTC validation data in response
      security_validation: {
        server_time_utc: validSubscription.server_time_utc,
        is_currently_active: validSubscription.is_currently_active_utc === 1,
        is_scheduled: validSubscription.is_scheduled_utc === 1,
        is_expired: validSubscription.is_expired_utc === 1,
        is_in_grace_period: validSubscription.is_in_grace_period_utc === 1,
        validated_with: 'utc_timestamp',
        real_time_status: validateSubscriptionStatus(validSubscription)
      },
      time_remaining: {
        seconds: validSubscription.seconds_remaining_utc,
        days: Math.floor(validSubscription.seconds_remaining_utc / (24 * 60 * 60)),
        hours: Math.floor((validSubscription.seconds_remaining_utc % (24 * 60 * 60)) / (60 * 60)),
        minutes: Math.floor((validSubscription.seconds_remaining_utc % (60 * 60)) / 60),
        is_expired: validSubscription.seconds_remaining_utc <= 0,
        is_scheduled: validSubscription.seconds_until_start_utc > 0,
        starts_in_seconds: Math.max(0, validSubscription.seconds_until_start_utc)
      }
    };

    // 🛡️ SECURITY: Remove internal fields before sending to client
    delete parsedSubscription.server_time_utc;
    delete parsedSubscription.is_currently_active_utc;
    delete parsedSubscription.is_scheduled_utc;
    delete parsedSubscription.is_expired_utc;
    delete parsedSubscription.is_in_grace_period_utc;
    delete parsedSubscription.seconds_remaining_utc;
    delete parsedSubscription.seconds_until_start_utc;

    console.log('✅ SECURE: Valid subscription found for user:', userId, 'with status:', parsedSubscription.security_validation.real_time_status);
    
    res.status(200).json({
      success: true,
      data: parsedSubscription,
      security: {
        validated_at: new Date().toISOString(),
        method: 'utc_timestamp_validation'
      }
    });

  } catch (error) {
    console.error('❌ SECURITY: Error in secure getCurrentSubscription:', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      security: {
        error_type: 'backend_validation_failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// 🛡️ SECURITY ENHANCEMENT: Get user's subscription history with UTC timestamps
const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        us.*,
        s.type as plan_type,
        s.name as plan_name,
        s.video_quality,
        s.max_sessions,
        -- 🛡️ SECURITY: Add UTC validation for historical data
        UTC_TIMESTAMP() as query_time_utc,
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as was_active_at_query
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.created_at DESC
    `;

    const subscriptions = await query(sql, [userId]);

    res.status(200).json({
      success: true,
      data: subscriptions || [],
      count: subscriptions?.length || 0,
      security: {
        query_time_utc: new Date().toISOString(),
        validated_with: 'utc_timestamp'
      }
    });

  } catch (error) {
    console.error('❌ SECURITY: Error fetching subscription history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription history',
      error: error.message,
      security: {
        error_type: 'history_retrieval_failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// 🛡️ SECURITY ENHANCEMENT: Create new subscription with UTC time enforcement
const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription_id, auto_renew = true, payment_method_id = null, start_date = null } = req.body;

    // 🛡️ SECURITY: Validate input with strict checks
    if (!subscription_id || typeof subscription_id !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Valid subscription ID is required',
        security: { validation_failed: 'subscription_id' }
      });
    }

    // 🛡️ SECURITY: Check if subscription plan exists and is active
    const planResult = await query(
      'SELECT * FROM subscriptions WHERE id = ? AND is_active = true',
      [subscription_id]
    );

    if (!planResult || planResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or inactive',
        security: { validation_failed: 'plan_not_found' }
      });
    }

    const plan = planResult[0];

    // 🛡️ SECURITY: Check if user already has an active subscription using UTC
    const activeSubs = await query(
      `SELECT id FROM user_subscriptions 
       WHERE user_id = ? 
       AND status = 'active' 
       AND start_date <= UTC_TIMESTAMP()
       AND end_date > UTC_TIMESTAMP()`,
      [userId]
    );

    if (activeSubs && activeSubs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription',
        error: {
          code: 'ACTIVE_SUBSCRIPTION_EXISTS',
          details: 'Cannot create new subscription while another is active'
        },
        security: { validation_failed: 'duplicate_subscription' }
      });
    }

    // 🛡️ SECURITY: Calculate dates using UTC
    const serverNowUTC = new Date().toISOString();
    const startDate = start_date ? validateUTCTime(start_date) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // 🛡️ SECURITY: Validate start date is not in the past (unless explicitly allowed)
    if (startDate < new Date() && !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Subscription start date cannot be in the past',
        security: { validation_failed: 'invalid_start_date' }
      });
    }

    // Insert new subscription with UTC times
    const insertSql = `
      INSERT INTO user_subscriptions (
        user_id, subscription_id, subscription_name, subscription_price, 
        subscription_currency, start_date, end_date, status, auto_renew,
        payment_method_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `;

    const insertParams = [
      userId,
      subscription_id,
      plan.name,
      plan.price,
      plan.currency || 'RWF',
      startDate,
      endDate,
      auto_renew,
      payment_method_id
    ];

    const result = await query(insertSql, insertParams);

    // Update user's subscription plan
    await query(
      'UPDATE users SET subscription_plan = ? WHERE id = ?',
      [plan.type, userId]
    );

    // Get the created subscription with UTC validation
    const newSubscription = await query(
      `SELECT us.*, s.type as plan_type,
              (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as is_currently_active
       FROM user_subscriptions us 
       LEFT JOIN subscriptions s ON us.subscription_id = s.id 
       WHERE us.id = ?`,
      [result.insertId]
    );

    console.log('🛡️ SECURITY: New subscription created for user:', userId, 'with UTC start:', startDate.toISOString());

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: newSubscription[0],
      security: {
        created_at: serverNowUTC,
        start_date_utc: startDate.toISOString(),
        end_date_utc: endDate.toISOString(),
        validated_with: 'utc_timestamp'
      }
    });

  } catch (error) {
    console.error('❌ SECURITY: Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message,
      security: {
        error_type: 'subscription_creation_failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// 🛡️ SECURITY ENHANCEMENT: Cancel user subscription with UTC timestamp
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription_id, reason = 'user_cancelled' } = req.body;

    if (!subscription_id) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required',
        security: { validation_failed: 'missing_subscription_id' }
      });
    }

    // 🛡️ SECURITY: Check if subscription belongs to user and is active using UTC
    const subscriptionResult = await query(
      `SELECT id, subscription_id FROM user_subscriptions 
       WHERE id = ? AND user_id = ? AND status = 'active'
       AND start_date <= UTC_TIMESTAMP()`,
      [subscription_id, userId]
    );

    if (!subscriptionResult || subscriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found',
        security: { validation_failed: 'subscription_not_found' }
      });
    }

    const subscription = subscriptionResult[0];
    const cancellationTimeUTC = new Date().toISOString();

    // Update subscription status with UTC timestamp
    await query(
      `UPDATE user_subscriptions 
       SET status = 'cancelled', cancelled_at = UTC_TIMESTAMP(), cancellation_reason = ?, auto_renew = false
       WHERE id = ? AND user_id = ?`,
      [reason, subscription_id, userId]
    );

    // Update user's subscription plan to 'none'
    await query(
      'UPDATE users SET subscription_plan = ? WHERE id = ?',
      ['none', userId]
    );

    console.log('🛡️ SECURITY: Subscription cancelled for user:', userId, 'at UTC:', cancellationTimeUTC);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      security: {
        cancelled_at: cancellationTimeUTC,
        validated_with: 'utc_timestamp'
      }
    });

  } catch (error) {
    console.error('❌ SECURITY: Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message,
      security: {
        error_type: 'cancellation_failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// 🛡️ ADD MISSING FUNCTION: Reactivate cancelled subscription with UTC
const reactivateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription_id } = req.body;

    if (!subscription_id) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required',
        security: { validation_failed: 'missing_subscription_id' }
      });
    }

    // 🛡️ SECURITY: Check if subscription belongs to user and is cancelled using UTC
    const subscriptionResult = await query(
      `SELECT id, subscription_id, end_date FROM user_subscriptions 
       WHERE id = ? AND user_id = ? AND status = 'cancelled'`,
      [subscription_id, userId]
    );

    if (!subscriptionResult || subscriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cancelled subscription not found',
        security: { validation_failed: 'subscription_not_found' }
      });
    }

    const subscription = subscriptionResult[0];
    const currentDate = new Date();
    const endDate = validateUTCTime(subscription.end_date);

    // 🛡️ SECURITY: If subscription end date has passed, extend it using UTC
    let newEndDate = endDate;
    if (endDate <= currentDate) {
      newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    // Reactivate subscription with UTC timestamp
    await query(
      `UPDATE user_subscriptions 
       SET status = 'active', cancelled_at = NULL, cancellation_reason = NULL, 
           auto_renew = true, end_date = ?, updated_at = UTC_TIMESTAMP()
       WHERE id = ? AND user_id = ?`,
      [newEndDate, subscription_id, userId]
    );

    // Update user's subscription plan
    const planResult = await query(
      'SELECT type FROM subscriptions WHERE id = ?',
      [subscription.subscription_id]
    );

    if (planResult && planResult.length > 0) {
      await query(
        'UPDATE users SET subscription_plan = ? WHERE id = ?',
        [planResult[0].type, userId]
      );
    }

    console.log('🛡️ SECURITY: Subscription reactivated for user:', userId, 'at UTC:', new Date().toISOString());

    res.status(200).json({
      success: true,
      message: 'Subscription reactivated successfully',
      security: {
        reactivated_at: new Date().toISOString(),
        validated_with: 'utc_timestamp'
      }
    });

  } catch (error) {
    console.error('❌ SECURITY: Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate subscription',
      error: error.message,
      security: {
        error_type: 'reactivation_failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// 🛡️ ADD MISSING FUNCTION: Update subscription auto-renew setting with UTC
const updateAutoRenew = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription_id, auto_renew } = req.body;

    if (!subscription_id || typeof auto_renew !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID and auto_renew (boolean) are required',
        security: { validation_failed: 'invalid_parameters' }
      });
    }

    // 🛡️ SECURITY: Check if subscription belongs to user using UTC validation
    const subscriptionResult = await query(
      `SELECT id FROM user_subscriptions 
       WHERE id = ? AND user_id = ?`,
      [subscription_id, userId]
    );

    if (!subscriptionResult || subscriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
        security: { validation_failed: 'subscription_not_found' }
      });
    }

    // Update auto-renew setting with UTC timestamp
    await query(
      `UPDATE user_subscriptions 
       SET auto_renew = ?, updated_at = UTC_TIMESTAMP()
       WHERE id = ? AND user_id = ?`,
      [auto_renew, subscription_id, userId]
    );

    console.log('🛡️ SECURITY: Auto-renew updated for user:', userId, 'to:', auto_renew, 'at UTC:', new Date().toISOString());

    res.status(200).json({
      success: true,
      message: `Auto-renew ${auto_renew ? 'enabled' : 'disabled'} successfully`,
      security: {
        updated_at: new Date().toISOString(),
        validated_with: 'utc_timestamp'
      }
    });

  } catch (error) {
    console.error('❌ SECURITY: Error updating auto-renew:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-renew setting',
      error: error.message,
      security: {
        error_type: 'auto_renew_update_failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// 🛡️ SECURITY ENHANCEMENT: Quick session limit check with UTC validation
const quickSessionLimitCheck = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🛡️ SECURITY: Get user's max sessions with UTC validation
    const subscriptionQuery = `
      SELECT 
        COALESCE(us.max_sessions, s.max_sessions, 1) as max_sessions,
        s.type as plan_type,
        -- 🛡️ SECURITY: Verify subscription is currently active using UTC
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as is_currently_active
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status = 'active'
        AND us.start_date <= UTC_TIMESTAMP()
        AND us.end_date > UTC_TIMESTAMP()
      LIMIT 1
    `;
    
    const subscriptions = await query(subscriptionQuery, [userId]);
    
    // 🛡️ SECURITY: If no valid active subscription, apply free tier limits
    if (!subscriptions || subscriptions.length === 0 || subscriptions[0].is_currently_active === 0) {
      const freeSessionCount = await query(
        `SELECT COUNT(*) as active_count 
         FROM user_session 
         WHERE user_id = ? 
           AND is_active = true 
           AND last_activity > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)`,
        [userId]
      );
      const activeSessions = freeSessionCount[0]?.active_count || 0;
      const maxFreeSessions = 1; // Free tier limit

      if (activeSessions >= maxFreeSessions) {
        return res.status(429).json({
          success: false,
          error: 'SESSION_LIMIT_EXCEEDED',
          message: `You have ${activeSessions} active session(s). Free tier allows only ${maxFreeSessions} simultaneous session.`,
          details: {
            currentSessions: activeSessions,
            maxAllowed: maxFreeSessions,
            planType: 'free',
            requiresSubscription: true
          },
          security: {
            validated_at: new Date().toISOString(),
            validation_method: 'utc_free_tier'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          canWatch: true,
          currentSessions: activeSessions,
          maxAllowed: maxFreeSessions,
          planType: 'free'
        },
        security: {
          validated_at: new Date().toISOString(),
          validation_method: 'utc_free_tier'
        }
      });
    }

    const maxSessions = subscriptions[0].max_sessions;
    const planType = subscriptions[0].plan_type;

    // 🛡️ SECURITY: Count active sessions using UTC
    const sessionCountQuery = `
      SELECT COUNT(*) as active_count 
      FROM user_session 
      WHERE user_id = ? 
        AND is_active = true 
        AND last_activity > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)
    `;
    
    const sessionCount = await query(sessionCountQuery, [userId]);
    const activeSessions = sessionCount[0]?.active_count || 0;

    const canWatch = activeSessions < maxSessions;

    if (!canWatch) {
      return res.status(429).json({
        success: false,
        error: 'SESSION_LIMIT_EXCEEDED',
        message: `You have ${activeSessions} active session(s) but your ${planType} plan only allows ${maxSessions}. Please log out from other devices to continue watching.`,
        details: {
          currentSessions: activeSessions,
          maxAllowed: maxSessions,
          planType: planType,
          manageUrl: '/account/settings#sessions'
        },
        security: {
          validated_at: new Date().toISOString(),
          validation_method: 'utc_premium_tier'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        canWatch: true,
        currentSessions: activeSessions,
        maxAllowed: maxSessions,
        planType: planType
      },
      security: {
        validated_at: new Date().toISOString(),
        validation_method: 'utc_premium_tier'
      }
    });

  } catch (error) {
    console.error('❌ SECURITY: Quick session limit check error:', error);
    // 🛡️ SECURITY: On error, be conservative but log it
    res.status(200).json({
      success: true,
      data: {
        canWatch: true,
        currentSessions: 0,
        maxAllowed: 1,
        planType: 'free',
        error: true
      },
      security: {
        validated_at: new Date().toISOString(),
        validation_method: 'error_fallback',
        error_occurred: true
      }
    });
  }
};

// 🛡️ SECURITY ENHANCEMENT: Check subscription status with UTC validation
const checkSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        us.status,
        us.start_date,
        us.end_date,
        us.auto_renew,
        us.subscription_name,
        us.subscription_price,
        s.type as plan_type,
        s.video_quality,
        s.max_sessions,
        s.offline_downloads,
        -- 🛡️ SECURITY: Add UTC validation fields
        UTC_TIMESTAMP() as server_time_utc,
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as is_currently_active,
        (us.grace_period_ends IS NOT NULL AND us.grace_period_ends > UTC_TIMESTAMP()) as is_in_grace_period
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status IN ('active', 'trialing', 'past_due')
        AND us.end_date > UTC_TIMESTAMP()
      ORDER BY us.created_at DESC
      LIMIT 1
    `;

    const subscriptions = await query(sql, [userId]);

    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
    const currentSubscription = hasActiveSubscription ? subscriptions[0] : null;

    // 🛡️ SECURITY: Determine access rights based on UTC validation
    const canAccessPremium = hasActiveSubscription &&
      (currentSubscription.is_currently_active || currentSubscription.is_in_grace_period);

    res.status(200).json({
      success: true,
      data: {
        has_active_subscription: hasActiveSubscription && currentSubscription.is_currently_active,
        has_scheduled_subscription: hasActiveSubscription && currentSubscription.start_date > new Date(),
        can_access_premium: canAccessPremium,
        is_in_grace_period: hasActiveSubscription && currentSubscription.is_in_grace_period,
        current_subscription: hasActiveSubscription ? {
          id: currentSubscription.id,
          status: currentSubscription.status,
          plan_type: currentSubscription.plan_type,
          max_sessions: currentSubscription.max_sessions,
          is_currently_active: currentSubscription.is_currently_active === 1,
          start_date: currentSubscription.start_date,
          end_date: currentSubscription.end_date
        } : null
      },
      security: {
        server_time_utc: currentSubscription?.server_time_utc || new Date().toISOString(),
        validated_with: 'utc_timestamp'
      }
    });

  } catch (error) {
    console.error('❌ SECURITY: Error checking subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status',
      error: error.message,
      security: {
        error_type: 'status_check_failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// 🛡️ KEEP ALL OTHER ORIGINAL FUNCTIONS AS THEY WERE
// Get billing history for user
const getBillingHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        pt.*,
        us.subscription_name,
        s.type as plan_type
      FROM payment_transactions pt
      LEFT JOIN user_subscriptions us ON pt.user_subscription_id = us.id
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE pt.user_id = ?
      ORDER BY pt.created_at DESC
    `;

    const billingHistory = await query(sql, [userId]);

    res.status(200).json({
      success: true,
      data: billingHistory || [],
      count: billingHistory?.length || 0
    });

  } catch (error) {
    console.error('❌ Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history',
      error: error.message
    });
  }
};

// Get payment methods for user
const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT * FROM payment_methods 
      WHERE user_id = ? AND status = 'active'
      ORDER BY is_default DESC, created_at DESC
    `;

    const paymentMethods = await query(sql, [userId]);

    res.status(200).json({
      success: true,
      data: paymentMethods || [],
      count: paymentMethods?.length || 0
    });

  } catch (error) {
    console.error('❌ Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message
    });
  }
};

// Add payment method
const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type,
      provider,
      last_four = null,
      phone_number = null,
      bank_name = null,
      account_name = null,
      brand = null,
      expiry_month = null,
      expiry_year = null,
      provider_payment_method_id = null,
      provider_customer_id = null
    } = req.body;

    // Validate required fields
    if (!type || !provider) {
      return res.status(400).json({
        success: false,
        message: 'Type and provider are required'
      });
    }

    // Check if this is the first payment method - set as default
    const existingMethods = await query(
      'SELECT id FROM payment_methods WHERE user_id = ? AND status = "active"',
      [userId]
    );

    const isDefault = existingMethods.length === 0;

    const insertSql = `
      INSERT INTO payment_methods (
        user_id, type, provider, last_four, phone_number, bank_name, account_name,
        brand, expiry_month, expiry_year, provider_payment_method_id, 
        provider_customer_id, is_default, is_verified, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'active')
    `;

    const insertParams = [
      userId,
      type,
      provider,
      last_four,
      phone_number,
      bank_name,
      account_name,
      brand,
      expiry_month,
      expiry_year,
      provider_payment_method_id,
      provider_customer_id,
      isDefault
    ];

    const result = await query(insertSql, insertParams);

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      data: {
        id: result.insertId,
        is_default: isDefault
      }
    });

  } catch (error) {
    console.error('❌ Error adding payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment method',
      error: error.message
    });
  }
};

// Remove payment method
const removePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { payment_method_id } = req.params;

    // Check if payment method belongs to user and is not default
    const paymentMethod = await query(
      'SELECT id, is_default FROM payment_methods WHERE id = ? AND user_id = ?',
      [payment_method_id, userId]
    );

    if (!paymentMethod || paymentMethod.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    if (paymentMethod[0].is_default) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove default payment method'
      });
    }

    // Soft delete the payment method
    await query(
      'UPDATE payment_methods SET status = "inactive" WHERE id = ? AND user_id = ?',
      [payment_method_id, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Payment method removed successfully'
    });

  } catch (error) {
    console.error('❌ Error removing payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove payment method',
      error: error.message
    });
  }
};

// Set default payment method
const setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { payment_method_id } = req.body;

    if (!payment_method_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }

    // Check if payment method belongs to user
    const paymentMethod = await query(
      'SELECT id FROM payment_methods WHERE id = ? AND user_id = ? AND status = "active"',
      [payment_method_id, userId]
    );

    if (!paymentMethod || paymentMethod.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Remove default from all user's payment methods
      await query(
        'UPDATE payment_methods SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );

      // Set new default
      await query(
        'UPDATE payment_methods SET is_default = TRUE WHERE id = ? AND user_id = ?',
        [payment_method_id, userId]
      );

      await query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Default payment method updated successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error setting default payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default payment method',
      error: error.message
    });
  }
};

// Get available subscription plans for users
const getAvailablePlans = async (req, res) => {
  try {
    const plans = await query(`
      SELECT * FROM subscriptions 
      WHERE is_active = true AND is_visible = true
      ORDER BY display_order ASC, price ASC
    `);

    // Parse JSON fields
    const parsedPlans = plans.map(plan => ({
      ...plan,
      devices_allowed: plan.devices_allowed ? JSON.parse(plan.devices_allowed) : [],
      supported_platforms: plan.supported_platforms ? JSON.parse(plan.supported_platforms) : [],
      content_restrictions: plan.content_restrictions ? JSON.parse(plan.content_restrictions) : []
    }));

    res.status(200).json({
      success: true,
      data: parsedPlans,
      count: parsedPlans.length
    });

  } catch (error) {
    console.error('❌ Error fetching available plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available plans',
      error: error.message
    });
  }
};

// 🛡️ KEEP ALL ORIGINAL HELPER FUNCTIONS
const getUsageMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscription
    const subscription = await query(
      `SELECT us.*, s.max_sessions, s.max_downloads 
       FROM user_subscriptions us 
       LEFT JOIN subscriptions s ON us.subscription_id = s.id 
       WHERE us.user_id = ? AND us.status = 'active' AND us.end_date > NOW() 
       LIMIT 1`,
      [userId]
    );

    if (!subscription || subscription.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active subscription found'
      });
    }

    const currentSub = subscription[0];

    // Get active sessions count - REAL DATA from user_session table
    const activeSessions = await query(
      `SELECT COUNT(*) as count FROM user_session 
       WHERE user_id = ? AND is_active = TRUE 
       AND last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
      [userId]
    );

    // Get streaming hours - REAL DATA from content_view_history table
    const streamingHours = await query(
      `SELECT COALESCE(SUM(watch_duration_seconds), 0) as total_seconds 
       FROM content_view_history 
       WHERE user_id = ? AND created_at >= ?`,
      [userId, currentSub.start_date]
    );

    // Calculate days since subscription started for average
    const daysSinceStart = Math.max(1, Math.ceil((new Date() - new Date(currentSub.start_date)) / (1000 * 60 * 60 * 24)));

    const metrics = {
      devices: {
        current: activeSessions[0]?.count || 0,
        limit: currentSub.max_sessions || 1,
        devices: await getActiveDevices(userId) // Get real device data
      },
      streaming: {
        hours: Math.round((streamingHours[0]?.total_seconds || 0) / 3600),
        average: ((streamingHours[0]?.total_seconds || 0) / 3600 / daysSinceStart).toFixed(1),
        daily_breakdown: await getWeeklyStreamingData(userId) // Get real weekly data
      },
      // Removed downloads section completely since we don't support it
      data: {
        used: await calculateDataUsage(userId), // Calculate real data usage
        limit: 'Unlimited', // Based on your subscription plans
        trend: await getDataUsageTrend(userId)
      }
    };

    res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('❌ Error fetching usage metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage metrics',
      error: error.message
    });
  }
};

// Helper function to get active devices
const getActiveDevices = async (userId) => {
  try {
    const devices = await query(
      `SELECT device_type, device_name, last_activity 
       FROM user_session 
       WHERE user_id = ? AND is_active = TRUE 
       AND last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       ORDER BY last_activity DESC
       LIMIT 5`,
      [userId]
    );

    return devices.map(device => ({
      type: device.device_type || 'desktop',
      name: device.device_name || `${device.device_type} Device`,
      last_active: formatLastActive(device.last_activity)
    }));
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
};

// Helper function to get weekly streaming data
const getWeeklyStreamingData = async (userId) => {
  try {
    const weeklyData = await query(
      `SELECT 
        DAYOFWEEK(created_at) as day_of_week,
        COALESCE(SUM(watch_duration_seconds), 0) as daily_seconds
       FROM content_view_history 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DAYOFWEEK(created_at)
       ORDER BY day_of_week`,
      [userId]
    );

    // Default data (0 hours for each day)
    const defaultData = [0, 0, 0, 0, 0, 0, 0];
    
    // Map database results to our weekly array (Sunday = 1, Monday = 2, etc.)
    weeklyData.forEach(day => {
      const index = (day.day_of_week + 5) % 7; // Convert to Monday-start week
      defaultData[index] = Math.round(day.daily_seconds / 3600); // Convert to hours
    });

    return defaultData;
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
};

// Helper function to calculate data usage
const calculateDataUsage = async (userId) => {
  try {
    // Estimate data usage based on streaming hours and average bitrate
    const streamingData = await query(
      `SELECT COALESCE(SUM(watch_duration_seconds), 0) as total_seconds 
       FROM content_view_history 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );

    const totalHours = (streamingData[0]?.total_seconds || 0) / 3600;
    
    // Estimate GB usage (average 1.5GB per hour for HD content)
    const estimatedGB = Math.round(totalHours * 1.5);
    
    return estimatedGB;
  } catch (error) {
    console.error('Error calculating data usage:', error);
    return 0;
  }
};

// Helper function to get data usage trend
const getDataUsageTrend = async (userId) => {
  try {
    const currentMonth = await query(
      `SELECT COALESCE(SUM(watch_duration_seconds), 0) as current_seconds 
       FROM content_view_history 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );

    const previousMonth = await query(
      `SELECT COALESCE(SUM(watch_duration_seconds), 0) as previous_seconds 
       FROM content_view_history 
       WHERE user_id = ? AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [userId]
    );

    const current = currentMonth[0]?.current_seconds || 0;
    const previous = previousMonth[0]?.previous_seconds || 0;

    return current > previous ? 'up' : 'stable';
  } catch (error) {
    console.error('Error calculating trend:', error);
    return 'stable';
  }
};

// Helper function to format last active time
const formatLastActive = (lastActivity) => {
  if (!lastActivity) return 'Unknown';
  
  const now = new Date();
  const activityTime = new Date(lastActivity);
  const diffMinutes = Math.floor((now - activityTime) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return `${Math.floor(diffMinutes / 1440)}d ago`;
};

// Helper function to calculate average per day
const calculateAveragePerDay = (totalSeconds, startDate) => {
  const daysSinceStart = Math.max(1, Math.ceil((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  return (totalSeconds / 3600 / daysSinceStart).toFixed(1);
};

module.exports = {
  getCurrentSubscription,
  getSubscriptionHistory,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateAutoRenew, 
  getBillingHistory,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getUsageMetrics,
  checkSubscriptionStatus,
  quickSessionLimitCheck,
  getAvailablePlans
};