const { query } = require("../config/dbConfig");

class CustomerManagementController {

  // Get all customers with their subscriptions
  static async getAllCustomers(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = req.query;
      const offset = (page - 1) * limit;

      // Build WHERE conditions
      let whereConditions = ['1=1'];
      let params = [];

      if (search) {
        whereConditions.push('(u.email LIKE ? OR u.id LIKE ? OR us.subscription_name LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Only add status filter if a specific status is provided and it's not 'all'
      if (status && status !== 'all') {
        whereConditions.push('us.status = ?');
        params.push(status);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get customers with subscription details
      const customersQuery = `
        SELECT 
          u.id as user_id,
          u.email,
          u.created_at as user_created,
          u.is_active as user_active,
          u.profile_avatar_url,
          us.id as subscription_id,
          us.subscription_name,
          us.subscription_price,
          us.subscription_currency,
          us.start_date,
          us.end_date,
          us.status as subscription_status,
          us.auto_renew,
          us.cancelled_at,
          us.cancellation_reason,
          us.grace_period_ends,
          s.type as plan_type,
          s.max_sessions,
          s.video_quality,
          s.devices_allowed,
          s.supported_platforms
        FROM user_subscriptions us
        INNER JOIN users u ON us.user_id = u.id
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE ${whereClause}
        ORDER BY us.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_subscriptions us
        INNER JOIN users u ON us.user_id = u.id
        WHERE ${whereClause}
      `;

      const [customers, countResult] = await Promise.all([
        query(customersQuery, [...params, parseInt(limit), offset]),
        query(countQuery, params)
      ]);

      // Process customers data
      const processedCustomers = customers.map(customer => ({
        ...customer,
        devices_allowed: customer.devices_allowed ? JSON.parse(customer.devices_allowed) : [],
        supported_platforms: customer.supported_platforms ? JSON.parse(customer.supported_platforms) : [],
        name: customer.email ? customer.email.split('@')[0] : 'Unknown'
      }));

      const totalCustomers = countResult[0]?.total || 0;

      res.status(200).json({
        success: true,
        data: {
          customers: processedCustomers,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalCustomers / limit),
            total_customers: totalCustomers,
            has_next: offset + customers.length < totalCustomers,
            has_prev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
        error: error.message
      });
    }
  }

  // Update customer subscription status only
  static async updateCustomerSubscription(req, res) {
    try {
      const { customerId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      // Valid status values from your table definition
      const validStatuses = ['active', 'expired', 'cancelled', 'past_due', 'trialing'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Verify customer subscription exists
      const subscriptionCheck = await query(
        'SELECT id, status FROM user_subscriptions WHERE user_id = ?',
        [customerId]
      );

      if (!subscriptionCheck || subscriptionCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Customer subscription not found'
        });
      }

      // Update subscription status
      await query(
        `UPDATE user_subscriptions 
         SET status = ?, 
             updated_at = UTC_TIMESTAMP()
         WHERE user_id = ?`,
        [status, customerId]
      );

      res.status(200).json({
        success: true,
        message: 'Subscription status updated successfully'
      });

    } catch (error) {
      console.error('❌ Error updating customer subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subscription status',
        error: error.message
      });
    }
  }

  // Get customer details by ID
  static async getCustomerDetails(req, res) {
    try {
      const { customerId } = req.params;

      const customerQuery = `
        SELECT 
          u.id as user_id,
          u.email,
          u.created_at as user_created,
          u.is_active as user_active,
          u.profile_avatar_url,
          us.id as subscription_id,
          us.subscription_name,
          us.subscription_price,
          us.subscription_currency,
          us.start_date,
          us.end_date,
          us.status as subscription_status,
          us.auto_renew,
          us.cancelled_at,
          us.cancellation_reason,
          us.grace_period_ends,
          us.payment_reference,
          s.type as plan_type,
          s.max_sessions,
          s.video_quality,
          s.devices_allowed,
          s.supported_platforms,
          s.offline_downloads,
          s.max_downloads,
          s.simultaneous_downloads,
          s.max_profiles,
          s.parental_controls,
          s.early_access,
          s.exclusive_content
        FROM user_subscriptions us
        INNER JOIN users u ON us.user_id = u.id
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE u.id = ?
        ORDER BY us.created_at DESC
        LIMIT 1
      `;

      const [customerDetails] = await query(customerQuery, [customerId]);

      if (!customerDetails || customerDetails.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Customer subscription not found'
        });
      }

      const customer = customerDetails[0];
      const processedCustomer = {
        ...customer,
        devices_allowed: customer.devices_allowed ? JSON.parse(customer.devices_allowed) : [],
        supported_platforms: customer.supported_platforms ? JSON.parse(customer.supported_platforms) : [],
        name: customer.email.split('@')[0]
      };

      res.status(200).json({
        success: true,
        data: processedCustomer
      });

    } catch (error) {
      console.error('❌ Error fetching customer details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer details',
        error: error.message
      });
    }
  }
}

module.exports = CustomerManagementController;