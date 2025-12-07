const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  enterKidMode,
  exitKidMode,
  getCurrentSessionMode,
  checkProfileSelection
} = require("../controllers/kidSessionController");

router.post("/enter", authMiddleware, enterKidMode);
router.post("/exit", authMiddleware, exitKidMode);
router.get("/current", authMiddleware, getCurrentSessionMode);
router.get("/check-selection", authMiddleware, checkProfileSelection);

module.exports = router;