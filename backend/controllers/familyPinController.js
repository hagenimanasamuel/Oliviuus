const { query } = require("../config/dbConfig");
const crypto = require("crypto");

// Helper: Validate user can manage PINs (either family plan owner OR parent role in family)
const validatePinManagementAccess = async (userId) => {
  try {
    console.log("🔍 [DEBUG] validatePinManagementAccess called for user:", userId);
    
    // First check if user is family plan owner
    const subscription = await query(`
      SELECT us.status, s.type, s.is_family_plan, s.max_family_members
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > UTC_TIMESTAMP())
      AND (s.type = 'family' OR s.is_family_plan = TRUE OR s.max_family_members > 1)
      LIMIT 1
    `, [userId]);

    console.log("🔍 [DEBUG] Subscription query result:", subscription);

    if (subscription && subscription.length > 0) {
      console.log("✅ [DEBUG] User is family plan owner");
      return { 
        valid: true, 
        subscription: subscription[0],
        isFamilyPlanOwner: true
      };
    }

    // If not family plan owner, check if user has parent role in a family
    console.log("🔍 [DEBUG] Checking if user has parent role in family");
    const parentRoleCheck = await query(`
      SELECT fm.id, fm.family_owner_id, u.email as owner_email
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      WHERE fm.user_id = ? 
      AND fm.member_role = 'parent'
      AND fm.invitation_status = 'accepted'
      AND fm.is_active = true
      LIMIT 1
    `, [userId]);

    console.log("🔍 [DEBUG] Parent role check result:", parentRoleCheck);

    if (parentRoleCheck && parentRoleCheck.length > 0) {
      console.log("✅ [DEBUG] User has parent role in family");
      
      // Verify the family owner still has active subscription
      const ownerSubscription = await query(`
        SELECT us.status, s.type
        FROM user_subscriptions us
        JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
        AND us.status = 'active'
        AND (us.end_date IS NULL OR us.end_date > UTC_TIMESTAMP())
        AND (s.type = 'family' OR s.is_family_plan = TRUE OR s.max_family_members > 1)
        LIMIT 1
      `, [parentRoleCheck[0].family_owner_id]);

      if (ownerSubscription && ownerSubscription.length > 0) {
        console.log("✅ [DEBUG] Family owner has active subscription");
        return { 
          valid: true, 
          subscription: ownerSubscription[0],
          isFamilyPlanOwner: false,
          isParentRole: true,
          familyOwnerId: parentRoleCheck[0].family_owner_id
        };
      } else {
        console.log("❌ [DEBUG] Family owner does not have active subscription");
        return { valid: false, error: "Family owner's subscription is not active" };
      }
    }

    console.log("❌ [DEBUG] User cannot manage PINs - not family owner or parent role");
    return { valid: false, error: "Family owner or parent role required" };

  } catch (error) {
    console.error("❌ [DEBUG] Error validating PIN management access:", error);
    return { valid: false, error: "System error during validation" };
  }
};

// Helper: Validate PIN strength
const validatePinStrength = (pin) => {
  // Must be exactly 4 digits
  if (!/^\d{4}$/.test(pin)) {
    return { valid: false, error: "PIN must be exactly 4 digits" };
  }

  // Common weak PINs to block
  const weakPins = [
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
    '1234', '4321', '1122', '1212', '1004', '2000', '2001', '2580', '1313', '1010',
    '2020', '3030', '4040', '5050', '6060', '7070', '8080', '9090'
  ];

  if (weakPins.includes(pin)) {
    return { valid: false, error: "PIN is too common or easily guessable" };
  }

  // Check for sequential patterns
  const isSequential = (pin) => {
    const digits = pin.split('').map(Number);
    let sequentialUp = true;
    let sequentialDown = true;
    
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i-1] + 1) sequentialUp = false;
      if (digits[i] !== digits[i-1] - 1) sequentialDown = false;
    }
    
    return sequentialUp || sequentialDown;
  };

  if (isSequential(pin)) {
    return { valid: false, error: "PIN cannot be sequential numbers" };
  }

  return { valid: true };
};

// Helper: Hash PIN for storage (FIXED - ensure full hash)
const hashPin = (pin) => {
  return crypto.createHash('sha256').update(pin).digest('hex');
};

// 1. Set Master PIN for Parental Controls
const setMasterPin = async (req, res) => {
  const { pin } = req.body;
  const userId = req.user.id;

  console.log("🔍 [DEBUG] setMasterPin called - User:", userId, "PIN provided:", !!pin);

  if (!pin) {
    console.log("❌ [DEBUG] No PIN provided");
    return res.status(400).json({ error: "PIN is required" });
  }

  try {
    // Validate user can manage PINs (family plan owner OR parent role)
    const accessValidation = await validatePinManagementAccess(userId);
    console.log("🔍 [DEBUG] Access validation result:", accessValidation);
    
    if (!accessValidation.valid) {
      console.log("❌ [DEBUG] Access validation failed:", accessValidation.error);
      return res.status(403).json({ error: accessValidation.error });
    }

    // Validate PIN strength
    const pinValidation = validatePinStrength(pin);
    if (!pinValidation.valid) {
      return res.status(400).json({ error: pinValidation.error });
    }

    // Hash the PIN
    const hashedPin = hashPin(pin);
    console.log("🔍 [DEBUG] Generated PIN hash:", hashedPin);

    // Get the actual parent user ID (family owner for parent role users)
    const parentUserId = accessValidation.isFamilyPlanOwner ? userId : accessValidation.familyOwnerId;

    // Check if parental controls record exists
    const existingControls = await query(
      "SELECT id FROM parental_controls WHERE parent_user_id = ?",
      [parentUserId]
    );

    if (existingControls.length > 0) {
      // Update existing PIN
      await query(
        "UPDATE parental_controls SET master_pin_code = ?, updated_at = NOW() WHERE parent_user_id = ?",
        [hashedPin, parentUserId]
      );
      console.log("✅ [DEBUG] Updated existing master PIN");
    } else {
      // Create new parental controls record
      await query(
        "INSERT INTO parental_controls (parent_user_id, master_pin_code) VALUES (?, ?)",
        [parentUserId, hashedPin]
      );
      console.log("✅ [DEBUG] Created new master PIN record");
    }

    // Log the action
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'set_master_pin', ?, 'success', ?)
    `, [
      userId,
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      JSON.stringify({
        action: existingControls.length > 0 ? 'updated' : 'created',
        is_family_plan_owner: accessValidation.isFamilyPlanOwner,
        is_parent_role: accessValidation.isParentRole,
        parent_user_id: parentUserId,
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      message: "Master PIN set successfully",
      action: existingControls.length > 0 ? 'updated' : 'created'
    });

  } catch (error) {
    console.error("❌ [DEBUG] Error setting master PIN:", error);
    
    // Log the error
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'set_master_pin', ?, 'failed', ?)
    `, [
      userId,
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(500).json({ error: "Failed to set master PIN" });
  }
};

// 2. Verify PIN (for identity verification before changes)
const verifyPin = async (req, res) => {
  const { pin } = req.body;
  const userId = req.user.id;

  console.log("🔍 [DEBUG] verifyPin called - User:", userId, "PIN provided:", !!pin);

  if (!pin) {
    return res.status(400).json({ error: "PIN is required" });
  }

  try {
    // Validate user can manage PINs (family plan owner OR parent role)
    const accessValidation = await validatePinManagementAccess(userId);
    console.log("🔍 [DEBUG] Access validation result for verifyPin:", accessValidation);
    
    if (!accessValidation.valid) {
      console.log("❌ [DEBUG] Access validation failed for verifyPin:", accessValidation.error);
      return res.status(403).json({ error: accessValidation.error });
    }

    // Get the actual parent user ID (family owner for parent role users)
    const parentUserId = accessValidation.isFamilyPlanOwner ? userId : accessValidation.familyOwnerId;

    // Get the master PIN from parental_controls
    const masterPinRecord = await query(
      "SELECT master_pin_code FROM parental_controls WHERE parent_user_id = ?",
      [parentUserId]
    );

    if (masterPinRecord.length === 0) {
      console.log("❌ [DEBUG] No master PIN found for user");
      return res.status(404).json({ error: "Master PIN not set" });
    }

    // Hash the provided PIN for comparison
    const hashedPin = hashPin(pin);
    const storedPin = masterPinRecord[0].master_pin_code;

    console.log("🔍 [DEBUG] PIN verification - Provided hash:", hashedPin);
    console.log("🔍 [DEBUG] PIN verification - Stored hash:", storedPin);
    console.log("🔍 [DEBUG] PIN verification - Hash lengths:", hashedPin.length, storedPin.length);

    // Verify the PIN
    if (hashedPin !== storedPin) {
      console.log("❌ [DEBUG] PIN verification failed");
      
      // Log failed attempt
      await query(`
        INSERT INTO security_logs 
        (user_id, action, ip_address, status, details) 
        VALUES (?, 'verify_pin', ?, 'failed', ?)
      `, [
        userId,
        req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
        JSON.stringify({
          reason: 'invalid_pin',
          timestamp: new Date().toISOString()
        })
      ]);

      return res.status(401).json({ error: "Invalid PIN" });
    }

    console.log("✅ [DEBUG] PIN verification successful");

    // Log successful verification
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'verify_pin', ?, 'success', ?)
    `, [
      userId,
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      JSON.stringify({
        action: 'identity_verification',
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      message: "PIN verified successfully",
      verified: true
    });

  } catch (error) {
    console.error("❌ [DEBUG] Error verifying PIN:", error);
    
    // Log the error
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'verify_pin', ?, 'failed', ?)
    `, [
      userId,
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(500).json({ error: "Failed to verify PIN" });
  }
};

// 3. Get PIN Status for Family Members
const getPinStatus = async (req, res) => {
  const userId = req.user.id;

  console.log("🔍 [DEBUG] getPinStatus called - User:", userId);

  try {
    // Validate user can manage PINs (family plan owner OR parent role)
    const accessValidation = await validatePinManagementAccess(userId);
    console.log("🔍 [DEBUG] Access validation result for getPinStatus:", accessValidation);
    
    if (!accessValidation.valid) {
      console.log("❌ [DEBUG] Access validation failed for getPinStatus:", accessValidation.error);
      return res.status(403).json({ error: accessValidation.error });
    }

    // Get family owner ID (either the user themselves or the family owner they belong to)
    const familyOwnerId = accessValidation.isFamilyPlanOwner ? userId : accessValidation.familyOwnerId;

    // Get all family members with their PIN status
    const familyMembers = await query(`
      SELECT 
        fm.id,
        fm.user_id,
        u.email,
        fm.member_role,
        fm.relationship,
        fm.dashboard_type,
        fm.is_active,
        fps.pin_attempts,
        fps.is_pin_locked,
        fps.pin_locked_until,
        fps.pin_set_at,
        fps.pin_changed_at
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      LEFT JOIN family_pin_security fps ON fm.id = fps.family_member_id
      WHERE fm.family_owner_id = ? AND fm.invitation_status = 'accepted'
      ORDER BY fm.member_role, fm.created_at
    `, [familyOwnerId]);

    const membersWithStatus = familyMembers.map(member => ({
      id: member.id,
      user_id: member.user_id,
      email: member.email,
      role: member.member_role,
      relationship: member.relationship,
      dashboard_type: member.dashboard_type,
      is_active: member.is_active,
      pin_security: {
        attempts: member.pin_attempts || 0,
        is_locked: member.is_pin_locked || false,
        locked_until: member.pin_locked_until,
        set_at: member.pin_set_at,
        changed_at: member.pin_changed_at
      }
    }));

    // Get master PIN status for the family owner
    const masterPin = await query(
      "SELECT master_pin_code FROM parental_controls WHERE parent_user_id = ?",
      [familyOwnerId]
    );

    console.log("✅ [DEBUG] PIN status retrieved successfully");

    res.status(200).json({
      master_pin_set: masterPin.length > 0 && !!masterPin[0].master_pin_code,
      family_owner_id: familyOwnerId,
      is_family_plan_owner: accessValidation.isFamilyPlanOwner,
      is_parent_role: accessValidation.isParentRole,
      family_members: membersWithStatus
    });

  } catch (error) {
    console.error("❌ [DEBUG] Error getting PIN status:", error);
    res.status(500).json({ error: "Failed to get PIN status" });
  }
};

// 4. Set PIN for Family Member
const setFamilyMemberPin = async (req, res) => {
  const { memberId, pin } = req.body;
  const userId = req.user.id;

  console.log("🔍 [DEBUG] setFamilyMemberPin called - User:", userId, "Member:", memberId);

  if (!memberId || !pin) {
    return res.status(400).json({ error: "Member ID and PIN are required" });
  }

  try {
    // Validate user can manage PINs (family plan owner OR parent role)
    const accessValidation = await validatePinManagementAccess(userId);
    if (!accessValidation.valid) {
      return res.status(403).json({ error: accessValidation.error });
    }

    // Get family owner ID
    const familyOwnerId = accessValidation.isFamilyPlanOwner ? userId : accessValidation.familyOwnerId;

    // Validate that the member belongs to this family owner
    const familyMember = await query(`
      SELECT fm.id, fm.user_id, fm.member_role, u.email
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ? AND fm.invitation_status = 'accepted'
    `, [memberId, familyOwnerId]);

    if (familyMember.length === 0) {
      return res.status(404).json({ error: "Family member not found" });
    }

    // Validate PIN strength
    const pinValidation = validatePinStrength(pin);
    if (!pinValidation.valid) {
      return res.status(400).json({ error: pinValidation.error });
    }

    const hashedPin = hashPin(pin);

    // Check if PIN security record exists
    const existingPinSecurity = await query(
      "SELECT id, previous_pins FROM family_pin_security WHERE family_member_id = ?",
      [memberId]
    );

    // Check PIN history to prevent reuse
    if (existingPinSecurity.length > 0) {
      const previousPins = existingPinSecurity[0].previous_pins 
        ? JSON.parse(existingPinSecurity[0].previous_pins) 
        : [];

      if (previousPins.includes(hashedPin)) {
        return res.status(400).json({ error: "PIN cannot be the same as a recently used PIN" });
      }

      // Update previous pins (keep last 3)
      const updatedPreviousPins = [hashedPin, ...previousPins].slice(0, 3);

      // Update existing PIN security record
      await query(`
        UPDATE family_pin_security 
        SET pin_attempts = 0, 
            is_pin_locked = FALSE,
            pin_locked_until = NULL,
            previous_pins = ?,
            pin_changed_at = NOW(),
            updated_at = NOW()
        WHERE family_member_id = ?
      `, [JSON.stringify(updatedPreviousPins), memberId]);
    } else {
      // Create new PIN security record
      await query(`
        INSERT INTO family_pin_security 
        (family_member_id, previous_pins, pin_set_at, pin_changed_at) 
        VALUES (?, ?, NOW(), NOW())
      `, [memberId, JSON.stringify([hashedPin])]);
    }

    console.log("✅ [DEBUG] Family member PIN security record updated");

    // Log the action
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'set_family_member_pin', ?, 'success', ?)
    `, [
      userId,
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      JSON.stringify({
        target_member_id: memberId,
        target_email: familyMember[0].email,
        member_role: familyMember[0].member_role,
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      message: "PIN set successfully for family member",
      member: {
        id: memberId,
        email: familyMember[0].email,
        role: familyMember[0].member_role
      }
    });

  } catch (error) {
    console.error("❌ [DEBUG] Error setting family member PIN:", error);
    
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'set_family_member_pin', ?, 'failed', ?)
    `, [
      userId,
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      JSON.stringify({
        target_member_id: memberId,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(500).json({ error: "Failed to set family member PIN" });
  }
};

// 5. Remove PIN from Family Member
const removeFamilyMemberPin = async (req, res) => {
  const { memberId } = req.body;
  const userId = req.user.id;

  if (!memberId) {
    return res.status(400).json({ error: "Member ID is required" });
  }

  try {
    // Validate user can manage PINs
    const accessValidation = await validatePinManagementAccess(userId);
    if (!accessValidation.valid) {
      return res.status(403).json({ error: accessValidation.error });
    }

    // Get family owner ID
    const familyOwnerId = accessValidation.isFamilyPlanOwner ? userId : accessValidation.familyOwnerId;

    // Verify that the member belongs to this family owner
    const familyMember = await query(`
      SELECT fm.id, fm.user_id, u.email
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      WHERE fm.id = ? AND fm.family_owner_id = ? AND fm.invitation_status = 'accepted'
    `, [memberId, familyOwnerId]);

    if (familyMember.length === 0) {
      return res.status(404).json({ error: "Family member not found" });
    }

    // Clear PIN security record
    await query(
      "DELETE FROM family_pin_security WHERE family_member_id = ?",
      [memberId]
    );

    // Log the action
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'remove_family_member_pin', ?, 'success', ?)
    `, [
      userId,
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      JSON.stringify({
        target_member_id: memberId,
        target_email: familyMember[0].email,
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(200).json({
      message: "PIN removed successfully from family member",
      member: {
        id: memberId,
        email: familyMember[0].email
      }
    });

  } catch (error) {
    console.error("❌ Error removing family member PIN:", error);
    
    await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'remove_family_member_pin', ?, 'failed', ?)
    `, [
      userId,
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
      JSON.stringify({
        target_member_id: memberId,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    ]);

    res.status(500).json({ error: "Failed to remove family member PIN" });
  }
};

module.exports = {
  setMasterPin,
  verifyPin,
  getPinStatus,
  setFamilyMemberPin,
  removeFamilyMemberPin
};