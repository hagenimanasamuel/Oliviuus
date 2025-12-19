const { query } = require("../config/dbConfig");
const { sendFamilyInvitationEmail } = require("../services/emailService");
const crypto = require("crypto");

// Generate invitation token
const generateInvitationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Check if user can invite more members
const canInviteMoreMembers = async (familyOwnerId) => {
    try {
        // Check if user has an active subscription
        const subscription = await query(`
      SELECT s.max_family_members, s.type
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? AND us.status = 'active'
      LIMIT 1
    `, [familyOwnerId]);

        if (!subscription || subscription.length === 0) {
            return { canInvite: false, reason: "No active subscription" };
        }

        const maxMembers = subscription[0].max_family_members || 1;

        // Count current family members (including pending)
        const memberCount = await query(`
      SELECT COUNT(*) as count 
      FROM family_members 
      WHERE family_owner_id = ? AND invitation_status != 'rejected'
    `, [familyOwnerId]);

        const currentCount = memberCount[0].count;

        return {
            canInvite: currentCount < maxMembers,
            reason: currentCount >= maxMembers ? "Family member limit reached" : null,
            currentCount,
            maxMembers
        };
    } catch (error) {
        console.error("Error checking invitation limits:", error);
        return { canInvite: false, reason: "System error" };
    }
};

// Enhanced validation function
const validateFamilyInvitation = async (familyOwnerId, targetEmail, memberRole) => {
    try {
        // 1. Check if owner can invite more members
        const invitationCheck = await canInviteMoreMembers(familyOwnerId);
        if (!invitationCheck.canInvite) {
            return { valid: false, error: `Cannot invite more family members: ${invitationCheck.reason}` };
        }

        // 2. Check if target user exists in system
        const targetUser = await query(
            `SELECT id, email, is_active, role, subscription_plan 
       FROM users WHERE email = ?`,
            [targetEmail]
        );

        if (targetUser.length === 0) {
            return { valid: false, error: "User not found. They need to have an Oliviuus account first." };
        }

        const targetUserId = targetUser[0].id;

        // 3. Prevent self-invitation
        if (targetUserId === familyOwnerId) {
            return { valid: false, error: "You cannot invite yourself to your own family plan." };
        }

        // 4. Check if target user is an admin
        if (targetUser[0].role === 'admin') {
            return { valid: false, error: "You are not allowed to invite this user." };
        }

        // 5. Check if target user is already a family owner
        const isTargetFamilyOwner = await query(
            `SELECT id FROM family_members WHERE user_id = ? AND member_role = 'owner' AND invitation_status = 'accepted'`,
            [targetUserId]
        );

        if (isTargetFamilyOwner.length > 0) {
            return { valid: false, error: "This user is already a family owner and cannot join another family." };
        }

        // 6. Check if target user has an active family plan subscription
        const targetUserFamilyPlan = await query(`
        SELECT us.status, s.name as plan_name, s.type as plan_type
        FROM user_subscriptions us
        JOIN subscriptions s ON us.subscription_id = s.id
        WHERE us.user_id = ? 
        AND us.status = 'active'
        AND (us.end_date IS NULL OR us.end_date > UTC_TIMESTAMP())
        AND (us.trial_end_date IS NULL OR us.trial_end_date > UTC_TIMESTAMP())
        AND (
            s.type = 'family' 
            OR s.is_family_plan = TRUE
            OR s.max_family_members > 1
            OR s.name LIKE '%family%'
            OR s.name LIKE '%Family%'
        )
        LIMIT 1
        `, [targetUserId]);

        if (targetUserFamilyPlan.length > 0) {
            return {
                valid: false,
                error: `This user already has an active ${targetUserFamilyPlan[0].plan_name} family plan. Users with family plans cannot join other families.`
            };
        }

        // 7. Check if user is already in a family (accepted or pending)
        const existingFamily = await query(
            `SELECT fm.id, fm.invitation_status, fm.family_owner_id, u.email as owner_email
       FROM family_members fm
       JOIN users u ON fm.family_owner_id = u.id
       WHERE fm.user_id = ? AND fm.invitation_status IN ('pending', 'accepted')`,
            [targetUserId]
        );

        if (existingFamily.length > 0) {
            const existing = existingFamily[0];
            if (existing.invitation_status === 'pending') {
                return { valid: false, error: `This user already has a pending invitation from other family.` };
            } else {
                return { valid: false, error: `This user is already part of other family.` };
            }
        }

        // 8. Check if user has active individual subscription
        const targetUserSubscription = await query(
            `SELECT us.status, s.name as plan_name, s.type as plan_type, s.is_family_plan
       FROM user_subscriptions us
       JOIN subscriptions s ON us.subscription_id = s.id
       WHERE us.user_id = ? AND us.status = 'active'
       LIMIT 1`,
            [targetUserId]
        );

        const hasActiveSubscription = targetUserSubscription.length > 0;
        const subscriptionPlan = hasActiveSubscription ? targetUserSubscription[0].plan_name : null;
        const isFamilyPlan = hasActiveSubscription ? targetUserSubscription[0].is_family_plan : false;

        // 9. Check for existing pending invitation from this owner
        const existingInvitation = await query(
            "SELECT id FROM family_members WHERE user_id = ? AND family_owner_id = ? AND invitation_status = 'pending'",
            [targetUserId, familyOwnerId]
        );

        if (existingInvitation.length > 0) {
            return { valid: false, error: "Invitation already sent to this user." };
        }

        // 10. Validate member role restrictions
        if (memberRole === 'owner') {
            return { valid: false, error: "Cannot assign owner role to family members." };
        }

        // 11. Get family owner info for additional checks
        const ownerInfo = await query(
            `SELECT u.email, us.status as subscription_status
       FROM users u
       LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
       WHERE u.id = ?`,
            [familyOwnerId]
        );

        if (!ownerInfo[0] || ownerInfo[0].subscription_status !== 'active') {
            return { valid: false, error: "Your subscription is not active. Please renew your subscription to invite members." };
        }

        return {
            valid: true,
            targetUserId,
            hasActiveSubscription,
            subscriptionPlan,
            isFamilyPlan,
            targetUserRole: targetUser[0].role
        };

    } catch (error) {
        console.error("Error validating family invitation:", error);
        return { valid: false, error: "System error during validation" };
    }
};

// Enhanced invitation function
const inviteFamilyMember = async (req, res) => {
    const { email, member_role, relationship, dashboard_type, language } = req.body;
    const familyOwnerId = req.user.id;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
    }

    try {
        // 1. Comprehensive validation
        const validation = await validateFamilyInvitation(familyOwnerId, email, member_role);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { targetUserId, hasActiveSubscription, subscriptionPlan, isFamilyPlan } = validation;

        // 2. Generate invitation token and set expiration (7 days)
        const invitationToken = generateInvitationToken();
        const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // 3. Create family member record
        await query(`
      INSERT INTO family_members (
        user_id, family_owner_id, member_role, relationship, 
        dashboard_type, invitation_token, invited_by, 
        invitation_expires_at, invitation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
            targetUserId,
            familyOwnerId,
            member_role || 'child',
            relationship || null,
            dashboard_type || 'normal',
            invitationToken,
            familyOwnerId,
            invitationExpires
        ]);

        // 4. Get family owner info for email
        const ownerInfo = await query(
            "SELECT email FROM users WHERE id = ?",
            [familyOwnerId]
        );

        const ownerEmail = ownerInfo[0].email;

        // 5. Send enhanced invitation email with subscription info
        const sendInvitationEmailBackground = async (targetEmail, ownerEmail, invitationToken, language, memberRole, hasActiveSub, currentPlan, isFamilyPlan) => {
            try {
                await sendFamilyInvitationEmail(targetEmail, ownerEmail, invitationToken, language, memberRole, hasActiveSub, currentPlan, isFamilyPlan);
                console.log(`✅ Family invitation email sent to ${targetEmail}`);
            } catch (emailErr) {
                console.error("⚠️ Failed to send family invitation email:", emailErr);
            }
        };

        // Trigger email sending in background
        sendInvitationEmailBackground(email, ownerEmail, invitationToken, language || 'en', member_role, hasActiveSubscription, subscriptionPlan, isFamilyPlan);

        // 6. Send notification to target user
        await sendFamilyInvitationNotification(targetUserId, familyOwnerId, member_role, hasActiveSubscription);

        // 7. Log the invitation for audit
        await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'family_invitation', ?, 'success', ?)
    `, [
            familyOwnerId,
            req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
            JSON.stringify({
                target_user_id: targetUserId,
                target_email: email,
                member_role: member_role,
                has_active_subscription: hasActiveSubscription,
                timestamp: new Date().toISOString()
            })
        ]);

        res.status(200).json({
            message: "Family invitation sent successfully",
            invitation: {
                email: email,
                role: member_role || 'child',
                expires: invitationExpires,
                status: 'pending',
                target_has_subscription: hasActiveSubscription
            }
        });

    } catch (error) {
        console.error("❌ Error inviting family member:", error);

        // Log the error for audit
        await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'family_invitation', ?, 'failed', ?)
    `, [
            familyOwnerId,
            req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
            JSON.stringify({
                target_email: email,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        ]);

        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

// Enhanced invitation acceptance with validation
const acceptFamilyInvitation = async (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
        return res.status(400).json({ error: "Invitation token is required" });
    }

    try {
        // Get current UTC timestamp
        const currentUtc = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // 1. Find the invitation with enhanced validation
        const invitation = await query(`
      SELECT fm.*, u.email as owner_email, owner.subscription_plan as owner_plan
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      JOIN users owner ON fm.family_owner_id = owner.id
      WHERE fm.invitation_token = ? AND fm.user_id = ?
    `, [token, userId]);

        if (invitation.length === 0) {
            return res.status(404).json({ error: "Invitation not found or invalid" });
        }

        const familyMember = invitation[0];

        // 2. COMPREHENSIVE: Check if user has any active family membership or subscription
        const userFamilyStatus = await query(`
      -- Check if user is already a family owner
      SELECT 'family_owner' as type, fm.id, u.email as family_owner_email
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      WHERE fm.user_id = ? AND fm.member_role = 'owner' AND fm.invitation_status = 'accepted'
      
      UNION ALL
      
      -- Check if user has active family plan subscription (using multiple methods) - UTC DATE CHECK
      SELECT 'family_subscription' as type, us.id, s.name as plan_name
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? AND us.status = 'active'
      AND (
        s.type = 'family' 
        OR s.is_family_plan = TRUE
        OR s.max_family_members > 1
        OR s.name LIKE '%family%'
        OR s.name LIKE '%Family%'
      )
      AND (us.end_date IS NULL OR us.end_date > UTC_TIMESTAMP())
      AND (us.trial_end_date IS NULL OR us.trial_end_date > UTC_TIMESTAMP())
      
      UNION ALL
      
      -- Check if user is already a family member in any family
      SELECT 'family_member' as type, fm.id, u.email as family_owner_email
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      WHERE fm.user_id = ? AND fm.invitation_status = 'accepted' AND fm.id != ?
    `, [userId, userId, userId, familyMember.id]);

        if (userFamilyStatus.length > 0) {
            const conflict = userFamilyStatus[0];
            let errorMessage = "Cannot accept invitation: ";

            switch (conflict.type) {
                case 'family_owner':
                    errorMessage = `You are already a family owner. Family owners cannot join other families.`;
                    break;
                case 'family_subscription':
                    errorMessage = `You have an active ${conflict.plan_name || 'family plan'} subscription. Users with family plans cannot join other families.`;
                    break;
                case 'family_member':
                    errorMessage = `You are already part of ${conflict.family_owner_email}'s family. Leave that family first to accept this invitation.`;
                    break;
                default:
                    errorMessage = "You are already associated with another family plan.";
            }

            return res.status(400).json({ error: errorMessage });
        }

        // 3. Check if invitation is expired - UTC COMPARISON
        const invitationExpiresUtc = new Date(familyMember.invitation_expires_at).toISOString();
        if (new Date().toISOString() > invitationExpiresUtc) {
            await query(
                "UPDATE family_members SET invitation_status = 'expired' WHERE id = ?",
                [familyMember.id]
            );
            return res.status(400).json({ error: "Invitation has expired" });
        }

        // 4. Check if invitation is already accepted
        if (familyMember.invitation_status === 'accepted') {
            return res.status(400).json({ error: "Invitation already accepted" });
        }

        // 5. COMPREHENSIVE: Check if family owner still has valid active subscription - UTC DATE CHECKS
        const ownerSubscription = await query(`
      SELECT 
        us.status, 
        us.start_date, 
        us.end_date,
        us.trial_end_date,
        s.name as plan_name,
        s.type as plan_type,
        s.is_family_plan,
        s.max_family_members
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > UTC_TIMESTAMP())
      AND (us.trial_end_date IS NULL OR us.trial_end_date > UTC_TIMESTAMP())
      AND (
        s.type = 'family' 
        OR s.is_family_plan = TRUE
        OR s.max_family_members > 1
      )
      LIMIT 1
    `, [familyMember.family_owner_id]);

        if (ownerSubscription.length === 0) {
            await query(
                "UPDATE family_members SET invitation_status = 'expired' WHERE id = ?",
                [familyMember.id]
            );
            return res.status(400).json({
                error: "Family owner's subscription is no longer active or valid. Invitation has been cancelled."
            });
        }

        // 6. Check if family owner has reached member limit
        const currentMemberCount = await query(`
      SELECT COUNT(*) as count 
      FROM family_members 
      WHERE family_owner_id = ? 
      AND invitation_status IN ('accepted', 'pending')
      AND user_id != ?
    `, [familyMember.family_owner_id, familyMember.family_owner_id]);

        const maxMembers = ownerSubscription[0].max_family_members || 1;
        if (currentMemberCount[0].count >= maxMembers) {
            return res.status(400).json({
                error: `Family owner has reached the maximum member limit (${maxMembers}). Cannot accept this invitation.`
            });
        }

        // 7. If user has an active individual subscription, pause it - UTC DATE CHECKS
        const userIndividualSubscription = await query(`
      SELECT us.id, s.name as plan_name, s.is_family_plan
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > UTC_TIMESTAMP())
      AND (us.trial_end_date IS NULL OR us.trial_end_date > UTC_TIMESTAMP())
      AND (
        s.type != 'family' 
        AND (s.is_family_plan IS NULL OR s.is_family_plan = FALSE)
        AND (s.max_family_members IS NULL OR s.max_family_members <= 1)
      )
      LIMIT 1
    `, [userId]);

        let subscriptionPaused = false;
        let pausedSubscriptionId = null;

        if (userIndividualSubscription.length > 0) {
            // Pause the individual subscription using UTC
            await query(
                "UPDATE user_subscriptions SET status = 'paused', paused_at = UTC_TIMESTAMP() WHERE id = ?",
                [userIndividualSubscription[0].id]
            );
            subscriptionPaused = true;
            pausedSubscriptionId = userIndividualSubscription[0].id;

            // Log the subscription pause
            await query(`
          INSERT INTO security_logs 
          (user_id, action, ip_address, status, details) 
          VALUES (?, 'subscription_paused_for_family', ?, 'success', ?)
        `, [
                userId,
                req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
                JSON.stringify({
                    subscription_id: userIndividualSubscription[0].id,
                    subscription_name: userIndividualSubscription[0].plan_name,
                    family_owner_id: familyMember.family_owner_id,
                    reason: 'joined_family_plan',
                    timestamp: new Date().toISOString() // UTC ISO string
                })
            ]);
        }

        // 8. Update invitation status to accepted using UTC
        await query(`
      UPDATE family_members 
      SET invitation_status = 'accepted', joined_at = UTC_TIMESTAMP(), is_active = TRUE,
          last_accessed_at = UTC_TIMESTAMP()
      WHERE id = ?
    `, [familyMember.id]);

        // 9. Send notification to family owner
        await sendInvitationAcceptedNotification(familyMember.family_owner_id, userId);

        // 10. Send notification to user about subscription changes
        if (subscriptionPaused) {
            const currentUtcTime = new Date().toISOString();
            await query(`
          INSERT INTO notifications 
          (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
          VALUES (?, 'subscription_paused', '⏸️ Subscription Paused', ?, 'pause', 'subscription', ?, 'normal', ?, ?)
        `, [
                userId,
                `Your ${userIndividualSubscription[0].plan_name} subscription has been paused because you joined ${familyMember.owner_email}'s family plan. It will be automatically reactivated if you leave the family.`,
                pausedSubscriptionId,
                JSON.stringify({
                    family_owner_email: familyMember.owner_email,
                    original_plan: userIndividualSubscription[0].plan_name,
                    paused_at: currentUtcTime,
                    can_reactivate: true
                }),
                "/account/settings#subscription"
            ]);
        }

        // 11. Send welcome notification to user
        const currentUtcTime = new Date().toISOString();
        await query(`
          INSERT INTO notifications 
          (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
          VALUES (?, 'family_joined', '👨‍👩‍👧‍👦 Joined Family Plan', ?, 'users', 'family', ?, 'normal', ?, ?)
        `, [
            userId,
            `You've successfully joined ${familyMember.owner_email}'s family plan as a ${familyMember.member_role}. You now have access to their subscription benefits.`,
            familyMember.family_owner_id,
            JSON.stringify({
                family_owner_email: familyMember.owner_email,
                member_role: familyMember.member_role,
                joined_at: currentUtcTime,
                subscription_paused: subscriptionPaused
            }),
            "/browse"
        ]);

        // 12. Log the acceptance for audit with UTC timestamp
        await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'family_invitation_accept', ?, 'success', ?)
    `, [
            userId,
            req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
            JSON.stringify({
                family_owner_id: familyMember.family_owner_id,
                family_owner_email: familyMember.owner_email,
                member_role: familyMember.member_role,
                owner_plan: ownerSubscription[0].plan_name,
                individual_subscription_paused: subscriptionPaused,
                paused_subscription_id: pausedSubscriptionId,
                timestamp: currentUtcTime
            })
        ]);

        res.json({
            message: "Family invitation accepted successfully",
            family: {
                owner_email: familyMember.owner_email,
                role: familyMember.member_role,
                joined_at: currentUtcTime,
                owner_plan: ownerSubscription[0].plan_name,
                individual_subscription_paused: subscriptionPaused
            }
        });

    } catch (error) {
        console.error("❌ Error accepting family invitation:", error);

        // Log the error for audit with UTC timestamp
        await query(`
      INSERT INTO security_logs 
      (user_id, action, ip_address, status, details) 
      VALUES (?, 'family_invitation_accept', ?, 'failed', ?)
    `, [
            userId,
            req.headers["x-forwarded-for"] || req.connection.remoteAddress || "Unknown",
            JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString()
            })
        ]);

        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

// Get family members
const getFamilyMembers = async (req, res) => {
    const familyOwnerId = req.user.id;

    try {
        // Get family members
        const familyMembers = await query(`
      SELECT 
        fm.*,
        u.email,
        u.profile_avatar_url,
        u.created_at as user_created_at,
        owner.email as owner_email
      FROM family_members fm
      JOIN users u ON fm.user_id = u.id
      JOIN users owner ON fm.family_owner_id = owner.id
      WHERE fm.family_owner_id = ?
      ORDER BY 
        fm.member_role,
        fm.invitation_status,
        fm.created_at DESC
    `, [familyOwnerId]);

        // Get subscription info with max_family_members
        const subscriptionInfo = await query(`
      SELECT s.max_family_members, s.name as plan_name
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? AND us.status = 'active'
      LIMIT 1
    `, [familyOwnerId]);

        const maxFamilyMembers = subscriptionInfo.length > 0 ? subscriptionInfo[0].max_family_members : 1;
        const planName = subscriptionInfo.length > 0 ? subscriptionInfo[0].plan_name : 'No active plan';

        // Transform the data for frontend
        const transformedMembers = familyMembers.map(member => ({
            id: member.id,
            user_id: member.user_id,
            email: member.email,
            profile_avatar_url: member.profile_avatar_url,
            member_role: member.member_role,
            relationship: member.relationship,
            dashboard_type: member.dashboard_type,
            invitation_status: member.invitation_status,
            is_active: member.is_active,
            is_suspended: member.is_suspended,
            suspended_until: member.suspended_until,
            sleep_time_start: member.sleep_time_start,
            sleep_time_end: member.sleep_time_end,
            enforce_sleep_time: member.enforce_sleep_time,
            allowed_access_start: member.allowed_access_start,
            allowed_access_end: member.allowed_access_end,
            enforce_access_window: member.enforce_access_window,
            monthly_spending_limit: member.monthly_spending_limit,
            current_month_spent: member.current_month_spent,
            content_restrictions: member.content_restrictions ? JSON.parse(member.content_restrictions) : null,
            custom_permissions: member.custom_permissions ? JSON.parse(member.custom_permissions) : null,
            invited_at: member.invited_at,
            joined_at: member.joined_at,
            last_accessed_at: member.last_accessed_at
        }));

        res.json({
            family_members: transformedMembers,
            total_count: transformedMembers.length,
            max_family_members: maxFamilyMembers,
            current_plan: planName,
            can_invite_more: transformedMembers.length < maxFamilyMembers
        });

    } catch (error) {
        console.error("❌ Error fetching family members:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

// Update family member settings
const updateFamilyMember = async (req, res) => {
    const { memberId } = req.params;
    const familyOwnerId = req.user.id;
    const updates = req.body;

    if (!memberId) {
        return res.status(400).json({ error: "Member ID is required" });
    }

    try {
        // 1. Verify the member belongs to this family owner
        const member = await query(
            "SELECT id FROM family_members WHERE id = ? AND family_owner_id = ?",
            [memberId, familyOwnerId]
        );

        if (member.length === 0) {
            return res.status(404).json({ error: "Family member not found" });
        }

        // 2. Build update query dynamically
        const allowedFields = [
            'member_role', 'relationship', 'dashboard_type', 'content_restrictions',
            'max_daily_watch_time', 'allowed_content_types', 'blocked_categories',
            'is_suspended', 'suspended_until', 'suspension_reason',
            'sleep_time_start', 'sleep_time_end', 'enforce_sleep_time',
            'allowed_access_start', 'allowed_access_end', 'enforce_access_window',
            'monthly_spending_limit', 'custom_permissions'
        ];

        const updateFields = [];
        const updateValues = [];

        Object.keys(updates).forEach(field => {
            if (allowedFields.includes(field)) {
                updateFields.push(`${field} = ?`);

                // Handle JSON fields
                if (['content_restrictions', 'allowed_content_types', 'blocked_categories', 'custom_permissions'].includes(field)) {
                    updateValues.push(updates[field] ? JSON.stringify(updates[field]) : null);
                } else {
                    updateValues.push(updates[field]);
                }
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

        updateValues.push(memberId, familyOwnerId);

        // 3. Execute update
        await query(
            `UPDATE family_members 
       SET ${updateFields.join(', ')}, updated_at = NOW() 
       WHERE id = ? AND family_owner_id = ?`,
            updateValues
        );

        // 4. Send notification to member if important settings changed
        if (updates.is_suspended !== undefined || updates.member_role || updates.dashboard_type) {
            await sendFamilySettingsNotification(memberId, updates);
        }

        res.json({
            message: "Family member updated successfully",
            updated_fields: updateFields
        });

    } catch (error) {
        console.error("❌ Error updating family member:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

// Remove family member
const removeFamilyMember = async (req, res) => {
    const { memberId } = req.params;
    const familyOwnerId = req.user.id;

    if (!memberId) {
        return res.status(400).json({ error: "Member ID is required" });
    }

    try {
        // 1. Verify the member belongs to this family owner
        const member = await query(
            "SELECT user_id FROM family_members WHERE id = ? AND family_owner_id = ?",
            [memberId, familyOwnerId]
        );

        if (member.length === 0) {
            return res.status(404).json({ error: "Family member not found" });
        }

        const memberUserId = member[0].user_id;

        // 2. Remove the family member record
        await query(
            "DELETE FROM family_members WHERE id = ? AND family_owner_id = ?",
            [memberId, familyOwnerId]
        );

        // 3. Send notification to removed member
        await sendFamilyRemovalNotification(memberUserId, familyOwnerId);

        res.json({
            message: "Family member removed successfully"
        });

    } catch (error) {
        console.error("❌ Error removing family member:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

// 🆕 Get current user's family member status and dashboard type
const getMyFamilyStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const familyStatus = await query(`
      SELECT 
        fm.*,
        u.email as owner_email,
        owner_us.status as owner_subscription_status,
        (owner_us.start_date <= UTC_TIMESTAMP() AND owner_us.end_date > UTC_TIMESTAMP()) as owner_has_active_subscription,
        s.max_family_members,
        s.type as owner_plan_type
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      LEFT JOIN user_subscriptions owner_us ON u.id = owner_us.user_id AND owner_us.status = 'active'
      LEFT JOIN subscriptions s ON owner_us.subscription_id = s.id
      WHERE fm.user_id = ? 
        AND fm.invitation_status = 'accepted'
        AND fm.is_active = true
      LIMIT 1
    `, [userId]);

    if (familyStatus.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          is_family_member: false,
          has_premium_access: false
        }
      });
    }

    const status = familyStatus[0];
    const hasPremiumAccess = status.owner_has_active_subscription === 1;

    res.status(200).json({
      success: true,
      data: {
        is_family_member: true,
        family_owner_id: status.family_owner_id,
        owner_email: status.owner_email,
        member_role: status.member_role,
        dashboard_type: status.dashboard_type,
        has_premium_access: hasPremiumAccess,
        owner_plan_type: status.owner_plan_type,
        owner_subscription_status: status.owner_subscription_status,
        restrictions: {
          content_restrictions: status.content_restrictions ? JSON.parse(status.content_restrictions) : null,
          max_daily_watch_time: status.max_daily_watch_time,
          allowed_content_types: status.allowed_content_types ? JSON.parse(status.allowed_content_types) : null
        }
      }
    });

  } catch (error) {
    console.error("❌ Error fetching family status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch family status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🆕 Check family membership for dashboard routing
const checkFamilyMembership = async (req, res) => {
  try {
    const { userId } = req.params;

    const familyData = await query(`
      SELECT 
        fm.*,
        u.email as owner_email,
        us.subscription_name,
        us.status as subscription_status,
        us.start_date,
        us.end_date,
        s.type as plan_type,
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as has_active_subscription
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      LEFT JOIN user_subscriptions us ON fm.family_owner_id = us.user_id 
        AND us.status = 'active'
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE fm.user_id = ? 
        AND fm.invitation_status = 'accepted'
        AND fm.is_active = true
      LIMIT 1
    `, [userId]);

    if (familyData.length > 0) {
      const memberData = familyData[0];
      const hasFamilyPlanAccess = memberData.plan_type === 'family' && 
        memberData.has_active_subscription === 1;

      return res.json({
        success: true,
        is_family_member: true,
        has_family_plan_access: hasFamilyPlanAccess,
        family_data: {
          family_owner_id: memberData.family_owner_id,
          member_role: memberData.member_role,
          dashboard_type: memberData.dashboard_type,
          subscription_name: memberData.subscription_name,
          plan_type: memberData.plan_type,
          content_restrictions: memberData.content_restrictions,
          max_daily_watch_time: memberData.max_daily_watch_time,
          allowed_content_types: memberData.allowed_content_types,
          blocked_categories: memberData.blocked_categories
        }
      });
    }

    res.json({
      success: true,
      is_family_member: false,
      has_family_plan_access: false
    });

  } catch (error) {
    console.error("Error checking family membership:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check family membership"
    });
  }
};

// 🆕 Get family member dashboard access info
const getFamilyDashboardAccess = async (req, res) => {
  try {
    const userId = req.user.id;

    const familyAccess = await query(`
      SELECT 
        fm.*,
        u.email as owner_email,
        us.subscription_name,
        us.status as subscription_status,
        s.type as plan_type,
        s.max_family_members,
        (us.start_date <= UTC_TIMESTAMP() AND us.end_date > UTC_TIMESTAMP()) as has_active_subscription
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      LEFT JOIN user_subscriptions us ON fm.family_owner_id = us.user_id 
        AND us.status = 'active'
      LEFT JOIN subscriptions s ON us.subscription_id = s.id
      WHERE fm.user_id = ? 
        AND fm.invitation_status = 'accepted'
        AND fm.is_active = true
      LIMIT 1
    `, [userId]);

    if (familyAccess.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          has_family_access: false,
          requires_individual_subscription: true
        }
      });
    }

    const accessData = familyAccess[0];
    const hasFamilyPlanAccess = accessData.plan_type === 'family' && 
      accessData.has_active_subscription === 1;

    res.status(200).json({
      success: true,
      data: {
        has_family_access: true,
        has_family_plan_access: hasFamilyPlanAccess,
        family_owner_id: accessData.family_owner_id,
        member_role: accessData.member_role,
        dashboard_type: accessData.dashboard_type,
        owner_email: accessData.owner_email,
        subscription_name: accessData.subscription_name,
        plan_type: accessData.plan_type,
        requires_individual_subscription: !hasFamilyPlanAccess,
        restrictions: {
          content_restrictions: accessData.content_restrictions ? JSON.parse(accessData.content_restrictions) : null,
          max_daily_watch_time: accessData.max_daily_watch_time,
          allowed_content_types: accessData.allowed_content_types ? JSON.parse(accessData.allowed_content_types) : null
        }
      }
    });

  } catch (error) {
    console.error("❌ Error fetching family dashboard access:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch family dashboard access",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to send family invitation notification
const sendFamilyInvitationNotification = async (targetUserId, familyOwnerId, memberRole, hasActiveSubscription) => {
    try {
        const ownerInfo = await query(
            "SELECT email FROM users WHERE id = ?",
            [familyOwnerId]
        );

        const message = hasActiveSubscription
            ? `You've been invited to join ${ownerInfo[0].email}'s family plan as a ${memberRole}. Note: You currently have an active subscription that will be paused when you join.`
            : `You've been invited to join ${ownerInfo[0].email}'s family plan as a ${memberRole}. Check your email to accept the invitation.`;

        await query(
            `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'family_invitation', '👨‍👩‍👧‍👦 Family Invitation', ?, 'users', 'family', ?, 'high', ?, ?)`,
            [
                targetUserId,
                message,
                familyOwnerId,
                JSON.stringify({
                    invitation_type: 'family',
                    member_role: memberRole,
                    has_active_subscription: hasActiveSubscription,
                    timestamp: new Date().toISOString()
                }),
                "/account/settings#family-invitations"
            ]
        );
    } catch (error) {
        console.error('Error sending family invitation notification:', error);
    }
};

// Helper function to send invitation accepted notification
const sendInvitationAcceptedNotification = async (familyOwnerId, memberUserId) => {
    try {
        const memberInfo = await query(
            "SELECT email FROM users WHERE id = ?",
            [memberUserId]
        );

        await query(
            `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'family_join', '✅ Family Member Joined', ?, 'user-check', 'family', ?, 'normal', ?, ?)`,
            [
                familyOwnerId,
                `${memberInfo[0].email} has accepted your family invitation and joined your family plan.`,
                memberUserId,
                JSON.stringify({
                    action: 'joined_family',
                    timestamp: new Date().toISOString()
                }),
                "/account/settings#profiles"
            ]
        );
    } catch (error) {
        console.error('Error sending invitation accepted notification:', error);
    }
};

// Helper function to send family settings notification
const sendFamilySettingsNotification = async (memberId, updates) => {
    try {
        const memberInfo = await query(
            "SELECT user_id FROM family_members WHERE id = ?",
            [memberId]
        );

        if (memberInfo.length > 0) {
            let message = "Your family member settings have been updated: ";
            const changes = [];

            if (updates.is_suspended !== undefined) {
                changes.push(updates.is_suspended ? "account suspended" : "account activated");
            }
            if (updates.member_role) {
                changes.push(`role changed to ${updates.member_role}`);
            }
            if (updates.dashboard_type) {
                changes.push(`dashboard changed to ${updates.dashboard_type}`);
            }

            message += changes.join(', ');

            await query(
                `INSERT INTO notifications 
         (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
         VALUES (?, 'family_settings', '⚙️ Family Settings Updated', ?, 'settings', 'family', ?, 'normal', ?, ?)`,
                [
                    memberInfo[0].user_id,
                    message,
                    memberId,
                    JSON.stringify({
                        updates: updates,
                        timestamp: new Date().toISOString()
                    }),
                    "/account/settings"
                ]
            );
        }
    } catch (error) {
        console.error('Error sending family settings notification:', error);
    }
};

// Helper function to send family removal notification
const sendFamilyRemovalNotification = async (memberUserId, familyOwnerId) => {
    try {
        const ownerInfo = await query(
            "SELECT email FROM users WHERE id = ?",
            [familyOwnerId]
        );

        await query(
            `INSERT INTO notifications 
       (user_id, type, title, message, icon, reference_type, reference_id, priority, metadata, action_url) 
       VALUES (?, 'family_removal', '👋 Removed from Family', ?, 'user-x', 'family', ?, 'high', ?, ?)`,
            [
                memberUserId,
                `You have been removed from ${ownerInfo[0].email}'s family plan. You no longer have access to their subscription benefits.`,
                familyOwnerId,
                JSON.stringify({
                    action: 'removed_from_family',
                    timestamp: new Date().toISOString()
                }),
                "/subscriptions"
            ]
        );
    } catch (error) {
        console.error('Error sending family removal notification:', error);
    }
};

// Get pending invitations for current user
const getPendingInvitations = async (req, res) => {
    const userId = req.user.id;

    try {
        const invitations = await query(`
      SELECT 
        fm.*,
        u.email as family_owner_email,
        owner.profile_avatar_url as owner_avatar
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      JOIN users owner ON fm.family_owner_id = owner.id
      WHERE fm.user_id = ? AND fm.invitation_status = 'pending'
      ORDER BY fm.invited_at DESC
    `, [userId]);

        res.json({
            pending_invitations: invitations.length,
            invitations: invitations
        });

    } catch (error) {
        console.error("❌ Error fetching pending invitations:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

// Get current family membership status
const getFamilyMembershipStatus = async (req, res) => {
    const userId = req.user.id;

    try {
        const membership = await query(`
      SELECT 
        fm.*,
        u.email as family_owner_email,
        u.profile_avatar_url as owner_avatar
      FROM family_members fm
      JOIN users u ON fm.family_owner_id = u.id
      WHERE fm.user_id = ? AND fm.invitation_status = 'accepted'
      LIMIT 1
    `, [userId]);

        const isFamilyMember = membership.length > 0;

        res.json({
            is_family_member: isFamilyMember,
            ...(isFamilyMember && {
                family_owner_email: membership[0].family_owner_email,
                member_role: membership[0].member_role,
                joined_at: membership[0].joined_at,
                dashboard_type: membership[0].dashboard_type
            })
        });

    } catch (error) {
        console.error("❌ Error fetching family membership:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

// Reject family invitation
const rejectFamilyInvitation = async (req, res) => {
    const { invitation_id } = req.body;
    const userId = req.user.id;

    try {
        // Verify the invitation belongs to this user
        const invitation = await query(
            "SELECT id FROM family_members WHERE id = ? AND user_id = ? AND invitation_status = 'pending'",
            [invitation_id, userId]
        );

        if (invitation.length === 0) {
            return res.status(404).json({ error: "Invitation not found" });
        }

        // Update invitation status to rejected
        await query(
            "UPDATE family_members SET invitation_status = 'rejected', updated_at = NOW() WHERE id = ?",
            [invitation_id]
        );

        res.json({
            message: "Invitation declined successfully"
        });

    } catch (error) {
        console.error("❌ Error rejecting family invitation:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

// Leave family
const leaveFamily = async (req, res) => {
    const userId = req.user.id;

    try {
        // Verify user is a family member (not owner)
        const membership = await query(
            "SELECT id, member_role FROM family_members WHERE user_id = ? AND invitation_status = 'accepted'",
            [userId]
        );

        if (membership.length === 0) {
            return res.status(400).json({ error: "You are not a member of any family" });
        }

        if (membership[0].member_role === 'owner') {
            return res.status(400).json({ error: "Family owners cannot leave their own family" });
        }

        // Remove from family
        await query(
            "DELETE FROM family_members WHERE user_id = ?",
            [userId]
        );

        res.json({
            message: "Successfully left the family"
        });

    } catch (error) {
        console.error("❌ Error leaving family:", error);
        res.status(500).json({ error: "Something went wrong, please try again." });
    }
};

module.exports = {
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
};