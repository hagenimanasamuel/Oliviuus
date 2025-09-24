const express = require("express");
const { updatePassword } = require("../controllers/authController");
const {deactivateAccount, deleteAccount} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// update the current user's password
router.put("/update-password", authMiddleware, updatePassword);

// Deactivate account (PUT)
router.put("/deactivate-account", authMiddleware, deactivateAccount);

// Delete account (DELETE)
router.delete("/delete-account", authMiddleware, deleteAccount);

module.exports = router;
