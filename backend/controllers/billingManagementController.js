const { query } = require("../config/dbConfig");

class BillingManagementController {

  // Get billing statistics
  static async getBillingStats(req, res) {
    try {
      const statsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
          COUNT(*) as total_invoices,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as paid_invoices,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices
        FROM payment_transactions 
        WHERE transaction_type IN ('subscription', 'one_time')
      `;

      const [stats] = await query(statsQuery);

      res.status(200).json({
        success: true,
        data: {
          total_revenue: parseFloat(stats.total_revenue) || 0,
          total_invoices: parseInt(stats.total_invoices) || 0,
          paid_invoices: parseInt(stats.paid_invoices) || 0,
          pending_invoices: parseInt(stats.pending_invoices) || 0
        }
      });

    } catch (error) {
      console.error('Error fetching billing stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch billing statistics',
        error: error.message
      });
    }
  }

  // Get all invoices with search and filtering
  static async getInvoices(req, res) {
    try {
      const { search = '', limit = 100 } = req.query;

      let whereConditions = ['transaction_type IN ("subscription", "one_time")'];
      let params = [];

      if (search) {
        whereConditions.push('(u.email LIKE ? OR pt.invoice_id LIKE ? OR pt.provider_transaction_id LIKE ? OR pt.id LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.join(' AND ');

      const invoicesQuery = `
        SELECT 
          pt.id,
          pt.amount,
          pt.currency,
          pt.status,
          pt.transaction_type,
          pt.description,
          pt.invoice_id,
          pt.provider_transaction_id,
          pt.provider,
          pt.created_at,
          pt.paid_at,
          u.email as customer_email,
          u.id as customer_id,
          us.subscription_name,
          s.type as plan_type
        FROM payment_transactions pt
        LEFT JOIN users u ON pt.user_id = u.id
        LEFT JOIN user_subscriptions us ON pt.user_subscription_id = us.id
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE ${whereClause}
        ORDER BY pt.created_at DESC
        LIMIT ?
      `;

      const invoices = await query(invoicesQuery, [...params, parseInt(limit)]);

      res.status(200).json({
        success: true,
        data: {
          invoices: invoices || [],
          total_count: invoices.length
        }
      });

    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoices',
        error: error.message
      });
    }
  }

  // Get invoice details by ID
  static async getInvoiceById(req, res) {
    try {
      const { invoiceId } = req.params;

      const invoiceQuery = `
        SELECT 
          pt.id,
          pt.amount,
          pt.currency,
          pt.status,
          pt.transaction_type,
          pt.description,
          pt.invoice_id,
          pt.provider_transaction_id,
          pt.provider,
          pt.created_at,
          pt.paid_at,
          pt.error_code,
          pt.error_message,
          u.email as customer_email,
          u.id as customer_id,
          us.subscription_name,
          us.start_date,
          us.end_date,
          s.type as plan_type,
          s.description as plan_description
        FROM payment_transactions pt
        LEFT JOIN users u ON pt.user_id = u.id
        LEFT JOIN user_subscriptions us ON pt.user_subscription_id = us.id
        LEFT JOIN subscriptions s ON us.subscription_id = s.id
        WHERE pt.id = ?
      `;

      const [invoice] = await query(invoiceQuery, [invoiceId]);

      if (!invoice || invoice.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      res.status(200).json({
        success: true,
        data: invoice[0]
      });

    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoice',
        error: error.message
      });
    }
  }
}

module.exports = BillingManagementController;