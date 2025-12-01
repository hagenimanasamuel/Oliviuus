const express = require("express");
const router = express.Router();
const { checkEmail, saveUserInfo, getMe, logout, loginUser, updateProfileAvatar, requestPasswordReset, resetPassword, createUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// POST /api/auth/check-email
router.post("/check-email", checkEmail);

// POST /api/auth/user-info → Save user after email verification
router.post("/user-info", saveUserInfo);

// ✅ Protected route
router.get("/me", authMiddleware, getMe);

// ✅ Logout
router.post("/logout", authMiddleware, logout);

// login route
router.post("/login", loginUser);  

// update the user profile
router.put("/update-avatar", authMiddleware, updateProfileAvatar);

// Reset password link sent route
router.post("/request-password-reset", requestPasswordReset);

// reset password route
router.post("/reset-password", resetPassword);

// admin creating new user route
router.post("/create-user", authMiddleware, createUser);

module.exports = router;
