/**
 * 🛣️ Payment Routes - Combined MoMo + Card
 */

const express = require('express');
const router = express.Router();
const momoPaymentController = require('../controllers/paymentController');

// Check if we need to import the card payment controller
let cardPaymentController;
try {
  cardPaymentController = require('../controllers/paymentControllerCard');
} catch (error) {
  console.warn('⚠️ Card payment controller not found, card payments will be disabled');
  cardPaymentController = null;
}

const authMiddleware = require('../middlewares/authMiddleware');
const { query } = require('../config/dbConfig');

// 🔐 MoMo Payment Routes (existing - keep as is)
router.post('/initiate', authMiddleware, momoPaymentController.initiatePayment);
router.get('/status/:referenceId', authMiddleware, momoPaymentController.checkPaymentStatus);

// 💳 Card Payment Routes (only if controller exists)
if (cardPaymentController) {
  router.post('/initiate-card', authMiddleware, cardPaymentController.initiateCardPayment);
  router.get('/card/track/:ref', authMiddleware, cardPaymentController.trackCardTransaction);
  router.post('/card-webhook', cardPaymentController.handleCardWebhook);
  router.get('/card-callback', cardPaymentController.handleCardCallback);
  
  // Optional stats endpoint
  router.get('/card/stats', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;

      const stats = await query(
        `SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
          SUM(CASE WHEN status = 'completed' THEN fee_amount ELSE 0 END) as total_fees,
          SUM(CASE WHEN status = 'completed' THEN net_amount ELSE 0 END) as total_net_amount
        FROM payment_transactions 
        WHERE user_id = ? AND provider = 'card'`,
        [userId]
      );

      // Calculate average fee percentage
      const avgFeePercentage = stats[0]?.total_amount > 0 
        ? Math.round((stats[0]?.total_fees / stats[0]?.total_amount) * 100)
        : 0;

      res.json({
        success: true,
        data: {
          totalPayments: stats[0]?.total_payments || 0,
          totalAmount: stats[0]?.total_amount || 0,
          totalFees: stats[0]?.total_fees || 0,
          totalNetAmount: stats[0]?.total_net_amount || 0,
          avgFeePercentage: avgFeePercentage
        }
      });

    } catch (error) {
      console.error('❌ Error getting payment stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment statistics'
      });
    }
  });
} else {
  console.log('ℹ️ Card payment routes disabled - controller not available');
}

// 🌐 Payment Callbacks (no auth needed)
router.post('/callback', momoPaymentController.handleCallback); // MoMo callback

// 🔄 Manual Status Update (for testing/admin)
router.post('/manual-update/:referenceId', authMiddleware, async (req, res) => {
  try {
    const { referenceId } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Check if payment exists and belongs to user
    const payments = await query(
      'SELECT id FROM payment_transactions WHERE provider_transaction_id = ? AND user_id = ?',
      [referenceId, req.user.id]
    );

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await query(
      'UPDATE payment_transactions SET status = ?, updated_at = UTC_TIMESTAMP() WHERE provider_transaction_id = ?',
      [status, referenceId]
    );

    res.json({
      success: true,
      message: `Payment status updated to ${status}`
    });

  } catch (error) {
    console.error('Manual update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status'
    });
  }
});

// 📊 All Payment History
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, method } = req.query;
    
    let queryStr = `
      SELECT pt.*, 
             u.email as user_email,
             u.name as user_name,
             s.name as subscription_name,
             s.type as subscription_type
      FROM payment_transactions pt
      LEFT JOIN users u ON pt.user_id = u.id
      LEFT JOIN subscriptions s ON pt.subscription_id = s.id
      WHERE pt.user_id = ?
    `;
    
    const params = [req.user.id];
    
    if (status && ['pending', 'completed', 'failed'].includes(status)) {
      queryStr += ' AND pt.status = ?';
      params.push(status);
    }
    
    if (method && ['momo', 'card'].includes(method)) {
      queryStr += ' AND pt.provider = ?';
      params.push(method);
    }
    
    queryStr += ' ORDER BY pt.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const payments = await query(queryStr, params);
    const total = await query(
      'SELECT COUNT(*) as count FROM payment_transactions WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total: total[0]?.count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history'
    });
  }
});

// 🏥 Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payment service is running',
    timestamp: new Date().toISOString(),
    features: {
      momo: true,
      card: cardPaymentController !== null
    }
  });
});

module.exports = router;