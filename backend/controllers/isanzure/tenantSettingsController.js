const { isanzureQuery } = require('../../config/isanzureDbConfig');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Encryption/decryption helpers (copy from landlord controller)
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

const encryptWithUserKey = (data, userPin) => {
  if (!data) return null;
  const secretKey = userPin + (process.env.ENCRYPTION_SECRET || 'your-secret-key');
  return encryptData(data, secretKey);
};

const decryptWithUserKey = (encryptedData, userPin) => {
  if (!encryptedData || !encryptedData.iv || !encryptedData.content) return null;
  const secretKey = userPin + (process.env.ENCRYPTION_SECRET || 'your-secret-key');
  return decryptData(encryptedData, secretKey);
};

const hashPin = async (pin) => {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error('Invalid PIN format. PIN must be 4 digits');
  }
  const saltRounds = 10;
  return await bcrypt.hash(pin, saltRounds);
};

const verifyPin = async (hashedPin, plainPin) => {
  if (!hashedPin || !plainPin) return false;
  return await bcrypt.compare(plainPin, hashedPin);
};

const validateRwandanPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\s/g, '');
  return /^\+250[0-9]{9}$/.test(cleaned);
};

const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 1. Get tenant account settings
exports.getTenantSettings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const userSql = `
      SELECT 
        id,
        oliviuus_user_id,
        user_type,
        
        -- Account PIN info
        has_pin,
        pin_set_at,
        pin_attempts,
        pin_locked_until,
        
        -- Public contact info
        public_phone,
        public_email,
        
        -- Withdrawal info (for refunds)
        withdrawal_method,
        withdrawal_account_name,
        withdrawal_account_number,
        withdrawal_phone_number,
        withdrawal_bank_name,
        withdrawal_set_at,
        withdrawal_verified,
        
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

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          oliviuus_user_id: user.oliviuus_user_id,
          user_type: user.user_type,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        security: {
          has_pin: user.has_pin,
          pin_set_at: user.pin_set_at,
          pin_attempts: user.pin_attempts || 0,
          is_locked: user.pin_locked_until && new Date(user.pin_locked_until) > new Date(),
          locked_until: user.pin_locked_until
        },
        contact: {
          public_phone: user.public_phone,
          public_email: user.public_email
        },
        withdrawal: {
          method: user.withdrawal_method,
          account_name: user.withdrawal_account_name ? true : false,
          account_number: user.withdrawal_account_number ? true : false,
          phone_number: user.withdrawal_phone_number ? true : false,
          bank_name: user.withdrawal_bank_name,
          set_at: user.withdrawal_set_at,
          verified: user.withdrawal_verified,
          is_encrypted: true
        },
        audit: {
          last_settings_update: user.last_settings_update
        }
      }
    });

  } catch (error) {
    console.error('Error getting tenant settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 2. Set/Update Account PIN (same as landlord)
exports.setAccountPin = async (req, res) => {
  try {
    const { currentPin, newPin, confirmPin } = req.body;
    const oliviuus_user_id = req.user.id;

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

    const userSql = 'SELECT id, has_pin, account_pin, pin_locked_until, pin_attempts FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

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
        const newAttempts = (user.pin_attempts || 0) + 1;
        let lockUntil = null;

        if (newAttempts >= 5) {
          lockUntil = new Date(Date.now() + 30 * 60 * 1000);
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

// 3. Verify PIN (for sensitive operations)
exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const user_id = req.user.id;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN format'
      });
    }

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

    const isValid = await verifyPin(user.account_pin, pin);

    if (isValid) {
      // Reset failed attempts
      await isanzureQuery(`
        UPDATE users 
        SET pin_attempts = 0, pin_locked_until = NULL 
        WHERE id = ?
      `, [user.id]);

      res.status(200).json({
        success: true,
        message: 'PIN verified successfully'
      });
    } else {
      const newAttempts = (user.pin_attempts || 0) + 1;
      let lockUntil = null;

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
          locked: lockUntil ? true : false
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

// 4. Save public contact information
exports.saveContactInfo = async (req, res) => {
  try {
    const { phone, email } = req.body;
    const oliviuus_user_id = req.user.id;

    // Validate at least one field is provided
    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (phone or email) is required'
      });
    }

    if (phone && !validateRwandanPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Rwandan phone number (e.g., +250 7XX XXX XXX)'
      });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);

    if (changedByResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your account is not found in iSanzure database'
      });
    }

    const changedByUser = changedByResult[0];

    const userSql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

    // Update contact information
    const updateSql = `
      UPDATE users 
      SET 
        public_phone = COALESCE(?, public_phone),
        public_email = COALESCE(?, public_email),
        last_settings_update = NOW(),
        updated_by = ?
      WHERE id = ?
    `;

    await isanzureQuery(updateSql, [
      phone ? phone.replace(/\s/g, '') : null,
      email || null,
      changedByUser.id,
      user.id
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
      user.id,
      phone ? phone.replace(/\s/g, '') : null,
      email || null,
      changedByUser.id,
      req.ip,
      req.headers['user-agent']
    ]);

    res.status(200).json({
      success: true,
      message: 'Contact information saved successfully'
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

// 5. Get contact information
exports.getContactInfo = async (req, res) => {
  try {
    const user_id = req.user.id;

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
        message: 'User not found'
      });
    }

    const user = userResult[0];

    res.status(200).json({
      success: true,
      data: {
        current: {
          phone: user.public_phone,
          email: user.public_email,
          last_updated: user.last_settings_update
        },
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

// 6. Get PIN status
exports.getPinStatus = async (req, res) => {
  try {
    const user_id = req.user.id;

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
    
    res.status(200).json({
      success: true,
      data: {
        has_pin: user.has_pin,
        pin_set_at: user.pin_set_at,
        pin_attempts: user.pin_attempts || 0,
        is_locked: user.pin_locked_until && new Date(user.pin_locked_until) > new Date(),
        locked_until: user.pin_locked_until,
        requires_setup: !user.has_pin
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

// 7. Get wallet info (balance from balance controller)
exports.getWalletInfo = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user's balance
    const balanceSql = `
      SELECT 
        ub.balance_amount,
        ub.on_hold_amount,
        ub.currency_code,
        ub.updated_at,
        
        (SELECT COUNT(*) FROM pending_balances 
         WHERE user_id = ub.user_id AND status = 'pending') as pending_count,
        
        (SELECT COALESCE(SUM(amount), 0) FROM pending_balances 
         WHERE user_id = ub.user_id AND status = 'pending') as pending_amount
         
      FROM user_balances ub
      WHERE ub.user_id = ?
    `;

    let balanceResult = await isanzureQuery(balanceSql, [user_id]);

    let balance = balanceResult[0];

    // If no balance record exists, create one
    if (!balance) {
      await isanzureQuery(`
        INSERT INTO user_balances (user_id, balance_amount, on_hold_amount, currency_code)
        VALUES (?, 0, 0, 'RWF')
      `, [user_id]);

      balance = {
        balance_amount: 0,
        on_hold_amount: 0,
        currency_code: 'RWF',
        updated_at: new Date(),
        pending_count: 0,
        pending_amount: 0
      };
    }

    res.status(200).json({
      success: true,
      data: {
        current: {
          available: parseFloat(balance.balance_amount) || 0,
          on_hold: parseFloat(balance.on_hold_amount) || 0,
          total: (parseFloat(balance.balance_amount) || 0) + (parseFloat(balance.on_hold_amount) || 0)
        },
        pending: {
          count: parseInt(balance.pending_count) || 0,
          amount: parseFloat(balance.pending_amount) || 0
        },
        currency: balance.currency_code || 'RWF',
        last_updated: balance.updated_at
      }
    });

  } catch (error) {
    console.error('Error getting wallet info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// 8. Save withdrawal account
exports.saveWithdrawalAccount = async (req, res) => {
  try {
    const { method, accountName, accountNumber, phoneNumber, pin } = req.body;
    const oliviuus_user_id = req.user.id;

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

    if (method === 'bk' || method === 'equity') {
      if (!accountNumber || !/^\d+$/.test(accountNumber.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Valid account number is required for bank accounts'
        });
      }
    } else {
      if (!validateRwandanPhone(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Valid Rwandan phone number is required for mobile money'
        });
      }
    }

    const userSql = 'SELECT id, has_pin, account_pin FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

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
      return res.status(400).json({
        success: false,
        message: 'Please set up your account PIN first before adding withdrawal accounts',
        requires_pin_setup: true
      });
    }

    const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
    const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);
    
    if (changedByResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Your account is not found'
      });
    }
    
    const changedByUser = changedByResult[0];

    // Start transaction
    await isanzureQuery('START TRANSACTION');

    try {
      let encryptedAccountNumber = null;
      let encryptedPhoneNumber = null;
      let encryptedAccountName = null;
      
      if (method === 'bk' || method === 'equity') {
        const accountNumberClean = accountNumber.replace(/\s/g, '');
        encryptedAccountNumber = JSON.stringify(encryptWithUserKey(accountNumberClean, pin));
        encryptedAccountName = JSON.stringify(encryptWithUserKey(accountName.trim(), pin));
      } else {
        const phoneNumberClean = phoneNumber.replace(/\s/g, '');
        encryptedPhoneNumber = JSON.stringify(encryptWithUserKey(phoneNumberClean, pin));
        encryptedAccountName = JSON.stringify(encryptWithUserKey(accountName.trim(), pin));
      }

      // Mark all current withdrawal accounts as not current
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
        user.id,
        method,
        encryptedAccountName,
        encryptedAccountNumber,
        encryptedPhoneNumber,
        bankName,
        changedByUser.id,
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
        encryptedAccountName,
        encryptedAccountNumber,
        encryptedPhoneNumber,
        bankName,
        changedByUser.id,
        user.id
      ]);

      await isanzureQuery('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Withdrawal account saved successfully',
        data: {
          method,
          bankName,
          verificationRequired: true
        }
      });

    } catch (error) {
      await isanzureQuery('ROLLBACK');
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

// 9. Delete withdrawal account
exports.deleteWithdrawalAccount = async (req, res) => {
  try {
    const { pin } = req.body;
    const oliviuus_user_id = req.user.id;

    const userSql = 'SELECT id, has_pin, account_pin FROM users WHERE oliviuus_user_id = ?';
    const userResult = await isanzureQuery(userSql, [oliviuus_user_id]);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

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

    await isanzureQuery('START TRANSACTION');

    try {
      const changedBySql = 'SELECT id FROM users WHERE oliviuus_user_id = ?';
      const changedByResult = await isanzureQuery(changedBySql, [oliviuus_user_id]);
      
      if (changedByResult.length === 0) {
        throw new Error('User not found');
      }
      
      const changedByUser = changedByResult[0];

      await isanzureQuery(`
        UPDATE withdrawal_account_history 
        SET is_current = FALSE, is_active = FALSE, deactivated_at = NOW()
        WHERE user_id = ? AND is_current = TRUE
      `, [user.id]);

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

      await isanzureQuery('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Withdrawal account deleted successfully'
      });

    } catch (error) {
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

// 10. Reveal sensitive withdrawal data with PIN
exports.revealWithdrawalData = async (req, res) => {
  try {
    const { pin } = req.body;
    const oliviuus_user_id = req.user.id;

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
        message: 'User not found'
      });
    }

    const user = userResult[0];

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

    const safeDecryptData = (encryptedData, userPin) => {
      if (!encryptedData) return null;
      
      try {
        const parsedData = JSON.parse(encryptedData);
        if (parsedData.iv && parsedData.content) {
          return decryptWithUserKey(parsedData, userPin);
        } else {
          return encryptedData;
        }
      } catch (jsonError) {
        console.log('Data is not JSON format, might be old hashed data');
        return '••••••••';
      }
    };

    let decryptedAccountName = null;
    let decryptedAccountNumber = null;
    let decryptedPhoneNumber = null;

    if (user.withdrawal_account_name) {
      decryptedAccountName = safeDecryptData(user.withdrawal_account_name, pin);
    }

    if (user.withdrawal_account_number) {
      decryptedAccountNumber = safeDecryptData(user.withdrawal_account_number, pin);
    }

    if (user.withdrawal_phone_number) {
      decryptedPhoneNumber = safeDecryptData(user.withdrawal_phone_number, pin);
    }

    res.status(200).json({
      success: true,
      data: {
        current: {
          method: user.withdrawal_method,
          accountName: decryptedAccountName,
          accountNumber: decryptedAccountNumber,
          phoneNumber: decryptedPhoneNumber
        },
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

// 11. Get withdrawal history
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user's isanzure ID
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

    // Format for response
    const formattedHistory = historyResult.map(record => ({
      uid: record.history_uid,
      withdrawal_method: record.withdrawal_method,
      method_display: record.withdrawal_method === 'bk' ? 'Bank of Kigali' : 
                     record.withdrawal_method === 'equity' ? 'Equity Bank' : 
                     record.withdrawal_method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money',
      account_name: record.account_name ? true : false, // Just indicate presence, not the actual encrypted data
      account_number: record.account_number ? true : false,
      phone_number: record.phone_number ? true : false,
      bank_name: record.bank_name,
      verification_status: record.verification_status || 'pending',
      verification_notes: record.verification_notes,
      verified_by_name: record.verified_by_name,
      verified_at: record.verified_at,
      changed_at: record.changed_at,
      is_current: record.is_current,
      is_active: record.is_active
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