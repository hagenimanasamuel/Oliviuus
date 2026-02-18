// backend/routes/isanzure/landlordTenantRoutes.js
const express = require('express');
const router = express.Router();
const landlordTenantController = require('../../controllers/isanzure/landlordTenantController');
const authMiddleware = require('../../middlewares/authMiddleware');

// All routes require authentication and landlord access
router.use(authMiddleware);

// ============================================
// 👥 TENANT MANAGEMENT
// ============================================

// Get tenant statistics
router.get('/stats', landlordTenantController.getTenantStats);

// Get all tenants (with filters)
router.get('/', landlordTenantController.getTenants);

// Get single tenant details
router.get('/:tenantId', landlordTenantController.getTenantDetails);

// Get tenant stay history
router.get('/:tenantId/history', landlordTenantController.getTenantHistory);

// Send message to tenant
router.post('/:tenantId/message', landlordTenantController.sendMessageToTenant);

// Export tenants data
router.get('/export/data', landlordTenantController.exportTenants);

module.exports = router;