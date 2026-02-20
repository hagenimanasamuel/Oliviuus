const { isanzureQuery } = require('../../config/isanzureDbConfig');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 👤 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 👤 ${message}`);
  }
};

// ============================================
// HELPER: GET DATABASE CONNECTION FOR TRANSACTIONS
// ============================================
const getConnection = () => {
  return new Promise((resolve, reject) => {
    const pool = require('../../config/isanzureDbConfig').isanzureDb;
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err);
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
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
        u.has_pin,
        u.account_pin,
        u.withdrawal_method,
        u.withdrawal_account_name,
        u.withdrawal_account_number,
        u.withdrawal_phone_number,
        u.withdrawal_bank_name,
        u.withdrawal_verified,
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
// 1. REQUEST WITHDRAWAL - TENANT (5% FEE)
// ============================================
exports.requestWithdrawal = async (req, res) => {
  let connection = null;
  
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // ✅ ENFORCE TENANT ONLY
    if (user.user_type !== 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Only tenants can access this endpoint',
        code: 'TENANT_ONLY'
      });
    }

    const { 
      amount, 
      pin,
      notes 
    } = req.body;

    debugLog('Processing withdrawal request for tenant:', { user: user.id, amount });

    // Validation
    if (!amount || amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is 1,000 RWF',
        code: 'INVALID_AMOUNT'
      });
    }

    if (!pin || pin.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required and must be 4 digits',
        code: 'INVALID_PIN'
      });
    }

    // Get database connection for transaction
    const pool = require('../../config/isanzureDbConfig').isanzureDb;
    
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // First, verify PIN and check if user has withdrawal account
    const [userData] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT 
          u.id,
          u.user_type,
          u.has_pin,
          u.account_pin,
          u.withdrawal_method,
          u.withdrawal_account_name,
          u.withdrawal_account_number,
          u.withdrawal_phone_number,
          u.withdrawal_bank_name,
          u.withdrawal_verified
        FROM users u
        WHERE u.id = ?
        FOR UPDATE
      `, [user.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!userData) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Double-check user type (security)
    if (userData.user_type !== 'tenant') {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(403).json({
        success: false,
        message: 'Only tenants can request withdrawals',
        code: 'TENANT_ONLY'
      });
    }

    // Check if user has withdrawal account
    if (!userData.withdrawal_method) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: 'No refund account found. Please set up a refund account first.',
        code: 'NO_WITHDRAWAL_ACCOUNT'
      });
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, userData.account_pin);
    
    if (!isValidPin) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN',
        code: 'INVALID_PIN'
      });
    }

    // Get user's current balance
    const [balance] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, balance_amount, on_hold_amount
        FROM user_balances
        WHERE user_id = ?
        FOR UPDATE
      `, [user.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!balance) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: 'No balance found for user',
        code: 'NO_BALANCE'
      });
    }

    // Check if user has enough available balance
    const availableBalance = parseFloat(balance.balance_amount) || 0;
    
    if (availableBalance < amount) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${availableBalance} RWF`,
        code: 'INSUFFICIENT_BALANCE',
        available: availableBalance
      });
    }

    // Check if user has any pending withdrawals (limit to 3)
    const [pendingCheck] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT COUNT(*) as pending_count
        FROM withdrawals
        WHERE user_id = ? AND status IN ('pending', 'processing')
      `, [user.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (pendingCheck && pendingCheck.pending_count >= 3) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: 'You have too many pending withdrawals. Please wait for them to be processed.',
        code: 'TOO_MANY_PENDING'
      });
    }

    // ✅ 5% FEE FOR TENANTS
    const feePercentage = 5.00;
    const feeAmount = Math.round(amount * (feePercentage / 100));
    const netAmount = amount - feeAmount;

    // Store account details - just method for reference (actual details from users table)
    const accountDetails = {
      method: userData.withdrawal_method,
      bank_name: userData.withdrawal_bank_name
    };

    // Create withdrawal request with fee information
    const withdrawalResult = await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO withdrawals (
          withdrawal_uid,
          user_id,
          amount,
          fee_percentage,
          fee_amount,
          net_amount,
          withdrawal_method,
          account_details,
          status,
          notes,
          requested_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
      `, [
        user.id,
        amount,
        feePercentage,
        feeAmount,
        netAmount,
        userData.withdrawal_method,
        JSON.stringify(accountDetails),
        notes || null
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const withdrawalId = withdrawalResult.insertId;

    // Update user balance - deduct full amount
    const previousBalance = parseFloat(balance.balance_amount) || 0;
    const newBalance = previousBalance - amount;

    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE user_balances 
        SET 
          balance_amount = ?,
          updated_at = NOW()
        WHERE user_id = ?
      `, [newBalance, user.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Log balance history
    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO balance_history (
          history_uid,
          user_id,
          previous_balance,
          new_balance,
          change_amount,
          change_type,
          reason,
          metadata,
          created_at
        ) VALUES (UUID(), ?, ?, ?, ?, 'debit', ?, ?, NOW())
      `, [
        user.id,
        previousBalance,
        newBalance,
        -amount,
        `Withdrawal request #${withdrawalId}`,
        JSON.stringify({
          withdrawal_id: withdrawalId,
          amount: amount,
          fee_percentage: feePercentage,
          fee_amount: feeAmount,
          net_amount: netAmount,
          user_type: 'tenant',
          status: 'pending'
        })
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Create alert for withdrawal initiation
    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO balance_alerts (
          alert_uid,
          user_id,
          threshold_amount,
          current_balance,
          alert_type,
          status,
          metadata,
          created_at
        ) VALUES (UUID(), ?, ?, ?, 'withdrawal_initiated', 'triggered', ?, NOW())
      `, [
        user.id,
        amount,
        newBalance,
        JSON.stringify({
          withdrawal_id: withdrawalId,
          amount: amount,
          fee_percentage: feePercentage,
          fee_amount: feeAmount,
          net_amount: netAmount,
          user_type: 'tenant',
          message: `Withdrawal of ${amount} RWF requested (${feePercentage}% fee: ${feeAmount} RWF, You'll receive: ${netAmount} RWF)`
        })
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Commit transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    connection.release();

    // Get the created withdrawal for response
    const withdrawal = await isanzureQuery(`
      SELECT 
        withdrawal_uid,
        amount,
        fee_percentage,
        fee_amount,
        net_amount,
        withdrawal_method,
        status,
        requested_at
      FROM withdrawals
      WHERE id = ?
    `, [withdrawalId]);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawal: {
          uid: withdrawal[0].withdrawal_uid,
          amount: parseFloat(withdrawal[0].amount),
          fee_percentage: parseFloat(withdrawal[0].fee_percentage),
          fee_amount: parseFloat(withdrawal[0].fee_amount),
          net_amount: parseFloat(withdrawal[0].net_amount),
          method: withdrawal[0].withdrawal_method,
          status: withdrawal[0].status,
          requested_at: withdrawal[0].requested_at
        },
        new_balance: newBalance,
        fee_explanation: `A ${feePercentage}% tenant fee (${feeAmount} RWF) was deducted. You will receive ${netAmount} RWF.`
      }
    });

  } catch (error) {
    debugLog('Error requesting withdrawal:', error.message);
    
    if (connection) {
      await new Promise((resolve) => {
        connection.rollback(() => resolve());
      });
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to request withdrawal',
      code: 'WITHDRAWAL_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 2. GET WITHDRAWAL HISTORY (TENANT)
// ============================================
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // ✅ ENFORCE TENANT ONLY
    if (user.user_type !== 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Only tenants can access withdrawal history',
        code: 'TENANT_ONLY'
      });
    }

    const { 
      status = 'all',
      page = 1, 
      limit = 10 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE w.user_id = ?';
    const params = [user.id];

    if (status && status !== 'all') {
      whereClause += ' AND w.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await isanzureQuery(`
      SELECT COUNT(*) as total
      FROM withdrawals w
      ${whereClause}
    `, params);

    const total = countResult[0]?.total || 0;

    // Get withdrawals with user info
    const withdrawals = await isanzureQuery(`
      SELECT 
        w.withdrawal_uid,
        w.amount,
        w.fee_percentage,
        w.fee_amount,
        w.net_amount,
        w.withdrawal_method,
        w.status,
        w.requested_at,
        w.processed_at,
        w.notes,
        
        -- Get account details from users table
        u.withdrawal_account_name,
        u.withdrawal_account_number,
        u.withdrawal_phone_number,
        u.withdrawal_bank_name,
        
        -- Get user's full name from SSO
        CONCAT(COALESCE(sso.first_name, ''), ' ', COALESCE(sso.last_name, '')) as user_full_name,
        sso.email as user_email,
        sso.phone as user_phone,
        
        -- Processed by admin info
        CONCAT(COALESCE(sso_admin.first_name, ''), ' ', COALESCE(sso_admin.last_name, '')) as processed_by_name
        
      FROM withdrawals w
      INNER JOIN users u ON w.user_id = u.id
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      LEFT JOIN users admin ON w.processed_by_admin_id = admin.id
      LEFT JOIN oliviuus_db.users sso_admin ON admin.oliviuus_user_id = sso_admin.id
      ${whereClause}
      ORDER BY w.requested_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get summary by status
    const summary = await isanzureQuery(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM(fee_amount) as total_fees,
        SUM(net_amount) as total_net
      FROM withdrawals
      WHERE user_id = ?
      GROUP BY status
    `, [user.id]);

    res.status(200).json({
      success: true,
      data: {
        withdrawals: withdrawals.map(w => ({
          uid: w.withdrawal_uid,
          amount: parseFloat(w.amount),
          fee_percentage: parseFloat(w.fee_percentage),
          fee_amount: parseFloat(w.fee_amount),
          net_amount: parseFloat(w.net_amount),
          method: w.withdrawal_method,
          method_display: w.withdrawal_method === 'bk' ? 'Bank of Kigali' : 
                         w.withdrawal_method === 'equity' ? 'Equity Bank' : 
                         w.withdrawal_method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money',
          status: w.status,
          requested_at: w.requested_at,
          processed_at: w.processed_at,
          processed_by: w.processed_by_name,
          user: {
            full_name: w.user_full_name || 'Tenant',
            email: w.user_email,
            phone: w.user_phone
          },
          account_details: {
            name: w.withdrawal_account_name ? true : false,
            number: w.withdrawal_account_number ? true : false,
            phone: w.withdrawal_phone_number ? true : false,
            bank: w.withdrawal_bank_name
          },
          notes: w.notes
        })),
        summary: summary.map(s => ({
          status: s.status,
          count: parseInt(s.count),
          total_amount: parseFloat(s.total_amount) || 0,
          total_fees: parseFloat(s.total_fees) || 0,
          total_net: parseFloat(s.total_net) || 0
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    debugLog('Error fetching withdrawal history:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal history',
      code: 'WITHDRAWAL_HISTORY_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 3. CANCEL PENDING WITHDRAWAL
// ============================================
exports.cancelWithdrawal = async (req, res) => {
  let connection = null;
  
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { withdrawalUid } = req.params;

    if (!withdrawalUid) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal UID is required',
        code: 'MISSING_WITHDRAWAL_UID'
      });
    }

    debugLog('Cancelling withdrawal:', withdrawalUid);

    // Get database connection for transaction
    const pool = require('../../config/isanzureDbConfig').isanzureDb;
    
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get withdrawal details
    const [withdrawal] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, withdrawal_uid, amount, status
        FROM withdrawals
        WHERE withdrawal_uid = ? AND user_id = ?
        FOR UPDATE
      `, [withdrawalUid, user.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!withdrawal) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
        code: 'WITHDRAWAL_NOT_FOUND'
      });
    }

    // Check if withdrawal can be cancelled
    if (withdrawal.status !== 'pending') {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: `Cannot cancel withdrawal with status: ${withdrawal.status}`,
        code: 'INVALID_STATUS'
      });
    }

    // Get user's current balance
    const [balance] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, balance_amount
        FROM user_balances
        WHERE user_id = ?
        FOR UPDATE
      `, [user.id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Update withdrawal status
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE withdrawals 
        SET status = 'failed', notes = CONCAT(IFNULL(notes, ''), ' | Cancelled by user')
        WHERE id = ?
      `, [withdrawal.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Return money to available balance
    const previousBalance = parseFloat(balance.balance_amount) || 0;
    const newBalance = previousBalance + parseFloat(withdrawal.amount);

    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE user_balances 
        SET 
          balance_amount = ?,
          updated_at = NOW()
        WHERE user_id = ?
      `, [newBalance, user.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Log balance history
    await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO balance_history (
          history_uid,
          user_id,
          previous_balance,
          new_balance,
          change_amount,
          change_type,
          reason,
          metadata,
          created_at
        ) VALUES (UUID(), ?, ?, ?, ?, 'credit', ?, ?, NOW())
      `, [
        user.id,
        previousBalance,
        newBalance,
        withdrawal.amount,
        `Withdrawal cancelled #${withdrawal.id}`,
        JSON.stringify({
          withdrawal_id: withdrawal.id,
          amount: withdrawal.amount,
          reason: 'user_cancelled'
        })
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Commit transaction
    await new Promise((resolve, reject) => {
      connection.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    connection.release();

    res.status(200).json({
      success: true,
      message: 'Withdrawal cancelled successfully',
      data: {
        withdrawal_uid: withdrawalUid,
        refunded_amount: parseFloat(withdrawal.amount),
        new_balance: newBalance
      }
    });

  } catch (error) {
    debugLog('Error cancelling withdrawal:', error.message);
    
    if (connection) {
      await new Promise((resolve) => {
        connection.rollback(() => resolve());
      });
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to cancel withdrawal',
      code: 'CANCEL_FAILED',
      error: error.message
    });
  }
};

// ============================================
// GET USER TRANSACTIONS (TENANT)
// ============================================
exports.getUserTransactions = async (req, res) => {
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
      limit = 20,
      page = 1,
      status = 'all',
      type = 'all'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE (t.from_user_id = ? OR t.to_user_id = ?)';
    const params = [user.id, user.id];

    if (status && status !== 'all') {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      whereClause += ' AND t.transaction_type = ?';
      params.push(type);
    }

    // Get total count
    const countResult = await isanzureQuery(`
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `, params);

    const total = countResult[0]?.total || 0;

    // Get transactions with user info
    const transactions = await isanzureQuery(`
      SELECT 
        t.transaction_uid,
        t.amount,
        t.currency_code,
        t.transaction_type,
        t.status,
        t.payment_method,
        t.gateway_data,
        t.notes,
        t.created_at,
        t.completed_at,
        
        -- From user info
        fu.id as from_user_id,
        fu.user_uid as from_user_uid,
        CONCAT(COALESCE(sso_from.first_name, ''), ' ', COALESCE(sso_from.last_name, '')) as from_user_name,
        
        -- To user info
        tu.id as to_user_id,
        tu.user_uid as to_user_uid,
        CONCAT(COALESCE(sso_to.first_name, ''), ' ', COALESCE(sso_to.last_name, '')) as to_user_name,
        
        -- Related booking
        b.booking_uid,
        b.payment_reference,
        p.title as property_title
        
      FROM transactions t
      LEFT JOIN users fu ON t.from_user_id = fu.id
      LEFT JOIN oliviuus_db.users sso_from ON fu.oliviuus_user_id = sso_from.id
      LEFT JOIN users tu ON t.to_user_id = tu.id
      LEFT JOIN oliviuus_db.users sso_to ON tu.oliviuus_user_id = sso_to.id
      LEFT JOIN bookings b ON t.booking_id = b.id
      LEFT JOIN properties p ON b.property_id = p.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Format transactions
    const formattedTransactions = transactions.map(t => {
      // Determine if user is sender or receiver
      const isSender = t.from_user_id === user.id;
      const isReceiver = t.to_user_id === user.id;
      
      // Parse gateway data if exists
      let gatewayData = null;
      try {
        if (t.gateway_data) {
          gatewayData = typeof t.gateway_data === 'string' 
            ? JSON.parse(t.gateway_data) 
            : t.gateway_data;
        }
      } catch (e) {
        console.error('Error parsing gateway_data:', e);
      }

      // Parse notes - handle both JSON and plain text
      let notes = null;
      try {
        if (t.notes) {
          // Try to parse as JSON first
          notes = JSON.parse(t.notes);
        }
      } catch (e) {
        // If parsing fails, it's plain text - use it as a string
        notes = { description: t.notes };
      }

      // Extract property title from various sources
      let propertyTitle = t.property_title;
      if (!propertyTitle && notes?.property_title) {
        propertyTitle = notes.property_title;
      }
      if (!propertyTitle && notes?.booking_uid) {
        propertyTitle = `Booking #${notes.booking_uid.substring(0, 8)}`;
      }

      return {
        uid: t.transaction_uid,
        amount: parseFloat(t.amount),
        currency: t.currency_code || 'RWF',
        type: t.transaction_type,
        status: t.status,
        payment_method: t.payment_method,
        direction: isSender ? 'debit' : (isReceiver ? 'credit' : 'unknown'),
        counterparty: {
          id: isSender ? t.to_user_id : t.from_user_id,
          uid: isSender ? t.to_user_uid : t.from_user_uid,
          name: isSender ? t.to_user_name : t.from_user_name
        },
        booking: t.booking_uid ? {
          uid: t.booking_uid,
          reference: t.payment_reference,
          property: propertyTitle
        } : null,
        gateway_data: gatewayData,
        notes: notes,
        description: typeof t.notes === 'string' && !t.notes.startsWith('{') 
          ? t.notes 
          : (notes?.description || `${t.transaction_type} payment`),
        created_at: t.created_at,
        completed_at: t.completed_at
      };
    });

    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      code: 'TRANSACTIONS_FETCH_FAILED',
      error: error.message
    });
  }
};