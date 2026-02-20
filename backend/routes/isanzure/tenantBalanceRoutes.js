const express = require('express');
const router = express.Router();
const tenantBalanceController = require('../../controllers/isanzure/tenantBalanceController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// 👤 TENANT BALANCE ROUTES
// ============================================

// Request withdrawal (with 5% fee)
router.post('/withdraw', tenantBalanceController.requestWithdrawal);

// Get withdrawal history
router.get('/withdrawals', tenantBalanceController.getWithdrawalHistory);

// Cancel pending withdrawal
router.post('/withdrawals/:withdrawalUid/cancel', tenantBalanceController.cancelWithdrawal);

// Get user transactions (rent payments, etc.)
router.get('/transactions', tenantBalanceController.getUserTransactions);

module.exports = router;