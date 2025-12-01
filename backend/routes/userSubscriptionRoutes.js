const express = require("express");
const {
  getCurrentSubscription,
  getSubscriptionHistory,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateAutoRenew,
  getBillingHistory,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getUsageMetrics,
  checkSubscriptionStatus,
  quickSessionLimitCheck,
  getAvailablePlans
} = require("../controllers/userSubscriptionController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Subscription management
router.get("/current", getCurrentSubscription);
router.get("/history", getSubscriptionHistory);
router.post("/create", createSubscription);
router.post("/cancel", cancelSubscription);
router.post("/reactivate", reactivateSubscription);
router.post("/auto-renew", updateAutoRenew);

// Billing and payments
router.get("/billing-history", getBillingHistory);
router.get("/payment-methods", getPaymentMethods);
router.post("/payment-methods", addPaymentMethod);
router.delete("/payment-methods/:payment_method_id", removePaymentMethod);
router.post("/payment-methods/default", setDefaultPaymentMethod);

// Usage and status
router.get("/usage-metrics", getUsageMetrics);
router.get("/status", checkSubscriptionStatus);
router.get("/session-check", quickSessionLimitCheck);

// Available plans
router.get("/available-plans", getAvailablePlans);

module.exports = router;