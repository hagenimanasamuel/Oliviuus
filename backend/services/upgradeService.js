/**
 * 🚀 Upgrade Service - Plan Upgrade Management
 */

const { query } = require('../config/dbConfig');
const PaymentService = require('./paymentService');

class UpgradeService {
  constructor() {
    this.paymentService = new PaymentService();
    console.log("✅ UpgradeService Ready - Plan Upgrade Management");
  }

  /**
   * 🆕 Calculate upgrade cost with operational adjustments
   */
  async calculateUpgradeCost(userId, newPlanId) {
    try {
      // Get current active subscription
      const currentSub = await this.getCurrentSubscription(userId);
      if (!currentSub) {
        throw new Error('No active subscription found');
      }

      // Get new plan details
      const newPlan = await this.getPlanDetails(newPlanId);
      if (!newPlan) {
        throw new Error('Invalid plan selected');
      }

      // Verify this is actually an upgrade
      if (!await this.isValidUpgrade(currentSub.subscription_id, newPlanId)) {
        throw new Error('Invalid upgrade - plan must be higher tier');
      }

      // Calculate days remaining in current cycle
      const daysRemaining = this.calculateDaysRemaining(currentSub.end_date);
      
      // Calculate base prorated amount
      const dailyOldPrice = currentSub.subscription_price / 30;
      const dailyNewPrice = newPlan.price / 30;
      const baseUpgrade = (dailyNewPrice - dailyOldPrice) * daysRemaining;

      // 🛡️ Apply operational adjustment (10% for fees, processing, etc.)
      const adjustment = baseUpgrade * 0.10;
      const finalAmount = baseUpgrade + adjustment;

      // Ensure minimum amount
      const minAmount = Math.max(0, Math.round(finalAmount));

      return {
        currentSubscription: currentSub,
        newPlan: newPlan,
        daysRemaining: daysRemaining,
        baseUpgradeAmount: Math.round(baseUpgrade),
        adjustmentAmount: Math.round(adjustment),
        finalAmount: minAmount,
        calculationBreakdown: {
          dailyOldPrice: Math.round(dailyOldPrice),
          dailyNewPrice: Math.round(dailyNewPrice),
          priceDifference: Math.round(dailyNewPrice - dailyOldPrice),
          adjustmentRate: '10%'
        }
      };

    } catch (error) {
      console.error('Upgrade calculation error:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get current active subscription
   */
  async getCurrentSubscription(userId) {
    const sql = `
      SELECT us.*, s.type as plan_type, s.price as current_plan_price
      FROM user_subscriptions us
      JOIN subscriptions s ON us.subscription_id = s.id
      WHERE us.user_id = ? 
      AND us.status = 'active' 
      AND us.end_date > UTC_TIMESTAMP()
      ORDER BY us.end_date DESC
      LIMIT 1
    `;

    const results = await query(sql, [userId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 🆕 Get plan details
   */
  async getPlanDetails(planId) {
    const sql = `
      SELECT * FROM subscriptions 
      WHERE id = ? AND is_active = true AND is_visible = true
    `;

    const results = await query(sql, [planId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 🆕 Verify if upgrade is valid (new plan must be higher tier)
   */
  async isValidUpgrade(currentPlanId, newPlanId) {
    // Get price comparison to ensure upgrade
    const sql = `
      SELECT 
        (SELECT price FROM subscriptions WHERE id = ?) as current_price,
        (SELECT price FROM subscriptions WHERE id = ?) as new_price
    `;

    const results = await query(sql, [currentPlanId, newPlanId]);
    
    if (results.length === 0) return false;
    
    const { current_price, new_price } = results[0];
    return new_price > current_price;
  }

  /**
   * 🆕 Calculate days remaining in subscription
   */
  calculateDaysRemaining(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining); // Ensure non-negative
  }

  /**
   * 🆕 Process upgrade payment and update subscription
   */
  async processUpgrade(userId, upgradeData) {
    try {
      const {
        newPlanId,
        phoneNumber,
        customerName,
        customerEmail,
        security_token
      } = upgradeData;

      // 🛡️ Validate security token
      await this.validateSecurityToken(security_token);

      // Calculate upgrade cost
      const costCalculation = await this.calculateUpgradeCost(userId, newPlanId);
      
      if (costCalculation.finalAmount === 0) {
        throw new Error('No upgrade cost calculated - invalid upgrade request');
      }

      // Get new plan details
      const newPlan = costCalculation.newPlan;

      // Process payment through existing payment service
      const paymentResult = await this.paymentService.createMoMoPayment({
        email: customerEmail,
        name: customerName,
        amount: costCalculation.finalAmount,
        phoneNumber: phoneNumber,
        callbackUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/upgrade/callback`
      });

      console.log('💰 Upgrade payment initiated:', {
        userId,
        amount: costCalculation.finalAmount,
        referenceId: paymentResult.referenceId
      });

      // Handle payment provider errors
      if (paymentResult.status === 'fail' || paymentResult.status === 'error') {
        // Create failed payment record
        await this.createUpgradePaymentRecord({
          userId,
          amount: costCalculation.finalAmount,
          referenceId: paymentResult.referenceId,
          currentSubscriptionId: costCalculation.currentSubscription.id,
          newPlanId: newPlan.id,
          calculationData: costCalculation,
          status: 'failed'
        });

        throw new Error(paymentResult.message || 'Payment initiation failed');
      }

      // 🆕 Create upgrade-specific payment record
      const paymentRecordId = await this.createUpgradePaymentRecord({
        userId,
        amount: costCalculation.finalAmount,
        referenceId: paymentResult.referenceId,
        currentSubscriptionId: costCalculation.currentSubscription.id,
        newPlanId: newPlan.id,
        calculationData: costCalculation,
        status: paymentResult.status === 'success' ? 'pending' : 'failed'
      });

      // If payment is immediately successful, process upgrade
      if (paymentResult.status === 'success') {
        await this.executeUpgrade(
          userId, 
          costCalculation.currentSubscription.id, 
          newPlan.id, 
          paymentRecordId
        );
      } else {
        // Start background status checking for pending payments
        this.startBackgroundUpgradeCheck(paymentResult.referenceId)
          .catch(error => {
            console.error('Background upgrade check error:', error.message);
          });
      }

      return {
        success: true,
        paymentReference: paymentResult.referenceId,
        amount: costCalculation.finalAmount,
        status: paymentResult.status === 'success' ? 'completed' : 'pending',
        upgradeDetails: {
          fromPlan: costCalculation.currentSubscription.subscription_name,
          toPlan: newPlan.name,
          effective: 'immediately',
          daysRemaining: costCalculation.daysRemaining
        }
      };

    } catch (error) {
      console.error('Upgrade processing error:', error);
      throw error;
    }
  }

  /**
   * 🆕 Create specialized upgrade payment record
   */
  async createUpgradePaymentRecord(paymentData) {
    const {
      userId,
      amount,
      referenceId,
      currentSubscriptionId,
      newPlanId,
      calculationData,
      status = 'pending'
    } = paymentData;

    const sql = `
      INSERT INTO payment_transactions (
        user_id, 
        subscription_id,
        user_subscription_id,
        amount, 
        currency, 
        status, 
        transaction_type,
        provider,
        provider_transaction_id,
        description,
        fee_amount,
        net_amount,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, 'RWF', ?, 'upgrade', 'momo', ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
    `;

    const description = `Plan upgrade: ${calculationData.currentSubscription.subscription_name} → ${calculationData.newPlan.name}`;
    
    const result = await query(sql, [
      userId,
      newPlanId, // The target plan
      currentSubscriptionId, // Current user_subscription ID
      amount,
      status,
      referenceId,
      description,
      calculationData.adjustmentAmount,
      calculationData.baseUpgradeAmount
    ]);

    console.log(`💾 Upgrade payment record created: ${referenceId} - ${status}`);
    return result.insertId;
  }

  /**
   * 🆕 Execute the actual subscription upgrade (WITH DUPLICATE PREVENTION)
   */
  async executeUpgrade(userId, currentSubscriptionId, newPlanId, paymentRecordId) {
    try {
      console.log('🔄 Executing upgrade:', { userId, currentSubscriptionId, newPlanId, paymentRecordId });

      // 🛡️ CHECK: Verify upgrade hasn't already been processed for this payment
      const existingUpgrade = await query(
        'SELECT id FROM payment_transactions WHERE id = ? AND status = "completed"',
        [paymentRecordId]
      );

      if (existingUpgrade && existingUpgrade.length > 0) {
        console.log('✅ Upgrade already processed for payment record:', paymentRecordId);
        return true; // Skip execution
      }

      // Get new plan details
      const newPlan = await this.getPlanDetails(newPlanId);
      
      // Update current subscription to new plan
      const updateSql = `
        UPDATE user_subscriptions 
        SET 
          subscription_id = ?,
          subscription_name = ?,
          subscription_price = ?,
          subscription_currency = ?,
          status = 'active',
          updated_at = UTC_TIMESTAMP()
        WHERE id = ? AND user_id = ?
      `;

      await query(updateSql, [
        newPlanId,
        newPlan.name,
        newPlan.price,
        newPlan.currency || 'RWF',
        currentSubscriptionId,
        userId
      ]);

      // Update payment status to completed
      const updatePaymentSql = `
        UPDATE payment_transactions 
        SET status = 'completed', updated_at = UTC_TIMESTAMP()
        WHERE id = ?
      `;

      await query(updatePaymentSql, [paymentRecordId]);

      console.log('✅ Upgrade executed successfully:', {
        userId,
        subscriptionId: currentSubscriptionId,
        newPlan: newPlan.name,
        paymentRecordId
      });

      // 🆕 Create upgrade notification
      await this.createUpgradeNotification(userId, newPlan.name);
      
      return true;

    } catch (error) {
      console.error('❌ Error executing upgrade:', error);
      throw error;
    }
  }

  /**
   * 🆕 Create notification for successful upgrade
   */
  async createUpgradeNotification(userId, newPlanName) {
    const sql = `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        status,
        icon,
        priority,
        created_at
      ) VALUES (?, 'upgrade_success', 'Plan Upgraded 🎉', ?, 'unread', 'crown', 'high', UTC_TIMESTAMP())
    `;

    const message = `Your plan has been successfully upgraded to ${newPlanName}. You now have access to all premium features!`;

    try {
      await query(sql, [userId, message]);
      console.log('✅ Upgrade notification created for user:', userId);
    } catch (error) {
      console.error('Failed to create upgrade notification:', error);
      // Don't throw - notification failure shouldn't break upgrade
    }
  }

  /**
   * 🛡️ Validate security token
   */
  async validateSecurityToken(token) {
    // Basic token validation - you can enhance this
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid security token');
    }

    try {
      const decoded = Buffer.from(token, 'base64').toString('ascii');
      const [timestamp, random, userAgent] = decoded.split('-');
      
      // Check if token is too old (5 minutes)
      if (Date.now() - parseInt(timestamp) > 300000) {
        throw new Error('Security token expired');
      }

      return true;
    } catch (error) {
      throw new Error('Invalid security token format');
    }
  }

  /**
   * 🆕 Handle upgrade payment callback (WITH DUPLICATE PREVENTION)
   */
  async handleUpgradeCallback(referenceId, status, transactionId = null) {
    try {
      // Get upgrade payment record
      const payment = await this.getUpgradePaymentByReference(referenceId);
      if (!payment) {
        throw new Error('Upgrade payment not found');
      }

      const mappedStatus = this.mapPaymentStatus(status);

      // 🛡️ CHECK: If already completed, skip processing
      if (payment.status === 'completed') {
        console.log('✅ Upgrade already completed for:', referenceId);
        return {
          success: true,
          status: 'completed',
          upgradeProcessed: true
        };
      }

      // Update payment status
      await this.updateUpgradePaymentStatus(referenceId, mappedStatus, transactionId);

      // If payment completed, execute the upgrade
      if (mappedStatus === 'completed') {
        await this.executeUpgrade(
          payment.user_id,
          payment.user_subscription_id,
          payment.subscription_id,
          payment.id
        );
      }

      console.log(`✅ Upgrade callback processed: ${referenceId} -> ${mappedStatus}`);

      return {
        success: true,
        status: mappedStatus,
        upgradeProcessed: mappedStatus === 'completed'
      };

    } catch (error) {
      console.error('Upgrade callback error:', error);
      throw error;
    }
  }

  /**
   * 🆕 Get upgrade payment by reference
   */
  async getUpgradePaymentByReference(referenceId) {
    const sql = `
      SELECT * FROM payment_transactions 
      WHERE provider_transaction_id = ? AND transaction_type = 'upgrade'
    `;

    const results = await query(sql, [referenceId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 🆕 Update upgrade payment status
   */
  async updateUpgradePaymentStatus(referenceId, status, transactionId = null) {
    let sql, params;

    if (transactionId) {
      sql = `
        UPDATE payment_transactions 
        SET status = ?, provider_transaction_id = ?, updated_at = UTC_TIMESTAMP() 
        WHERE provider_transaction_id = ? AND transaction_type = 'upgrade'
      `;
      params = [status, transactionId, referenceId];
    } else {
      sql = `
        UPDATE payment_transactions 
        SET status = ?, updated_at = UTC_TIMESTAMP() 
        WHERE provider_transaction_id = ? AND transaction_type = 'upgrade'
      `;
      params = [status, referenceId];
    }

    const result = await query(sql, params);

    if (result.affectedRows === 0) {
      console.warn(`⚠️ No upgrade payment record found: ${referenceId}`);
    } else {
      console.log(`🔄 Upgrade payment status updated: ${referenceId} -> ${status}`);
    }
  }

  /**
   * 🛡️ Map payment status
   */
  mapPaymentStatus(providerStatus) {
    const statusMap = {
      'success': 'completed',
      'completed': 'completed',
      'failed': 'failed',
      'pending': 'pending',
      'processing': 'pending',
      'cancelled': 'cancelled'
    };

    return statusMap[providerStatus?.toLowerCase()] || 'pending';
  }

  /**
   * 🔄 Background Status Checker for Upgrades
   */
  async startBackgroundUpgradeCheck(referenceId) {
    console.log(`🔍 Starting background upgrade check: ${referenceId}`);

    for (let attempt = 1; attempt <= 18; attempt++) {
      try {
        await this.paymentService.delay(5000);

        const payment = await this.getUpgradePaymentByReference(referenceId);
        if (!payment || payment.status !== 'pending') {
          break;
        }

        const apiStatus = await this.paymentService.checkStatus(referenceId);
        if (apiStatus.status && apiStatus.status !== 'pending' && apiStatus.status !== 'processing') {
          await this.handleUpgradeCallback(referenceId, apiStatus.status);
          console.log(`✅ Background upgrade update: ${referenceId} -> ${apiStatus.status}`);
          break;
        }

      } catch (error) {
        console.error(`Background upgrade check error:`, error.message);
      }
    }

    console.log(`🏁 Background upgrade check completed: ${referenceId}`);
  }

  /**
   * 🆕 Get available upgrade plans for user
   */
  async getAvailableUpgrades(userId) {
    try {
      const currentSub = await this.getCurrentSubscription(userId);
      if (!currentSub) {
        throw new Error('No active subscription found');
      }

      // Get all plans that are higher priced than current plan
      const sql = `
        SELECT s.* 
        FROM subscriptions s
        WHERE s.price > ? 
        AND s.is_active = true 
        AND s.is_visible = true
        ORDER BY s.price ASC
      `;

      const upgradePlans = await query(sql, [currentSub.subscription_price]);

      return {
        currentSubscription: currentSub,
        availableUpgrades: upgradePlans
      };

    } catch (error) {
      console.error('Error getting available upgrades:', error);
      throw error;
    }
  }

  /**
   * 🆕 Check upgrade status for frontend
   */
  async checkUpgradeStatus(referenceId, userId) {
    try {
      // Get upgrade payment record
      const payment = await this.getUpgradePaymentByReference(referenceId);
      
      if (!payment) {
        throw new Error('Upgrade payment not found');
      }

      // Verify ownership
      if (payment.user_id !== userId) {
        throw new Error('Access denied');
      }

      // Get current subscription to verify upgrade
      const currentSub = await this.getCurrentSubscription(userId);

      return {
        payment: payment,
        currentSubscription: currentSub,
        upgradeCompleted: payment.status === 'completed'
      };

    } catch (error) {
      console.error('Error checking upgrade status:', error);
      throw error;
    }
  }
}

module.exports = UpgradeService;