// controllers/freePlansController.js
const { query } = require("../config/dbConfig");

const FreePlansController = {
  /**
   * 🎁 Get all free plan schedules
   */
  getAllSchedules: async (req, res) => {
    try {
      const {
        status = 'all',
        type = 'all',
        page = 1,
        limit = 20,
        search = ''
      } = req.query;

      const offset = (page - 1) * limit;

      // Build WHERE conditions
      let whereConditions = ['1=1'];
      let params = [];

      if (status !== 'all') {
        whereConditions.push('fps.status = ?');
        params.push(status);
      }

      if (type !== 'all') {
        whereConditions.push('fps.schedule_type = ?');
        params.push(type);
      }

      if (search) {
        whereConditions.push('(fps.schedule_name LIKE ? OR fps.description LIKE ?)');
        params.push(`%${search}%`);
        params.push(`%${search}%`);
      }

      // Get total count
      const countSql = `
        SELECT COUNT(*) as total 
        FROM free_plan_schedules fps
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countResult = await query(countSql, params);
      const total = countResult[0]?.total || 0;

      // Get schedules with plan details - USING ACTUAL COLUMNS
      const sql = `
        SELECT 
          fps.*,
          s.name as plan_name,
          s.type as plan_type,
          s.price as original_price,
          CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
          
          -- Calculate stats using subqueries
          (
            SELECT COUNT(*) 
            FROM free_plan_activations fpa 
            WHERE fpa.schedule_id = fps.id 
            AND fpa.is_active = 1
          ) as active_activations,
          
          (
            SELECT COUNT(*) 
            FROM free_plan_activations fpa 
            WHERE fpa.schedule_id = fps.id
          ) as total_activations,
          
          -- Calculate remaining activations
          CASE 
            WHEN fps.max_activations IS NULL THEN 'Unlimited'
            ELSE fps.max_activations - fps.current_activations
          END as remaining_activations,
          
          -- Time calculations
          TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), fps.end_date) as seconds_remaining,
          TIMESTAMPDIFF(DAY, UTC_TIMESTAMP(), fps.end_date) as days_remaining,
          TIMESTAMPDIFF(DAY, fps.start_date, fps.end_date) as total_duration_days
          
        FROM free_plan_schedules fps
        LEFT JOIN subscriptions s ON fps.target_plan_id = s.id
        LEFT JOIN users u ON fps.created_by = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY fps.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const schedules = await query(sql, [...params, parseInt(limit), offset]);

      // Parse JSON fields
      const parsedSchedules = schedules.map(schedule => ({
        ...schedule,
        target_user_ids: schedule.target_user_ids ? JSON.parse(schedule.target_user_ids) : [],
        user_segment_criteria: schedule.user_segment_criteria ? JSON.parse(schedule.user_segment_criteria) : {},
        allowed_devices: schedule.allowed_devices ? JSON.parse(schedule.allowed_devices) : [],
        allowed_regions: schedule.allowed_regions ? JSON.parse(schedule.allowed_regions) : [],
        blocked_countries: schedule.blocked_countries ? JSON.parse(schedule.blocked_countries) : [],
        remaining_activations: schedule.remaining_activations === 'Unlimited' ? 'Unlimited' : parseInt(schedule.remaining_activations)
      }));

      res.status(200).json({
        success: true,
        data: parsedSchedules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('❌ Error fetching free plan schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch free plan schedules',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Create a new free plan schedule
   */
  createSchedule: async (req, res) => {
    try {
      const {
        schedule_name,
        description,
        schedule_type = 'public_offer',
        target_plan_id,
        target_user_type = 'eligible_users',
        target_user_ids = null,
        user_segment_criteria = null,
        start_date,
        end_date = null,
        plan_duration_days = 7,
        is_trial = true,
        auto_upgrade_to_paid = false,
        upgrade_plan_id = null,
        max_activations = null,
        allowed_devices = null,
        allowed_regions = null,
        blocked_countries = null,
        terms_and_conditions = null,
        redemption_instructions = null
      } = req.body;

      // Validate required fields
      if (!schedule_name || !target_plan_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Schedule name, target plan, start date, and end date are required'
        });
      }

      // Validate dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }

      // Check if target plan exists
      const planCheck = await query(
        'SELECT id, name FROM subscriptions WHERE id = ?',
        [target_plan_id]
      );

      if (planCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Target plan not found'
        });
      }

      // Check if upgrade plan exists (if provided)
      let validUpgradePlanId = null;
      if (upgrade_plan_id && upgrade_plan_id !== '' && upgrade_plan_id !== 'null') {
        const upgradePlanCheck = await query(
          'SELECT id, name FROM subscriptions WHERE id = ?',
          [upgrade_plan_id]
        );

        if (upgradePlanCheck.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Upgrade plan not found'
          });
        }
        validUpgradePlanId = upgrade_plan_id;
      }

      // Parse JSON fields
      const parsedTargetUserIds = target_user_ids ? JSON.stringify(target_user_ids) : null;
      const parsedSegmentCriteria = user_segment_criteria ? JSON.stringify(user_segment_criteria) : null;
      const parsedAllowedDevices = allowed_devices ? JSON.stringify(allowed_devices) : null;
      const parsedAllowedRegions = allowed_regions ? JSON.stringify(allowed_regions) : null;
      const parsedBlockedCountries = blocked_countries ? JSON.stringify(blocked_countries) : null;

      // Insert schedule - USING ACTUAL COLUMNS
      const sql = `
        INSERT INTO free_plan_schedules (
          schedule_name, description, schedule_type, target_plan_id, target_user_type,
          target_user_ids, user_segment_criteria, start_date, end_date,
          plan_duration_days, is_trial, auto_upgrade_to_paid, upgrade_plan_id, 
          max_activations, allowed_devices, allowed_regions, blocked_countries,
          terms_and_conditions, redemption_instructions,
          status, is_active, created_by, next_execution_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?)
      `;

      const params = [
        schedule_name,
        description,
        schedule_type,
        target_plan_id,
        target_user_type,
        parsedTargetUserIds,
        parsedSegmentCriteria,
        startDate.toISOString().slice(0, 19).replace('T', ' '),
        endDate.toISOString().slice(0, 19).replace('T', ' '),
        plan_duration_days,
        is_trial ? 1 : 0,
        auto_upgrade_to_paid ? 1 : 0,
        validUpgradePlanId,
        max_activations,
        parsedAllowedDevices,
        parsedAllowedRegions,
        parsedBlockedCountries,
        terms_and_conditions,
        redemption_instructions,
        req.user.id,
        startDate.toISOString().slice(0, 19).replace('T', ' ') // Set next_execution_at to start_date
      ];

      const result = await query(sql, params);

      // Get the created schedule
      const newSchedule = await query(
        `SELECT fps.*, s.name as plan_name 
         FROM free_plan_schedules fps 
         LEFT JOIN subscriptions s ON fps.target_plan_id = s.id 
         WHERE fps.id = ?`,
        [result.insertId]
      );

      // Parse JSON fields for response
      const parsedSchedule = {
        ...newSchedule[0],
        target_user_ids: newSchedule[0].target_user_ids ? JSON.parse(newSchedule[0].target_user_ids) : [],
        user_segment_criteria: newSchedule[0].user_segment_criteria ? JSON.parse(newSchedule[0].user_segment_criteria) : {},
        allowed_devices: newSchedule[0].allowed_devices ? JSON.parse(newSchedule[0].allowed_devices) : [],
        allowed_regions: newSchedule[0].allowed_regions ? JSON.parse(newSchedule[0].allowed_regions) : [],
        blocked_countries: newSchedule[0].blocked_countries ? JSON.parse(newSchedule[0].blocked_countries) : []
      };

      res.status(201).json({
        success: true,
        message: 'Free plan schedule created successfully',
        data: parsedSchedule
      });

    } catch (error) {
      console.error('❌ Error creating free plan schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create free plan schedule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Update free plan schedule
   */
  updateSchedule: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const updateData = req.body;

      // Check if schedule exists
      const schedule = await query(
        'SELECT id, status, current_activations FROM free_plan_schedules WHERE id = ?',
        [scheduleId]
      );

      if (schedule.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Free plan schedule not found'
        });
      }

      // Don't allow updating certain fields if there are activations
      if (schedule[0].current_activations > 0) {
        const restrictedFields = ['target_plan_id', 'plan_duration_days', 'max_activations'];
        for (const field of restrictedFields) {
          if (updateData[field] !== undefined) {
            return res.status(400).json({
              success: false,
              message: `Cannot change ${field} after users have already activated this offer`
            });
          }
        }
      }

      // Build update query
      const allowedFields = [
        'schedule_name', 'description', 'status', 'is_active',
        'end_date', 'allowed_devices', 'allowed_regions', 'blocked_countries',
        'terms_and_conditions', 'redemption_instructions'
      ];

      const updateFields = [];
      const updateValues = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          
          // Handle JSON fields
          if (['allowed_devices', 'allowed_regions', 'blocked_countries'].includes(key)) {
            updateValues.push(JSON.stringify(updateData[key]));
          } else if (key === 'is_active') {
            updateValues.push(updateData[key] ? 1 : 0);
          } else {
            updateValues.push(updateData[key]);
          }
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updateValues.push(scheduleId);

      const sql = `UPDATE free_plan_schedules SET ${updateFields.join(', ')}, updated_at = UTC_TIMESTAMP() WHERE id = ?`;
      await query(sql, updateValues);

      res.status(200).json({
        success: true,
        message: 'Schedule updated successfully'
      });

    } catch (error) {
      console.error('❌ Error updating schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update schedule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Delete free plan schedule
   */
  deleteSchedule: async (req, res) => {
    try {
      const { scheduleId } = req.params;

      // Check if schedule exists
      const schedule = await query(
        'SELECT id, current_activations FROM free_plan_schedules WHERE id = ?',
        [scheduleId]
      );

      if (schedule.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Free plan schedule not found'
        });
      }

      // Don't delete if there are activations
      if (schedule[0].current_activations > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete schedule with existing activations. You can deactivate it instead.'
        });
      }

      // Delete schedule
      await query('DELETE FROM free_plan_schedules WHERE id = ?', [scheduleId]);

      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete schedule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Toggle schedule status
   */
  toggleScheduleStatus: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const { action } = req.body; // 'activate', 'pause', 'complete'

      // Check if schedule exists
      const schedule = await query(
        'SELECT id, status, is_active FROM free_plan_schedules WHERE id = ?',
        [scheduleId]
      );

      if (schedule.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Free plan schedule not found'
        });
      }

      let newStatus;
      let newIsActive;
      let message;
      let extraUpdates = '';

      switch (action) {
        case 'activate':
          newStatus = 'active';
          newIsActive = 1;
          message = 'Schedule activated successfully';
          extraUpdates = 'activated_at = UTC_TIMESTAMP(), ';
          break;
        case 'pause':
          newStatus = 'paused';
          newIsActive = 0;
          message = 'Schedule paused successfully';
          break;
        case 'complete':
          newStatus = 'completed';
          newIsActive = 0;
          message = 'Schedule marked as completed';
          extraUpdates = 'completed_at = UTC_TIMESTAMP(), ';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: activate, pause, or complete'
          });
      }

      const sql = `
        UPDATE free_plan_schedules 
        SET ${extraUpdates}status = ?, is_active = ?, updated_at = UTC_TIMESTAMP() 
        WHERE id = ?
      `;

      await query(sql, [newStatus, newIsActive, scheduleId]);

      res.status(200).json({
        success: true,
        message
      });

    } catch (error) {
      console.error('❌ Error toggling schedule status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update schedule status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Manually activate free plan for users
   */
  manualActivation: async (req, res) => {
    try {
      const {
        schedule_id,
        user_ids,
        plan_id,
        duration_days = 7,
        is_trial = true,
        activation_reason = 'manual_activation'
      } = req.body;

      // Validate inputs
      if (!plan_id || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Plan ID and user IDs array are required'
        });
      }

      // Check if plan exists
      const planCheck = await query(
        'SELECT id, name, type, price FROM subscriptions WHERE id = ?',
        [plan_id]
      );

      if (planCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }

      const plan = planCheck[0];

      // Check schedule if provided
      if (schedule_id) {
        const scheduleCheck = await query(
          'SELECT id, max_activations, current_activations FROM free_plan_schedules WHERE id = ?',
          [schedule_id]
        );

        if (scheduleCheck.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Schedule not found'
          });
        }

        const schedule = scheduleCheck[0];
        if (schedule.max_activations && schedule.current_activations + user_ids.length > schedule.max_activations) {
          return res.status(400).json({
            success: false,
            message: `Cannot activate ${user_ids.length} users. Schedule only has ${schedule.max_activations - schedule.current_activations} remaining activations.`
          });
        }
      }

      const activationResults = {
        successful: [],
        failed: [],
        skipped: []
      };

      // Process each user
      for (const userId of user_ids) {
        try {
          // Check if user exists
          const userCheck = await query(
            'SELECT id, email, first_name, last_name FROM users WHERE id = ? AND is_active = 1',
            [userId]
          );

          if (userCheck.length === 0) {
            activationResults.skipped.push({
              user_id: userId,
              reason: 'User not found or inactive'
            });
            continue;
          }

          const user = userCheck[0];

          // Check if user already has an active free plan from this schedule
          if (schedule_id) {
            const existingActivation = await query(
              `SELECT id FROM free_plan_activations 
               WHERE user_id = ? AND schedule_id = ? AND is_active = 1`,
              [userId, schedule_id]
            );

            if (existingActivation.length > 0) {
              activationResults.skipped.push({
                user_id: userId,
                reason: 'User already has active free plan from this schedule'
              });
              continue;
            }
          }

          // Check if user has active subscription
          const activeSub = await query(
            `SELECT id FROM user_subscriptions 
             WHERE user_id = ? 
             AND status = 'active' 
             AND start_date <= UTC_TIMESTAMP()
             AND end_date > UTC_TIMESTAMP()`,
            [userId]
          );

          if (activeSub.length > 0) {
            activationResults.skipped.push({
              user_id: userId,
              reason: 'User already has active subscription'
            });
            continue;
          }

          // Calculate dates
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + duration_days);

          // Create user subscription 
          const subscriptionSql = `
            INSERT INTO user_subscriptions (
              user_id, 
              subscription_id, 
              subscription_name, 
              subscription_price,
              subscription_currency, 
              start_date, 
              end_date, 
              status, 
              auto_renew,
              trial_end_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const subscriptionParams = [
            userId,
            plan_id,
            plan.name,
            0, // Free plan
            'RWF',
            startDate.toISOString().slice(0, 19).replace('T', ' '),
            endDate.toISOString().slice(0, 19).replace('T', ' '),
            is_trial ? 'trialing' : 'active',
            0, // auto_renew = FALSE
            is_trial ? endDate.toISOString().slice(0, 19).replace('T', ' ') : null
          ];

          const subResult = await query(subscriptionSql, subscriptionParams);

          // Create free plan activation record - USING ACTUAL COLUMNS
          const activationSql = `
            INSERT INTO free_plan_activations (
              schedule_id, 
              user_id, 
              subscription_id, 
              plan_id,
              activation_type, 
              activated_at, 
              expires_at, 
              is_active,
              activated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
          `;

          const activationParams = [
            schedule_id || null,
            userId,
            subResult.insertId,
            plan_id,
            schedule_id ? 'scheduled' : 'manual',
            startDate.toISOString().slice(0, 19).replace('T', ' '),
            endDate.toISOString().slice(0, 19).replace('T', ' '),
            req.user.id
          ];

          await query(activationSql, activationParams);

          // Update user's subscription plan
          await query(
            'UPDATE users SET subscription_plan = ? WHERE id = ?',
            [plan.type, userId]
          );

          // Update schedule activation count if applicable
          if (schedule_id) {
            await query(
              'UPDATE free_plan_schedules SET current_activations = current_activations + 1 WHERE id = ?',
              [schedule_id]
            );
          }

          activationResults.successful.push({
            user_id: userId,
            user_email: user.email,
            user_name: `${user.first_name} ${user.last_name}`,
            subscription_id: subResult.insertId,
            expires_at: endDate
          });

        } catch (userError) {
          console.error(`Error processing user ${userId}:`, userError);
          activationResults.failed.push({
            user_id: userId,
            reason: userError.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Free plan activation completed. ${activationResults.successful.length} successful, ${activationResults.failed.length} failed, ${activationResults.skipped.length} skipped.`,
        data: activationResults
      });

    } catch (error) {
      console.error('❌ Error in manual activation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate free plans',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Get free plan activations
   */
  getActivations: async (req, res) => {
    try {
      const {
        schedule_id = null,
        user_id = null,
        status = 'active',
        page = 1,
        limit = 20,
        start_date = null,
        end_date = null
      } = req.query;

      const offset = (page - 1) * limit;

      // Build WHERE conditions
      let whereConditions = ['1=1'];
      let params = [];

      if (schedule_id) {
        whereConditions.push('fpa.schedule_id = ?');
        params.push(schedule_id);
      }

      if (user_id) {
        whereConditions.push('fpa.user_id = ?');
        params.push(user_id);
      }

      if (status === 'active') {
        whereConditions.push('fpa.is_active = 1 AND fpa.expires_at > UTC_TIMESTAMP()');
      } else if (status === 'expired') {
        whereConditions.push('fpa.is_active = 1 AND fpa.expires_at <= UTC_TIMESTAMP()');
      } else if (status === 'inactive') {
        whereConditions.push('fpa.is_active = 0');
      }

      if (start_date) {
        whereConditions.push('fpa.activated_at >= ?');
        params.push(new Date(start_date).toISOString().slice(0, 19).replace('T', ' '));
      }

      if (end_date) {
        whereConditions.push('fpa.activated_at <= ?');
        params.push(new Date(end_date).toISOString().slice(0, 19).replace('T', ' '));
      }

      // Get total count
      const countSql = `
        SELECT COUNT(*) as total 
        FROM free_plan_activations fpa
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countResult = await query(countSql, params);
      const total = countResult[0]?.total || 0;

      // Get activations - USING ACTUAL COLUMNS
      const sql = `
        SELECT 
          fpa.*,
          fps.schedule_name,
          s.name as plan_name,
          s.type as plan_type,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          u.email as user_email,
          u.phone as user_phone,
          
          -- Time calculations
          TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), fpa.expires_at) as seconds_remaining,
          TIMESTAMPDIFF(DAY, fpa.activated_at, fpa.expires_at) as total_days,
          TIMESTAMPDIFF(DAY, UTC_TIMESTAMP(), fpa.expires_at) as days_remaining,
          
          -- Subscription status
          us.status as subscription_status,
          us.end_date as subscription_end_date,
          fpa.activation_type
          
        FROM free_plan_activations fpa
        LEFT JOIN free_plan_schedules fps ON fpa.schedule_id = fps.id
        LEFT JOIN subscriptions s ON fpa.plan_id = s.id
        LEFT JOIN users u ON fpa.user_id = u.id
        LEFT JOIN user_subscriptions us ON fpa.subscription_id = us.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY fpa.activated_at DESC
        LIMIT ? OFFSET ?
      `;

      const activations = await query(sql, [...params, parseInt(limit), offset]);

      // Parse JSON fields
      const parsedActivations = activations.map(activation => ({
        ...activation,
        devices_used: activation.devices_used ? JSON.parse(activation.devices_used) : [],
        platforms_used: activation.platforms_used ? JSON.parse(activation.platforms_used) : []
      }));

      res.status(200).json({
        success: true,
        data: parsedActivations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('❌ Error fetching activations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch free plan activations',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Get schedule statistics
   */
  getScheduleStats: async (req, res) => {
    try {
      const { scheduleId } = req.params;

      // Get basic schedule info
      const schedule = await query(
        `SELECT fps.*, s.name as plan_name 
         FROM free_plan_schedules fps 
         LEFT JOIN subscriptions s ON fps.target_plan_id = s.id 
         WHERE fps.id = ?`,
        [scheduleId]
      );

      if (schedule.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Get activation statistics - USING ACTUAL COLUMNS
      const activationStats = await query(`
        SELECT 
          COUNT(*) as total_activations,
          COUNT(CASE WHEN fpa.is_active = 1 AND fpa.expires_at > UTC_TIMESTAMP() THEN 1 END) as active_activations,
          COUNT(CASE WHEN fpa.is_active = 0 THEN 1 END) as inactive_activations,
          COUNT(CASE WHEN fpa.expires_at <= UTC_TIMESTAMP() THEN 1 END) as expired_activations
        FROM free_plan_activations fpa
        WHERE fpa.schedule_id = ?
      `, [scheduleId]);

      // Get activation trend (last 30 days)
      const activationTrend = await query(`
        SELECT 
          DATE(fpa.activated_at) as activation_date,
          COUNT(*) as activations_count
        FROM free_plan_activations fpa
        WHERE fpa.schedule_id = ? 
          AND fpa.activated_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)
        GROUP BY DATE(fpa.activated_at)
        ORDER BY activation_date
      `, [scheduleId]);

      // Get user engagement stats
      const engagementStats = await query(`
        SELECT 
          COUNT(DISTINCT fpa.user_id) as unique_users,
          COALESCE(AVG(TIMESTAMPDIFF(DAY, fpa.activated_at, fpa.expires_at)), 0) as avg_plan_duration_days
        FROM free_plan_activations fpa
        WHERE fpa.schedule_id = ?
      `, [scheduleId]);

      // Parse schedule JSON fields
      const parsedSchedule = {
        ...schedule[0],
        target_user_ids: schedule[0].target_user_ids ? JSON.parse(schedule[0].target_user_ids) : [],
        user_segment_criteria: schedule[0].user_segment_criteria ? JSON.parse(schedule[0].user_segment_criteria) : {},
        allowed_devices: schedule[0].allowed_devices ? JSON.parse(schedule[0].allowed_devices) : [],
        allowed_regions: schedule[0].allowed_regions ? JSON.parse(schedule[0].allowed_regions) : [],
        blocked_countries: schedule[0].blocked_countries ? JSON.parse(schedule[0].blocked_countries) : []
      };

      res.status(200).json({
        success: true,
        data: {
          schedule: parsedSchedule,
          statistics: {
            activations: activationStats[0],
            engagement: engagementStats[0],
            trend: activationTrend
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching schedule stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch schedule statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Get available plans for free plan assignment
   */
  getAvailablePlansForFree: async (req, res) => {
    try {
      const plans = await query(`
        SELECT 
          id, 
          name, 
          type, 
          price, 
          original_price,
          video_quality,
          max_sessions,
          offline_downloads,
          devices_allowed,
          supported_platforms,
          max_profiles,
          parental_controls
        FROM subscriptions 
        WHERE is_active = 1 
        AND type != 'free'
        ORDER BY display_order ASC, price ASC
      `);

      // Parse JSON fields
      const parsedPlans = plans.map(plan => ({
        ...plan,
        devices_allowed: plan.devices_allowed ? JSON.parse(plan.devices_allowed) : [],
        supported_platforms: plan.supported_platforms ? JSON.parse(plan.supported_platforms) : []
      }));

      res.status(200).json({
        success: true,
        data: parsedPlans,
        count: parsedPlans.length
      });

    } catch (error) {
      console.error('❌ Error fetching available plans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available plans',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Search users for free plan assignment
   */
  searchUsersForAssignment: async (req, res) => {
    try {
      const { search = '', limit = 20 } = req.query;

      if (!search || search.length < 2) {
        return res.status(200).json({
          success: true,
          data: [],
          count: 0,
          message: 'Please enter at least 2 characters to search'
        });
      }

      const sql = `
        SELECT 
          id,
          oliviuus_id,
          email,
          phone,
          first_name,
          last_name,
          profile_avatar_url,
          subscription_plan,
          global_account_tier,
          created_at,
          last_active_at,
          
          -- Check if user has active subscription
          EXISTS (
            SELECT 1 FROM user_subscriptions us 
            WHERE us.user_id = u.id 
            AND us.status = 'active' 
            AND us.start_date <= UTC_TIMESTAMP() 
            AND us.end_date > UTC_TIMESTAMP()
          ) as has_active_subscription,
          
          -- Check if user has any free plan activation
          EXISTS (
            SELECT 1 FROM free_plan_activations fpa 
            WHERE fpa.user_id = u.id 
            AND fpa.is_active = 1
          ) as has_active_free_plan
          
        FROM users u
        WHERE u.is_active = 1 
          AND u.is_deleted = 0
          AND (
            u.email LIKE ? 
            OR u.phone LIKE ? 
            OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
            OR u.oliviuus_id LIKE ?
          )
        ORDER BY 
          CASE 
            WHEN u.email LIKE ? THEN 1
            WHEN u.phone LIKE ? THEN 2
            WHEN CONCAT(u.first_name, ' ', u.last_name) LIKE ? THEN 3
            ELSE 4
          END,
          u.last_active_at DESC
        LIMIT ?
      `;

      const searchPattern = `%${search}%`;
      const users = await query(sql, [
        searchPattern, searchPattern, searchPattern, searchPattern,
        searchPattern, searchPattern, searchPattern,
        parseInt(limit)
      ]);

      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });

    } catch (error) {
      console.error('❌ Error searching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Get dashboard statistics
   */
  getDashboardStats: async (req, res) => {
    try {
      // Get overall statistics - USING ACTUAL COLUMNS
      const overallStats = await query(`
        SELECT 
          -- Schedule counts
          COUNT(*) as total_schedules,
          COUNT(CASE WHEN fps.status = 'active' AND fps.is_active = 1 THEN 1 END) as active_schedules,
          COUNT(CASE WHEN fps.status = 'scheduled' THEN 1 END) as scheduled_schedules,
          COUNT(CASE WHEN fps.status = 'paused' THEN 1 END) as paused_schedules,
          COUNT(CASE WHEN fps.status = 'completed' THEN 1 END) as completed_schedules,
          
          -- Activation counts
          (SELECT COUNT(*) FROM free_plan_activations) as total_activations,
          (SELECT COUNT(*) FROM free_plan_activations WHERE is_active = 1 AND expires_at > UTC_TIMESTAMP()) as active_activations,
          (SELECT COUNT(*) FROM free_plan_activations WHERE expires_at <= UTC_TIMESTAMP()) as expired_activations,
          
          -- User counts
          COUNT(DISTINCT fpa.user_id) as unique_users_activated,
          
          -- Plan distribution
          COUNT(DISTINCT fps.target_plan_id) as unique_plans_used
          
        FROM free_plan_schedules fps
        LEFT JOIN free_plan_activations fpa ON fps.id = fpa.schedule_id
      `);

      // Get recent activity
      const recentActivity = await query(`
        SELECT 
          fps.schedule_name,
          fps.status,
          fps.next_execution_at,
          COUNT(fpa.id) as recent_activations,
          s.name as plan_name
        FROM free_plan_schedules fps
        LEFT JOIN free_plan_activations fpa ON fps.id = fpa.schedule_id 
          AND fpa.activated_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
        LEFT JOIN subscriptions s ON fps.target_plan_id = s.id
        WHERE fps.is_active = 1
        GROUP BY fps.id, fps.schedule_name, fps.status, fps.next_execution_at, s.name
        ORDER BY fps.next_execution_at ASC
        LIMIT 10
      `);

      // Get upcoming executions
      const upcomingExecutions = await query(`
        SELECT 
          fps.schedule_name,
          fps.schedule_type,
          fps.next_execution_at,
          s.name as plan_name,
          fps.max_activations,
          fps.current_activations,
          CASE 
            WHEN fps.max_activations IS NULL THEN 'Unlimited'
            ELSE fps.max_activations - fps.current_activations
          END as remaining_activations
        FROM free_plan_schedules fps
        LEFT JOIN subscriptions s ON fps.target_plan_id = s.id
        WHERE fps.status IN ('scheduled', 'active')
          AND fps.next_execution_at >= UTC_TIMESTAMP()
          AND fps.is_active = 1
        ORDER BY fps.next_execution_at ASC
        LIMIT 5
      `);

      // Get top performing schedules
      const topSchedules = await query(`
        SELECT 
          fps.schedule_name,
          s.name as plan_name,
          COUNT(fpa.id) as total_activations,
          COUNT(CASE WHEN fpa.is_active = 1 AND fpa.expires_at > UTC_TIMESTAMP() THEN 1 END) as active_activations,
          fps.created_at
        FROM free_plan_schedules fps
        LEFT JOIN free_plan_activations fpa ON fps.id = fpa.schedule_id
        LEFT JOIN subscriptions s ON fps.target_plan_id = s.id
        GROUP BY fps.id, fps.schedule_name, s.name, fps.created_at
        ORDER BY total_activations DESC
        LIMIT 5
      `);

      res.status(200).json({
        success: true,
        data: {
          overall: overallStats[0],
          recent_activity: recentActivity,
          upcoming_executions: upcomingExecutions,
          top_schedules: topSchedules
        }
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Check if user can activate a free plan offer
   */
  checkEligibility: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const userId = req.user ? req.user.id : null;

      if (!userId) {
        return res.status(401).json({
          success: false,
          eligible: false,
          reason: 'User not authenticated'
        });
      }

      // Check if schedule exists and is active
      const schedule = await query(`
        SELECT fps.*, 
               s.name as plan_name, 
               s.type as plan_type,
               s.price as original_price
        FROM free_plan_schedules fps
        LEFT JOIN subscriptions s ON fps.target_plan_id = s.id
        WHERE fps.id = ? AND fps.is_active = 1
      `, [scheduleId]);

      if (schedule.length === 0) {
        return res.status(404).json({
          success: false,
          eligible: false,
          reason: 'Free plan offer not found or inactive'
        });
      }

      const scheduleData = schedule[0];
      const now = new Date();
      const startDate = new Date(scheduleData.start_date);
      const endDate = new Date(scheduleData.end_date);

      // Check if schedule is active (date-wise)
      if (now < startDate) {
        return res.status(200).json({
          success: true,
          eligible: false,
          reason: 'This free plan offer has not started yet',
          starts_at: scheduleData.start_date
        });
      }

      if (now > endDate) {
        return res.status(200).json({
          success: true,
          eligible: false,
          reason: 'This free plan offer has expired',
          ended_at: scheduleData.end_date
        });
      }

      // Check max activations limit
      if (scheduleData.max_activations && scheduleData.current_activations >= scheduleData.max_activations) {
        return res.status(200).json({
          success: true,
          eligible: false,
          reason: 'This free plan offer has reached its maximum activation limit'
        });
      }

      // Check if user already activated this offer
      const existingActivation = await query(`
        SELECT id FROM free_plan_activations 
        WHERE schedule_id = ? AND user_id = ? AND is_active = 1
      `, [scheduleId, userId]);

      if (existingActivation.length > 0) {
        return res.status(200).json({
          success: true,
          eligible: false,
          reason: 'You have already activated this free plan offer'
        });
      }

      // Check if user has active subscription
      const activeSub = await query(
        `SELECT id FROM user_subscriptions 
         WHERE user_id = ? 
         AND status = 'active' 
         AND start_date <= UTC_TIMESTAMP()
         AND end_date > UTC_TIMESTAMP()`,
        [userId]
      );

      if (activeSub.length > 0) {
        return res.status(200).json({
          success: true,
          eligible: false,
          reason: 'You already have an active subscription'
        });
      }

      // Check if user has active free plan from ANY schedule
      const activeFreePlan = await query(`
        SELECT fpa.* 
        FROM free_plan_activations fpa
        WHERE fpa.user_id = ? 
          AND fpa.is_active = 1 
          AND fpa.expires_at > UTC_TIMESTAMP()
      `, [userId]);

      if (activeFreePlan.length > 0) {
        return res.status(200).json({
          success: true,
          eligible: false,
          reason: 'You already have an active free plan'
        });
      }

      // Check specific user IDs if specified
      scheduleData.target_user_ids = scheduleData.target_user_ids ? JSON.parse(scheduleData.target_user_ids) : [];
      if (scheduleData.target_user_ids && scheduleData.target_user_ids.length > 0) {
        const targetUserIds = scheduleData.target_user_ids.map(id => parseInt(id));
        const userIdInt = parseInt(userId);
        
        if (!targetUserIds.includes(userIdInt)) {
          return res.status(200).json({
            success: true,
            eligible: false,
            reason: 'This free plan offer is not available for your account'
          });
        }
      }

      // All checks passed - user is eligible
      return res.status(200).json({
        success: true,
        eligible: true,
        schedule: {
          id: scheduleData.id,
          name: scheduleData.schedule_name,
          description: scheduleData.description,
          plan_name: scheduleData.plan_name,
          plan_type: scheduleData.plan_type,
          duration_days: scheduleData.plan_duration_days,
          is_trial: scheduleData.is_trial,
          terms_and_conditions: scheduleData.terms_and_conditions,
          redemption_instructions: scheduleData.redemption_instructions,
          ends_at: scheduleData.end_date,
          max_activations: scheduleData.max_activations,
          current_activations: scheduleData.current_activations,
          remaining_activations: scheduleData.max_activations 
            ? scheduleData.max_activations - scheduleData.current_activations 
            : 'Unlimited'
        }
      });

    } catch (error) {
      console.error('❌ Error checking eligibility:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check eligibility',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Activate free plan for current user
   */
  activateFreePlan: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const userId = req.user.id;

      // Check if schedule exists and is active
      const schedule = await query(`
        SELECT fps.*, 
               s.name as plan_name, 
               s.type as plan_type,
               s.price as original_price
        FROM free_plan_schedules fps
        LEFT JOIN subscriptions s ON fps.target_plan_id = s.id
        WHERE fps.id = ? AND fps.is_active = 1
      `, [scheduleId]);

      if (schedule.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Free plan offer not found or inactive'
        });
      }

      const scheduleData = schedule[0];
      scheduleData.target_user_ids = scheduleData.target_user_ids ? JSON.parse(scheduleData.target_user_ids) : [];
      
      const now = new Date();
      const startDate = new Date(scheduleData.start_date);
      const endDate = new Date(scheduleData.end_date);

      // Check basic conditions
      if (now < startDate) {
        return res.status(400).json({
          success: false,
          message: 'This free plan offer has not started yet'
        });
      }

      if (now > endDate) {
        return res.status(400).json({
          success: false,
          message: 'This free plan offer has expired'
        });
      }

      // Check max activations limit
      if (scheduleData.max_activations && scheduleData.current_activations >= scheduleData.max_activations) {
        return res.status(400).json({
          success: false,
          message: 'This free plan offer has reached its maximum activation limit'
        });
      }

      // Check if user already activated this offer
      const existingActivation = await query(`
        SELECT id FROM free_plan_activations 
        WHERE schedule_id = ? AND user_id = ? AND is_active = 1
      `, [scheduleId, userId]);

      if (existingActivation.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already activated this free plan offer'
        });
      }

      // Check if user has active subscription
      const activeSub = await query(
        `SELECT id FROM user_subscriptions 
         WHERE user_id = ? 
         AND status = 'active' 
         AND start_date <= UTC_TIMESTAMP()
         AND end_date > UTC_TIMESTAMP()`,
        [userId]
      );

      if (activeSub.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active subscription'
        });
      }

      // Check if user has active free plan from ANY schedule
      const activeFreePlan = await query(`
        SELECT fpa.* 
        FROM free_plan_activations fpa
        WHERE fpa.user_id = ? 
          AND fpa.is_active = 1 
          AND fpa.expires_at > UTC_TIMESTAMP()
      `, [userId]);

      if (activeFreePlan.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active free plan'
        });
      }

      // Check specific user IDs if specified
      if (scheduleData.target_user_ids && scheduleData.target_user_ids.length > 0) {
        const targetUserIds = scheduleData.target_user_ids.map(id => parseInt(id));
        const userIdInt = parseInt(userId);
        
        if (!targetUserIds.includes(userIdInt)) {
          return res.status(400).json({
            success: false,
            message: 'This free plan offer is not available for your account'
          });
        }
      }

      // Calculate dates for the free plan
      const activationStartDate = new Date();
      const activationEndDate = new Date();
      activationEndDate.setDate(activationEndDate.getDate() + scheduleData.plan_duration_days);

      // Start transaction
      await query('START TRANSACTION');

      try {
        // 1. Create user subscription - USING ACTUAL COLUMNS (NO 'source' or 'notes')
        const subscriptionSql = `
          INSERT INTO user_subscriptions (
            user_id, 
            subscription_id, 
            subscription_name, 
            subscription_price,
            subscription_currency, 
            start_date, 
            end_date, 
            status, 
            auto_renew,
            trial_end_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const subscriptionParams = [
          userId,
          scheduleData.target_plan_id,
          scheduleData.plan_name,
          0, // Free plan
          'RWF',
          activationStartDate.toISOString().slice(0, 19).replace('T', ' '),
          activationEndDate.toISOString().slice(0, 19).replace('T', ' '),
          scheduleData.is_trial ? 'trialing' : 'active',
          0, // auto_renew = FALSE
          scheduleData.is_trial ? activationEndDate.toISOString().slice(0, 19).replace('T', ' ') : null
        ];
        
        const subResult = await query(subscriptionSql, subscriptionParams);
        const subscriptionId = subResult.insertId;

        // 2. Create free plan activation record - USING ACTUAL COLUMNS (NO 'activation_source')
        const activationSql = `
          INSERT INTO free_plan_activations (
            schedule_id, 
            user_id, 
            subscription_id, 
            plan_id,
            activation_type, 
            activated_at, 
            expires_at, 
            is_active,
            activated_by
          ) VALUES (?, ?, ?, ?, 'user_activated', ?, ?, 1, ?)
        `;

        await query(activationSql, [
          scheduleId,
          userId,
          subscriptionId,
          scheduleData.target_plan_id,
          activationStartDate.toISOString().slice(0, 19).replace('T', ' '),
          activationEndDate.toISOString().slice(0, 19).replace('T', ' '),
          userId
        ]);

        // 3. Update schedule activation count
        await query(
          'UPDATE free_plan_schedules SET current_activations = current_activations + 1 WHERE id = ?',
          [scheduleId]
        );

        // 4. Update user's subscription plan
        await query(
          'UPDATE users SET subscription_plan = ? WHERE id = ?',
          [scheduleData.plan_type, userId]
        );

        // Commit transaction
        await query('COMMIT');

        res.status(200).json({
          success: true,
          message: `Free ${scheduleData.is_trial ? 'trial' : 'plan'} activated successfully!`,
          data: {
            subscription_id: subscriptionId,
            plan_name: scheduleData.plan_name,
            plan_type: scheduleData.plan_type,
            expires_at: activationEndDate,
            duration_days: scheduleData.plan_duration_days,
            is_trial: scheduleData.is_trial
          }
        });

      } catch (transactionError) {
        await query('ROLLBACK');
        console.error('❌ Transaction failed:', transactionError);
        throw transactionError;
      }

    } catch (error) {
      console.error('❌ Error activating free plan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate free plan',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Get schedule details by ID
   */
  getScheduleById: async (req, res) => {
    try {
      const { scheduleId } = req.params;

      const schedule = await query(`
        SELECT 
          fps.*,
          s.name as plan_name,
          s.type as plan_type,
          s.price as original_price,
          CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
          
          -- Calculate stats
          (
            SELECT COUNT(*) 
            FROM free_plan_activations fpa 
            WHERE fpa.schedule_id = fps.id 
            AND fpa.is_active = 1
          ) as active_activations,
          
          (
            SELECT COUNT(*) 
            FROM free_plan_activations fpa 
            WHERE fpa.schedule_id = fps.id
          ) as total_activations
          
        FROM free_plan_schedules fps
        LEFT JOIN subscriptions s ON fps.target_plan_id = s.id
        LEFT JOIN users u ON fps.created_by = u.id
        WHERE fps.id = ?
      `, [scheduleId]);

      if (schedule.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Parse JSON fields
      const parsedSchedule = {
        ...schedule[0],
        target_user_ids: schedule[0].target_user_ids ? JSON.parse(schedule[0].target_user_ids) : [],
        user_segment_criteria: schedule[0].user_segment_criteria ? JSON.parse(schedule[0].user_segment_criteria) : {},
        allowed_devices: schedule[0].allowed_devices ? JSON.parse(schedule[0].allowed_devices) : [],
        allowed_regions: schedule[0].allowed_regions ? JSON.parse(schedule[0].allowed_regions) : [],
        blocked_countries: schedule[0].blocked_countries ? JSON.parse(schedule[0].blocked_countries) : []
      };

      res.status(200).json({
        success: true,
        data: parsedSchedule
      });

    } catch (error) {
      console.error('❌ Error fetching schedule details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch schedule details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Get eligible free plan schedules for current user
   */
  getEligibleSchedules: async (req, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const now = new Date();

      // Get all ACTIVE schedules that are currently running
      const activeSchedules = await query(`
        SELECT fps.*, 
               s.name as plan_name, 
               s.type as plan_type,
               s.price as original_price,
               
               -- Calculate remaining activations
               CASE 
                 WHEN fps.max_activations IS NULL THEN 'Unlimited'
                 ELSE fps.max_activations - fps.current_activations
               END as remaining_activations,
               
               -- Calculate time remaining
               TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), fps.end_date) as seconds_remaining,
               TIMESTAMPDIFF(DAY, UTC_TIMESTAMP(), fps.end_date) as days_remaining
               
        FROM free_plan_schedules fps
        LEFT JOIN subscriptions s ON fps.target_plan_id = s.id
        WHERE fps.is_active = 1 
          AND fps.status = 'active'
          AND fps.start_date <= ?
          AND (fps.end_date IS NULL OR fps.end_date >= ?)
        ORDER BY fps.created_at DESC
      `, [now.toISOString().slice(0, 19).replace('T', ' '), now.toISOString().slice(0, 19).replace('T', ' ')]);

      if (activeSchedules.length === 0) {
        return res.status(200).json({
          success: true,
          available_schedules: [],
          count: 0,
          message: 'No free plans available at the moment'
        });
      }

      const eligibleSchedules = [];
      
      // Get user's active free plans
      let userActiveFreePlans = [];
      try {
        const activePlansResult = await query(`
          SELECT schedule_id 
          FROM free_plan_activations 
          WHERE user_id = ? 
            AND is_active = 1 
            AND expires_at > UTC_TIMESTAMP()
        `, [userId]);
        
        userActiveFreePlans = activePlansResult.map(p => p.schedule_id);
      } catch (error) {
        // Continue with empty array
      }
      
      // Check if user has active subscription
      let hasActiveSubscription = false;
      try {
        const activeSub = await query(
          `SELECT id FROM user_subscriptions 
           WHERE user_id = ? 
           AND status = 'active' 
           AND start_date <= UTC_TIMESTAMP()
           AND end_date > UTC_TIMESTAMP()`,
          [userId]
        );
        
        hasActiveSubscription = activeSub.length > 0;
      } catch (error) {
        // Continue assuming no active subscription
      }
      
      // Check eligibility for each schedule
      for (const schedule of activeSchedules) {
        try {
          // Parse JSON fields
          schedule.target_user_ids = schedule.target_user_ids ? JSON.parse(schedule.target_user_ids) : [];
          schedule.user_segment_criteria = schedule.user_segment_criteria ? JSON.parse(schedule.user_segment_criteria) : {};
          
          // 1. Check max activations limit
          if (schedule.max_activations && schedule.current_activations >= schedule.max_activations) {
            continue;
          }
          
          // 2. Check if user already activated this offer
          if (userActiveFreePlans.includes(schedule.id)) {
            continue;
          }
          
          // 3. Check if user has active subscription (from any source)
          if (hasActiveSubscription) {
            continue;
          }
          
          // 4. Check specific user IDs if specified
          if (schedule.target_user_ids && schedule.target_user_ids.length > 0) {
            const targetUserIds = schedule.target_user_ids.map(id => parseInt(id));
            const userIdInt = parseInt(userId);
            
            if (!targetUserIds.includes(userIdInt)) {
              continue;
            }
          }
          
          // 5. Check user segment criteria
          if (schedule.user_segment_criteria && Object.keys(schedule.user_segment_criteria).length > 0) {
            const criteria = schedule.user_segment_criteria;
            
            // Get user info
            const userInfo = await query(`
              SELECT u.*,
                TIMESTAMPDIFF(DAY, u.created_at, UTC_TIMESTAMP()) as account_age_days,
                u.email_verified,
                u.phone_verified,
                u.global_account_tier
              FROM users u
              WHERE u.id = ?
            `, [userId]);

            if (userInfo.length === 0) {
              continue;
            }
            
            const user = userInfo[0];

            // Check account age
            if (criteria.min_account_age_days && user.account_age_days < criteria.min_account_age_days) {
              continue;
            }

            // Check email verification
            if (criteria.require_email_verification && !user.email_verified) {
              continue;
            }

            // Check phone verification
            if (criteria.require_phone_verification && !user.phone_verified) {
              continue;
            }

            // Check account tiers
            if (criteria.allowed_account_tiers && criteria.allowed_account_tiers.length > 0) {
              const allowedTiers = criteria.allowed_account_tiers.map(tier => tier.toLowerCase());
              const userTier = user.global_account_tier?.toLowerCase() || 'free';
              
              if (!allowedTiers.includes(userTier)) {
                continue;
              }
            }
          }

          // All checks passed - user is eligible!
          eligibleSchedules.push({
            id: schedule.id,
            schedule_name: schedule.schedule_name,
            description: schedule.description,
            plan_name: schedule.plan_name,
            plan_type: schedule.plan_type,
            duration_days: schedule.plan_duration_days,
            is_trial: schedule.is_trial,
            terms_and_conditions: schedule.terms_and_conditions,
            redemption_instructions: schedule.redemption_instructions,
            start_date: schedule.start_date,
            end_date: schedule.end_date,
            ends_at: schedule.end_date,
            max_activations: schedule.max_activations,
            current_activations: schedule.current_activations,
            remaining_activations: schedule.remaining_activations,
            seconds_remaining: schedule.seconds_remaining,
            days_remaining: schedule.days_remaining,
            schedule_type: schedule.schedule_type,
            auto_upgrade_to_paid: schedule.auto_upgrade_to_paid,
            upgrade_plan_id: schedule.upgrade_plan_id
          });

        } catch (scheduleError) {
          // Continue with other schedules
        }
      }

      res.status(200).json({
        success: true,
        available_schedules: eligibleSchedules,
        count: eligibleSchedules.length,
        message: eligibleSchedules.length > 0 
          ? `Found ${eligibleSchedules.length} eligible free plan(s)`
          : 'No eligible free plans found'
      });

    } catch (error) {
      console.error('❌ Error fetching eligible free plans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch eligible free plans',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 🎁 Get user's active free plans
   */
  getUserActivePlans: async (req, res) => {
    try {
      const userId = req.user.id;

      const sql = `
        SELECT 
          fpa.*,
          fps.schedule_name,
          s.name as plan_name,
          s.type as plan_type,
          TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), fpa.expires_at) as seconds_remaining,
          TIMESTAMPDIFF(DAY, UTC_TIMESTAMP(), fpa.expires_at) as days_remaining,
          TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), fpa.expires_at) as hours_remaining,
          us.status as subscription_status
        FROM free_plan_activations fpa
        LEFT JOIN free_plan_schedules fps ON fpa.schedule_id = fps.id
        LEFT JOIN subscriptions s ON fpa.plan_id = s.id
        LEFT JOIN user_subscriptions us ON fpa.subscription_id = us.id
        WHERE fpa.user_id = ? 
          AND fpa.is_active = 1 
          AND fpa.expires_at > UTC_TIMESTAMP()
        ORDER BY fpa.expires_at ASC
      `;
      
      const activePlans = await query(sql, [userId]);

      res.status(200).json({
        success: true,
        data: activePlans,
        count: activePlans.length
      });

    } catch (error) {
      console.error('❌ Error fetching user active plans:', error);
      res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: 'No active free plans found'
      });
    }
  }
};

module.exports = FreePlansController;