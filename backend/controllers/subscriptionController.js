const { query } = require("../config/dbConfig");

// 🛡️ Enhanced subscription controller with server-side time validation
class EnhancedSubscriptionController {

  /**
   * 🛡️ Format time remaining for display
   */
  static formatTimeRemaining(secondsRemaining, secondsUntilStart) {
    if (secondsUntilStart > 0) {
      const days = Math.floor(secondsUntilStart / (24 * 60 * 60));
      const hours = Math.floor((secondsUntilStart % (24 * 60 * 60)) / (60 * 60));

      if (days > 0) {
        return `Starts in ${days} day${days === 1 ? '' : 's'}${hours > 0 ? `, ${hours}h` : ''}`;
      } else if (hours > 0) {
        return `Starts in ${hours}h`;
      } else {
        return 'Starts soon';
      }
    }

    if (secondsRemaining <= 0) {
      return 'Expired';
    }

    const days = Math.floor(secondsRemaining / (24 * 60 * 60));
    const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);

    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'}${days <= 3 ? `, ${hours}h` : ''}`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

// 🛡️ Get current user's active subscription with FAMILY PLAN support
const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
  
    console.log('🔍 getCurrentSubscription called for user:', userId, {
      is_family_member: req.user.is_family_member,
      has_family_plan_access: req.user.has_family_plan_access
    });

    // 🆕 CHECK FOR FAMILY PLAN ACCESS FIRST
    if (req.user.has_family_plan_access) {
      console.log('🎯 User has family plan access, returning family plan data');
      
      const familyPlanData = {
        id: 'family_plan',
        subscription_name: 'Family Plan',
        plan_type: 'family',
        is_family_plan: true,
        family_owner_id: req.user.family_owner_id,
        real_time_status: 'active',
        time_remaining: {
          seconds: 31536000, // 1 year in seconds
          days: 365,
          hours: 0,
          minutes: 0,
          is_expired: false,
          is_scheduled: false,
          formatted: 'Family Plan Active'
        },
        is_currently_active: true,
        is_scheduled: false,
        is_expired: false,
        is_in_grace_period: false,
        video_quality: 'UHD',
        max_sessions: 5,
        offline_downloads: true,
        max_downloads: -1,
        simultaneous_downloads: 3,
        max_profiles: 7,
        parental_controls: true,
        early_access: true,
        exclusive_content: true,
        devices_allowed: JSON.stringify(['mobile', 'tablet', 'desktop', 'smarttv', 'gaming']),
        supported_platforms: JSON.stringify(['web', 'mobile', 'tablet', 'smarttv', 'gaming'])
      };

      return res.status(200).json({
        success: true,
        data: familyPlanData
      });
    }

    // 🛡️ COMPREHENSIVE QUERY: Handle all possible subscription states
    const sql = `
      SELECT 
        us.*,
        s.type as plan_type,
        s.video_quality,
        s.max_sessions,
        s.offline_downloads,
        s.max_downloads,
        s.simultaneous_downloads,
        s.max_profiles,
        s.parental_controls,
        s.early_access,
        s.exclusive_content,
        s.devices_allowed,
        s.supported_platforms,
        
        -- 🛡️ COMPREHENSIVE REAL-TIME STATUS CALCULATION
        CASE 
          -- 🚫 EXPIRED: End date has passed (regardless of status)
          WHEN us.end_date <= UTC_TIMESTAMP() THEN 'expired'
          
          -- 📅 SCHEDULED: Start date is in future
          WHEN us.start_date > UTC_TIMESTAMP() THEN 'scheduled'
          
          -- ⏳ GRACE PERIOD: In grace period (past due but grace period active)
          WHEN us.status = 'past_due' AND us.grace_period_ends > UTC_TIMESTAMP() THEN 'grace_period'
          
          -- 🔄 TRIALING: Active trial period
          WHEN us.status = 'trialing' AND us.end_date > UTC_TIMESTAMP() THEN 'trialing'
          
          -- ✅ ACTIVE: Currently active and within date range
          WHEN us.status = 'active' AND us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP() THEN 'active'
          
          -- ❌ INVALID: Any other case (shouldn't happen)
          ELSE 'invalid'
        END as real_time_status,
        
        -- 🛡️ TIME CALCULATIONS
        GREATEST(0, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), us.end_date)) as seconds_remaining,
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), us.start_date) as seconds_until_start,
        
        -- 🛡️ BOOLEAN FLAGS FOR EASY CHECKING
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as is_currently_active,
        (us.start_date > UTC_TIMESTAMP()) as is_scheduled,
        (us.end_date <= UTC_TIMESTAMP()) as is_expired,
        (us.status = 'past_due' AND us.grace_period_ends > UTC_TIMESTAMP()) as is_in_grace_period,
        
        -- 🛡️ DEBUG INFO
        UTC_TIMESTAMP() as server_time,
        us.start_date as subscription_start,
        us.end_date as subscription_end,
        us.status as subscription_status
        
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status IN ('active', 'trialing', 'past_due')
      ORDER BY 
        -- 🎯 PRIORITY: Currently active > Scheduled > Expired/Grace
        CASE 
          WHEN us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP() THEN 0  -- Currently active
          WHEN us.start_date > UTC_TIMESTAMP() THEN 1  -- Scheduled
          WHEN us.status = 'past_due' AND us.grace_period_ends > UTC_TIMESTAMP() THEN 2  -- Grace period
          ELSE 3  -- Expired/Invalid
        END,
        us.created_at DESC
      LIMIT 3
    `;

    const subscriptions = await query(sql, [userId]);

    // 🛡️ FILTER LOGIC: Only return subscriptions that should grant CURRENT access
    let validSubscription = null;
    
    if (subscriptions && subscriptions.length > 0) {
      validSubscription = subscriptions.find(sub => 
        sub.real_time_status === 'active' || 
        sub.real_time_status === 'grace_period' ||
        sub.real_time_status === 'trialing'
      );
    }

    // 🛡️ RESPONSE HANDLING
    if (!validSubscription) {
      console.log('❌ No valid current subscription found for user:', userId);
      
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active subscription found',
        debug: {
          total_subscriptions: subscriptions?.length || 0,
          available_states: subscriptions?.map(sub => sub.real_time_status) || [],
          server_time: new Date().toISOString()
        }
      });
    }

    // 🛡️ ENHANCE THE VALID SUBSCRIPTION OBJECT
    const enhancedSubscription = {
      ...validSubscription,
      real_time_status: validSubscription.real_time_status,
      time_remaining: {
        seconds: validSubscription.seconds_remaining,
        days: Math.floor(validSubscription.seconds_remaining / (24 * 60 * 60)),
        hours: Math.floor((validSubscription.seconds_remaining % (24 * 60 * 60)) / (60 * 60)),
        minutes: Math.floor((validSubscription.seconds_remaining % (60 * 60)) / 60),
        is_expired: validSubscription.seconds_remaining <= 0,
        is_scheduled: validSubscription.seconds_until_start > 0,
        starts_in_seconds: Math.max(0, validSubscription.seconds_until_start),
        formatted: formatTimeRemaining(validSubscription.seconds_remaining, validSubscription.seconds_until_start)
      },
      is_currently_active: validSubscription.is_currently_active === 1,
      is_scheduled: validSubscription.is_scheduled === 1,
      is_expired: validSubscription.is_expired === 1,
      is_in_grace_period: validSubscription.is_in_grace_period === 1,
      devices_allowed: validSubscription.devices_allowed ? 
        JSON.parse(validSubscription.devices_allowed) : [],
      supported_platforms: validSubscription.supported_platforms ? 
        JSON.parse(validSubscription.supported_platforms) : []
    };

    res.status(200).json({
      success: true,
      data: enhancedSubscription
    });

  } catch (error) {
    console.error('❌ Error in getCurrentSubscription:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🛡️ Real-time subscription status check with FAMILY PLAN support
const checkSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🆕 CHECK FOR FAMILY PLAN ACCESS FIRST
    if (req.user.has_family_plan_access) {
      return res.status(200).json({
        success: true,
        data: {
          has_active_subscription: true,
          has_scheduled_subscription: false,
          can_access_premium: true,
          is_in_grace_period: false,
          is_family_plan_access: true,
          current_subscription: {
            id: 'family_plan',
            status: 'active',
            plan_type: 'family',
            max_sessions: 5,
            is_currently_active: true,
            is_scheduled: false
          }
        }
      });
    }

    const sql = `
      SELECT 
        us.id,
        us.status,
        us.start_date,
        us.end_date,
        us.grace_period_ends,
        s.max_sessions,
        s.type as plan_type,
        -- 🛡️ Real-time active status based on SERVER UTC time
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as is_currently_active,
        -- 🛡️ Check if in grace period based on SERVER time
        (us.grace_period_ends IS NOT NULL AND us.grace_period_ends > UTC_TIMESTAMP()) as is_in_grace_period,
        -- 🛡️ Check if subscription is scheduled for future
        (us.start_date > UTC_TIMESTAMP()) as is_scheduled
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status IN ('active', 'trialing', 'past_due')
      ORDER BY 
        CASE 
          WHEN us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP() THEN 0
          WHEN us.start_date > UTC_TIMESTAMP() THEN 1
          ELSE 2
        END,
        us.created_at DESC
      LIMIT 1
    `;

    const subscriptions = await query(sql, [userId]);

    const hasSubscription = subscriptions && subscriptions.length > 0;
    const currentSubscription = hasSubscription ? subscriptions[0] : null;

    // 🛡️ Determine access rights based on SERVER time
    const canAccessPremium = hasSubscription &&
      (currentSubscription.is_currently_active || currentSubscription.is_in_grace_period);

    res.status(200).json({
      success: true,
      data: {
        has_active_subscription: hasSubscription && currentSubscription.is_currently_active,
        has_scheduled_subscription: hasSubscription && currentSubscription.is_scheduled,
        can_access_premium: canAccessPremium,
        is_in_grace_period: hasSubscription && currentSubscription.is_in_grace_period,
        is_family_plan_access: false,
        current_subscription: hasSubscription ? {
          id: currentSubscription.id,
          status: currentSubscription.status,
          plan_type: currentSubscription.plan_type,
          max_sessions: currentSubscription.max_sessions,
          is_currently_active: currentSubscription.is_currently_active === 1,
          is_scheduled: currentSubscription.is_scheduled === 1
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🛡️ Enhanced session limit check with FAMILY PLAN support
const quickSessionLimitCheck = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🆕 CHECK FOR FAMILY PLAN ACCESS FIRST
    if (req.user.has_family_plan_access) {
      const familySessionCount = await query(
        `SELECT COUNT(*) as active_count 
         FROM user_session 
         WHERE user_id = ? 
           AND is_active = true 
           AND session_mode IS NOT NULL  -- NEW: Only count sessions with mode selected
           AND last_activity > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)`,
        [userId]
      );
      
      const activeSessions = familySessionCount[0]?.active_count || 0;
      const maxFamilySessions = 3;

      if (activeSessions >= maxFamilySessions) {
        return res.status(429).json({
          success: false,
          error: 'SESSION_LIMIT_EXCEEDED',
          message: `You have ${activeSessions} active session(s). Family plan allows ${maxFamilySessions} simultaneous sessions.`,
          details: {
            currentSessions: activeSessions,
            maxAllowed: maxFamilySessions,
            planType: 'family',
            requiresSubscription: false
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          canWatch: true,
          currentSessions: activeSessions,
          maxAllowed: maxFamilySessions,
          planType: 'family',
          isFamilyPlan: true
        }
      });
    }

    // 🛡️ Get user's subscription with SERVER time validation
    const subscriptionQuery = `
      SELECT 
        COALESCE(us.max_sessions, s.max_sessions, 1) as max_sessions,
        s.type as plan_type,
        -- 🛡️ Verify subscription is currently active based on SERVER time
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

    // 🛡️ If no valid active subscription, apply free tier limits
    if (!subscriptions || subscriptions.length === 0 || subscriptions[0].is_currently_active === 0) {
      const freeSessionCount = await query(
        `SELECT COUNT(*) as active_count 
         FROM user_session 
         WHERE user_id = ? 
           AND is_active = true 
           AND session_mode IS NOT NULL  -- NEW: Only count sessions with mode selected
           AND last_activity > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)`,
        [userId]
      );
      const activeSessions = freeSessionCount[0]?.active_count || 0;
      const maxFreeSessions = 1;

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
        }
      });
    }

    const maxSessions = subscriptions[0].max_sessions;
    const planType = subscriptions[0].plan_type;

    // 🛡️ Count active sessions using SERVER time
    const sessionCountQuery = `
      SELECT COUNT(*) as active_count 
      FROM user_session 
      WHERE user_id = ? 
        AND is_active = true 
        AND session_mode IS NOT NULL  -- NEW: Only count sessions with mode selected
        AND last_activity > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)
    `;

    const sessionCount = await query(sessionCountQuery, [userId]);
    const activeSessions = sessionCount[0]?.active_count || 0;

    const canWatch = activeSessions < maxSessions;

    if (!canWatch) {
      return res.status(429).json({
        success: false,
        error: 'SESSION_LIMIT_EXCEEDED',
        message: `You have ${activeSessions} active session(s) but your ${planType} plan only allows ${maxSessions}.`,
        details: {
          currentSessions: activeSessions,
          maxAllowed: maxSessions,
          planType: planType,
          manageUrl: '/account/settings#sessions'
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
      }
    });

  } catch (error) {
    console.error('❌ Quick session limit check error:', error);
    // 🛡️ Fail-safe: Allow limited access on error but log it
    res.status(200).json({
      success: true,
      data: {
        canWatch: true,
        currentSessions: 0,
        maxAllowed: 1,
        planType: 'free',
        error: true
      }
    });
  }
};

// Helper function to format time remaining
const formatTimeRemaining = (secondsRemaining, secondsUntilStart) => {
  if (secondsUntilStart > 0) {
    const days = Math.floor(secondsUntilStart / (24 * 60 * 60));
    const hours = Math.floor((secondsUntilStart % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) {
      return `Starts in ${days} day${days === 1 ? '' : 's'}${hours > 0 ? `, ${hours}h` : ''}`;
    } else if (hours > 0) {
      return `Starts in ${hours}h`;
    } else {
      return 'Starts soon';
    }
  }

  if (secondsRemaining <= 0) {
    return 'Expired';
  }

  const days = Math.floor(secondsRemaining / (24 * 60 * 60));
  const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}${days <= 3 ? `, ${hours}h` : ''}`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Seed default subscription plans
const seedSubscriptionPlans = async (req, res) => {
  try {
    // Check if plans already exist
    const existingPlans = await query('SELECT id FROM subscriptions LIMIT 1');

    if (existingPlans.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Subscription plans already exist. Use update endpoints to modify plans.'
      });
    }

    const defaultPlans = [
      // Free Plan (Hidden from users)
      {
        name: 'Free Plan',
        type: 'free',
        price: 0,
        original_price: 0,
        description: 'Limited access to basic content with advertisements.',
        tagline: 'Get started with limited access',
        currency: 'RWF',
        devices_allowed: JSON.stringify(['mobile']),
        max_sessions: 1,
        max_devices_registered: 1,
        supported_platforms: JSON.stringify(['mobile']),
        video_quality: 'SD',
        max_video_bitrate: 1000,
        hdr_support: false,
        offline_downloads: false,
        max_downloads: 0,
        download_quality: 'SD',
        download_expiry_days: 0,
        simultaneous_downloads: 0,
        early_access: false,
        exclusive_content: false,
        content_restrictions: JSON.stringify(['premium', 'exclusive']),
        max_profiles: 1,
        parental_controls: false,
        display_order: 0,
        is_popular: false,
        is_featured: false,
        is_active: true,
        is_visible: false
      },
      // Mobile Plan (Visible)
      {
        name: 'Mobile Plan',
        type: 'mobile',
        price: 3000,
        original_price: 3000,
        description: 'Perfect for mobile viewers who want affordable access to Oliviuus on a single device.',
        tagline: 'Entertainment on the go',
        currency: 'RWF',
        devices_allowed: JSON.stringify(['mobile']),
        max_sessions: 1,
        max_devices_registered: 3,
        supported_platforms: JSON.stringify(['mobile']),
        video_quality: 'SD',
        max_video_bitrate: 2000,
        hdr_support: false,
        offline_downloads: false,
        max_downloads: 0,
        download_quality: 'SD',
        download_expiry_days: 30,
        simultaneous_downloads: 1,
        early_access: false,
        exclusive_content: false,
        content_restrictions: JSON.stringify(['premium']),
        max_profiles: 1,
        parental_controls: false,
        display_order: 1,
        is_popular: false,
        is_featured: false,
        is_active: true,
        is_visible: true
      },
      // Basic Plan (Visible)
      {
        name: 'Basic Plan',
        type: 'basic',
        price: 5000,
        original_price: 5000,
        description: 'The Basic Plan offers improved quality and flexibility for regular viewers.',
        tagline: 'Your daily dose of movies and series',
        currency: 'RWF',
        devices_allowed: JSON.stringify(['mobile', 'tablet', 'desktop']),
        max_sessions: 2,
        max_devices_registered: 5,
        supported_platforms: JSON.stringify(['web', 'mobile', 'tablet']),
        video_quality: 'HD',
        max_video_bitrate: 4000,
        hdr_support: false,
        offline_downloads: true,
        max_downloads: 10,
        download_quality: 'SD',
        download_expiry_days: 30,
        simultaneous_downloads: 1,
        early_access: false,
        exclusive_content: false,
        content_restrictions: JSON.stringify([]),
        max_profiles: 2,
        parental_controls: false,
        display_order: 2,
        is_popular: false,
        is_featured: false,
        is_active: true,
        is_visible: true
      },
      // Standard Plan (Visible)
      {
        name: 'Standard Plan',
        type: 'standard',
        price: 7000,
        original_price: 7000,
        description: 'Upgrade to the Standard Plan for better quality and flexibility across multiple devices.',
        tagline: 'Step up your viewing experience',
        currency: 'RWF',
        devices_allowed: JSON.stringify(['mobile', 'tablet', 'desktop', 'smarttv']),
        max_sessions: 3,
        max_devices_registered: 8,
        supported_platforms: JSON.stringify(['web', 'mobile', 'tablet', 'smarttv']),
        video_quality: 'FHD',
        max_video_bitrate: 8000,
        hdr_support: false,
        offline_downloads: true,
        max_downloads: -1, // unlimited
        download_quality: 'HD',
        download_expiry_days: 30,
        simultaneous_downloads: 2,
        early_access: true,
        exclusive_content: true,
        content_restrictions: JSON.stringify([]),
        max_profiles: 5,
        parental_controls: true,
        display_order: 3,
        is_popular: true,
        is_featured: false,
        is_active: true,
        is_visible: true
      },
      // Family Plan (Visible)
      {
        name: 'Family Plan',
        type: 'family',
        price: 10000,
        original_price: 10000,
        description: 'Our Premium Family Plan offers everything Oliviuus has to offer with the best quality.',
        tagline: 'The complete family entertainment experience',
        currency: 'RWF',
        devices_allowed: JSON.stringify(['mobile', 'tablet', 'desktop', 'smarttv', 'gaming']),
        max_sessions: 5,
        max_devices_registered: 15,
        supported_platforms: JSON.stringify(['web', 'mobile', 'tablet', 'smarttv', 'gaming']),
        video_quality: 'UHD',
        max_video_bitrate: 15000,
        hdr_support: true,
        offline_downloads: true,
        max_downloads: -1, // unlimited
        download_quality: 'FHD',
        download_expiry_days: 30,
        simultaneous_downloads: 3,
        early_access: true,
        exclusive_content: true,
        content_restrictions: JSON.stringify([]),
        max_profiles: 7,
        parental_controls: true,
        display_order: 4,
        is_popular: false,
        is_featured: true,
        is_active: true,
        is_visible: true
      },
      // Custom Plan (Hidden from users - for admin use)
      {
        name: 'Custom Plan',
        type: 'custom',
        price: 0,
        original_price: 0,
        description: 'Customizable plan for free trials, promotions, gifts, and enterprise solutions.',
        tagline: 'Flexible plan for special use cases',
        currency: 'RWF',
        devices_allowed: JSON.stringify(['mobile', 'tablet', 'desktop', 'smarttv', 'gaming']),
        max_sessions: 1,
        max_devices_registered: 1,
        supported_platforms: JSON.stringify(['web', 'mobile', 'tablet', 'smarttv', 'gaming']),
        video_quality: 'HD',
        max_video_bitrate: 4000,
        hdr_support: false,
        offline_downloads: false,
        max_downloads: 0,
        download_quality: 'SD',
        download_expiry_days: 0,
        simultaneous_downloads: 0,
        early_access: false,
        exclusive_content: false,
        content_restrictions: JSON.stringify([]),
        max_profiles: 1,
        parental_controls: false,
        display_order: 5,
        is_popular: false,
        is_featured: false,
        is_active: true,
        is_visible: false
      }
    ];

    // Insert all plans
    for (const plan of defaultPlans) {
      const sql = `
        INSERT INTO subscriptions (
          name, type, price, original_price, description, tagline, currency,
          devices_allowed, max_sessions, max_devices_registered, supported_platforms,
          video_quality, max_video_bitrate, hdr_support, offline_downloads, max_downloads,
          download_quality, download_expiry_days, simultaneous_downloads, early_access,
          exclusive_content, content_restrictions, max_profiles, parental_controls,
          display_order, is_popular, is_featured, is_active, is_visible
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        plan.name, plan.type, plan.price, plan.original_price, plan.description, plan.tagline, plan.currency,
        plan.devices_allowed, plan.max_sessions, plan.max_devices_registered, plan.supported_platforms,
        plan.video_quality, plan.max_video_bitrate, plan.hdr_support, plan.offline_downloads, plan.max_downloads,
        plan.download_quality, plan.download_expiry_days, plan.simultaneous_downloads, plan.early_access,
        plan.exclusive_content, plan.content_restrictions, plan.max_profiles, plan.parental_controls,
        plan.display_order, plan.is_popular, plan.is_featured, plan.is_active, plan.is_visible
      ];

      await query(sql, params);
    }

    res.status(201).json({
      success: true,
      message: 'Default subscription plans seeded successfully',
      data: {
        plans_created: defaultPlans.length,
        visible_plans: defaultPlans.filter(p => p.is_visible).map(p => ({ name: p.name, type: p.type, price: p.price })),
        hidden_plans: defaultPlans.filter(p => !p.is_visible).map(p => ({ name: p.name, type: p.type, price: p.price }))
      }
    });

  } catch (error) {
    console.error('Error seeding subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed subscription plans',
      error: error.message
    });
  }
};

// Reset subscription plans (delete all and reseed)
const resetSubscriptionPlans = async (req, res) => {
  try {
    // Delete all existing plans
    await query('DELETE FROM subscriptions');

    // Reseed plans
    return seedSubscriptionPlans(req, res);

  } catch (error) {
    console.error('Error resetting subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset subscription plans',
      error: error.message
    });
  }
};

// Get all subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    let plans;

    try {
      // Try to use display_order if it exists
      plans = await query(`
        SELECT * FROM subscriptions 
        WHERE is_active = true 
        ORDER BY display_order ASC
      `);
    } catch (orderError) {
      // If display_order doesn't exist, fall back to id ordering
      if (orderError.code === 'ER_BAD_FIELD_ERROR') {
        plans = await query(`
          SELECT * FROM subscriptions 
          WHERE is_active = true 
          ORDER BY id ASC
        `);
      } else {
        throw orderError;
      }
    }

    // Check if plans exists and has data
    if (!plans || plans.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: 'No subscription plans found'
      });
    }

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
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message
    });
  }
};

// Get subscription plan by ID
const getSubscriptionPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    const plans = await query('SELECT * FROM subscriptions WHERE id = ?', [planId]);

    if (!plans || plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    const plan = plans[0];
    // Parse JSON fields
    const parsedPlan = {
      ...plan,
      devices_allowed: plan.devices_allowed ? JSON.parse(plan.devices_allowed) : [],
      supported_platforms: plan.supported_platforms ? JSON.parse(plan.supported_platforms) : [],
      content_restrictions: plan.content_restrictions ? JSON.parse(plan.content_restrictions) : []
    };

    res.status(200).json({
      success: true,
      data: parsedPlan
    });

  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plan',
      error: error.message
    });
  }
};

// Update subscription plan
const updateSubscriptionPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    // Check if plan exists
    const existingPlans = await query('SELECT id FROM subscriptions WHERE id = ?', [planId]);
    if (!existingPlans || existingPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Build dynamic update query
    const allowedFields = [
      'name', 'type', 'price', 'original_price', 'description', 'tagline', 'currency',
      'devices_allowed', 'max_sessions', 'max_devices_registered', 'supported_platforms',
      'video_quality', 'max_video_bitrate', 'hdr_support', 'offline_downloads', 'max_downloads',
      'download_quality', 'download_expiry_days', 'simultaneous_downloads', 'early_access',
      'exclusive_content', 'content_restrictions', 'max_profiles', 'parental_controls',
      'display_order', 'is_popular', 'is_featured', 'is_active', 'is_visible'
    ];

    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);

        // Handle JSON fields
        if (['devices_allowed', 'supported_platforms', 'content_restrictions'].includes(key)) {
          updateValues.push(JSON.stringify(updateData[key]));
        } else {
          updateValues.push(updateData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateValues.push(planId);

    const sql = `UPDATE subscriptions SET ${updateFields.join(', ')}, updated_at = UTC_TIMESTAMP() WHERE id = ?`;

    await query(sql, updateValues);

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully'
    });

  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription plan',
      error: error.message
    });
  }
};

// Get user's subscription history
const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        us.*,
        s.type as plan_type,
        s.video_quality,
        s.max_sessions
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.created_at DESC
    `;

    const subscriptions = await query(sql, [userId]);

    res.status(200).json({
      success: true,
      data: subscriptions || [],
      count: subscriptions?.length || 0
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription history',
      error: error.message
    });
  }
};

// 🛡️ Create subscription with future start date support
const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription_id, auto_renew = true, start_date = null } = req.body;

    // Validate input
    if (!subscription_id) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    // Check if subscription plan exists and is active
    const planResult = await query(
      'SELECT * FROM subscriptions WHERE id = ? AND is_active = true',
      [subscription_id]
    );

    if (!planResult || planResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or inactive'
      });
    }

    const plan = planResult[0];

    // 🛡️ Check if user already has an active subscription using SERVER time
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
        }
      });
    }

    // 🛡️ Calculate dates using SERVER time
    const serverNow = new Date();
    const startDate = start_date ? new Date(start_date) : serverNow;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // 🛡️ Validate future start date is not too far in the future
    const maxFutureStartDays = 30; // Maximum 30 days in future
    const maxFutureStart = new Date(serverNow);
    maxFutureStart.setDate(maxFutureStart.getDate() + maxFutureStartDays);

    if (startDate > maxFutureStart) {
      return res.status(400).json({
        success: false,
        message: `Subscription start date cannot be more than ${maxFutureStartDays} days in the future`
      });
    }

    // Determine initial status based on start date
    const initialStatus = startDate > serverNow ? 'active' : 'active';

    // Insert new subscription
    const insertSql = `
      INSERT INTO user_subscriptions (
        user_id, subscription_id, subscription_name, subscription_price, 
        subscription_currency, start_date, end_date, status, auto_renew
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      userId,
      subscription_id,
      plan.name,
      plan.price,
      plan.currency || 'RWF',
      startDate,
      endDate,
      initialStatus,
      auto_renew
    ];

    const result = await query(insertSql, insertParams);

    // Get the created subscription with enhanced data
    const newSubscription = await query(
      `SELECT 
        us.*, 
        s.type as plan_type,
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as is_currently_active,
        (us.start_date > UTC_TIMESTAMP()) as is_scheduled
       FROM user_subscriptions us 
       LEFT JOIN subscriptions s ON us.subscription_id = s.id 
       WHERE us.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: startDate > serverNow ?
        'Subscription scheduled successfully' :
        'Subscription created successfully',
      data: {
        ...newSubscription[0],
        is_currently_active: newSubscription[0].is_currently_active === 1,
        is_scheduled: newSubscription[0].is_scheduled === 1
      }
    });

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel user subscription
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription_id, reason = 'user_cancelled' } = req.body;

    if (!subscription_id) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    // Check if subscription belongs to user and is active
    const subscriptionResult = await query(
      `SELECT id FROM user_subscriptions 
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      [subscription_id, userId]
    );

    if (!subscriptionResult || subscriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found'
      });
    }

    // Update subscription status
    await query(
      `UPDATE user_subscriptions 
       SET status = 'cancelled', cancelled_at = UTC_TIMESTAMP(), cancellation_reason = ?, auto_renew = false
       WHERE id = ? AND user_id = ?`,
      [reason, subscription_id, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
};

// Get available subscription plans for users (only visible ones)
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available plans',
      error: error.message
    });
  }
};

module.exports = {
  seedSubscriptionPlans,
  resetSubscriptionPlans,
  getSubscriptionPlans,
  getSubscriptionPlanById,
  updateSubscriptionPlan,
  getCurrentSubscription,
  getSubscriptionHistory,
  createSubscription,
  cancelSubscription,
  getAvailablePlans,
  checkSubscriptionStatus,
  quickSessionLimitCheck,
};