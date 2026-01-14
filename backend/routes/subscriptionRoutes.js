const express = require("express");
const { query } = require('../config/dbConfig');
const {
  seedSubscriptionPlans,
  resetSubscriptionPlans,
  getSubscriptionPlans,
  getSubscriptionPlanById,
  updateSubscriptionPlan,
  getCurrentSubscription,
  getSubscriptionHistory,
  createSubscription,
  cancelSubscription,
  getAvailablePlans,
  checkSubscriptionStatus,
  quickSessionLimitCheck,
  handleUserIdentifier, // 🆕 ADD THIS IMPORT
  EnhancedSubscriptionController // 🆕 ADD THIS IMPORT
} = require("../controllers/subscriptionController");
const { getPublicSubscriptionPlans } = require("../controllers/publicSubscriptionController");
const CustomerManagementController = require("../controllers/customerManagementController");
const BillingManagementController = require("../controllers/billingManagementController");
const SubscriptionAnalyticsController = require("../controllers/subscriptionAnalyticsController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// ✅ Public route - Get subscription plans (No auth required)
router.get("/public", getPublicSubscriptionPlans);

// 🆕 Combined identifier middleware for subscription routes
const subscriptionAuthMiddleware = (req, res, next) => {
  // First try to use auth middleware
  authMiddleware(req, res, (err) => {
    if (err) {
      // If auth fails, try to get identifier from query params
      return handleUserIdentifier(req, res, next);
    }
    // If auth succeeds, proceed
    next();
  });
};

// ✅ User subscription routes (Authenticated users OR identifier-based access)
router.get("/user/current", subscriptionAuthMiddleware, getCurrentSubscription);
router.get("/user/history", subscriptionAuthMiddleware, getSubscriptionHistory);
router.get("/user/status", subscriptionAuthMiddleware, checkSubscriptionStatus);
router.get("/user/available-plans", subscriptionAuthMiddleware, getAvailablePlans);
router.post("/user/subscribe", subscriptionAuthMiddleware, createSubscription);
router.post("/user/cancel", subscriptionAuthMiddleware, cancelSubscription);
router.get("/user/sessions/quick-check", subscriptionAuthMiddleware, quickSessionLimitCheck);

// 🆕 New route to get user identifier info (for debugging)
router.get("/user/identifier-info", subscriptionAuthMiddleware, async (req, res) => {
  try {
    const identifier = await EnhancedSubscriptionController.getUserIdentifier(req);
    const actualUserId = await EnhancedSubscriptionController.getActualUserId(identifier);
    
    res.status(200).json({
      success: true,
      data: {
        identifier,
        actual_user_id: actualUserId,
        auth_method: req.user ? 'auth_middleware' : 'identifier_middleware',
        request_method: req.method,
        endpoint: req.originalUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get identifier info',
      error: error.message
    });
  }
});

// Plan selection before payment
router.post("/select", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, currency, plan_data } = req.body;

    console.log('📋 Plan selection request:', { userId, plan, currency });

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Verify the plan exists and is active
    const plans = await query(
      'SELECT id, type, price FROM subscriptions WHERE id = ? AND is_active = true',
      [plan]
    );

    if (!plans || plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    const selectedPlan = plans[0];

    // Return success - the actual payment will happen on the payment page
    res.status(200).json({
      success: true,
      message: 'Plan selected successfully',
      data: {
        planId: selectedPlan.id,
        planType: selectedPlan.type,
        price: selectedPlan.price,
        currency: currency || 'RWF'
      }
    });

  } catch (error) {
    console.error('❌ Plan selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select plan',
      error: error.message
    });
  }
});

// ✅ Admin routes (Admin only) - Keep authMiddleware only
router.post("/seed", authMiddleware, adminMiddleware, seedSubscriptionPlans);
router.post("/reset", authMiddleware, adminMiddleware, resetSubscriptionPlans);
router.get("/", authMiddleware, adminMiddleware, getSubscriptionPlans);
router.get("/:planId", authMiddleware, adminMiddleware, getSubscriptionPlanById);
router.put("/:planId", authMiddleware, adminMiddleware, updateSubscriptionPlan);

// Customer Management Routes
router.get("/admin/customers", authMiddleware, adminMiddleware, CustomerManagementController.getAllCustomers);
router.get("/admin/customers/:customerId", authMiddleware, adminMiddleware, CustomerManagementController.getCustomerDetails);
router.put("/admin/customers/:customerId/subscription", authMiddleware, adminMiddleware, CustomerManagementController.updateCustomerSubscription);

// Billing Management Routes
router.get("/admin/billing/stats", authMiddleware, adminMiddleware, BillingManagementController.getBillingStats);
router.get("/admin/billing/invoices", authMiddleware, adminMiddleware, BillingManagementController.getInvoices);
router.get("/admin/billing/invoices/:invoiceId", authMiddleware, adminMiddleware, BillingManagementController.getInvoiceById);

// Subscription Analytics Routes
router.get("/admin/analytics/overview", authMiddleware, adminMiddleware, SubscriptionAnalyticsController.getSubscriptionAnalytics);
router.get("/admin/analytics/real-time", authMiddleware, adminMiddleware, SubscriptionAnalyticsController.getRealTimeMetrics);

// 🆕 Health check for subscription routes
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Subscription routes are healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      multi_identifier_support: true,
      user_types: ['legacy_user', 'oliviuus_user', 'kid_profile', 'family_member'],
      auth_methods: ['jwt_auth', 'identifier_params']
    }
  });
});

module.exports = router;