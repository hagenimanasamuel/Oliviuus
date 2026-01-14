const express = require("express");
const router = express.Router();
const { 
  // checkEmail, 
  // saveUserInfo, 
  checkIdentifier,
  verifyCode,
  resendVerification,
  completeRegistration,
  getMe, 
  logout, 
  loginUser, 
  lookupIdentifier,
  googleAuth, 
  updateProfileAvatar, 
  requestPasswordReset, 
  resetPassword, 
  createUser,
  // New custom account functions
  checkUsernameAvailability, // CHANGED FROM checkCustomIdAvailability
  generateUsernameSuggestions,
  createCustomAccount,
  addIdentifierToCustomAccount
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// POST /api/auth/check-email
router.post("/check-identifier", checkIdentifier);
router.post("/verify-code", verifyCode);
router.post("/resend-verification", resendVerification);

// POST /api/auth/user-info → Save user after verification
router.post("/complete-registration", completeRegistration);

// ✅ Protected route
router.get("/me", authMiddleware, getMe);

// ✅ Logout
router.post("/logout", authMiddleware, logout);

// login route
router.post("/login", loginUser);
router.post("/lookup-identifier", lookupIdentifier);

// google oauth
router.post('/google', googleAuth);

// update the user profile
router.put("/update-avatar", authMiddleware, updateProfileAvatar);

// Reset password link sent route
router.post("/request-password-reset", requestPasswordReset);

// reset password route
router.post("/reset-password", resetPassword);

// admin creating new user route
router.post("/create-user", authMiddleware, createUser);

// ============================================
// CUSTOM ACCOUNT ROUTES
// ============================================

// Check if username is available
router.post("/check-username", checkUsernameAvailability); // CHANGED ROUTE AND FUNCTION

// Generate username suggestions
router.post("/generate-username-suggestions", generateUsernameSuggestions);

// Create custom account (final step)
router.post("/create-custom-account", createCustomAccount);

// Add email/phone to existing custom account
router.post("/add-identifier", authMiddleware, addIdentifierToCustomAccount);

module.exports = router;