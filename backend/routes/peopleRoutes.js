const express = require("express");
const {
  getAllPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  addPersonToContent,
  removePersonFromContent,
  updateCasting,
  getContentCasting,
  searchPeople,
  getPersonRolesInContent,
  addPersonRolesToContent
} = require("../controllers/peopleController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// ✅ Public routes
router.get("/search", searchPeople);
router.get("/content/casting", getContentCasting);

// ✅ Admin routes (protected)
router.get("/", authMiddleware, adminMiddleware, getAllPeople);
router.get("/:id", authMiddleware, adminMiddleware, getPersonById);
router.post("/", authMiddleware, adminMiddleware, createPerson);
router.put("/:id", authMiddleware, adminMiddleware, updatePerson);
router.delete("/:id", authMiddleware, adminMiddleware, deletePerson);

// Casting management routes
router.post("/content/add", authMiddleware, adminMiddleware, addPersonToContent);
router.post("/content/add-roles", authMiddleware, adminMiddleware, addPersonRolesToContent);
router.put("/content/:id", authMiddleware, adminMiddleware, updateCasting);
router.delete("/content/:id", authMiddleware, adminMiddleware, removePersonFromContent);
router.get("/:person_id/content/:content_id/roles", authMiddleware, adminMiddleware, getPersonRolesInContent);

module.exports = router;