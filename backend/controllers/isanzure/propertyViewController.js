// backend/controllers/isanzure/propertyViewController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const { v4: uuidv4 } = require('uuid');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 👁️ ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 👁️ ${message}`);
  }
};

// ============================================
// HELPER: GET AUTHENTICATED USER
// ============================================
const getAuthenticatedUser = async (req) => {
  try {
    const userId = req.user?.id || req.user?.oliviuus_id;
    if (!userId) return null;

    const sql = `
      SELECT 
        u.id,
        u.user_uid,
        u.oliviuus_user_id,
        u.user_type
      FROM users u
      WHERE u.oliviuus_user_id = ?
        AND u.is_active = 1
      LIMIT 1
    `;

    const users = await isanzureQuery(sql, [userId]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    return null;
  }
};

// ============================================
// HELPER: GET DEVICE INFO FROM USER AGENT
// ============================================
const getDeviceInfo = (userAgent) => {
  if (!userAgent) return { device: 'desktop', browser: 'unknown', os: 'unknown' };

  const ua = userAgent.toLowerCase();
  
  // Device type
  let device = 'desktop';
  if (/(mobile|android|iphone|ipod|blackberry)/.test(ua)) device = 'mobile';
  else if (/(tablet|ipad|playbook)/.test(ua)) device = 'tablet';
  else if (/(bot|crawler|spider)/.test(ua)) device = 'bot';

  // Browser
  let browser = 'unknown';
  if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('chrome')) browser = 'chrome';
  else if (ua.includes('safari')) browser = 'safari';
  else if (ua.includes('edge')) browser = 'edge';
  else if (ua.includes('opera')) browser = 'opera';
  else if (ua.includes('msie') || ua.includes('trident')) browser = 'ie';

  // OS
  let os = 'unknown';
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac')) os = 'mac';
  else if (ua.includes('linux')) os = 'linux';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'ios';

  return { device, browser, os };
};

// ============================================
// 1. RECORD PROPERTY VIEW
// ============================================
exports.recordView = async (req, res) => {
  try {
    const { propertyUid } = req.params;
    const { view_type = 'page_view', session_id, referrer } = req.body;

    debugLog('Recording view for property:', propertyUid);

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required',
        code: 'MISSING_PROPERTY_UID'
      });
    }

    // Get authenticated user if any
    const user = await getAuthenticatedUser(req);

    // Get property ID
    const property = await isanzureQuery(`
      SELECT id, title FROM properties WHERE property_uid = ?
    `, [propertyUid]);

    if (property.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    const propertyId = property[0].id;

    // Get device info from user agent
    const userAgent = req.headers['user-agent'];
    const { device, browser, os } = getDeviceInfo(userAgent);

    // Get client IP
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Generate session ID if not provided
    const viewSessionId = session_id || uuidv4();

    // Record the view
    const result = await isanzureQuery(`
      INSERT INTO property_views (
        view_uid,
        property_id,
        viewer_id,
        view_type,
        session_id,
        device_type,
        browser,
        os,
        ip_address,
        referrer_url,
        referrer_domain,
        viewed_at
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      propertyId,
      user?.id || null,
      view_type,
      viewSessionId,
      device,
      browser,
      os,
      ipAddress,
      referrer || null,
      referrer ? new URL(referrer).hostname : null
    ]);

    // Get the created view
    const newView = await isanzureQuery(`
      SELECT 
        view_uid,
        view_type,
        viewed_at
      FROM property_views 
      WHERE id = ?
    `, [result.insertId]);

    debugLog('View recorded successfully:', newView[0]);

    res.status(201).json({
      success: true,
      message: 'View recorded',
      data: {
        view: newView[0],
        session_id: viewSessionId
      }
    });

  } catch (error) {
    debugLog('Error recording view:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to record view',
      code: 'RECORD_VIEW_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 2. UPDATE VIEW (time spent, scroll depth, actions)
// ============================================
exports.updateView = async (req, res) => {
  try {
    const { viewUid } = req.params;
    const { time_spent, scroll_depth, actions, left } = req.body;

    debugLog('Updating view:', viewUid);

    if (!viewUid) {
      return res.status(400).json({
        success: false,
        message: 'View UID is required',
        code: 'MISSING_VIEW_UID'
      });
    }

    // Check if view exists
    const view = await isanzureQuery(`
      SELECT id FROM property_views WHERE view_uid = ?
    `, [viewUid]);

    if (view.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'View not found',
        code: 'VIEW_NOT_FOUND'
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (time_spent !== undefined) {
      updates.push('time_spent = ?');
      values.push(time_spent);
    }

    if (scroll_depth !== undefined) {
      updates.push('scroll_depth = ?');
      values.push(scroll_depth);
    }

    if (actions !== undefined) {
      // Merge with existing actions if any
      const existingView = await isanzureQuery(`
        SELECT actions FROM property_views WHERE id = ?
      `, [view[0].id]);

      let existingActions = [];
      if (existingView[0]?.actions) {
        existingActions = JSON.parse(existingView[0].actions);
      }

      const newActions = Array.isArray(actions) ? actions : [actions];
      const mergedActions = [...new Set([...existingActions, ...newActions])];
      
      updates.push('actions = ?');
      values.push(JSON.stringify(mergedActions));
    }

    if (left === true) {
      updates.push('left_at = NOW()');
    }

    updates.push('updated_at = NOW()');

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        code: 'NO_UPDATES'
      });
    }

    // Execute update
    await isanzureQuery(`
      UPDATE property_views 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, [...values, view[0].id]);

    res.status(200).json({
      success: true,
      message: 'View updated successfully'
    });

  } catch (error) {
    debugLog('Error updating view:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update view',
      code: 'UPDATE_VIEW_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 3. GET VIEW STATS FOR A PROPERTY (PUBLIC)
// ============================================
exports.getPropertyViewStats = async (req, res) => {
  try {
    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required',
        code: 'MISSING_PROPERTY_UID'
      });
    }

    // Get property ID
    const property = await isanzureQuery(`
      SELECT id FROM properties WHERE property_uid = ?
    `, [propertyUid]);

    if (property.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    const propertyId = property[0].id;

    // Get view stats
    const stats = await isanzureQuery(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT 
          CASE 
            WHEN viewer_id IS NOT NULL THEN viewer_id 
            ELSE ip_address 
          END
        ) as unique_viewers,
        COUNT(DISTINCT 
          CASE 
            WHEN viewer_id IS NOT NULL THEN viewer_id 
            ELSE NULL 
          END
        ) as logged_in_viewers,
        AVG(time_spent) as avg_time_spent,
        MAX(time_spent) as max_time_spent,
        AVG(scroll_depth) as avg_scroll_depth,
        
        -- Views by type
        SUM(CASE WHEN view_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
        SUM(CASE WHEN view_type = 'quick_view' THEN 1 ELSE 0 END) as quick_views,
        SUM(CASE WHEN view_type = 'gallery_view' THEN 1 ELSE 0 END) as gallery_views,
        SUM(CASE WHEN view_type = 'contact_view' THEN 1 ELSE 0 END) as contact_views,
        
        -- Today's views
        SUM(CASE WHEN DATE(viewed_at) = CURDATE() THEN 1 ELSE 0 END) as today_views,
        
        -- This week
        SUM(CASE WHEN YEARWEEK(viewed_at) = YEARWEEK(NOW()) THEN 1 ELSE 0 END) as week_views,
        
        -- This month
        SUM(CASE WHEN MONTH(viewed_at) = MONTH(NOW()) AND YEAR(viewed_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as month_views
      FROM property_views
      WHERE property_id = ?
    `, [propertyId]);

    // Get views by device
    const deviceStats = await isanzureQuery(`
      SELECT 
        device_type,
        COUNT(*) as count
      FROM property_views
      WHERE property_id = ?
      GROUP BY device_type
      ORDER BY count DESC
    `, [propertyId]);

    // Get views by country
    const countryStats = await isanzureQuery(`
      SELECT 
        COALESCE(country_code, 'Unknown') as country,
        COUNT(*) as count
      FROM property_views
      WHERE property_id = ?
      GROUP BY country_code
      ORDER BY count DESC
      LIMIT 10
    `, [propertyId]);

    // Get views over time (last 30 days)
    const timeStats = await isanzureQuery(`
      SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as unique_views
      FROM property_views
      WHERE property_id = ? 
        AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC
    `, [propertyId]);

    res.status(200).json({
      success: true,
      data: {
        property_uid: propertyUid,
        summary: stats[0] || {
          total_views: 0,
          unique_sessions: 0,
          unique_viewers: 0,
          logged_in_viewers: 0,
          avg_time_spent: 0,
          max_time_spent: 0,
          avg_scroll_depth: 0,
          page_views: 0,
          quick_views: 0,
          gallery_views: 0,
          contact_views: 0,
          today_views: 0,
          week_views: 0,
          month_views: 0
        },
        by_device: deviceStats,
        by_country: countryStats,
        over_time: timeStats
      }
    });

  } catch (error) {
    debugLog('Error fetching view stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch view stats',
      code: 'FETCH_STATS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 4. TRACK ACTION (quick helper for common actions)
// ============================================
exports.trackAction = async (req, res) => {
  try {
    const { viewUid } = req.params;
    const { action } = req.body;

    if (!viewUid || !action) {
      return res.status(400).json({
        success: false,
        message: 'View UID and action are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Get current view
    const view = await isanzureQuery(`
      SELECT id, actions FROM property_views WHERE view_uid = ?
    `, [viewUid]);

    if (view.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'View not found',
        code: 'VIEW_NOT_FOUND'
      });
    }

    // Update actions
    let actions = [];
    if (view[0].actions) {
      actions = JSON.parse(view[0].actions);
    }

    if (!actions.includes(action)) {
      actions.push(action);
    }

    await isanzureQuery(`
      UPDATE property_views 
      SET actions = ?, updated_at = NOW()
      WHERE id = ?
    `, [JSON.stringify(actions), view[0].id]);

    res.status(200).json({
      success: true,
      message: 'Action tracked'
    });

  } catch (error) {
    debugLog('Error tracking action:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to track action',
      code: 'TRACK_ACTION_FAILED',
      error: error.message
    });
  }
};

module.exports = exports;