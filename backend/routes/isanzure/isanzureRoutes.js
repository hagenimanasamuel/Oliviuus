// backend/routes/isanzure/isanzureRoutes.js
const express = require('express');
const router = express.Router();
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const authMiddleware = require('../../middlewares/authMiddleware');
const accountSettingsRoutes = require('./accountSettingsRoutes');

router.use('/settings', accountSettingsRoutes);

// Create iSanzure user with landlord role
router.post('/create-landlord', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id; // From your auth middleware
    const user_type = 'landlord'; // Fixed as landlord

    console.log('📝 Creating landlord user for Oliviuus ID:', user_id);

    // Check if user already exists in iSanzure
    const checkSql = 'SELECT id, user_type FROM users WHERE oliviuus_user_id = ?';
    const existingUser = await isanzureQuery(checkSql, [user_id]);

    if (existingUser.length > 0) {
      const currentUser = existingUser[0];
      
      // If already a landlord
      if (currentUser.user_type === 'landlord') {
        return res.status(200).json({
          success: true,
          message: 'You are already registered as a landlord',
          user_type: 'landlord',
          isanzure_user_id: currentUser.id,
          user: {
            ...req.user,
            is_landlord: true
          }
        });
      }
      
      // Update to landlord role
      const updateSql = `
        UPDATE users 
        SET user_type = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE oliviuus_user_id = ?
      `;
      await isanzureQuery(updateSql, [user_type, user_id]);
      
      return res.status(200).json({
        success: true,
        message: 'Account upgraded to landlord successfully',
        user_type: user_type,
        isanzure_user_id: currentUser.id,
        user: {
          ...req.user,
          is_landlord: true
        }
      });
    }

    // Create new iSanzure user as landlord
    const insertSql = `
      INSERT INTO users (
        oliviuus_user_id, 
        user_type, 
        registration_source,
        created_at,
        updated_at
      ) VALUES (?, ?, 'oliviuus_sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = await isanzureQuery(insertSql, [user_id, user_type]);

    console.log('✅ Landlord created in iSanzure with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Landlord account created successfully',
      isanzure_user_id: result.insertId,
      user_type: user_type,
      user: {
        ...req.user,
        is_landlord: true
      }
    });

  } catch (error) {
    console.error('❌ Error creating landlord user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get iSanzure user info
router.get('/user-info', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const sql = `
      SELECT 
        id as isanzure_user_id,
        oliviuus_user_id,
        user_type,
        id_verified,
        id_document_type,
        DATE_FORMAT(id_verified_at, '%Y-%m-%d %H:%i:%s') as id_verified_at,
        registration_source,
        DATE_FORMAT(last_isanzure_login, '%Y-%m-%d %H:%i:%s') as last_isanzure_login,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
      FROM users 
      WHERE oliviuus_user_id = ?
    `;
    
    const results = await isanzureQuery(sql, [user_id]);
    
    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'User not found in iSanzure database',
        user: req.user
      });
    }
    
    res.status(200).json({
      success: true,
      exists: true,
      user: results[0],
      oliviuus_user: req.user
    });
    
  } catch (error) {
    console.error('Error fetching iSanzure user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Check if user is a landlord
router.get('/is-landlord', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const sql = `
      SELECT user_type, id as isanzure_user_id
      FROM users 
      WHERE oliviuus_user_id = ?
    `;
    
    const results = await isanzureQuery(sql, [user_id]);
    
    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        is_landlord: false,
        exists_in_isanzure: false,
        message: 'User not registered in iSanzure',
        user: req.user
      });
    }
    
    const is_landlord = results[0].user_type === 'landlord';
    
    res.status(200).json({
      success: true,
      is_landlord: is_landlord,
      exists_in_isanzure: true,
      user_type: results[0].user_type,
      isanzure_user_id: results[0].isanzure_user_id,
      user: {
        ...req.user,
        is_landlord: is_landlord
      }
    });
    
  } catch (error) {
    console.error('Error checking landlord status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// auto create tenant user if not exists - this is called from the frontend when we detect a logged in user without an iSanzure account, to ensure they have one for tenant features
router.post('/auto-create-tenant', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const user_type = 'tenant';

    console.log('📝 Auto-creating tenant for Oliviuus ID:', user_id);

    // First check if user exists
    const checkSql = 'SELECT id, user_type FROM users WHERE oliviuus_user_id = ?';
    const existingUser = await isanzureQuery(checkSql, [user_id]);

    if (existingUser.length > 0) {
      // User already exists
      console.log('✅ User already exists in iSanzure as:', existingUser[0].user_type);
      return res.status(200).json({
        success: true,
        exists: true,
        message: 'User already exists in iSanzure',
        isanzure_user: {
          id: existingUser[0].id,
          user_type: existingUser[0].user_type,
          oliviuus_user_id: user_id
        }
      });
    }

    // User doesn't exist, create new one
    const insertSql = `
      INSERT INTO users (
        oliviuus_user_id, 
        user_type, 
        registration_source,
        created_at,
        updated_at
      ) VALUES (?, ?, 'oliviuus_sso', NOW(), NOW())
    `;

    const result = await isanzureQuery(insertSql, [user_id, user_type]);
    
    console.log('✅ New tenant created with ID:', result.insertId);

    // Fetch the created user
    const fetchSql = `
      SELECT 
        id as isanzure_user_id,
        oliviuus_user_id,
        user_type,
        registration_source,
        created_at
      FROM users 
      WHERE id = ?
    `;
    
    const newUser = await isanzureQuery(fetchSql, [result.insertId]);

    res.status(201).json({
      success: true,
      exists: false,
      message: 'Tenant account created successfully',
      isanzure_user: newUser[0] || {
        id: result.insertId,
        oliviuus_user_id: user_id,
        user_type: user_type
      }
    });

  } catch (error) {
    // Handle duplicate entry error gracefully
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️ Duplicate entry caught, user was created in another request');
      
      // Fetch the existing user
      try {
        const fetchSql = 'SELECT id, user_type FROM users WHERE oliviuus_user_id = ?';
        const existingUser = await isanzureQuery(fetchSql, [req.user.id]);
        
        if (existingUser.length > 0) {
          return res.status(200).json({
            success: true,
            exists: true,
            message: 'User already exists in iSanzure',
            isanzure_user: existingUser[0]
          });
        }
      } catch (fetchError) {
        console.error('Error fetching after duplicate:', fetchError);
      }
    }
    
    console.error('❌ Error in auto-create-tenant:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;