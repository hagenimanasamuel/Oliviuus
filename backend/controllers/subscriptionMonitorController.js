// controllers/subscriptionMonitorController.js
const { query } = require("../config/dbConfig");

/**
 * 🕐 BACKGROUND SUBSCRIPTION MONITOR
 * This controller runs automatically when the server starts
 * and periodically checks for expired subscriptions to update their status.
 */
class SubscriptionMonitor {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
  }

  /**
   * 🚀 Start the subscription monitor
   */
  async start() {
    try {
      // Don't start in test environment
      if (process.env.NODE_ENV === 'test') {
        return;
      }

      // Initial check on startup
      await this.checkAndUpdateExpiredSubscriptions();
      
      // Set up periodic checks
      this.intervalId = setInterval(() => {
        this.checkAndUpdateExpiredSubscriptions();
      }, this.checkInterval);
      
      this.isRunning = true;
      
    } catch (error) {
      console.error('Error starting subscription monitor:', error.message);
      this.stop();
    }
  }

  /**
   * 🛑 Stop the subscription monitor
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * 🔍 Check and update expired subscriptions using UTC time
   */
  async checkAndUpdateExpiredSubscriptions() {
    try {
      // 🛡️ Find subscriptions that have ended but are not marked as expired
      const findExpiredSql = `
        SELECT 
          us.id,
          us.user_id,
          us.subscription_name,
          us.status,
          us.start_date,
          us.end_date
        FROM user_subscriptions us
        WHERE 
          -- 🛡️ Only check subscriptions that should have ended (UTC comparison)
          us.end_date <= UTC_TIMESTAMP()
          -- 🛡️ But are not yet marked as expired
          AND us.status IN ('active', 'trialing', 'past_due')
          -- 🛡️ Also check grace period if applicable
          AND (us.grace_period_ends IS NULL OR us.grace_period_ends <= UTC_TIMESTAMP())
        ORDER BY us.end_date ASC
        LIMIT 100  -- Process in batches
      `;

      const expiredSubscriptions = await query(findExpiredSql);
      
      if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
        return;
      }

      // 🛡️ Update each expired subscription
      for (const subscription of expiredSubscriptions) {
        try {
          // 🛡️ Double-check with UTC before updating
          const verifySql = `
            SELECT 
              us.id,
              (us.end_date <= UTC_TIMESTAMP()) as is_still_expired
            FROM user_subscriptions us
            WHERE us.id = ? 
              AND us.status IN ('active', 'trialing', 'past_due')
            LIMIT 1
          `;

          const verification = await query(verifySql, [subscription.id]);
          
          if (!verification || verification.length === 0 || verification[0].is_still_expired === 0) {
            continue;
          }

          // 🛡️ Update the subscription status to expired using UTC timestamp
          const updateSql = `
            UPDATE user_subscriptions 
            SET 
              status = 'expired',
              updated_at = UTC_TIMESTAMP()
            WHERE id = ? 
              AND status IN ('active', 'trialing', 'past_due')
              AND end_date <= UTC_TIMESTAMP()
          `;

          const updateResult = await query(updateSql, [subscription.id]);

          if (updateResult.affectedRows > 0) {
            // 🛡️ Also update user's subscription plan if this was their active subscription
            await this.updateUserSubscriptionPlan(subscription.user_id);
          }

        } catch (error) {
          console.error(`Error updating subscription ${subscription.id}:`, error.message);
        }
      }

    } catch (error) {
      console.error('Error in subscription expiration check:', error.message);
    }
  }

  /**
   * 👤 Update user's subscription plan when their subscription expires
   */
  async updateUserSubscriptionPlan(userId) {
    try {
      // Check if user has any other active subscription
      const activeSubSql = `
        SELECT COUNT(*) as active_count 
        FROM user_subscriptions 
        WHERE user_id = ? 
          AND status = 'active' 
          AND start_date <= UTC_TIMESTAMP()
          AND end_date > UTC_TIMESTAMP()
      `;

      const activeCountResult = await query(activeSubSql, [userId]);
      const activeCount = activeCountResult[0]?.active_count || 0;

      if (activeCount === 0) {
        // No active subscriptions found, update user to free plan
        const updateUserSql = `
          UPDATE users 
          SET subscription_plan = 'none', 
              updated_at = UTC_TIMESTAMP() 
          WHERE id = ? AND subscription_plan != 'none'
        `;

        await query(updateUserSql, [userId]);
      }
    } catch (error) {
      console.error(`Error updating user ${userId} subscription plan:`, error.message);
    }
  }
}

// Create and export singleton instance
const subscriptionMonitor = new SubscriptionMonitor();

/**
 * 🚀 Initialize and start the subscription monitor
 * This should be called when the server starts
 */
const initializeSubscriptionMonitor = () => {
  // Don't start in test environment
  if (process.env.NODE_ENV === 'test') {
    return subscriptionMonitor;
  }

  // Start the monitor
  subscriptionMonitor.start();

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    subscriptionMonitor.stop();
  });

  process.on('SIGINT', () => {
    subscriptionMonitor.stop();
  });

  return subscriptionMonitor;
};

module.exports = {
  SubscriptionMonitor: subscriptionMonitor,
  initializeSubscriptionMonitor
};