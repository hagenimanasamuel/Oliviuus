const express = require('express');
const router = express.Router();
const accountSettingsController = require('../../controllers/isanzure/accountSettingsController');
const authMiddleware = require('../../middlewares/authMiddleware');
const { uploadMultipleImages, uploadSingleImage, uploadPropertyImages } = require('../../middlewares/isanzure/uploadMiddleware');

// Middleware to check if user is a landlord
const landlordMiddleware = async (req, res, next) => {
  try {
    // Check if user is a landlord in iSanzure
    const { isanzureQuery } = require('../../config/isanzureDbConfig');
    const userSql = 'SELECT user_type FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [req.user.id]);
    
    if (userResult.length === 0 || userResult[0].user_type !== 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Landlord account required.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in landlord middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(landlordMiddleware);

// 1. Get account settings
router.get('/', accountSettingsController.getAccountSettings);

// 2. Set/Update account PIN
router.post('/set-pin', accountSettingsController.setAccountPin);
router.get('/pin-history', accountSettingsController.getPinStatus);

// 3. Verify PIN for sensitive operations
router.post('/verify-pin', accountSettingsController.verifyPin);

// 4. Reset failed PIN attempts
router.post('/reset-pin-attempts', accountSettingsController.resetPinAttempts);

// 5. Save public contact information
router.post('/save-contact', accountSettingsController.saveContactInfo);
router.post('/update-contact', accountSettingsController.updateContactInfo);
router.get('/contact-history', accountSettingsController.getContactInfo);

// 6. Save withdrawal account
router.post('/save-withdrawal', accountSettingsController.saveWithdrawalAccount);

// 7. Get withdrawal history
router.get('/withdrawal-history', accountSettingsController.getWithdrawalHistory);

// Delete withdrawal account
router.delete('/delete-withdrawal', accountSettingsController.deleteWithdrawalAccount);

// Cancel verification request
router.delete('/cancel-verification', accountSettingsController.cancelVerificationRequest);

// Reveal sensitive withdrawal data with PIN
router.post('/reveal-withdrawal-data', accountSettingsController.revealWithdrawalData);

// 8. Submit verification request
router.post('/submit-verification', 
  (req, res, next) => {
    const multer = require('multer');
    
    // Configure multer for memory storage
    const storage = multer.memoryStorage();
    
    // File filter function
    const fileFilter = (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, WebP, and PDF files are allowed.'));
      }
    };
    
    // Create multer instance
    const upload = multer({
      storage: storage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 4, // Max 4 files
      },
      fileFilter: fileFilter,
    });
    
    // Use the fields middleware
    upload.fields([
      { name: 'nationalIdFront', maxCount: 1 },
      { name: 'nationalIdBack', maxCount: 1 },
      { name: 'passportPhoto', maxCount: 1 },
      { name: 'verificationLetter', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 5MB per file.'
          });
        }
        if (err.message.includes('Invalid file type')) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }
      next();
    });
  },
  accountSettingsController.submitVerificationRequest
);

// 9. Get verification history
router.get('/verification-history', accountSettingsController.getVerificationHistory);

// 10. Update profile from SSO (for syncing user data)
router.post('/update-profile', accountSettingsController.updateProfileFromSSO);

// 11. Check PIN status
router.get('/pin-status', async (req, res) => {
  try {
    const { isanzureQuery } = require('../../config/isanzureDbConfig');
    const userSql = `
      SELECT 
        has_pin, 
        pin_set_at, 
        pin_attempts,
        pin_locked_until
      FROM users 
      WHERE oliviuus_user_id = ?
    `;
    
    const userResult = await isanzureQuery(userSql, [req.user.id]);
    
    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult[0];
    
    res.status(200).json({
      success: true,
      data: {
        has_pin: user.has_pin,
        pin_set_at: user.pin_set_at,
        pin_attempts: user.pin_attempts || 0,
        is_locked: user.pin_locked_until && new Date(user.pin_locked_until) > new Date(),
        locked_until: user.pin_locked_until,
        requires_setup: !user.has_pin,
        days_since_set: user.pin_set_at ? 
          Math.floor((new Date() - new Date(user.pin_set_at)) / (1000 * 60 * 60 * 24)) : null
      }
    });
    
  } catch (error) {
    console.error('Error getting PIN status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// 12. Check verification status
router.get('/verification-status', async (req, res) => {
  try {
    const { isanzureQuery } = require('../../config/isanzureDbConfig');
    const userSql = `
      SELECT 
        verification_status,
        verification_submitted_at,
        verification_processed_at,
        rejection_reason,
        id_verified,
        id_document_type
      FROM users 
      WHERE oliviuus_user_id = ?
    `;
    
    const userResult = await isanzureQuery(userSql, [req.user.id]);
    
    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult[0];
    
    res.status(200).json({
      success: true,
      data: {
        verification_status: user.verification_status,
        id_verified: user.id_verified,
        id_document_type: user.id_document_type,
        submitted_at: user.verification_submitted_at,
        processed_at: user.verification_processed_at,
        rejection_reason: user.rejection_reason,
        is_pending: user.verification_status === 'pending',
        is_approved: user.verification_status === 'approved' || user.id_verified,
        is_rejected: user.verification_status === 'rejected',
        can_resubmit: user.verification_status === 'rejected' || 
                     user.verification_status === 'not_submitted'
      }
    });
    
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;