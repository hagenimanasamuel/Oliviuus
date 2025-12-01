const express = require("express");
const router = express.Router();
const { getRoles, createRole, updateRole, deleteRole } = require("../controllers/rolesController");


const authMiddleware = require("../middlewares/authMiddleware");

// Get all roles
router.get("/", authMiddleware, getRoles);

// Create a new role
router.post("/", authMiddleware, createRole);

// Update an existing role
router.put("/:id", authMiddleware, updateRole);

// Delete a role
router.delete("/:id", authMiddleware, deleteRole);

module.exports = router;
