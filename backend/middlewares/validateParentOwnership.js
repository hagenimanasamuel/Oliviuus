// middleware/validateParentOwnership.js
const { query } = require("../config/dbConfig");

const validateParentOwnership = async (req, res, next) => {
  try {
    const parentUserId = req.user.id;
    let kidProfileId = req.params.kidId;

    if (!kidProfileId) {
      return res.status(400).json({ 
        error: "kid_profile_id_required",
        message: "Kid profile ID is required" 
      });
    }

    // Verify parent owns this kid profile
    const ownershipCheck = await query(
      `SELECT id FROM kids_profiles 
       WHERE id = ? AND parent_user_id = ? AND is_active = TRUE
       LIMIT 1`,
      [kidProfileId, parentUserId]
    );

    if (ownershipCheck.length === 0) {
      return res.status(403).json({
        error: "parent_ownership_required",
        message: "You do not have permission to access this kid profile"
      });
    }

    req.validated_kid_id = kidProfileId;
    next();
  } catch (error) {
    console.error("❌ Parent ownership validation error:", error);
    res.status(500).json({ error: "Ownership verification failed" });
  }
};

module.exports = { validateParentOwnership };