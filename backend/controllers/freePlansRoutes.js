// routes/freePlansRoutes.js
const express = require("express");
const FreePlansController = require("../controllers/freePlansController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// ====================
// PUBLIC ROUTES (No auth required for some)
// ====================

// Check eligibility for any user (requires auth but not admin)
router.get("/:scheduleId/check-eligibility", authMiddleware, FreePlansController.checkEligibility);

// Get eligible schedules for current user
router.get("/eligible", authMiddleware, FreePlansController.getEligibleSchedules);

// Get user's active free plans
router.get("/user/active", authMiddleware, FreePlansController.getUserActivePlans);

// Activate free plan (user action)
router.post("/:scheduleId/activate", authMiddleware, FreePlansController.activateFreePlan);

// ====================
// ADMIN ROUTES (Require auth + admin)
// ====================
router.use(authMiddleware, adminMiddleware);

// Dashboard & Statistics
router.get("/dashboard/stats", FreePlansController.getDashboardStats);

// Schedule Management
router.get("/schedules", FreePlansController.getAllSchedules);
router.post("/schedules", FreePlansController.createSchedule);
router.get("/schedules/:scheduleId", FreePlansController.getScheduleById); // Get schedule details
router.get("/schedules/:scheduleId/stats", FreePlansController.getScheduleStats); // Get schedule statistics
router.put("/schedules/:scheduleId", FreePlansController.updateSchedule);
router.delete("/schedules/:scheduleId", FreePlansController.deleteSchedule);
router.post("/schedules/:scheduleId/toggle", FreePlansController.toggleScheduleStatus);

// Activation Management
router.get("/activations", FreePlansController.getActivations);
router.post("/activations/manual", FreePlansController.manualActivation);

// Utility Endpoints
router.get("/plans/available", FreePlansController.getAvailablePlansForFree);
router.get("/users/search", FreePlansController.searchUsersForAssignment);

module.exports = router;