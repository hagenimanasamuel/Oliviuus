const { query } = require("../config/dbConfig");

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

    const sql = `UPDATE subscriptions SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
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



// Get current user's active subscription 
const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    // More flexible query that handles various subscription states
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
        s.exclusive_content
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND (
          (us.status = 'active' AND us.end_date > NOW()) OR
          (us.status = 'trialing' AND us.end_date > NOW()) OR
          (us.status = 'past_due' AND us.grace_period_ends > NOW())
        )
      ORDER BY us.created_at DESC
      LIMIT 1
    `;

    const subscriptions = await query(sql, [userId]);

    if (!subscriptions || subscriptions.length === 0) {
      const allUserSubs = await query(
        `SELECT id, status, start_date, end_date, subscription_name 
         FROM user_subscriptions 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [userId]
      );
      
      
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active subscription found',
        debug: {
          all_subscriptions: allUserSubs
        }
      });
    }

    const subscription = subscriptions[0];
    
    res.status(200).json({
      success: true,
      data: subscription
    });

  } catch (error) {
    console.error('❌ Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current subscription',
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

// Create new subscription for user
const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription_id, auto_renew = true } = req.body;

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

    // Check if user already has an active subscription
    const activeSubs = await query(
      `SELECT id FROM user_subscriptions 
       WHERE user_id = ? AND status = 'active' AND end_date > NOW()`,
      [userId]
    );

    if (activeSubs && activeSubs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // Insert new subscription WITHOUT payment_method_id
    const insertSql = `
      INSERT INTO user_subscriptions (
        user_id, subscription_id, subscription_name, subscription_price, 
        subscription_currency, start_date, end_date, status, auto_renew
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `;

    const insertParams = [
      userId,
      subscription_id,
      plan.name,
      plan.price,
      plan.currency || 'RWF',
      startDate,
      endDate,
      auto_renew
    ];

    const result = await query(insertSql, insertParams);

    // Get the created subscription
    const newSubscription = await query(
      `SELECT us.*, s.type as plan_type 
       FROM user_subscriptions us 
       LEFT JOIN subscriptions s ON us.subscription_id = s.id 
       WHERE us.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: newSubscription[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
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
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = ?, auto_renew = false
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

// Check subscription status
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
        s.offline_downloads
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status IN ('active', 'trialing', 'past_due')
        AND us.end_date > NOW()
      ORDER BY us.created_at DESC
      LIMIT 1
    `;

    const subscriptions = await query(sql, [userId]);

    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
    const currentSubscription = hasActiveSubscription ? subscriptions[0] : null;

    res.status(200).json({
      success: true,
      data: {
        has_active_subscription: hasActiveSubscription,
        current_subscription: currentSubscription,
        can_access_premium: hasActiveSubscription && 
          (currentSubscription.status === 'active' || currentSubscription.status === 'trialing')
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status',
      error: error.message
    });
  }
};

// Quick session limit check for video playback
const quickSessionLimitCheck = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's max sessions
    const subscriptionQuery = `
      SELECT 
        COALESCE(us.max_sessions, s.max_sessions, 1) as max_sessions,
        s.type as plan_type
      FROM user_subscriptions us
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
        AND us.status = 'active' 
        AND us.end_date > NOW()
      LIMIT 1
    `;
    
    const subscriptions = await query(subscriptionQuery, [userId]);
    const maxSessions = subscriptions && subscriptions.length > 0 ? subscriptions[0].max_sessions : 1;
    const planType = subscriptions && subscriptions.length > 0 ? subscriptions[0].plan_type : 'free';

    // Count active sessions quickly
    const sessionCountQuery = `
      SELECT COUNT(*) as active_count 
      FROM user_session 
      WHERE user_id = ? 
        AND is_active = true 
        AND last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `;
    
    const sessionCount = await query(sessionCountQuery, [userId]);
    const activeSessions = sessionCount[0]?.active_count || 0;

    const canWatch = activeSessions < maxSessions;

    if (!canWatch) {
      return res.status(429).json({
        success: false,
        error: 'SESSION_LIMIT_EXCEEDED',
        message: `You have ${activeSessions} active session(s) but your plan only allows ${maxSessions}. Please log out from other devices to continue watching.`,
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
        maxAllowed: maxSessions
      }
    });

  } catch (error) {
    console.error('Quick session limit check error:', error);
    // On error, allow playback to avoid blocking users
    res.status(200).json({
      success: true,
      data: {
        canWatch: true,
        currentSessions: 0,
        maxAllowed: 1,
        error: true
      }
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