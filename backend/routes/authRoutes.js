const express = require("express");
const router = express.Router();
const { checkEmail, saveUserInfo, getMe, logout, loginUser, updateProfileAvatar } = require("../controllers/authController");
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

module.exports = router;
