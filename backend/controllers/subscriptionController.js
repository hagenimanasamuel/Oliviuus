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
      {
        name: 'Mobile Plan',
        type: 'mobile', // Changed from 'monthly' to 'mobile'
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
      {
        name: 'Basic Plan',
        type: 'basic', // Changed from 'monthly' to 'basic'
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
      {
        name: 'Standard Plan',
        type: 'standard', // Changed from 'monthly' to 'standard'
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
      {
        name: 'Family Plan',
        type: 'family', // Changed from 'monthly' to 'family'
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
        plans: defaultPlans.map(p => ({ name: p.name, type: p.type, price: p.price }))
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

module.exports = {
  seedSubscriptionPlans,
  resetSubscriptionPlans,
  getSubscriptionPlans,
  getSubscriptionPlanById,
  updateSubscriptionPlan
};