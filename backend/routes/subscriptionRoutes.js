const express = require("express");
const {
  seedSubscriptionPlans,
  resetSubscriptionPlans,
  getSubscriptionPlans,
  getSubscriptionPlanById,
  updateSubscriptionPlan
} = require("../controllers/subscriptionController");
const { getPublicSubscriptionPlans } = require("../controllers/publicSubscriptionController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// ✅ Public route - Get subscription plans (No auth required)
router.get("/public", getPublicSubscriptionPlans);

// ✅ Seed default subscription plans (Admin only)
router.post("/seed", authMiddleware, adminMiddleware, seedSubscriptionPlans);

// ✅ Reset subscription plans (delete all and reseed - Admin only)
router.post("/reset", authMiddleware, adminMiddleware, resetSubscriptionPlans);

// ✅ Get all subscription plans (Admin only - for management)
router.get("/", authMiddleware, adminMiddleware, getSubscriptionPlans);

// ✅ Get subscription plan by ID (Admin only)
router.get("/:planId", authMiddleware, adminMiddleware, getSubscriptionPlanById);

// ✅ Update subscription plan (Admin only)
router.put("/:planId", authMiddleware, adminMiddleware, updateSubscriptionPlan);

module.exports = router;