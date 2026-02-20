const express = require('express');
const router = express.Router();
const tenantSettingsController = require('../../controllers/isanzure/tenantSettingsController');
const authMiddleware = require('../../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// 1. Get tenant account settings
router.get('/', tenantSettingsController.getTenantSettings);

// 2. Set/Update account PIN
router.post('/pin', tenantSettingsController.setAccountPin);

// 3. Verify PIN for sensitive operations
router.post('/verify-pin', tenantSettingsController.verifyPin);

// 4. Save public contact information
router.post('/contact', tenantSettingsController.saveContactInfo);

// 5. Get contact information
router.get('/contact', tenantSettingsController.getContactInfo);

// 6. Get PIN status
router.get('/pin-status', tenantSettingsController.getPinStatus);

// 7. Get wallet info (balance)
router.get('/wallet', tenantSettingsController.getWalletInfo);

// 8. Save withdrawal account
router.post('/withdrawal', tenantSettingsController.saveWithdrawalAccount);

// 9. Get withdrawal history - ADD THIS ROUTE
router.get('/withdrawal-history', tenantSettingsController.getWithdrawalHistory);

// 10. Delete withdrawal account
router.delete('/withdrawal', tenantSettingsController.deleteWithdrawalAccount);

// 11. Reveal sensitive withdrawal data with PIN
router.post('/reveal-withdrawal-data', tenantSettingsController.revealWithdrawalData);

module.exports = router;