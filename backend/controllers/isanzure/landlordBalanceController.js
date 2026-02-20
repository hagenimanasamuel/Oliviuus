// backend/controllers/isanzure/landlordBalanceController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const mysql = require('mysql2');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 💰 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 💰 ${message}`);
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
// HELPER: GET USER'S PENDING BALANCE TOTAL
// ============================================
const getUserPendingTotal = async (userId) => {
  try {
    const result = await isanzureQuery(`
      SELECT COALESCE(SUM(amount), 0) as total_pending
      FROM pending_balances
      WHERE user_id = ? AND status = 'pending'
    `, [userId]);
    
    return parseFloat(result[0]?.total_pending || 0);
  } catch (error) {
    debugLog('Error getting user pending total:', error.message);
    return 0;
  }
};

// ============================================
// HELPER: GET USER'S PENDING WITHDRAWALS TOTAL
// ============================================
const getUserPendingWithdrawalsTotal = async (userId) => {
  try {
    const result = await isanzureQuery(`
      SELECT COALESCE(SUM(amount), 0) as total_withdrawals_pending
      FROM withdrawals
      WHERE user_id = ? AND status IN ('pending', 'processing')
    `, [userId]);
    
    return parseFloat(result[0]?.total_withdrawals_pending || 0);
  } catch (error) {
    debugLog('Error getting pending withdrawals total:', error.message);
    return 0;
  }
};

// ============================================
// HELPER: GET USER'S PENDING BALANCES DETAILS
// ============================================
const getUserPendingBalances = async (userId) => {
  try {
    return await isanzureQuery(`
      SELECT 
        pending_uid,
        source_type,
        source_reference_type,
        source_reference_id,
        source_reference_uid,
        amount,
        pending_type,
        description,
        reason,
        pending_since
      FROM pending_balances
      WHERE user_id = ? AND status = 'pending'
      ORDER BY pending_since DESC
    `, [userId]);
  } catch (error) {
    debugLog('Error getting user pending balances:', error.message);
    return [];
  }
};

// ============================================
// HELPER: LOG BALANCE HISTORY
// ============================================
const logBalanceHistory = async (connection, userId, transactionId, previousBalance, newBalance, changeType, reason, metadata = null) => {
  const changeAmount = newBalance - previousBalance;
  
  await new Promise((resolve, reject) => {
    connection.query(`
      INSERT INTO balance_history (
        history_uid,
        user_id,
        transaction_id,
        previous_balance,
        new_balance,
        change_amount,
        change_type,
        reason,
        metadata,
        created_at
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      userId,
      transactionId,
      previousBalance,
      newBalance,
      changeAmount,
      changeType,
      reason,
      metadata ? JSON.stringify(metadata) : null
    ], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ============================================
// HELPER: CHECK AND CREATE BALANCE ALERTS
// ============================================
const checkAndCreateAlert = async (userId, currentBalance, alertType, metadata = null) => {
  try {
    // Check if user has any low balance threshold settings (you can add this later)
    // For now, create alert if balance is below 5000 RWF
    if (alertType === 'low_balance' && currentBalance < 5000) {
      await isanzureQuery(`
        INSERT INTO balance_alerts (
          alert_uid,
          user_id,
          threshold_amount,
          current_balance,
          alert_type,
          status,
          metadata,
          created_at
        ) VALUES (UUID(), ?, ?, ?, 'low_balance', 'triggered', ?, NOW())
      `, [userId, 5000, currentBalance, metadata ? JSON.stringify(metadata) : null]);
      
      debugLog(`Low balance alert created for user ${userId}: ${currentBalance}`);
    }
    
    // Check for large deposit (over 100,000 RWF)
    if (alertType === 'large_deposit' && currentBalance > 100000) {
      await isanzureQuery(`
        INSERT INTO balance_alerts (
          alert_uid,
          user_id,
          threshold_amount,
          current_balance,
          alert_type,
          status,
          metadata,
          created_at
        ) VALUES (UUID(), ?, ?, ?, 'large_deposit', 'triggered', ?, NOW())
      `, [userId, 100000, currentBalance, metadata ? JSON.stringify(metadata) : null]);
    }
  } catch (error) {
    debugLog('Error creating alert:', error.message);
  }
};

// ============================================
// 1. GET USER'S CURRENT BALANCE - UPDATED
// ============================================
exports.getUserBalance = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // This endpoint can work for both landlords and tenants
    // but we'll log which type is accessing
    debugLog(`Fetching balance for ${user.user_type}:`, user.id);

    // Get user balance from user_balances table
    const balanceResult = await isanzureQuery(`
      SELECT 
        ub.id,
        ub.balance_amount,
        ub.on_hold_amount,
        ub.currency_code,
        ub.updated_at,
        
        -- Get pending withdrawals count
        (SELECT COUNT(*) FROM withdrawals 
         WHERE user_id = ub.user_id 
         AND status IN ('pending', 'processing')) as pending_withdrawals_count,
        
        -- Get total pending withdrawal amount
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals 
         WHERE user_id = ub.user_id 
         AND status IN ('pending', 'processing')) as pending_withdrawals_amount,
        
        -- Get recent transactions count (last 30 days)
        (SELECT COUNT(*) FROM transactions 
         WHERE (from_user_id = ub.user_id OR to_user_id = ub.user_id)
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as recent_transactions
         
      FROM user_balances ub
      WHERE ub.user_id = ?
    `, [user.id]);

    let balance = balanceResult[0];

    // If no balance record exists, create one
    if (!balance) {
      await isanzureQuery(`
        INSERT INTO user_balances (
          user_id,
          balance_amount,
          on_hold_amount,
          currency_code,
          updated_at
        ) VALUES (?, 0.00, 0.00, 'RWF', NOW())
      `, [user.id]);

      balance = {
        balance_amount: 0,
        on_hold_amount: 0,
        currency_code: 'RWF',
        updated_at: new Date(),
        pending_withdrawals_count: 0,
        pending_withdrawals_amount: 0,
        recent_transactions: 0
      };
    }

    // Get pending balances from pending_balances table
    const pendingTotal = await getUserPendingTotal(user.id);
    
    // Get pending balances details
    const pendingBalances = await getUserPendingBalances(user.id);

    // Check if user has any frozen balances
    const frozenResult = await isanzureQuery(`
      SELECT 
        COUNT(*) as frozen_count,
        COALESCE(SUM(frozen_amount), 0) as total_frozen
      FROM balance_freeze_log
      WHERE user_id = ? AND status = 'frozen'
    `, [user.id]);

    const frozen = frozenResult[0] || { frozen_count: 0, total_frozen: 0 };

    res.status(200).json({
      success: true,
      data: {
        current: {
          available: parseFloat(balance.balance_amount) || 0,
          pending: pendingTotal,
          on_hold: parseFloat(balance.on_hold_amount) || 0,
          frozen: parseFloat(frozen.total_frozen) || 0,
          total: (parseFloat(balance.balance_amount) || 0) + 
                 pendingTotal + 
                 (parseFloat(balance.on_hold_amount) || 0)
        },
        currency: balance.currency_code || 'RWF',
        last_updated: balance.updated_at,
        stats: {
          pending_withdrawals: parseInt(balance.pending_withdrawals_count) || 0,
          pending_withdrawal_amount: parseFloat(balance.pending_withdrawals_amount) || 0,
          recent_transactions: parseInt(balance.recent_transactions) || 0,
          frozen_balances: parseInt(frozen.frozen_count) || 0,
          pending_balances_count: pendingBalances.length
        },
        pending_balances: pendingBalances.map(pb => ({
          uid: pb.pending_uid,
          amount: parseFloat(pb.amount),
          type: pb.pending_type,
          source: pb.source_type,
          description: pb.description,
          reason: pb.reason,
          since: pb.pending_since,
          reference: {
            type: pb.source_reference_type,
            id: pb.source_reference_id,
            uid: pb.source_reference_uid
          }
        }))
      }
    });

  } catch (error) {
    debugLog('Error fetching user balance:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance',
      code: 'BALANCE_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 2. GET BALANCE HISTORY WITH FILTERS
// ============================================
exports.getBalanceHistory = async (req, res) => {
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
      change_type,
      days = 30,
      page = 1, 
      limit = 20,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    let whereClause = 'WHERE bh.user_id = ? AND bh.created_at >= ?';
    const params = [user.id, dateLimit];

    if (change_type && change_type !== 'all') {
      whereClause += ' AND bh.change_type = ?';
      params.push(change_type);
    }

    // Get total count
    const countResult = await isanzureQuery(`
      SELECT COUNT(*) as total
      FROM balance_history bh
      ${whereClause}
    `, params);

    const total = countResult[0]?.total || 0;

    // Get history with transaction details
    const history = await isanzureQuery(`
      SELECT 
        bh.id,
        bh.history_uid,
        bh.previous_balance,
        bh.new_balance,
        bh.change_amount,
        bh.change_type,
        bh.reason,
        bh.metadata,
        bh.created_at,
        
        t.transaction_uid,
        t.amount as transaction_amount,
        t.transaction_type,
        t.status as transaction_status,
        t.payment_method,
        t.from_user_id,
        t.to_user_id
        
      FROM balance_history bh
      LEFT JOIN transactions t ON bh.transaction_id = t.id
      ${whereClause}
      ORDER BY bh.${sort} ${order}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Get summary by change type
    const summary = await isanzureQuery(`
      SELECT 
        change_type,
        COUNT(*) as count,
        SUM(change_amount) as total_amount,
        SUM(CASE WHEN change_amount > 0 THEN change_amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN change_amount < 0 THEN ABS(change_amount) ELSE 0 END) as total_debits
      FROM balance_history bh
      ${whereClause}
      GROUP BY change_type
    `, params);

    // Get user names for from_user_id and to_user_id
    const formattedHistory = [];
    for (const h of history) {
      let fromUserName = null;
      let toUserName = null;
      
      if (h.from_user_id) {
        const fromUser = await isanzureQuery(`
          SELECT CONCAT(COALESCE(sso.first_name, ''), ' ', COALESCE(sso.last_name, '')) as full_name
          FROM users u
          LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
          WHERE u.id = ?
        `, [h.from_user_id]);
        fromUserName = fromUser[0]?.full_name || 'Unknown';
      }
      
      if (h.to_user_id) {
        const toUser = await isanzureQuery(`
          SELECT CONCAT(COALESCE(sso.first_name, ''), ' ', COALESCE(sso.last_name, '')) as full_name
          FROM users u
          LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
          WHERE u.id = ?
        `, [h.to_user_id]);
        toUserName = toUser[0]?.full_name || 'Unknown';
      }

      formattedHistory.push({
        uid: h.history_uid,
        previous_balance: parseFloat(h.previous_balance),
        new_balance: parseFloat(h.new_balance),
        change: {
          amount: parseFloat(h.change_amount),
          type: h.change_type,
          is_credit: parseFloat(h.change_amount) > 0,
          is_debit: parseFloat(h.change_amount) < 0
        },
        reason: h.reason,
        metadata: h.metadata ? JSON.parse(h.metadata) : null,
        created_at: h.created_at,
        transaction: h.transaction_uid ? {
          uid: h.transaction_uid,
          amount: parseFloat(h.transaction_amount),
          type: h.transaction_type,
          status: h.transaction_status,
          payment_method: h.payment_method,
          from: fromUserName,
          to: toUserName
        } : null
      });
    }

    res.status(200).json({
      success: true,
      data: {
        history: formattedHistory,
        summary: summary.map(s => ({
          type: s.change_type,
          count: parseInt(s.count),
          total: parseFloat(s.total_amount) || 0,
          credits: parseFloat(s.total_credits) || 0,
          debits: parseFloat(s.total_debits) || 0
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          has_more: total > (parseInt(page) * parseInt(limit))
        },
        filters_applied: {
          days: parseInt(days),
          change_type: change_type || 'all',
          date_from: dateLimit
        }
      }
    });

  } catch (error) {
    debugLog('Error fetching balance history:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance history',
      code: 'HISTORY_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 3. GET BALANCE STATISTICS - UPDATED
// ============================================
exports.getBalanceStats = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { days = 30 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    // ✅ NEW: Get pending balances total
    const pendingTotal = await getUserPendingTotal(user.id);
    const pendingWithdrawalsTotal = await getUserPendingWithdrawalsTotal(user.id);

    // Get overall statistics
    const stats = await isanzureQuery(`
      SELECT 
        -- Balance summary
        (SELECT balance_amount FROM user_balances WHERE user_id = ?) as current_balance,
        (SELECT on_hold_amount FROM user_balances WHERE user_id = ?) as on_hold_amount,
        
        -- Total credits in period
        (SELECT COALESCE(SUM(change_amount), 0)
         FROM balance_history
         WHERE user_id = ? 
           AND change_amount > 0
           AND created_at >= ?) as total_credits,
        
        -- Total debits in period
        (SELECT COALESCE(SUM(ABS(change_amount)), 0)
         FROM balance_history
         WHERE user_id = ? 
           AND change_amount < 0
           AND created_at >= ?) as total_debits,
        
        -- Transaction counts
        (SELECT COUNT(*) FROM balance_history
         WHERE user_id = ? AND created_at >= ?) as total_transactions,
        
        (SELECT COUNT(*) FROM balance_history
         WHERE user_id = ? AND change_amount > 0 AND created_at >= ?) as credit_count,
        
        (SELECT COUNT(*) FROM balance_history
         WHERE user_id = ? AND change_amount < 0 AND created_at >= ?) as debit_count,
        
        -- Average transaction
        (SELECT COALESCE(AVG(ABS(change_amount)), 0)
         FROM balance_history
         WHERE user_id = ? AND created_at >= ?) as avg_transaction,
        
        -- Largest transaction
        (SELECT COALESCE(MAX(ABS(change_amount)), 0)
         FROM balance_history
         WHERE user_id = ? AND created_at >= ?) as largest_transaction,
        
        -- Withdrawal stats
        (SELECT COUNT(*) FROM withdrawals
         WHERE user_id = ? AND requested_at >= ?) as withdrawal_count,
        
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals
         WHERE user_id = ? AND status = 'completed' AND requested_at >= ?) as total_withdrawn,
        
        -- Daily average
        (SELECT COALESCE(AVG(daily_total), 0)
         FROM (
           SELECT DATE(created_at) as day, SUM(ABS(change_amount)) as daily_total
           FROM balance_history
           WHERE user_id = ? AND created_at >= ?
           GROUP BY DATE(created_at)
         ) as daily) as avg_daily_activity
         
    `, [
      user.id, user.id,  // for current_balance, on_hold
      user.id, dateLimit,          // for total_credits
      user.id, dateLimit,          // for total_debits
      user.id, dateLimit,          // for total_transactions
      user.id, dateLimit,          // for credit_count
      user.id, dateLimit,          // for debit_count
      user.id, dateLimit,          // for avg_transaction
      user.id, dateLimit,          // for largest_transaction
      user.id, dateLimit,          // for withdrawal_count
      user.id, dateLimit,          // for total_withdrawn
      user.id, dateLimit           // for avg_daily_activity
    ]);

    const s = stats[0] || {};

    // Get daily breakdown for chart
    const daily = await isanzureQuery(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN change_amount > 0 THEN change_amount ELSE 0 END) as credits,
        SUM(CASE WHEN change_amount < 0 THEN ABS(change_amount) ELSE 0 END) as debits,
        COUNT(*) as transactions
      FROM balance_history
      WHERE user_id = ? AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [user.id, dateLimit]);

    res.status(200).json({
      success: true,
      data: {
        current: {
          available: parseFloat(s.current_balance) || 0,
          pending: pendingTotal, // ✅ Now from pending_balances
          on_hold: parseFloat(s.on_hold_amount) || 0,
          pending_withdrawals: pendingWithdrawalsTotal
        },
        period: {
          days: parseInt(days),
          from: dateLimit,
          to: new Date(),
          credits: {
            total: parseFloat(s.total_credits) || 0,
            count: parseInt(s.credit_count) || 0
          },
          debits: {
            total: parseFloat(s.total_debits) || 0,
            count: parseInt(s.debit_count) || 0
          },
          net_change: (parseFloat(s.total_credits) || 0) - (parseFloat(s.total_debits) || 0),
          transactions: parseInt(s.total_transactions) || 0,
          average: parseFloat(s.avg_transaction) || 0,
          largest: parseFloat(s.largest_transaction) || 0,
          daily_average: parseFloat(s.avg_daily_activity) || 0
        },
        withdrawals: {
          count: parseInt(s.withdrawal_count) || 0,
          total_withdrawn: parseFloat(s.total_withdrawn) || 0
        },
        daily_breakdown: daily.map(d => ({
          date: d.date,
          credits: parseFloat(d.credits) || 0,
          debits: parseFloat(d.debits) || 0,
          transactions: parseInt(d.transactions) || 0
        }))
      }
    });

  } catch (error) {
    debugLog('Error fetching balance stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance statistics',
      code: 'STATS_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 4. GET PENDING TRANSACTIONS - UPDATED
// ============================================
exports.getPendingTransactions = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Get pending transactions from transactions table
    const pending = await isanzureQuery(`
      SELECT 
        t.transaction_uid,
        t.amount,
        t.transaction_type,
        t.payment_method,
        t.created_at,
        t.notes,
        
        -- From user info
        fu.id as from_user_id,
        fu.user_uid as from_user_uid,
        CONCAT(COALESCE(sso_fu.first_name, ''), ' ', COALESCE(sso_fu.last_name, '')) as from_user_name,
        
        -- To user info
        tu.id as to_user_id,
        tu.user_uid as to_user_uid,
        CONCAT(COALESCE(sso_tu.first_name, ''), ' ', COALESCE(sso_tu.last_name, '')) as to_user_name,
        
        -- Related booking
        b.booking_uid,
        b.payment_reference as booking_reference
        
      FROM transactions t
      LEFT JOIN users fu ON t.from_user_id = fu.id
      LEFT JOIN oliviuus_db.users sso_fu ON fu.oliviuus_user_id = sso_fu.id
      LEFT JOIN users tu ON t.to_user_id = tu.id
      LEFT JOIN oliviuus_db.users sso_tu ON tu.oliviuus_user_id = sso_tu.id
      LEFT JOIN bookings b ON t.booking_id = b.id
      WHERE (t.from_user_id = ? OR t.to_user_id = ?)
        AND t.status = 'pending'
      ORDER BY t.created_at DESC
    `, [user.id, user.id]);

    // Get pending withdrawals
    const pendingWithdrawals = await isanzureQuery(`
      SELECT 
        w.withdrawal_uid,
        w.amount,
        w.withdrawal_method,
        w.status,
        w.requested_at,
        w.notes,
        JSON_UNQUOTE(JSON_EXTRACT(w.account_details, '$.account_name')) as account_name,
        JSON_UNQUOTE(JSON_EXTRACT(w.account_details, '$.phone_number')) as phone_number
      FROM withdrawals w
      WHERE w.user_id = ? AND w.status IN ('pending', 'processing')
      ORDER BY w.requested_at DESC
    `, [user.id]);

    // ✅ NEW: Get pending balances
    const pendingBalances = await getUserPendingBalances(user.id);

    res.status(200).json({
      success: true,
      data: {
        pending_transactions: pending.map(t => ({
          uid: t.transaction_uid,
          amount: parseFloat(t.amount),
          type: t.transaction_type,
          payment_method: t.payment_method,
          created_at: t.created_at,
          notes: t.notes ? JSON.parse(t.notes) : null,
          from: t.from_user_id === user.id ? 'You' : t.from_user_name,
          to: t.to_user_id === user.id ? 'You' : t.to_user_name,
          booking: t.booking_uid ? {
            uid: t.booking_uid,
            reference: t.booking_reference
          } : null
        })),
        pending_withdrawals: pendingWithdrawals.map(w => ({
          uid: w.withdrawal_uid,
          amount: parseFloat(w.amount),
          method: w.withdrawal_method,
          status: w.status,
          requested_at: w.requested_at,
          account_name: w.account_name,
          phone_number: w.phone_number,
          notes: w.notes
        })),
        pending_balances: pendingBalances.map(pb => ({
          uid: pb.pending_uid,
          amount: parseFloat(pb.amount),
          type: pb.pending_type,
          source: pb.source_type,
          description: pb.description,
          since: pb.pending_since
        }))
      }
    });

  } catch (error) {
    debugLog('Error fetching pending transactions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending transactions',
      code: 'PENDING_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 5. GET WITHDRAWAL HISTORY
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

    // ✅ ENFORCE LANDLORD ONLY
    if (user.user_type !== 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Only landlords can access withdrawal history',
        code: 'LANDLORD_ONLY'
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

    // Get withdrawals
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
        
        -- Processed by admin info
        CONCAT(COALESCE(sso_admin.first_name, ''), ' ', COALESCE(sso_admin.last_name, '')) as processed_by_name
        
      FROM withdrawals w
      INNER JOIN users u ON w.user_id = u.id
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
          status: w.status,
          requested_at: w.requested_at,
          processed_at: w.processed_at,
          processed_by: w.processed_by_name,
          account_details: {
            name: w.withdrawal_account_name,
            number: w.withdrawal_account_number ? `•••• ${w.withdrawal_account_number.slice(-4)}` : null,
            phone: w.withdrawal_phone_number,
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
// 6. REQUEST WITHDRAWAL - UPDATED
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

    // ✅ ENFORCE LANDLORD ONLY
    if (user.user_type !== 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Only landlords can request withdrawals',
        code: 'LANDLORD_ONLY'
      });
    }

    const { 
      amount, 
      pin,
      notes 
    } = req.body;

    debugLog('Processing withdrawal request for landlord:', { user: user.id, amount });

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
    if (userData.user_type !== 'landlord') {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(403).json({
        success: false,
        message: 'Only landlords can request withdrawals',
        code: 'LANDLORD_ONLY'
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
        message: 'No withdrawal account found. Please set up a withdrawal account first.',
        code: 'NO_WITHDRAWAL_ACCOUNT'
      });
    }

    // Verify PIN
    const bcrypt = require('bcryptjs');
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

    // ✅ FIXED 10% FEE FOR LANDLORDS
    const feePercentage = 10.00;
    const feeAmount = Math.round(amount * (feePercentage / 100));
    const netAmount = amount - feeAmount;

    // Store minimal account details - just method and reference
    const accountDetails = {
      method: userData.withdrawal_method,
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
          user_type: 'landlord',
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
          user_type: 'landlord',
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
        fee_explanation: `A ${feePercentage}% landlord fee (${feeAmount} RWF) was deducted. You will receive ${netAmount} RWF.`
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
// 7. CANCEL PENDING WITHDRAWAL - UPDATED
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

    // ✅ Return money to available balance (no more pending_amount)
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
    await logBalanceHistory(
      connection,
      user.id,
      null,
      previousBalance,
      newBalance,
      'credit',
      `Withdrawal cancelled #${withdrawal.id}`,
      {
        withdrawal_id: withdrawal.id,
        amount: withdrawal.amount,
        reason: 'user_cancelled'
      }
    );

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
// 8. GET USER ALERTS
// ============================================
exports.getUserAlerts = async (req, res) => {
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
      status = 'all',
      type = 'all',
      limit = 20
    } = req.query;

    let whereClause = 'WHERE user_id = ?';
    const params = [user.id];

    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      whereClause += ' AND alert_type = ?';
      params.push(type);
    }

    const alerts = await isanzureQuery(`
      SELECT 
        alert_uid,
        threshold_amount,
        current_balance,
        alert_type,
        status,
        sent_at,
        resolved_at,
        metadata,
        created_at
      FROM balance_alerts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ?
    `, [...params, parseInt(limit)]);

    // Get counts by status
    const counts = await isanzureQuery(`
      SELECT 
        status,
        COUNT(*) as count
      FROM balance_alerts
      WHERE user_id = ?
      GROUP BY status
    `, [user.id]);

    res.status(200).json({
      success: true,
      data: {
        alerts: alerts.map(a => ({
          uid: a.alert_uid,
          threshold: parseFloat(a.threshold_amount),
          current_balance: parseFloat(a.current_balance),
          type: a.alert_type,
          status: a.status,
          sent_at: a.sent_at,
          resolved_at: a.resolved_at,
          metadata: a.metadata ? JSON.parse(a.metadata) : null,
          created_at: a.created_at
        })),
        counts: counts.reduce((acc, c) => {
          acc[c.status] = parseInt(c.count);
          return acc;
        }, {})
      }
    });

  } catch (error) {
    debugLog('Error fetching user alerts:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      code: 'ALERTS_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 9. RESOLVE ALERT
// ============================================
exports.resolveAlert = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { alertUid } = req.params;

    if (!alertUid) {
      return res.status(400).json({
        success: false,
        message: 'Alert UID is required',
        code: 'MISSING_ALERT_UID'
      });
    }

    const result = await isanzureQuery(`
      UPDATE balance_alerts 
      SET status = 'resolved', resolved_at = NOW()
      WHERE alert_uid = ? AND user_id = ? AND status != 'resolved'
    `, [alertUid, user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found or already resolved',
        code: 'ALERT_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      data: {
        alert_uid: alertUid,
        resolved_at: new Date()
      }
    });

  } catch (error) {
    debugLog('Error resolving alert:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      code: 'ALERT_RESOLVE_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 10. FREEZE USER BALANCE (ADMIN)
// ============================================
exports.freezeUserBalance = async (req, res) => {
  let connection = null;
  
  try {
    const admin = await getAuthenticatedUser(req);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user is admin (you can implement proper admin check)
    if (admin.user_type !== 'admin' && admin.user_type !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    const { 
      user_uid, 
      amount, 
      reason 
    } = req.body;

    if (!user_uid) {
      return res.status(400).json({
        success: false,
        message: 'User UID is required',
        code: 'MISSING_USER_UID'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
        code: 'INVALID_AMOUNT'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
        code: 'MISSING_REASON'
      });
    }

    debugLog('Freezing user balance:', { admin: admin.id, target_user: user_uid, amount });

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

    // Get target user
    const [targetUser] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id FROM users WHERE user_uid = ?
      `, [user_uid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!targetUser) {
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

    // Get user's balance
    const [balance] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, balance_amount, on_hold_amount
        FROM user_balances
        WHERE user_id = ?
        FOR UPDATE
      `, [targetUser.id], (err, results) => {
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
        message: 'User has no balance',
        code: 'NO_BALANCE'
      });
    }

    // Check if enough balance to freeze
    if (parseFloat(balance.balance_amount) < amount) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${balance.balance_amount} RWF`,
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Create freeze record
    const freezeResult = await new Promise((resolve, reject) => {
      connection.query(`
        INSERT INTO balance_freeze_log (
          freeze_uid,
          user_id,
          frozen_by_admin_id,
          frozen_amount,
          reason,
          status,
          frozen_at
        ) VALUES (UUID(), ?, ?, ?, ?, 'frozen', NOW())
      `, [targetUser.id, admin.id, amount, reason], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Update user balance
    const previousBalance = parseFloat(balance.balance_amount) || 0;
    const previousOnHold = parseFloat(balance.on_hold_amount) || 0;
    const newBalance = previousBalance - amount;
    const newOnHold = previousOnHold + amount;

    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE user_balances 
        SET 
          balance_amount = ?,
          on_hold_amount = ?,
          updated_at = NOW()
        WHERE user_id = ?
      `, [newBalance, newOnHold, targetUser.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Log balance history
    await logBalanceHistory(
      connection,
      targetUser.id,
      null,
      previousBalance,
      newBalance,
      'hold',
      `Balance frozen by admin: ${reason}`,
      {
        freeze_id: freezeResult.insertId,
        frozen_by: admin.id,
        frozen_amount: amount,
        reason: reason
      }
    );

    // Create alert
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
        ) VALUES (UUID(), ?, ?, ?, 'payment_due', 'triggered', ?, NOW())
      `, [
        targetUser.id,
        amount,
        newBalance,
        JSON.stringify({
          freeze_id: freezeResult.insertId,
          frozen_amount: amount,
          reason: reason,
          message: `${amount} RWF has been frozen on your account`
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
      message: 'Balance frozen successfully',
      data: {
        freeze_uid: freezeResult.insertId,
        user_uid,
        frozen_amount: amount,
        new_balance: newBalance,
        on_hold: newOnHold
      }
    });

  } catch (error) {
    debugLog('Error freezing balance:', error.message);
    
    if (connection) {
      await new Promise((resolve) => {
        connection.rollback(() => resolve());
      });
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to freeze balance',
      code: 'FREEZE_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 11. UNFREEZE USER BALANCE (ADMIN)
// ============================================
exports.unfreezeUserBalance = async (req, res) => {
  let connection = null;
  
  try {
    const admin = await getAuthenticatedUser(req);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user is admin
    if (admin.user_type !== 'admin' && admin.user_type !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    const { freezeUid } = req.params;
    const { reason } = req.body;

    if (!freezeUid) {
      return res.status(400).json({
        success: false,
        message: 'Freeze UID is required',
        code: 'MISSING_FREEZE_UID'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Unfreeze reason is required',
        code: 'MISSING_REASON'
      });
    }

    debugLog('Unfreezing balance:', { admin: admin.id, freeze_uid: freezeUid });

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

    // Get freeze record
    const [freeze] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, user_id, frozen_amount, status
        FROM balance_freeze_log
        WHERE freeze_uid = ? AND status = 'frozen'
        FOR UPDATE
      `, [freezeUid], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!freeze) {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(404).json({
        success: false,
        message: 'Freeze record not found or already unfrozen',
        code: 'FREEZE_NOT_FOUND'
      });
    }

    // Get user's balance
    const [balance] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, balance_amount, on_hold_amount
        FROM user_balances
        WHERE user_id = ?
        FOR UPDATE
      `, [freeze.user_id], (err, results) => {
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
        message: 'User has no balance record',
        code: 'NO_BALANCE'
      });
    }

    // Update freeze record
    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE balance_freeze_log 
        SET 
          status = 'unfrozen',
          unfrozen_at = NOW(),
          unfrozen_by_admin_id = ?,
          unfreeze_reason = ?
        WHERE id = ?
      `, [admin.id, reason, freeze.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Update user balance
    const previousBalance = parseFloat(balance.balance_amount) || 0;
    const previousOnHold = parseFloat(balance.on_hold_amount) || 0;
    const frozenAmount = parseFloat(freeze.frozen_amount) || 0;
    const newBalance = previousBalance + frozenAmount;
    const newOnHold = previousOnHold - frozenAmount;

    await new Promise((resolve, reject) => {
      connection.query(`
        UPDATE user_balances 
        SET 
          balance_amount = ?,
          on_hold_amount = ?,
          updated_at = NOW()
        WHERE user_id = ?
      `, [newBalance, newOnHold, freeze.user_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Log balance history
    await logBalanceHistory(
      connection,
      freeze.user_id,
      null,
      previousBalance,
      newBalance,
      'release',
      `Balance unfrozen by admin: ${reason}`,
      {
        freeze_id: freeze.id,
        unfrozen_by: admin.id,
        unfrozen_amount: frozenAmount,
        reason: reason
      }
    );

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
      message: 'Balance unfrozen successfully',
      data: {
        freeze_uid: freezeUid,
        unfrozen_amount: frozenAmount,
        new_balance: newBalance,
        on_hold: newOnHold
      }
    });

  } catch (error) {
    debugLog('Error unfreezing balance:', error.message);
    
    if (connection) {
      await new Promise((resolve) => {
        connection.rollback(() => resolve());
      });
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to unfreeze balance',
      code: 'UNFREEZE_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 12. PROCESS WITHDRAWAL (ADMIN) - UPDATED
// ============================================
exports.processWithdrawal = async (req, res) => {
  let connection = null;
  
  try {
    const admin = await getAuthenticatedUser(req);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user is admin
    if (admin.user_type !== 'admin' && admin.user_type !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    const { withdrawalUid } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'

    if (!withdrawalUid) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal UID is required',
        code: 'MISSING_WITHDRAWAL_UID'
      });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action (approve/reject) is required',
        code: 'INVALID_ACTION'
      });
    }

    debugLog('Processing withdrawal:', { admin: admin.id, withdrawal_uid: withdrawalUid, action });

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

    // Get withdrawal details - include fee info
    const [withdrawal] = await new Promise((resolve, reject) => {
      connection.query(`
        SELECT id, user_id, amount, fee_amount, net_amount, status, withdrawal_method
        FROM withdrawals
        WHERE withdrawal_uid = ?
        FOR UPDATE
      `, [withdrawalUid], (err, results) => {
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

    if (withdrawal.status !== 'pending') {
      await new Promise((resolve, reject) => {
        connection.rollback(() => resolve());
      });
      connection.release();
      
      return res.status(400).json({
        success: false,
        message: `Cannot process withdrawal with status: ${withdrawal.status}`,
        code: 'INVALID_STATUS'
      });
    }

    if (action === 'approve') {
      // Approve withdrawal - record that fee was collected
      await new Promise((resolve, reject) => {
        connection.query(`
          UPDATE withdrawals 
          SET 
            status = 'completed',
            processed_by_admin_id = ?,
            processed_at = NOW(),
            notes = CONCAT(IFNULL(notes, ''), ' | ', ?)
          WHERE id = ?
        `, [admin.id, notes || 'Approved by admin', withdrawal.id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Create transaction record - show net amount as what user gets
      const transactionResult = await new Promise((resolve, reject) => {
        connection.query(`
          INSERT INTO transactions (
            transaction_uid,
            from_user_id,
            to_user_id,
            amount,
            transaction_type,
            status,
            payment_method,
            notes,
            created_at,
            completed_at
          ) VALUES (UUID(), ?, 1, ?, 'withdrawal', 'completed', ?, ?, NOW(), NOW())
        `, [
          withdrawal.user_id,
          withdrawal.amount, // Store full amount, but we have fee info in notes
          withdrawal.withdrawal_method,
          JSON.stringify({
            withdrawal_id: withdrawal.id,
            withdrawal_uid: withdrawalUid,
            processed_by: admin.id,
            full_amount: withdrawal.amount,
            fee_amount: withdrawal.fee_amount,
            net_amount: withdrawal.net_amount,
            fee_percentage: 10
          })
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Log balance history
      await logBalanceHistory(
        connection,
        withdrawal.user_id,
        transactionResult.insertId,
        0,
        0,
        'debit',
        `Withdrawal completed - Fee: ${withdrawal.fee_amount} RWF, Net: ${withdrawal.net_amount} RWF`,
        {
          withdrawal_id: withdrawal.id,
          amount: withdrawal.amount,
          fee_amount: withdrawal.fee_amount,
          net_amount: withdrawal.net_amount,
          status: 'completed'
        }
      );

    } else {
      // Reject withdrawal - return full amount (no fee charged)
      await new Promise((resolve, reject) => {
        connection.query(`
          UPDATE withdrawals 
          SET 
            status = 'rejected',
            processed_by_admin_id = ?,
            processed_at = NOW(),
            notes = CONCAT(IFNULL(notes, ''), ' | Rejected: ', ?)
          WHERE id = ?
        `, [admin.id, notes || 'Rejected by admin', withdrawal.id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Get user's balance
      const [balance] = await new Promise((resolve, reject) => {
        connection.query(`
          SELECT balance_amount
          FROM user_balances
          WHERE user_id = ?
          FOR UPDATE
        `, [withdrawal.user_id], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      // Return full amount to available balance (no fee deducted since it was pending)
      const previousBalance = parseFloat(balance.balance_amount) || 0;
      const newBalance = previousBalance + parseFloat(withdrawal.amount);

      await new Promise((resolve, reject) => {
        connection.query(`
          UPDATE user_balances 
          SET 
            balance_amount = ?,
            updated_at = NOW()
          WHERE user_id = ?
        `, [newBalance, withdrawal.user_id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Log balance history
      await logBalanceHistory(
        connection,
        withdrawal.user_id,
        null,
        previousBalance,
        newBalance,
        'credit',
        `Withdrawal rejected - full amount returned`,
        {
          withdrawal_id: withdrawal.id,
          amount: withdrawal.amount,
          status: 'rejected',
          reason: notes
        }
      );
    }

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
      message: `Withdrawal ${action}d successfully`,
      data: {
        withdrawal_uid: withdrawalUid,
        status: action === 'approve' ? 'completed' : 'rejected',
        processed_at: new Date(),
        fee_charged: action === 'approve' ? withdrawal.fee_amount : 0,
        net_paid: action === 'approve' ? withdrawal.net_amount : 0
      }
    });

  } catch (error) {
    debugLog('Error processing withdrawal:', error.message);
    
    if (connection) {
      await new Promise((resolve) => {
        connection.rollback(() => resolve());
      });
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      code: 'PROCESS_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 13. GET ALL FROZEN BALANCES (ADMIN)
// ============================================
exports.getFrozenBalances = async (req, res) => {
  try {
    const admin = await getAuthenticatedUser(req);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user is admin
    if (admin.user_type !== 'admin' && admin.user_type !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    const frozen = await isanzureQuery(`
      SELECT 
        bfl.freeze_uid,
        bfl.frozen_amount,
        bfl.reason,
        bfl.frozen_at,
        bfl.status,
        
        u.id as user_id,
        u.user_uid,
        CONCAT(COALESCE(sso.first_name, ''), ' ', COALESCE(sso.last_name, '')) as user_name,
        sso.profile_avatar_url as user_avatar,
        
        ub.balance_amount as current_balance,
        ub.on_hold_amount as current_on_hold,
        
        admin_u.id as admin_id,
        CONCAT(COALESCE(sso_admin.first_name, ''), ' ', COALESCE(sso_admin.last_name, '')) as frozen_by_name
        
      FROM balance_freeze_log bfl
      INNER JOIN users u ON bfl.user_id = u.id
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      LEFT JOIN users admin_u ON bfl.frozen_by_admin_id = admin_u.id
      LEFT JOIN oliviuus_db.users sso_admin ON admin_u.oliviuus_user_id = sso_admin.id
      WHERE bfl.status = 'frozen'
      ORDER BY bfl.frozen_at DESC
    `);

    // Get summary
    const summary = await isanzureQuery(`
      SELECT 
        COUNT(*) as total_frozen,
        COALESCE(SUM(frozen_amount), 0) as total_amount,
        COUNT(DISTINCT user_id) as unique_users
      FROM balance_freeze_log
      WHERE status = 'frozen'
    `);

    const s = summary[0] || {};

    res.status(200).json({
      success: true,
      data: {
        frozen: frozen.map(f => ({
          uid: f.freeze_uid,
          amount: parseFloat(f.frozen_amount),
          reason: f.reason,
          frozen_at: f.frozen_at,
          user: {
            uid: f.user_uid,
            name: f.user_name,
            avatar: f.user_avatar,
            current_balance: parseFloat(f.current_balance) || 0,
            current_on_hold: parseFloat(f.current_on_hold) || 0
          },
          frozen_by: f.frozen_by_name
        })),
        summary: {
          total_frozen: parseInt(s.total_frozen) || 0,
          total_amount: parseFloat(s.total_amount) || 0,
          unique_users: parseInt(s.unique_users) || 0
        }
      }
    });

  } catch (error) {
    debugLog('Error fetching frozen balances:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch frozen balances',
      code: 'FROZEN_FETCH_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 14. GET PENDING BALANCES DETAILS - NEW
// ============================================
exports.getPendingBalances = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const pendingBalances = await getUserPendingBalances(user.id);

    res.status(200).json({
      success: true,
      data: {
        pending_balances: pendingBalances.map(pb => ({
          uid: pb.pending_uid,
          amount: parseFloat(pb.amount),
          type: pb.pending_type,
          source: pb.source_type,
          description: pb.description,
          reason: pb.reason,
          since: pb.pending_since,
          reference: {
            type: pb.source_reference_type,
            id: pb.source_reference_id,
            uid: pb.source_reference_uid
          }
        }))
      }
    });

  } catch (error) {
    debugLog('Error fetching pending balances:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending balances',
      code: 'PENDING_BALANCES_FAILED',
      error: error.message
    });
  }
};

module.exports = exports;