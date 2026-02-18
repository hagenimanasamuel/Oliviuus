// backend/controllers/isanzure/wishlistController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ⭐ ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ⭐ ${message}`);
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
        u.user_type,
        u.public_phone,
        u.public_email,
        u.is_active,
        COALESCE(sso.first_name, 'User') as first_name,
        COALESCE(sso.last_name, '') as last_name,
        CONCAT(
          COALESCE(sso.first_name, 'User'),
          ' ',
          COALESCE(sso.last_name, '')
        ) as full_name,
        sso.profile_avatar_url as avatar
      FROM users u
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE u.oliviuus_user_id = ?
        AND u.is_active = 1
      LIMIT 1
    `;

    const users = await isanzureQuery(sql, [userId]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    debugLog('Error getting authenticated user:', error.message);
    return null;
  }
};

// ============================================
// 1. GET USER'S WISHLIST (BASIC)
// ============================================
exports.getWishlist = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      sort = 'saved_at', 
      order = 'DESC',
      property_type 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    debugLog('Fetching wishlist for user:', user.id);

    // Base query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM wishlist w
      WHERE w.user_id = ?
    `;

    let dataQuery = `
      SELECT 
        w.id,
        w.wishlist_uid,
        w.saved_at,
        w.display_order,
        w.created_at,
        w.updated_at,
        
        -- Property details
        p.id as property_id,
        p.property_uid,
        p.title as property_title,
        p.description as property_description,
        p.property_type,
        p.address,
        p.province,
        p.district,
        p.sector,
        p.cell,
        p.village,
        p.max_guests,
        p.area,
        p.status as property_status,
        p.is_verified,
        p.is_featured,
        
        -- Pricing
        pp.monthly_price,
        pp.weekly_price,
        pp.daily_price,
        pp.currency_code,
        
        -- Cover image
        (SELECT pi.image_url FROM property_images pi 
         WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
        
        -- Image count
        (SELECT COUNT(*) FROM property_images pi2 
         WHERE pi2.property_id = p.id) as image_count,
        
        -- Landlord details
        l.id as landlord_id,
        l.user_uid as landlord_uid,
        CONCAT(
          COALESCE(sso_landlord.first_name, 'Landlord'),
          ' ',
          COALESCE(sso_landlord.last_name, '')
        ) as landlord_name,
        sso_landlord.profile_avatar_url as landlord_avatar
        
      FROM wishlist w
      INNER JOIN properties p ON w.property_id = p.id
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      LEFT JOIN users l ON p.landlord_id = l.id
      LEFT JOIN oliviuus_db.users sso_landlord ON l.oliviuus_user_id = sso_landlord.id
      WHERE w.user_id = ?
    `;

    // Apply filters
    const queryParams = [user.id];
    const dataParams = [user.id];

    if (property_type) {
      countQuery += ` AND p.property_type = ?`;
      dataQuery += ` AND p.property_type = ?`;
      queryParams.push(property_type);
      dataParams.push(property_type);
    }

    // Add sorting
    const validSortFields = ['saved_at', 'display_order', 'property_title', 'monthly_price'];
    const sortField = validSortFields.includes(sort) ? sort : 'saved_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    if (sortField === 'property_title') {
      dataQuery += ` ORDER BY p.title ${sortOrder}`;
    } else if (sortField === 'monthly_price') {
      dataQuery += ` ORDER BY pp.monthly_price ${sortOrder}`;
    } else {
      dataQuery += ` ORDER BY w.${sortField} ${sortOrder}`;
    }
    
    dataQuery += `, w.id DESC LIMIT ? OFFSET ?`;
    dataParams.push(parseInt(limit), offset);

    // Execute queries
    const [countResult, wishlistItems] = await Promise.all([
      isanzureQuery(countQuery, queryParams),
      isanzureQuery(dataQuery, dataParams)
    ]);

    const total = countResult[0]?.total || 0;

    // Format the response
    const formattedItems = wishlistItems.map(item => ({
      id: item.wishlist_uid,
      saved_at: item.saved_at,
      display_order: item.display_order,
      property: {
        id: item.property_uid,
        uid: item.property_uid,
        title: item.property_title,
        description: item.property_description,
        type: item.property_type,
        location: {
          address: item.address,
          province: item.province,
          district: item.district,
          sector: item.sector,
          cell: item.cell,
          village: item.village
        },
        specs: {
          guests: item.max_guests,
          area: item.area
        },
        pricing: {
          monthly: item.monthly_price,
          weekly: item.weekly_price,
          daily: item.daily_price,
          currency: item.currency_code || 'RWF'
        },
        images: {
          cover: item.cover_image,
          count: item.image_count || 0
        },
        status: item.property_status,
        verified: item.is_verified === 1,
        featured: item.is_featured === 1
      },
      landlord: {
        id: item.landlord_uid,
        name: item.landlord_name,
        avatar: item.landlord_avatar
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          has_more: total > (parseInt(page) * parseInt(limit))
        },
        filters: {
          property_type: property_type || null,
          sort,
          order
        }
      }
    });

  } catch (error) {
    debugLog('Error fetching wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      code: 'FETCH_WISHLIST_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 2. GET WISHLIST SUMMARY (COUNTS, RECENT)
// ============================================
exports.getWishlistSummary = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    debugLog('Fetching wishlist summary for user:', user.id);

    const summary = await isanzureQuery(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN DATE(w.saved_at) = CURDATE() THEN 1 END) as added_today,
        COUNT(CASE WHEN DATE(w.saved_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as added_this_week,
        COUNT(CASE WHEN p.is_verified = 1 THEN 1 END) as verified_properties,
        COUNT(CASE WHEN p.is_featured = 1 THEN 1 END) as featured_properties,
        
        -- Property type breakdown
        COUNT(CASE WHEN p.property_type = 'apartment' THEN 1 END) as apartments,
        COUNT(CASE WHEN p.property_type = 'house' THEN 1 END) as houses,
        COUNT(CASE WHEN p.property_type = 'villa' THEN 1 END) as villas,
        COUNT(CASE WHEN p.property_type = 'condo' THEN 1 END) as condos,
        COUNT(CASE WHEN p.property_type = 'studio' THEN 1 END) as studios,
        COUNT(CASE WHEN p.property_type = 'ghetto' THEN 1 END) as ghetto,
        
        -- Price ranges (RWF)
        COUNT(CASE WHEN pp.monthly_price < 100000 THEN 1 END) as under_100k,
        COUNT(CASE WHEN pp.monthly_price BETWEEN 100000 AND 300000 THEN 1 END) as between_100k_300k,
        COUNT(CASE WHEN pp.monthly_price BETWEEN 300000 AND 500000 THEN 1 END) as between_300k_500k,
        COUNT(CASE WHEN pp.monthly_price > 500000 THEN 1 END) as above_500k,
        
        -- Most recent item
        MAX(w.saved_at) as last_added_at,
        
        -- Get the most recent property details
        (SELECT p2.property_uid FROM wishlist w2 
         INNER JOIN properties p2 ON w2.property_id = p2.id
         WHERE w2.user_id = w.user_id 
         ORDER BY w2.saved_at DESC LIMIT 1) as last_property_uid,
         
        (SELECT p2.title FROM wishlist w2 
         INNER JOIN properties p2 ON w2.property_id = p2.id
         WHERE w2.user_id = w.user_id 
         ORDER BY w2.saved_at DESC LIMIT 1) as last_property_title,
         
        (SELECT pi.image_url FROM wishlist w2 
         INNER JOIN properties p2 ON w2.property_id = p2.id
         LEFT JOIN property_images pi ON p2.id = pi.property_id AND pi.is_cover = 1
         WHERE w2.user_id = w.user_id 
         ORDER BY w2.saved_at DESC LIMIT 1) as last_property_image
         
      FROM wishlist w
      INNER JOIN properties p ON w.property_id = p.id
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE w.user_id = ?
      GROUP BY w.user_id
    `, [user.id]);

    const data = summary.length > 0 ? summary[0] : {
      total_items: 0,
      added_today: 0,
      added_this_week: 0,
      verified_properties: 0,
      featured_properties: 0,
      apartments: 0,
      houses: 0,
      villas: 0,
      condos: 0,
      studios: 0,
      ghetto: 0,
      under_100k: 0,
      between_100k_300k: 0,
      between_300k_500k: 0,
      above_500k: 0
    };

    // Format the response
    const summaryData = {
      total: parseInt(data.total_items) || 0,
      added_today: parseInt(data.added_today) || 0,
      added_this_week: parseInt(data.added_this_week) || 0,
      verified: parseInt(data.verified_properties) || 0,
      featured: parseInt(data.featured_properties) || 0,
      breakdown: {
        property_types: {
          apartment: parseInt(data.apartments) || 0,
          house: parseInt(data.houses) || 0,
          villa: parseInt(data.villas) || 0,
          condo: parseInt(data.condos) || 0,
          studio: parseInt(data.studios) || 0,
          ghetto: parseInt(data.ghetto) || 0
        },
        price_ranges: {
          under_100k: parseInt(data.under_100k) || 0,
          between_100k_300k: parseInt(data.between_100k_300k) || 0,
          between_300k_500k: parseInt(data.between_300k_500k) || 0,
          above_500k: parseInt(data.above_500k) || 0
        }
      },
      last_added: data.last_added_at ? {
        at: data.last_added_at,
        property: {
          uid: data.last_property_uid,
          title: data.last_property_title,
          image: data.last_property_image
        }
      } : null
    };

    res.status(200).json({
      success: true,
      data: summaryData
    });

  } catch (error) {
    debugLog('Error fetching wishlist summary:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist summary',
      code: 'FETCH_SUMMARY_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 3. CHECK IF PROPERTY IS IN WISHLIST
// ============================================
exports.checkWishlistStatus = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required',
        code: 'MISSING_PROPERTY_UID'
      });
    }

    debugLog('Checking wishlist status for property:', propertyUid);

    // Get property ID from UID
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

    // Check if in wishlist
    const wishlistItem = await isanzureQuery(`
      SELECT 
        id,
        wishlist_uid,
        saved_at,
        display_order
      FROM wishlist
      WHERE user_id = ? AND property_id = ?
      LIMIT 1
    `, [user.id, propertyId]);

    const isInWishlist = wishlistItem.length > 0;

    res.status(200).json({
      success: true,
      data: {
        property_uid: propertyUid,
        in_wishlist: isInWishlist,
        wishlist_item: isInWishlist ? {
          id: wishlistItem[0].wishlist_uid,
          saved_at: wishlistItem[0].saved_at,
          display_order: wishlistItem[0].display_order
        } : null
      }
    });

  } catch (error) {
    debugLog('Error checking wishlist status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status',
      code: 'CHECK_WISHLIST_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 4. ADD PROPERTY TO WISHLIST
// ============================================
exports.addToWishlist = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required',
        code: 'MISSING_PROPERTY_UID'
      });
    }

    debugLog('Adding property to wishlist:', propertyUid);

    // Get property ID from UID
    const property = await isanzureQuery(`
      SELECT id, title, status FROM properties WHERE property_uid = ?
    `, [propertyUid]);

    if (property.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    const propertyId = property[0].id;

    // Check if property is active
    if (property[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot save inactive property to wishlist',
        code: 'PROPERTY_INACTIVE'
      });
    }

    // Get max display order for new items
    const orderResult = await isanzureQuery(`
      SELECT MAX(display_order) as max_order FROM wishlist WHERE user_id = ?
    `, [user.id]);

    const displayOrder = (orderResult[0]?.max_order || 0) + 1;

    // Insert into wishlist (unique constraint will prevent duplicates)
    try {
      const result = await isanzureQuery(`
        INSERT INTO wishlist (
          wishlist_uid,
          user_id,
          property_id,
          display_order,
          saved_at,
          created_at,
          updated_at
        ) VALUES (UUID(), ?, ?, ?, NOW(), NOW(), NOW())
      `, [user.id, propertyId, displayOrder]);

      const wishlistId = result.insertId;

      // Get the inserted item
      const newItem = await isanzureQuery(`
        SELECT 
          w.id,
          w.wishlist_uid,
          w.saved_at,
          w.display_order,
          p.property_uid,
          p.title,
          p.property_type,
          p.province,
          p.district,
          (SELECT pi.image_url FROM property_images pi 
           WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image
        FROM wishlist w
        INNER JOIN properties p ON w.property_id = p.id
        WHERE w.id = ?
      `, [wishlistId]);

      // Log the action for analytics
      await isanzureQuery(`
        INSERT INTO security_audit_log (
          log_uid,
          user_id,
          action_type,
          description,
          metadata,
          created_at
        ) VALUES (UUID(), ?, 'wishlist_add', ?, ?, NOW())
      `, [
        user.id,
        `Added property ${propertyUid} to wishlist`,
        JSON.stringify({
          property_id: propertyId,
          property_uid: propertyUid,
          property_title: property[0].title
        })
      ]);

      debugLog('Property added to wishlist successfully');

      res.status(201).json({
        success: true,
        message: 'Property added to wishlist',
        data: {
          wishlist_item: {
            id: newItem[0].wishlist_uid,
            property_uid: newItem[0].property_uid,
            saved_at: newItem[0].saved_at,
            display_order: newItem[0].display_order,
            property: {
              title: newItem[0].title,
              type: newItem[0].property_type,
              location: {
                province: newItem[0].province,
                district: newItem[0].district
              },
              image: newItem[0].cover_image
            }
          }
        }
      });

    } catch (insertError) {
      // Check if duplicate entry (property already in wishlist)
      if (insertError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Property already in wishlist',
          code: 'ALREADY_IN_WISHLIST'
        });
      }
      throw insertError;
    }

  } catch (error) {
    debugLog('Error adding to wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add to wishlist',
      code: 'ADD_TO_WISHLIST_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 5. REMOVE PROPERTY FROM WISHLIST
// ============================================
exports.removeFromWishlist = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { propertyUid } = req.params;

    if (!propertyUid) {
      return res.status(400).json({
        success: false,
        message: 'Property UID is required',
        code: 'MISSING_PROPERTY_UID'
      });
    }

    debugLog('Removing property from wishlist:', propertyUid);

    // Get property ID from UID
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

    // Check if in wishlist
    const wishlistItem = await isanzureQuery(`
      SELECT id, wishlist_uid FROM wishlist 
      WHERE user_id = ? AND property_id = ?
    `, [user.id, propertyId]);

    if (wishlistItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not in wishlist',
        code: 'NOT_IN_WISHLIST'
      });
    }

    // Delete from wishlist
    await isanzureQuery(`
      DELETE FROM wishlist 
      WHERE user_id = ? AND property_id = ?
    `, [user.id, propertyId]);

    // Log the action
    await isanzureQuery(`
      INSERT INTO security_audit_log (
        log_uid,
        user_id,
        action_type,
        description,
        metadata,
        created_at
      ) VALUES (UUID(), ?, 'wishlist_remove', ?, ?, NOW())
    `, [
      user.id,
      `Removed property ${propertyUid} from wishlist`,
      JSON.stringify({
        property_id: propertyId,
        property_uid: propertyUid,
        property_title: property[0].title,
        wishlist_item_id: wishlistItem[0].id
      })
    ]);

    debugLog('Property removed from wishlist successfully');

    res.status(200).json({
      success: true,
      message: 'Property removed from wishlist',
      data: {
        property_uid: propertyUid,
        removed: true
      }
    });

  } catch (error) {
    debugLog('Error removing from wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist',
      code: 'REMOVE_FROM_WISHLIST_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 6. BULK REMOVE PROPERTIES FROM WISHLIST
// ============================================
exports.bulkRemoveFromWishlist = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { property_uids } = req.body;

    if (!property_uids || !Array.isArray(property_uids) || property_uids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Property UIDs array is required',
        code: 'MISSING_PROPERTY_UIDS'
      });
    }

    debugLog(`Bulk removing ${property_uids.length} properties from wishlist`);

    // Get property IDs from UIDs
    const placeholders = property_uids.map(() => '?').join(',');
    const properties = await isanzureQuery(`
      SELECT id, property_uid, title FROM properties 
      WHERE property_uid IN (${placeholders})
    `, property_uids);

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid properties found',
        code: 'NO_PROPERTIES_FOUND'
      });
    }

    const propertyIds = properties.map(p => p.id);

    // Delete from wishlist
    const deletePlaceholders = propertyIds.map(() => '?').join(',');
    const result = await isanzureQuery(`
      DELETE FROM wishlist 
      WHERE user_id = ? AND property_id IN (${deletePlaceholders})
    `, [user.id, ...propertyIds]);

    // Log the action
    await isanzureQuery(`
      INSERT INTO security_audit_log (
        log_uid,
        user_id,
        action_type,
        description,
        metadata,
        created_at
      ) VALUES (UUID(), ?, 'wishlist_bulk_remove', ?, ?, NOW())
    `, [
      user.id,
      `Bulk removed ${result.affectedRows} properties from wishlist`,
      JSON.stringify({
        count: result.affectedRows,
        properties: properties.map(p => ({
          uid: p.property_uid,
          title: p.title
        }))
      })
    ]);

    debugLog(`Bulk removed ${result.affectedRows} properties`);

    res.status(200).json({
      success: true,
      message: `${result.affectedRows} properties removed from wishlist`,
      data: {
        removed_count: result.affectedRows,
        properties_removed: properties.map(p => p.property_uid)
      }
    });

  } catch (error) {
    debugLog('Error bulk removing from wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk remove from wishlist',
      code: 'BULK_REMOVE_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 7. CLEAR ENTIRE WISHLIST
// ============================================
exports.clearWishlist = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    debugLog('Clearing entire wishlist for user:', user.id);

    // Get count before deletion
    const countResult = await isanzureQuery(`
      SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?
    `, [user.id]);

    const count = countResult[0]?.count || 0;

    if (count === 0) {
      return res.status(200).json({
        success: true,
        message: 'Wishlist is already empty',
        data: { cleared_count: 0 }
      });
    }

    // Delete all wishlist items for user
    await isanzureQuery(`
      DELETE FROM wishlist WHERE user_id = ?
    `, [user.id]);

    // Log the action
    await isanzureQuery(`
      INSERT INTO security_audit_log (
        log_uid,
        user_id,
        action_type,
        description,
        metadata,
        created_at
      ) VALUES (UUID(), ?, 'wishlist_clear', ?, ?, NOW())
    `, [
      user.id,
      `Cleared entire wishlist (${count} items)`,
      JSON.stringify({ items_removed: count })
    ]);

    debugLog(`Cleared ${count} items from wishlist`);

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: {
        cleared_count: count
      }
    });

  } catch (error) {
    debugLog('Error clearing wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      code: 'CLEAR_WISHLIST_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 8. UPDATE DISPLAY ORDER (FOR DRAG-DROP)
// ============================================
exports.updateDisplayOrder = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array with orders is required',
        code: 'MISSING_ITEMS'
      });
    }

    debugLog('Updating display order for', items.length, 'items');

    // Update each item's display order
    const updates = [];
    for (const item of items) {
      const { wishlist_uid, display_order } = item;
      
      // Verify the item belongs to this user
      const check = await isanzureQuery(`
        SELECT id FROM wishlist 
        WHERE wishlist_uid = ? AND user_id = ?
      `, [wishlist_uid, user.id]);

      if (check.length > 0) {
        updates.push(
          isanzureQuery(`
            UPDATE wishlist 
            SET display_order = ?, updated_at = NOW()
            WHERE wishlist_uid = ? AND user_id = ?
          `, [display_order, wishlist_uid, user.id])
        );
      }
    }

    await Promise.all(updates);

    // Log the action
    await isanzureQuery(`
      INSERT INTO security_audit_log (
        log_uid,
        user_id,
        action_type,
        description,
        metadata,
        created_at
      ) VALUES (UUID(), ?, 'wishlist_reorder', ?, ?, NOW())
    `, [
      user.id,
      'Reordered wishlist items',
      JSON.stringify({ items_updated: updates.length })
    ]);

    debugLog('Display order updated successfully');

    res.status(200).json({
      success: true,
      message: 'Display order updated successfully',
      data: {
        updated_count: updates.length
      }
    });

  } catch (error) {
    debugLog('Error updating display order:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update display order',
      code: 'UPDATE_ORDER_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 9. GET WISHLIST PROPERTIES (WITH FULL DETAILS)
// ============================================
exports.getWishlistProperties = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    debugLog('Fetching wishlist properties for user:', user.id);

    // Get total count
    const countResult = await isanzureQuery(`
      SELECT COUNT(*) as total
      FROM wishlist w
      WHERE w.user_id = ?
    `, [user.id]);

    const total = countResult[0]?.total || 0;

    // Get properties with full details
    const properties = await isanzureQuery(`
      SELECT 
        p.id,
        p.property_uid,
        p.title,
        p.description,
        p.property_type,
        p.address,
        p.province,
        p.district,
        p.sector,
        p.cell,
        p.village,
        p.max_guests,
        p.area,
        p.status,
        p.is_verified,
        p.is_featured,
        p.created_at as property_created_at,
        
        -- Pricing
        pp.monthly_price,
        pp.weekly_price,
        pp.daily_price,
        pp.currency_code,
        
        -- Images
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'image_url', pi.image_url,
            'is_cover', pi.is_cover,
            'display_order', pi.display_order
          )
        ) FROM property_images pi 
        WHERE pi.property_id = p.id 
        ORDER BY pi.display_order ASC) as images,
        
        -- Amenities
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'amenity_key', pa.amenity_key,
            'amenity_name', pa.amenity_name,
            'category', pa.category
          )
        ) FROM property_amenity_junction paj
        INNER JOIN property_amenities pa ON paj.amenity_id = pa.id
        WHERE paj.property_id = p.id) as amenities,
        
        -- Landlord info
        l.id as landlord_id,
        l.user_uid as landlord_uid,
        CONCAT(
          COALESCE(sso_landlord.first_name, ''),
          ' ',
          COALESCE(sso_landlord.last_name, '')
        ) as landlord_name,
        sso_landlord.profile_avatar_url as landlord_avatar,
        l.user_type as landlord_type,
        
        -- Wishlist info
        w.wishlist_uid,
        w.saved_at,
        w.display_order
        
      FROM wishlist w
      INNER JOIN properties p ON w.property_id = p.id
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      LEFT JOIN users l ON p.landlord_id = l.id
      LEFT JOIN oliviuus_db.users sso_landlord ON l.oliviuus_user_id = sso_landlord.id
      WHERE w.user_id = ?
      ORDER BY w.display_order ASC, w.saved_at DESC
      LIMIT ? OFFSET ?
    `, [user.id, parseInt(limit), offset]);

    // Parse JSON fields
    const formattedProperties = properties.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      amenities: p.amenities ? JSON.parse(p.amenities) : [],
      wishlist: {
        id: p.wishlist_uid,
        saved_at: p.saved_at,
        display_order: p.display_order
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        properties: formattedProperties,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          has_more: total > (parseInt(page) * parseInt(limit))
        }
      }
    });

  } catch (error) {
    debugLog('Error fetching wishlist properties:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist properties',
      code: 'FETCH_PROPERTIES_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 10. GET WISHLIST STATISTICS
// ============================================
exports.getWishlistStats = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    debugLog('Fetching wishlist stats for user:', user.id);

    const stats = await isanzureQuery(`
      SELECT 
        COUNT(*) as total_items,
        
        -- By property type
        COUNT(CASE WHEN p.property_type = 'apartment' THEN 1 END) as apartments,
        COUNT(CASE WHEN p.property_type = 'house' THEN 1 END) as houses,
        COUNT(CASE WHEN p.property_type = 'villa' THEN 1 END) as villas,
        COUNT(CASE WHEN p.property_type = 'condo' THEN 1 END) as condos,
        COUNT(CASE WHEN p.property_type = 'studio' THEN 1 END) as studios,
        COUNT(CASE WHEN p.property_type = 'ghetto' THEN 1 END) as ghetto,
        
        -- By location (district)
        p.district,
        COUNT(*) as district_count,
        
        -- By price range
        COUNT(CASE 
          WHEN pp.monthly_price < 100000 THEN 'under_100k'
          WHEN pp.monthly_price BETWEEN 100000 AND 300000 THEN '100k_300k'
          WHEN pp.monthly_price BETWEEN 300001 AND 500000 THEN '300k_500k'
          WHEN pp.monthly_price > 500000 THEN 'above_500k'
        END) as price_range,
        
        -- Average price
        AVG(pp.monthly_price) as avg_monthly_price,
        
        -- Min/Max prices
        MIN(pp.monthly_price) as min_price,
        MAX(pp.monthly_price) as max_price,
        
        -- Verification stats
        SUM(CASE WHEN p.is_verified = 1 THEN 1 ELSE 0 END) as verified_count,
        
        -- Recently added (last 30 days)
        SUM(CASE WHEN w.saved_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent_additions,
        
        -- By property status
        SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_properties,
        SUM(CASE WHEN p.status != 'active' THEN 1 ELSE 0 END) as inactive_properties
        
      FROM wishlist w
      INNER JOIN properties p ON w.property_id = p.id
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE w.user_id = ?
      GROUP BY p.district WITH ROLLUP
    `, [user.id]);

    // Get top districts
    const topDistricts = await isanzureQuery(`
      SELECT 
        p.district,
        COUNT(*) as count,
        AVG(pp.monthly_price) as avg_price
      FROM wishlist w
      INNER JOIN properties p ON w.property_id = p.id
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE w.user_id = ? AND p.district IS NOT NULL
      GROUP BY p.district
      ORDER BY count DESC
      LIMIT 5
    `, [user.id]);

    const summary = stats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        total: parseInt(summary.total_items) || 0,
        verified: parseInt(summary.verified_count) || 0,
        recent_additions: parseInt(summary.recent_additions) || 0,
        active: parseInt(summary.active_properties) || 0,
        inactive: parseInt(summary.inactive_properties) || 0,
        price_stats: {
          average: parseFloat(summary.avg_monthly_price) || 0,
          min: parseFloat(summary.min_price) || 0,
          max: parseFloat(summary.max_price) || 0
        },
        property_types: {
          apartment: parseInt(summary.apartments) || 0,
          house: parseInt(summary.houses) || 0,
          villa: parseInt(summary.villas) || 0,
          condo: parseInt(summary.condos) || 0,
          studio: parseInt(summary.studios) || 0,
          ghetto: parseInt(summary.ghetto) || 0
        },
        top_districts: topDistricts.map(d => ({
          district: d.district,
          count: d.count,
          avg_price: parseFloat(d.avg_price) || 0
        }))
      }
    });

  } catch (error) {
    debugLog('Error fetching wishlist stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist stats',
      code: 'STATS_FAILED',
      error: error.message
    });
  }
};

module.exports = exports;