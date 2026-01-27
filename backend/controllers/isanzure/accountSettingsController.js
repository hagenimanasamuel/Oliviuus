const { isanzureQuery } = require('../../config/isanzureDbConfig');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../../config/cloudinaryConfig');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


// Encryption function
const encryptData = (text, secretKey) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(secretKey).digest('base64').substr(0, 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    content: encrypted
  };
};

// Decryption function
const decryptData = (encryptedData, secretKey) => {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(secretKey).digest('base64').substr(0, 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Function to encrypt data with user-specific key
const encryptWithUserKey = (data, userPin) => {
  if (!data) return null;
  // Create a key from user's PIN + environment secret
  const secretKey = userPin + (process.env.ENCRYPTION_SECRET);
  return encryptData(data, secretKey);
};

// Function to decrypt data with user-specific key
const decryptWithUserKey = (encryptedData, userPin) => {
  if (!encryptedData || !encryptedData.iv || !encryptedData.content) return null;
  // Create a key from user's PIN + environment secret
  const secretKey = userPin + (process.env.ENCRYPTION_SECRET);
  return decryptData(encryptedData, secretKey);
};

// Helper function to sanitize JSON data
const sanitizeJSON = (data) => {
  if (!data) return null;
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error sanitizing JSON:', error);
    return null;
  }
};

// Helper function to parse JSON data
const parseJSON = (data) => {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

// Helper function to upload document to Cloudinary
const uploadDocumentToCloudinary = async (fileBuffer, fileName, folder = 'isanzure/verification') => {
  try {
    const result = await uploadBufferToCloudinary(fileBuffer, folder, fileName);
    return {
      url: result.url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Error uploading document to Cloudinary:', error);
    throw new Error('Failed to upload document');
  }
};

// Helper function to handle PIN hashing
const hashPin = async (pin) => {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error('Invalid PIN format. PIN must be 4 digits');
  }
  const saltRounds = 10;
  return await bcrypt.hash(pin, saltRounds);
};

// Helper function to verify PIN
const verifyPin = async (hashedPin, plainPin) => {
  if (!hashedPin || !plainPin) return false;
  return await bcrypt.compare(plainPin, hashedPin);
};

// 1. Set/Update Account PIN
exports.setAccountPin = async (req, res) => {
  try {
    const { currentPin, newPin, confirmPin } = req.body;
    const oliviuus_user_id = req.user.id; // This is from SSO

    console.log('Received PIN data:', { currentPin, newPin, confirmPin, oliviuus_user_id });

    // Validation
    if (!newPin || !confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'New PIN and confirm PIN are required'
      });
    }

    if (newPin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'New PINs do not match'
      });
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits'
      });
    }

    // Get user's current PIN status
    const userSql = 'SELECT id, has_pin, account_pin, pin_locked_until, pin_attempts FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];
    
    console.log('User found:', { 
      id: user.id, 
      has_pin: user.has_pin,
      pin_locked_until: user.pin_locked_until,
      pin_attempts: user.pin_attempts 
    });

    if (!user.id) {
      return res.status(500).json({
        success: false,
        message: 'User record is incomplete'
      });
    }

    // Check if PIN is locked
    if (user.pin_locked_until && new Date(user.pin_locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'PIN is locked due to too many failed attempts. Try again later.'
      });
    }

    // If user already has a PIN, verify current PIN
    if (user.has_pin) {
      if (!currentPin) {
        return res.status(400).json({
          success: false,
          message: 'Current PIN is required to update PIN'
        });
      }

      if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
        return res.status(400).json({
          success: false,
          message: 'Current PIN must be 4 digits'
        });
      }

      const isValidPin = await verifyPin(user.account_pin, currentPin);
      if (!isValidPin) {
        // Increment failed attempts
        const newAttempts = (user.pin_attempts || 0) + 1;
        let lockUntil = null;

        // Lock after 5 failed attempts for 30 minutes
        if (newAttempts >= 5) {
          lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }

        const updateAttemptsSql = `
          UPDATE users 
          SET pin_attempts = ?, pin_locked_until = ?
          WHERE id = ?
        `;
        await isanzureQuery(updateAttemptsSql, [newAttempts, lockUntil, user.id]);

        const remainingAttempts = 5 - newAttempts;
        return res.status(401).json({
          success: false,
          message: `Invalid current PIN. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining` : 'Account locked for 30 minutes'}`
        });
      }
    }

    // Hash the new PIN
    const hashedPin = await hashPin(newPin);

    // Get the changed_by user (isanzure user id for the person making the change)
    const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);
    
    if (changedByResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your account is not found in iSanzure database'
      });
    }
    
    const changedByUser = changedByResult[0];

    // Update user's PIN
    const updateSql = `
      UPDATE users 
      SET 
        account_pin = ?,
        has_pin = TRUE,
        pin_set_at = NOW(),
        pin_attempts = 0,
        pin_locked_until = NULL,
        last_settings_update = NOW(),
        updated_by = ?
      WHERE id = ?
    `;

    await isanzureQuery(updateSql, [hashedPin, changedByUser.id, user.id]);

    // Log PIN change in audit log
    const auditSql = `
      INSERT INTO pin_change_history (
        user_id, 
        change_type, 
        changed_by, 
        ip_address, 
        user_agent
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    await isanzureQuery(auditSql, [
      user.id,
      user.has_pin ? 'update' : 'set',
      changedByUser.id,
      req.ip,
      req.headers['user-agent']
    ]);

    console.log('PIN successfully set/updated for user:', user.id);

    res.status(200).json({
      success: true,
      message: user.has_pin ? 'PIN updated successfully' : 'PIN set successfully'
    });

  } catch (error) {
    console.error('Error setting account PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 2. Save Public Contact Information
exports.saveContactInfo = async (req, res) => {
  try {
    const { 
      phone, 
      email
    } = req.body;

    const oliviuus_user_id = req.user.id; // This is the SSO user ID

    // Validation
    if (!validateRwandanPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Rwandan phone number (e.g., +250 7XX XXX XXX)'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Get isanzure user for the person making the change
    const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);

    if (changedByResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your account is not found in iSanzure database'
      });
    }

    const changedByUser = changedByResult[0]; // This gives id = 5 (isanzure user id)

    // Also get the target user (should be the same as changedByUser since they're updating their own contact)
    // keep the logic in case  want to allow admins to change other users' contact info later
    const userSql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0]; // This should also be id = 5

    // Update contact information
    const updateSql = `
      UPDATE users 
      SET 
        public_phone = ?,
        public_email = ?,
        last_settings_update = NOW(),
        updated_by = ?
      WHERE id = ?
    `;

    await isanzureQuery(updateSql, [
      phone.replace(/\s/g, ''), // Remove spaces
      email,
      changedByUser.id, // Use isanzure user id (5)
      user.id // Use isanzure user id (5)
    ]);

    // Log contact info update
    const auditSql = `
      INSERT INTO contact_info_history (
        user_id, 
        public_phone, 
        public_email, 
        changed_by,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await isanzureQuery(auditSql, [
      user.id, // isanzure user id (5)
      phone.replace(/\s/g, ''),
      email,
      changedByUser.id, // isanzure user id (5) - this matches the foreign key
      req.ip,
      req.headers['user-agent']
    ]);

    res.status(200).json({
      success: true,
      message: 'Contact information saved successfully',
      data: {
        phone,
        email
      }
    });

  } catch (error) {
    console.error('Error saving contact information:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 2b. Update Public Contact Information (Partial updates allowed)
exports.updateContactInfo = async (req, res) => {
  try {
    const { 
      phone, 
      email
    } = req.body;

    const oliviuus_user_id = req.user.id; // SSO user ID

    // Validate at least one field is provided
    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (phone or email) is required for update'
      });
    }

    // Get isanzure user for the person making the change
    const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);

    if (changedByResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your account is not found in iSanzure database'
      });
    }

    const changedByUser = changedByResult[0];

    // Get target user (should be the same as changedByUser)
    const userSql = 'SELECT id, public_phone, public_email FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];

    // Prepare update fields dynamically
    const updates = [];
    const values = [];

    // Validate and add phone if provided
    if (phone !== undefined) {
      if (phone === null || phone === '') {
        // Allow clearing phone
        updates.push('public_phone = ?');
        values.push(null);
      } else {
        if (!validateRwandanPhone(phone)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid Rwandan phone number (e.g., +250 7XX XXX XXX)'
          });
        }
        updates.push('public_phone = ?');
        values.push(phone.replace(/\s/g, ''));
      }
    }

    // Validate and add email if provided
    if (email !== undefined) {
      if (email === null || email === '') {
        // Allow clearing email
        updates.push('public_email = ?');
        values.push(null);
      } else {
        if (!validateEmail(email)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
          });
        }
        updates.push('public_email = ?');
        values.push(email);
      }
    }

    // Add audit fields
    updates.push('last_settings_update = NOW()');
    updates.push('updated_by = ?');
    values.push(changedByUser.id); // Use isanzure user id
    values.push(user.id); // Use isanzure user id for WHERE clause

    // Build update query
    const updateSql = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    await isanzureQuery(updateSql, values);

    // Log contact info update
    const auditSql = `
      INSERT INTO contact_info_history (
        user_id, 
        public_phone, 
        public_email, 
        changed_by,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    // Get updated values for audit log
    const auditPhone = phone !== undefined ? (phone ? phone.replace(/\s/g, '') : null) : user.public_phone;
    const auditEmail = email !== undefined ? (email || null) : user.public_email;

    await isanzureQuery(auditSql, [
      user.id, // isanzure user id
      auditPhone,
      auditEmail,
      changedByUser.id, // isanzure user id
      req.ip,
      req.headers['user-agent']
    ]);

    // Get updated user data
    const updatedUserSql = 'SELECT public_phone, public_email, last_settings_update FROM users WHERE id = ?';
    const updatedUser = await isanzureQuery(updatedUserSql, [user.id]);

    res.status(200).json({
      success: true,
      message: 'Contact information updated successfully',
      data: {
        phone: updatedUser[0].public_phone,
        email: updatedUser[0].public_email,
        updated_at: updatedUser[0].last_settings_update
      }
    });

  } catch (error) {
    console.error('Error updating contact information:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to get user's public contact info
exports.getContactInfo = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user contact info
    const userSql = `
      SELECT 
        id,
        public_phone,
        public_email,
        last_settings_update
      FROM users 
      WHERE oliviuus_user_id = ?
    `;
    const userResult = await isanzureQuery(userSql, [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];

    // Get contact history
    const historySql = `
      SELECT 
        public_phone,
        public_email,
        changed_at,
        changed_by,
        ip_address
      FROM contact_info_history 
      WHERE user_id = ? 
      ORDER BY changed_at DESC
      LIMIT 5
    `;
    const historyResult = await isanzureQuery(historySql, [user.id]);

    res.status(200).json({
      success: true,
      data: {
        current: {
          phone: user.public_phone,
          email: user.public_email,
          last_updated: user.last_settings_update
        },
        history: historyResult,
        has_contact_info: !!(user.public_phone || user.public_email)
      }
    });

  } catch (error) {
    console.error('Error getting contact information:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to validate Rwandan phone number
const validateRwandanPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\s/g, '');
  return /^\+250[0-9]{9}$/.test(cleaned);
};

// Helper function to validate email
const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 3. Save Withdrawal Account with Encryption and PIN Verification
exports.saveWithdrawalAccount = async (req, res) => {
  try {
    const { 
      method, 
      accountName, 
      accountNumber, 
      phoneNumber,
      pin // PIN is required for encryption/decryption
    } = req.body;

    const oliviuus_user_id = req.user.id;

    // Validation
    if (!method || !['bk', 'equity', 'mtn', 'airtel'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal method'
      });
    }

    if (!accountName || accountName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Account name is required'
      });
    }

    // Bank-specific validation
    if (method === 'bk' || method === 'equity') {
      if (!accountNumber || !/^\d+$/.test(accountNumber.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Valid account number is required for bank accounts'
        });
      }
      if (accountNumber.replace(/\s/g, '').length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Account number is too short'
        });
      }
    } else {
      // Mobile money validation
      if (!validateRwandanPhone(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Valid Rwandan phone number is required for mobile money'
        });
      }
    }

    // Get user
    const userSql = 'SELECT id, has_pin, account_pin FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];

    // Check if user has PIN and verify it
    if (user.has_pin) {
      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'PIN verification required to update withdrawal account',
          requires_pin: true
        });
      }

      const isValidPin = await verifyPin(user.account_pin, pin);
      if (!isValidPin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid PIN. Please enter correct PIN to update withdrawal account.'
        });
      }
    } else {
      // If user doesn't have PIN, require them to set one first
      return res.status(400).json({
        success: false,
        message: 'Please set up your account PIN first before adding withdrawal accounts',
        requires_pin_setup: true
      });
    }

    // Get the isanzure user ID for changed_by_user_id
    const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);
    
    if (changedByResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your account is not found in iSanzure database'
      });
    }
    
    const changedByUser = changedByResult[0];

    // Start transaction
    await isanzureQuery('START TRANSACTION');

    try {
      // ENCRYPT sensitive data using user's PIN
      let encryptedAccountNumber = null;
      let encryptedPhoneNumber = null;
      let encryptedAccountName = null;
      
      if (method === 'bk' || method === 'equity') {
        // Encrypt account number
        const accountNumberClean = accountNumber.replace(/\s/g, '');
        encryptedAccountNumber = JSON.stringify(encryptWithUserKey(accountNumberClean, pin));
        
        // Also encrypt account name for consistency
        encryptedAccountName = JSON.stringify(encryptWithUserKey(accountName.trim(), pin));
      } else {
        // Encrypt phone number
        const phoneNumberClean = phoneNumber.replace(/\s/g, '');
        encryptedPhoneNumber = JSON.stringify(encryptWithUserKey(phoneNumberClean, pin));
        
        // Encrypt account name
        encryptedAccountName = JSON.stringify(encryptWithUserKey(accountName.trim(), pin));
      }

      // First, mark all current withdrawal accounts as not current
      await isanzureQuery(`
        UPDATE withdrawal_account_history 
        SET is_current = FALSE 
        WHERE user_id = ? AND is_current = TRUE
      `, [user.id]);

      // Insert new withdrawal account into history
      const insertHistorySql = `
        INSERT INTO withdrawal_account_history (
          user_id,
          withdrawal_method,
          account_name,
          account_number,
          phone_number,
          bank_name,
          verification_status,
          changed_by_user_id,
          ip_address,
          user_agent,
          is_current
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, TRUE)
      `;

      const bankName = method === 'bk' ? 'Bank of Kigali' : 
                     method === 'equity' ? 'Equity Bank' : 
                     method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money';

      await isanzureQuery(insertHistorySql, [
        user.id, // user_id from isanzure users table
        method,
        encryptedAccountName, // Encrypted account name
        encryptedAccountNumber, // Encrypted account number
        encryptedPhoneNumber, // Encrypted phone number
        bankName,
        changedByUser.id, // Use isanzure user ID
        req.ip,
        req.headers['user-agent']
      ]);

      // Update user's current withdrawal info
      const updateUserSql = `
        UPDATE users 
        SET 
          withdrawal_method = ?,
          withdrawal_account_name = ?,
          withdrawal_account_number = ?,
          withdrawal_phone_number = ?,
          withdrawal_bank_name = ?,
          withdrawal_set_at = NOW(),
          withdrawal_verified = FALSE,
          last_settings_update = NOW(),
          updated_by = ?
        WHERE id = ?
      `;

      await isanzureQuery(updateUserSql, [
        method,
        encryptedAccountName, // Encrypted account name
        encryptedAccountNumber, // Encrypted account number
        encryptedPhoneNumber, // Encrypted phone number
        bankName,
        changedByUser.id, // Use isanzure user ID
        user.id
      ]);

      // Commit transaction
      await isanzureQuery('COMMIT');

      // Log successful save (without sensitive data)
      console.log(`Withdrawal account saved for user ${user.id}: ${method} - ${bankName}`);

      // Return masked data to frontend
      res.status(200).json({
        success: true,
        message: 'Withdrawal account saved successfully',
        data: {
          method,
          accountName,
          accountNumber: method === 'bk' || method === 'equity' ? '••••' + accountNumber.replace(/\s/g, '').slice(-4) : null,
          phoneNumber: method === 'mtn' || method === 'airtel' ? phoneNumber.slice(0, 7) + '••••' + phoneNumber.slice(-3) : null,
          bankName,
          verificationRequired: true,
          message: 'Your withdrawal account will be verified within 24-48 hours'
        }
      });

    } catch (error) {
      // Rollback on error
      await isanzureQuery('ROLLBACK');
      console.error('Error saving withdrawal account:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error saving withdrawal account:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 4. Submit Verification Request
exports.submitVerificationRequest = async (req, res) => {
  try {
    const { verificationReason, documentType = 'national_id' } = req.body;
    const user_id = req.user.id;

    // Validation
    if (!verificationReason || verificationReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid reason for verification (minimum 10 characters)'
      });
    }

    if (!['national_id', 'passport', 'driving_license'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    // Check if files are uploaded
    if (!req.files || !req.files.nationalIdFront || !req.files.nationalIdBack || !req.files.passportPhoto) {
      return res.status(400).json({
        success: false,
        message: 'National ID (front & back) and passport photo are required'
      });
    }

    // Get user
    const userSql = 'SELECT id, verification_status FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];

    // Check if user already has pending or approved verification
    if (user.verification_status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending verification request'
      });
    }

    if (user.verification_status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified'
      });
    }

    // Start transaction
    await isanzureQuery('START TRANSACTION');

    try {
      // Upload documents to Cloudinary
      const uploadPromises = [];

      // National ID Front
      uploadPromises.push(
        uploadDocumentToCloudinary(
          req.files.nationalIdFront[0].buffer,
          `national_id_front_${user.id}_${Date.now()}`,
          'isanzure/verification/national_ids'
        )
      );

      // National ID Back
      uploadPromises.push(
        uploadDocumentToCloudinary(
          req.files.nationalIdBack[0].buffer,
          `national_id_back_${user.id}_${Date.now()}`,
          'isanzure/verification/national_ids'
        )
      );

      // Passport Photo
      uploadPromises.push(
        uploadDocumentToCloudinary(
          req.files.passportPhoto[0].buffer,
          `passport_photo_${user.id}_${Date.now()}`,
          'isanzure/verification/passport_photos'
        )
      );

      // Verification Letter (optional)
      let verificationLetterResult = null;
      if (req.files.verificationLetter && req.files.verificationLetter[0]) {
        verificationLetterResult = await uploadDocumentToCloudinary(
          req.files.verificationLetter[0].buffer,
          `verification_letter_${user.id}_${Date.now()}`,
          'isanzure/verification/letters'
        );
      }

      // Wait for all uploads
      const [nationalIdFrontResult, nationalIdBackResult, passportPhotoResult] = await Promise.all(uploadPromises);

      // Get the changed_by user ID (isanzure user id)
      const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
      const changedByResult = await isanzureQuery(changedBySql, [user_id]);
      
      if (changedByResult.length === 0) {
        throw new Error('Your account is not found in iSanzure database');
      }
      
      const changedByUser = changedByResult[0];

      // Update user verification status - FIXED: changed document_type to id_document_type
      const updateUserSql = `
        UPDATE users 
        SET 
          verification_status = 'pending',
          verification_submitted_at = NOW(),
          verification_reason = ?,
          id_document_type = ?,  -- CHANGED FROM document_type TO id_document_type
          national_id_front_url = ?,
          national_id_front_public_id = ?,
          national_id_back_url = ?,
          national_id_back_public_id = ?,
          passport_photo_url = ?,
          passport_photo_public_id = ?,
          verification_letter_url = ?,
          verification_letter_public_id = ?,
          last_settings_update = NOW(),
          updated_by = ?
        WHERE id = ?
      `;

      await isanzureQuery(updateUserSql, [
        verificationReason.trim(),
        documentType, // This will go into id_document_type column
        nationalIdFrontResult.url,
        nationalIdFrontResult.public_id,
        nationalIdBackResult.url,
        nationalIdBackResult.public_id,
        passportPhotoResult.url,
        passportPhotoResult.public_id,
        verificationLetterResult ? verificationLetterResult.url : null,
        verificationLetterResult ? verificationLetterResult.public_id : null,
        changedByUser.id, // Use isanzure user id
        user.id
      ]);

      // Insert into verification history
      const historySql = `
        INSERT INTO verification_history (
          user_id,
          national_id_front_url,
          national_id_front_public_id,
          national_id_back_url,
          national_id_back_public_id,
          passport_photo_url,
          passport_photo_public_id,
          verification_letter_url,
          verification_letter_public_id,
          verification_reason,
          document_type,
          status,
          submitted_by_user_id,
          submitted_ip,
          submitted_user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `;

      await isanzureQuery(historySql, [
        user.id,
        nationalIdFrontResult.url,
        nationalIdFrontResult.public_id,
        nationalIdBackResult.url,
        nationalIdBackResult.public_id,
        passportPhotoResult.url,
        passportPhotoResult.public_id,
        verificationLetterResult ? verificationLetterResult.url : null,
        verificationLetterResult ? verificationLetterResult.public_id : null,
        verificationReason.trim(),
        documentType,
        changedByUser.id, // Use isanzure user id
        req.ip,
        req.headers['user-agent']
      ]);

      // Commit transaction
      await isanzureQuery('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Verification request submitted successfully',
        data: {
          verificationId: user.id,
          status: 'pending',
          submittedAt: new Date(),
          estimatedProcessingTime: '24-48 hours',
          documentsSubmitted: {
            nationalId: true,
            passportPhoto: true,
            verificationLetter: verificationLetterResult ? true : false
          }
        }
      });

    } catch (error) {
      // Rollback on error
      await isanzureQuery('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error submitting verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 5. Get Account Settings
exports.getAccountSettings = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user with all settings - REMOVED user_uid and the business hours/time columns
    const userSql = `
      SELECT 
        id,
        oliviuus_user_id,
        user_type,
        
        -- Verification info
        id_verified,
        id_document_type,
        verification_status,
        verification_reason,
        verification_submitted_at,
        verification_processed_at,
        rejection_reason,
        verification_letter_url,
        national_id_front_url,
        national_id_back_url,
        passport_photo_url,
        
        -- Account PIN info
        has_pin,
        pin_set_at,
        
        -- Public contact info (only phone and email)
        public_phone,
        public_email,
        
        -- Withdrawal info
        withdrawal_method,
        withdrawal_account_name,
        withdrawal_account_number,
        withdrawal_phone_number,
        withdrawal_bank_name,
        withdrawal_set_at,
        withdrawal_verified,
        withdrawal_verified_at,
        
        -- Timestamps
        created_at,
        updated_at,
        last_settings_update
        
      FROM users 
      WHERE oliviuus_user_id = ?
    `;

    const userResult = await isanzureQuery(userSql, [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];

    // Format response
    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          oliviuus_user_id: user.oliviuus_user_id,
          user_type: user.user_type,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        verification: {
          id_verified: user.id_verified,
          verification_status: user.verification_status,
          id_document_type: user.id_document_type,
          verification_reason: user.verification_reason,
          verification_submitted_at: user.verification_submitted_at,
          verification_processed_at: user.verification_processed_at,
          rejection_reason: user.rejection_reason,
          // Return the actual URLs, not just booleans
          verification_letter_url: user.verification_letter_url,
          national_id_front_url: user.national_id_front_url,
          national_id_back_url: user.national_id_back_url,
          passport_photo_url: user.passport_photo_url,
          // Keep the has_documents for quick checks
          has_documents: {
            verification_letter: !!user.verification_letter_url,
            national_id_front: !!user.national_id_front_url,
            national_id_back: !!user.national_id_back_url,
            passport_photo: !!user.passport_photo_url
          }
        },
        security: {
          has_pin: user.has_pin,
          pin_set_at: user.pin_set_at,
          requires_pin_update: !user.has_pin || (user.pin_set_at && 
            (new Date() - new Date(user.pin_set_at)) > (90 * 24 * 60 * 60 * 1000)) // 90 days
        },
        contact: {
          public_phone: user.public_phone,
          public_email: user.public_email
        },
        withdrawal: {
          method: user.withdrawal_method,
          account_name: user.withdrawal_account_name ? '••••••••' : null,
          account_number: user.withdrawal_account_number ? true : false,
          phone_number: user.withdrawal_phone_number ? true : false,
          bank_name: user.withdrawal_bank_name,
          set_at: user.withdrawal_set_at,
          verified: user.withdrawal_verified,
          verified_at: user.withdrawal_verified_at,
          requires_verification: user.withdrawal_method && !user.withdrawal_verified,
          is_encrypted: true
        },
        audit: {
          last_settings_update: user.last_settings_update
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting account settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 6. Verify PIN (for sensitive operations)
exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const user_id = req.user.id;

    // Validation
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN format'
      });
    }

    // Get user's PIN
    const userSql = 'SELECT id, account_pin, pin_attempts, pin_locked_until FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

    // Check if PIN is locked
    if (user.pin_locked_until && new Date(user.pin_locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'PIN is locked due to too many failed attempts',
        locked_until: user.pin_locked_until
      });
    }

    // Verify PIN
    const isValid = await verifyPin(user.account_pin, pin);

    if (isValid) {
      // Reset failed attempts
      await isanzureQuery(`
        UPDATE users 
        SET pin_attempts = 0, pin_locked_until = NULL 
        WHERE id = ?
      `, [user.id]);

      // Generate temporary token for sensitive operation (valid for 5 minutes)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store token in database (you might want to create a separate table for this)
      await isanzureQuery(`
        INSERT INTO pin_verification_tokens (
          user_id, 
          token, 
          expires_at, 
          operation_type,
          ip_address
        ) VALUES (?, ?, ?, ?, ?)
      `, [user.id, token, expiresAt, req.body.operation_type || 'general', req.ip]);

      res.status(200).json({
        success: true,
        message: 'PIN verified successfully',
        data: {
          token,
          expires_at: expiresAt,
          operation_allowed: true
        }
      });
    } else {
      // Increment failed attempts
      const newAttempts = (user.pin_attempts || 0) + 1;
      let lockUntil = null;

      // Lock after 5 failed attempts for 30 minutes
      if (newAttempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await isanzureQuery(`
        UPDATE users 
        SET pin_attempts = ?, pin_locked_until = ?
        WHERE id = ?
      `, [newAttempts, lockUntil, user.id]);

      const remainingAttempts = 5 - newAttempts;
      
      res.status(401).json({
        success: false,
        message: `Invalid PIN. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining` : 'Account locked for 30 minutes'}`,
        data: {
          remaining_attempts: remainingAttempts > 0 ? remainingAttempts : 0,
          locked: lockUntil ? true : false,
          locked_until: lockUntil
        }
      });
    }

  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 7. Update User Profile from SSO
exports.updateProfileFromSSO = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { first_name, last_name, email, phone, profile_picture_url } = req.body;

    // Get user
    const userSql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (first_name) {
      updates.push('first_name = ?');
      values.push(first_name);
    }

    if (last_name) {
      updates.push('last_name = ?');
      values.push(last_name);
    }

    if (email && validateEmail(email)) {
      updates.push('email = ?');
      values.push(email);
    }

    if (phone && validateRwandanPhone(phone)) {
      updates.push('phone = ?');
      values.push(phone.replace(/\s/g, ''));
    }

    if (profile_picture_url) {
      updates.push('profile_picture_url = ?');
      values.push(profile_picture_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Add user ID to values
    values.push(user.id);

    const updateSql = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    await isanzureQuery(updateSql, values);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        first_name,
        last_name,
        email,
        phone,
        profile_picture_url
      }
    });

  } catch (error) {
    console.error('Error updating profile from SSO:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 8. Get Withdrawal History
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user
    const userSql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

    // Get withdrawal history
    const historySql = `
      SELECT 
        history_uid,
        withdrawal_method,
        account_name,
        account_number,
        phone_number,
        bank_name,
        verification_status,
        verification_notes,
        verified_by_name,
        verified_at,
        changed_at,
        is_current,
        is_active
      FROM withdrawal_account_history 
      WHERE user_id = ? 
      ORDER BY changed_at DESC
      LIMIT 10
    `;

    const historyResult = await isanzureQuery(historySql, [user.id]);

    // Format bank names for display
    const formattedHistory = historyResult.map(record => ({
      ...record,
      method_display: record.withdrawal_method === 'bk' ? 'Bank of Kigali' : 
                     record.withdrawal_method === 'equity' ? 'Equity Bank' : 
                     record.withdrawal_method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money',
      changed_at: record.changed_at,
      is_current: record.is_current
    }));

    res.status(200).json({
      success: true,
      data: {
        history: formattedHistory,
        current_account: formattedHistory.find(record => record.is_current) || null,
        total_changes: historyResult.length
      }
    });

  } catch (error) {
    console.error('Error getting withdrawal history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 9. Get Verification History
exports.getVerificationHistory = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user
    const userSql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

    // Get verification history
    const historySql = `
      SELECT 
        history_uid,
        status,
        rejection_reason,
        submitted_at,
        processed_at,
        processed_by_name,
        document_type
      FROM verification_history 
      WHERE user_id = ? 
      ORDER BY submitted_at DESC
    `;

    const historyResult = await isanzureQuery(historySql, [user.id]);

    res.status(200).json({
      success: true,
      data: {
        history: historyResult,
        current_status: user.verification_status,
        has_pending: historyResult.some(record => record.status === 'pending'),
        total_submissions: historyResult.length
      }
    });

  } catch (error) {
    console.error('Error getting verification history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 10. Reset Failed PIN Attempts (Admin/User initiated)
exports.resetPinAttempts = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user
    const userSql = 'SELECT id, pin_attempts, pin_locked_until FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

    // Check if PIN is actually locked
    if (!user.pin_locked_until && user.pin_attempts === 0) {
      return res.status(200).json({
        success: true,
        message: 'No failed PIN attempts to reset'
      });
    }

    // Reset attempts
    await isanzureQuery(`
      UPDATE users 
      SET pin_attempts = 0, pin_locked_until = NULL 
      WHERE id = ?
    `, [user.id]);

    // Log the reset
    await isanzureQuery(`
      INSERT INTO security_audit_log (
        user_id,
        action_type,
        description,
        ip_address,
        user_agent
      ) VALUES (?, 'pin_reset', 'User reset failed PIN attempts', ?, ?)
    `, [user.id, req.ip, req.headers['user-agent']]);

    res.status(200).json({
      success: true,
      message: 'PIN attempts reset successfully'
    });

  } catch (error) {
    console.error('Error resetting PIN attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Get PIN status and history
exports.getPinStatus = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user PIN status
    const userSql = `
      SELECT 
        has_pin, 
        pin_set_at, 
        pin_attempts,
        pin_locked_until
      FROM users 
      WHERE oliviuus_user_id = ?
    `;
    
    const userResult = await isanzureQuery(userSql, [user_id]);
    
    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult[0];
    
    // Get PIN change history
    const historySql = `
      SELECT 
        change_type,
        changed_at,
        ip_address
      FROM pin_change_history 
      WHERE user_id = (SELECT id FROM users WHERE oliviuus_user_id = ?)
      ORDER BY changed_at DESC
      LIMIT 10
    `;
    
    const historyResult = await isanzureQuery(historySql, [user_id]);
    
    res.status(200).json({
      success: true,
      data: {
        security: {
          has_pin: user.has_pin,
          pin_set_at: user.pin_set_at,
          pin_attempts: user.pin_attempts || 0,
          is_locked: user.pin_locked_until && new Date(user.pin_locked_until) > new Date(),
          locked_until: user.pin_locked_until,
          remaining_attempts: 5 - (user.pin_attempts || 0),
          days_since_set: user.pin_set_at ? 
            Math.floor((new Date() - new Date(user.pin_set_at)) / (1000 * 60 * 60 * 24)) : null
        },
        history: historyResult
      }
    });
    
  } catch (error) {
    console.error('Error getting PIN status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete Withdrawal Account
exports.deleteWithdrawalAccount = async (req, res) => {
  try {
    const { pin } = req.body;
    const oliviuus_user_id = req.user.id;

    // Get user
    const userSql = 'SELECT id, has_pin, account_pin FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];

    // Check if user has PIN and verify it
    if (user.has_pin) {
      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'PIN verification required to delete withdrawal account',
          requires_pin: true
        });
      }

      const isValidPin = await verifyPin(user.account_pin, pin);
      if (!isValidPin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid PIN. Please enter correct PIN to delete withdrawal account.'
        });
      }
    }

    // Start transaction
    await isanzureQuery('START TRANSACTION');

    try {
      // Get the isanzure user ID for changed_by_user_id
      const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
      const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);
      
      if (changedByResult.length === 0) {
        throw new Error('User not found');
      }
      
      const changedByUser = changedByResult[0];

      // Mark all withdrawal accounts as not current and inactive
      await isanzureQuery(`
        UPDATE withdrawal_account_history 
        SET is_current = FALSE, is_active = FALSE, deactivated_at = NOW()
        WHERE user_id = ? AND is_current = TRUE
      `, [user.id]);

      // Clear user's withdrawal info
      const updateUserSql = `
        UPDATE users 
        SET 
          withdrawal_method = NULL,
          withdrawal_account_name = NULL,
          withdrawal_account_number = NULL,
          withdrawal_phone_number = NULL,
          withdrawal_bank_name = NULL,
          withdrawal_set_at = NULL,
          withdrawal_verified = FALSE,
          last_settings_update = NOW(),
          updated_by = ?
        WHERE id = ?
      `;

      await isanzureQuery(updateUserSql, [changedByUser.id, user.id]);

      // Commit transaction
      await isanzureQuery('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Withdrawal account deleted successfully'
      });

    } catch (error) {
      // Rollback on error
      await isanzureQuery('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting withdrawal account:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Verify PIN and reveal sensitive data
exports.revealWithdrawalData = async (req, res) => {
  try {
    const { pin } = req.body;
    const oliviuus_user_id = req.user.id;

    // Get user and withdrawal data
    const userSql = `
      SELECT 
        u.id,
        u.has_pin,
        u.account_pin,
        u.withdrawal_account_name,
        u.withdrawal_account_number,
        u.withdrawal_phone_number,
        u.withdrawal_method
      FROM users u
      WHERE u.oliviuus_user_id = ?
    `;
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in iSanzure database'
      });
    }

    const user = userResult[0];

    // Check if user has PIN and verify it
    if (user.has_pin) {
      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'PIN verification required to reveal sensitive data',
          requires_pin: true
        });
      }

      const isValidPin = await verifyPin(user.account_pin, pin);
      if (!isValidPin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid PIN. Please enter correct PIN to view sensitive data.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please set up your account PIN first to view sensitive data'
      });
    }

    // Helper function to safely parse JSON or handle hashed data
    const safeDecryptData = (encryptedData, dataType, userPin) => {
      if (!encryptedData) return null;
      
      try {
        // First, try to parse as JSON (new encrypted format)
        const parsedData = JSON.parse(encryptedData);
        
        // If it parsed successfully, decrypt it
        if (parsedData.iv && parsedData.content) {
          const decrypted = decryptWithUserKey(parsedData, userPin);
          return decrypted;
        } else {
          // If it's JSON but not in encrypted format, return as is
          return encryptedData;
        }
      } catch (jsonError) {
        // If JSON.parse fails, it's probably old hashed data
        console.log(`Data is not JSON format (${dataType}), might be old hashed data`);
        
        // For old hashed data, we can't decrypt it - return masked data
        // Or you could return the hashed value with a note
        return '••••••••'; // Return masked placeholder
      }
    };

    // DECRYPT the sensitive data
    let decryptedAccountName = null;
    let decryptedAccountNumber = null;
    let decryptedPhoneNumber = null;

    // Decrypt account name
    if (user.withdrawal_account_name) {
      decryptedAccountName = safeDecryptData(user.withdrawal_account_name, 'account_name', pin);
    }

    // Decrypt account number
    if (user.withdrawal_account_number) {
      decryptedAccountNumber = safeDecryptData(user.withdrawal_account_number, 'account_number', pin);
    }

    // Decrypt phone number
    if (user.withdrawal_phone_number) {
      decryptedPhoneNumber = safeDecryptData(user.withdrawal_phone_number, 'phone_number', pin);
    }

    // Get full withdrawal history for audit
    const historySql = `
      SELECT 
        withdrawal_method,
        account_name,
        account_number,
        phone_number,
        verification_status,
        changed_at,
        is_current
      FROM withdrawal_account_history 
      WHERE user_id = ? 
      ORDER BY changed_at DESC
      LIMIT 5
    `;
    
    const historyResult = await isanzureQuery(historySql, [user.id]);

    // Decrypt history data for the current session
    const decryptedHistory = historyResult.map(record => {
      const decryptedRecord = { ...record };
      
      // Decrypt account name in history
      if (record.account_name) {
        try {
          decryptedRecord.account_name = safeDecryptData(record.account_name, 'account_name_history', pin);
        } catch (error) {
          decryptedRecord.account_name = '••••••••';
        }
      }
      
      // Decrypt account number in history
      if (record.account_number) {
        try {
          decryptedRecord.account_number = safeDecryptData(record.account_number, 'account_number_history', pin);
          // Mask for history display
          if (decryptedRecord.account_number && decryptedRecord.account_number !== '••••••••') {
            decryptedRecord.account_number_masked = '••••' + decryptedRecord.account_number.slice(-4);
          } else {
            decryptedRecord.account_number_masked = '••••••••';
          }
        } catch (error) {
          decryptedRecord.account_number = '••••••••';
          decryptedRecord.account_number_masked = '••••••••';
        }
      }
      
      // Decrypt phone number in history
      if (record.phone_number) {
        try {
          decryptedRecord.phone_number = safeDecryptData(record.phone_number, 'phone_number_history', pin);
          // Mask for history display
          if (decryptedRecord.phone_number && decryptedRecord.phone_number !== '••••••••') {
            decryptedRecord.phone_number_masked = decryptedRecord.phone_number.slice(0, 7) + '••••' + decryptedRecord.phone_number.slice(-3);
          } else {
            decryptedRecord.phone_number_masked = '•••••••••••';
          }
        } catch (error) {
          decryptedRecord.phone_number = '•••••••••••';
          decryptedRecord.phone_number_masked = '•••••••••••';
        }
      }
      
      return decryptedRecord;
    });

    res.status(200).json({
      success: true,
      data: {
        current: {
          method: user.withdrawal_method,
          accountName: decryptedAccountName,
          accountNumber: decryptedAccountNumber,
          phoneNumber: decryptedPhoneNumber,
          data_format: decryptedAccountName && decryptedAccountName !== '••••••••' ? 'encrypted' : 'legacy'
        },
        history: decryptedHistory,
        revealed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error revealing withdrawal data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Cancel/Delete verification request
exports.cancelVerificationRequest = async (req, res) => {
  try {
    const oliviuus_user_id = req.user.id;

    // Get user
    const userSql = 'SELECT id, verification_status FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

    // Check if user has pending verification
    if (user.verification_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending verification request to cancel'
      });
    }

    // Get the changed_by user ID
    const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);
    
    if (changedByResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your account is not found in iSanzure database'
      });
    }
    
    const changedByUser = changedByResult[0];

    // Start transaction
    await isanzureQuery('START TRANSACTION');

    try {
      // Reset user verification status and clear document URLs
      const updateSql = `
        UPDATE users 
        SET 
          verification_status = 'not_submitted',
          verification_submitted_at = NULL,
          verification_reason = NULL,
          id_document_type = NULL,
          national_id_front_url = NULL,
          national_id_front_public_id = NULL,
          national_id_back_url = NULL,
          national_id_back_public_id = NULL,
          passport_photo_url = NULL,
          passport_photo_public_id = NULL,
          verification_letter_url = NULL,
          verification_letter_public_id = NULL,
          last_settings_update = NOW(),
          updated_by = ?
        WHERE id = ?
      `;

      await isanzureQuery(updateSql, [changedByUser.id, user.id]);

      // Log the cancellation in verification history
      const historySql = `
        INSERT INTO verification_history (
          user_id,
          status,
          verification_reason,
          rejection_reason,
          submitted_by_user_id,
          submitted_ip,
          submitted_user_agent
        ) VALUES (?, 'cancelled', 'User cancelled verification request', 'Cancelled by user', ?, ?, ?)
      `;

      await isanzureQuery(historySql, [
        user.id,
        changedByUser.id,
        req.ip,
        req.headers['user-agent']
      ]);

      // Commit transaction
      await isanzureQuery('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Verification request cancelled successfully',
        data: {
          status: 'not_submitted',
          cancelled_at: new Date()
        }
      });

    } catch (error) {
      // Rollback on error
      await isanzureQuery('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error cancelling verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel verification request',
      error: error.message
    });
  }
};