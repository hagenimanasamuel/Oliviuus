// backend/routes/isanzure/landlordBalanceController.js
const express = require('express');
const router = express.Router();
const balanceController = require('../../controllers/isanzure/landlordBalanceController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// 💰 BALANCE ROUTES
// ============================================

// Get user's current balance
router.get('/', balanceController.getUserBalance);

// Get balance history with filters
router.get('/history', balanceController.getBalanceHistory);

// Get balance statistics
router.get('/stats', balanceController.getBalanceStats);

// Get pending transactions
router.get('/pending', balanceController.getPendingTransactions);

// Get withdrawal history
router.get('/withdrawals', balanceController.getWithdrawalHistory);

// Request withdrawal
router.post('/withdraw', balanceController.requestWithdrawal);

// Cancel pending withdrawal
router.post('/withdrawals/:withdrawalUid/cancel', balanceController.cancelWithdrawal);

// Get balance alerts
router.get('/alerts', balanceController.getUserAlerts);

// Mark alert as resolved
router.patch('/alerts/:alertUid/resolve', balanceController.resolveAlert);

// ============================================
// 🔒 ADMIN ROUTES (Add admin middleware later)
// ============================================

// Freeze user balance (admin only)
router.post('/admin/freeze', balanceController.freezeUserBalance);

// Unfreeze user balance (admin only)
router.post('/admin/unfreeze/:freezeUid', balanceController.unfreezeUserBalance);

// Process withdrawal (admin only)
router.post('/admin/withdrawals/:withdrawalUid/process', balanceController.processWithdrawal);

// Get all frozen balances (admin only)
router.get('/admin/frozen', balanceController.getFrozenBalances);

module.exports = router;