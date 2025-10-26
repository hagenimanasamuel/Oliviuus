const express = require("express");
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
} = require("../controllers/subscriptionController");
const { getPublicSubscriptionPlans } = require("../controllers/publicSubscriptionController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// ✅ Public route - Get subscription plans (No auth required)
router.get("/public", getPublicSubscriptionPlans);

// ✅ User subscription routes (Authenticated users)
router.get("/user/current", authMiddleware, getCurrentSubscription);
router.get("/user/history", authMiddleware, getSubscriptionHistory);
router.get("/user/status", authMiddleware, checkSubscriptionStatus);
router.get("/user/available-plans", authMiddleware, getAvailablePlans);
router.post("/user/subscribe", authMiddleware, createSubscription);
router.post("/user/cancel", authMiddleware, cancelSubscription);
router.get("/user/sessions/quick-check", authMiddleware, quickSessionLimitCheck);

// ✅ Admin routes (Admin only)
router.post("/seed", authMiddleware, adminMiddleware, seedSubscriptionPlans);
router.post("/reset", authMiddleware, adminMiddleware, resetSubscriptionPlans);
router.get("/", authMiddleware, adminMiddleware, getSubscriptionPlans);
router.get("/:planId", authMiddleware, adminMiddleware, getSubscriptionPlanById);
router.put("/:planId", authMiddleware, adminMiddleware, updateSubscriptionPlan);

module.exports = router;