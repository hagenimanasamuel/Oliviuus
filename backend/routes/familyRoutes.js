// src/routes/familyRoutes.js
const express = require("express");
const {
  inviteFamilyMember,
  acceptFamilyInvitation,
  getFamilyMembers,
  updateFamilyMember,
  removeFamilyMember,
  getPendingInvitations,
  getFamilyMembershipStatus,
  rejectFamilyInvitation,
  leaveFamily,
  getMyFamilyStatus,
  checkFamilyMembership,
  getFamilyDashboardAccess
} = require("../controllers/familyController");
const {
  setMasterPin,
  setFamilyMemberPin,
  verifyPin,
  removeFamilyMemberPin,
  getPinStatus
} = require("../controllers/familyPinController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Family management routes
router.post("/invite", inviteFamilyMember);
router.post("/invitations/accept", acceptFamilyInvitation);
router.get("/members", getFamilyMembers);
router.put("/members/:memberId", updateFamilyMember);
router.delete("/members/:memberId", removeFamilyMember);
router.get("/invitations/pending", getPendingInvitations);
router.get("/membership/status", getFamilyMembershipStatus);
router.post("/invitations/reject", rejectFamilyInvitation);
router.post("/leave", leaveFamily);
router.get("/members/my-status", getMyFamilyStatus);

// 🆕 New routes for family dashboard access
router.get("/members/check/:userId", checkFamilyMembership);
router.get("/dashboard-access", getFamilyDashboardAccess);

// Family PIN management routes
router.post("/pin/master/set", setMasterPin);
router.post("/pin/member/set", setFamilyMemberPin);
router.post("/pin/verify", verifyPin);
router.post("/pin/member/remove", removeFamilyMemberPin);
router.get("/pin/status", getPinStatus);

module.exports = router;