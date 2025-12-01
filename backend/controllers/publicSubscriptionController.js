const { query } = require("../config/dbConfig");

// Get all active and visible subscription plans for public
const getPublicSubscriptionPlans = async (req, res) => {
  try {
    let plans;
    
    try {
      // Get all necessary fields for comparison table
      plans = await query(`
        SELECT 
          id,
          type,
          price,
          is_popular,
          max_sessions,
          video_quality,
          offline_downloads,
          max_downloads,
          download_quality,
          simultaneous_downloads,
          download_expiry_days,
          hdr_support,
          parental_controls,
          supported_platforms,
          max_devices_registered,
          max_video_bitrate
        FROM subscriptions 
        WHERE is_active = true AND is_visible = true
        ORDER BY display_order ASC
      `);
    } catch (error) {
      // If any field doesn't exist, fall back to basic fields
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Some fields missing, fetching basic data only');
        plans = await query(`
          SELECT 
            id,
            type,
            price,
            is_popular
          FROM subscriptions 
          WHERE is_active = true AND is_visible = true
          ORDER BY id ASC
        `);
      } else {
        throw error;
      }
    }

    // Check if plans exists and has data
    if (!plans || plans.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: 'No subscription plans available'
      });
    }

    // Format plans with all necessary fields for frontend
    const formattedPlans = plans.map(plan => {
      // Create base plan with guaranteed fields
      const basePlan = {
        id: plan.id,
        type: plan.type,
        price: plan.price,
        popular: Boolean(plan.is_popular)
      };

      // Add all comparison fields with fallbacks
      const comparisonFields = {
        deviceLimit: plan.max_sessions || 1,
        video_quality: plan.video_quality || 'SD',
        offline_downloads: Boolean(plan.offline_downloads),
        max_downloads: plan.max_downloads || 0,
        download_quality: plan.download_quality || 'SD',
        simultaneous_downloads: plan.simultaneous_downloads || 1,
        download_expiry_days: plan.download_expiry_days || 30,
        hdr_support: Boolean(plan.hdr_support),
        parental_controls: Boolean(plan.parental_controls),
        supported_platforms: plan.supported_platforms || '["web","mobile","tablet"]',
        max_devices_registered: plan.max_devices_registered || 5,
        max_video_bitrate: plan.max_video_bitrate || 2000
      };

      return {
        ...basePlan,
        ...comparisonFields
      };
    });

    // console.log('Formatted plans for frontend:', formattedPlans.map(p => ({
    //   id: p.id,
    //   type: p.type,
    //   price: p.price,
    //   deviceLimit: p.deviceLimit,
    //   video_quality: p.video_quality,
    //   max_downloads: p.max_downloads
    // })));

    res.status(200).json({
      success: true,
      data: formattedPlans,
      count: formattedPlans.length
    });

  } catch (error) {
    console.error('Error fetching public subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message
    });
  }
};

module.exports = {
  getPublicSubscriptionPlans
};