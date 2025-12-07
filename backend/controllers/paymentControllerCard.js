/**
 * 💳 Card Payment Controller - LMBTech + Pesapal Integration
 * Uses existing payment_transactions table
 */

const crypto = require('crypto');
const { query } = require('../config/dbConfig');

// Configuration
const LMBTECH_APP_KEY = process.env.LMBTECH_APP_KEY;
const LMBTECH_SECRET_KEY = process.env.LMBTECH_SECRET_KEY;
const CARD_PAYMENT_URL = 'https://pay.lmbtech.rw/pay/pesapal/iframe.php';
const CALLBACK_URL = `${process.env.BASE_URL || 'http://localhost:3000'}/api/payment/card-callback`;
const CANCEL_URL = `${process.env.CLIENT_URL || 'http://localhost:3001'}/subscription`;

const cardPaymentController = {
  /**
   * 💳 Initiate Card Payment
   */
  async initiateCardPayment(req, res) {
    try {
      const userId = req.user.id;
      const {
        phoneNumber,
        customerName,
        customerEmail,
        planId,
        planType
      } = req.body;

      console.log('💳 Card payment initiation:', {
        userId,
        customerEmail,
        planId,
        planType
      });

      // Validation
      if (!customerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is required for card payment'
        });
      }

      // Verify plan exists and get price
      let planPrice;
      let planData = null;

      if (planId) {
        const plans = await query(
          'SELECT id, price, type, name FROM subscriptions WHERE id = ? AND is_active = true',
          [planId]
        );

        if (!plans || plans.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid subscription plan'
          });
        }

        planData = plans[0];
        planPrice = planData.price;
      } else {
        const { amount } = req.body;
        if (!amount || amount < 100) {
          return res.status(400).json({
            success: false,
            message: 'Valid amount is required'
          });
        }
        planPrice = amount;
      }

      // Generate unique reference ID
      const referenceId = `CARD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Get user info
      let userEmail = customerEmail;
      let userName = customerName;

      if (!userEmail) {
        const users = await query('SELECT email, name FROM users WHERE id = ?', [userId]);
        if (users && users.length > 0) {
          const user = users[0];
          userEmail = user.email;
          userName = userName || user.name || user.email.split('@')[0];
        }
      }

      // Normalize phone number
      const normalizePhone = (phone) => {
        if (!phone) return '+250';
        
        let normalized = phone.trim().replace(/[\s-]/g, '');
        
        if (normalized.startsWith('0')) {
          normalized = '+250' + normalized.substring(1);
        } else if (normalized.startsWith('250')) {
          normalized = '+' + normalized;
        } else if (!normalized.startsWith('+')) {
          normalized = '+250' + normalized;
        }
        
        return normalized;
      };

      const phoneNormalized = normalizePhone(phoneNumber);

      // Extract first and last name
      const nameParts = (userName || '').trim().split(/\s+/, 2);
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts[1] || 'User';

      // Build LMBTech payment data (exact format they expect)
      const paymentData = {
        email: userEmail,
        name: userName || 'Customer',
        phone_number: phoneNormalized,
        first_name: firstName,
        last_name: lastName,
        payment_method: 'Card',
        card_url: CARD_PAYMENT_URL,
        api_key: LMBTECH_APP_KEY,
        secrate_key: LMBTECH_SECRET_KEY, // Note: Their typo "secrate" not "secret"
        amount: parseFloat(planPrice),
        reference_id: referenceId,
        callback_url: CALLBACK_URL,
        cancel_url: CANCEL_URL,
        currency: 'RWF',
        country_code: 'RW',
        action: 'pay',
        service_paid: 'subscription',
        created_at: new Date().toISOString()
      };

      // Save payment record to payment_transactions table
      const description = planData ? `Card payment for ${planData.name} plan` : 'Card payment';
      
      const insertSql = `
        INSERT INTO payment_transactions (
          user_id, amount, currency, status, transaction_type,
          provider, provider_transaction_id, description,
          subscription_id, created_at, updated_at
        ) VALUES (?, ?, 'RWF', ?, 'one_time', ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `;

      await query(insertSql, [
        userId,
        planPrice,
        'pending',
        'card',
        referenceId,
        description,
        planId
      ]);

      console.log('✅ Card payment record created:', referenceId);

      // Return payment data for frontend form submission
      res.json({
        success: true,
        message: 'Card payment initiated',
        data: {
          referenceId,
          paymentMethod: 'card',
          amount: parseFloat(planPrice),
          customerEmail: userEmail,
          customerName: userName,
          status: 'pending',
          paymentUrl: CARD_PAYMENT_URL,
          paymentData: paymentData, // Send all data for form submission
          formAction: CARD_PAYMENT_URL,
          formMethod: 'POST'
        }
      });

    } catch (error) {
      console.error('❌ Card payment initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate card payment'
      });
    }
  },

  /**
   * 📝 Generate HTML Payment Form
   */
  async generatePaymentForm(req, res) {
    try {
      const { referenceId } = req.params;

      // Get payment details
      const payments = await query(
        'SELECT * FROM payment_transactions WHERE provider_transaction_id = ?',
        [referenceId]
      );

      if (!payments || payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = payments[0];

      // Get subscription details if exists
      let planData = null;
      if (payment.subscription_id) {
        const plans = await query(
          'SELECT name, type FROM subscriptions WHERE id = ?',
          [payment.subscription_id]
        );
        if (plans && plans.length > 0) {
          planData = plans[0];
        }
      }

      // Get user details
      const users = await query(
        'SELECT email, name FROM users WHERE id = ?',
        [payment.user_id]
      );

      const user = users && users.length > 0 ? users[0] : { email: '', name: '' };

      // Build payment data
      const paymentData = {
        email: user.email,
        name: user.name || 'Customer',
        phone_number: '+250', 
        first_name: user.name?.split(' ')[0] || 'Customer',
        last_name: user.name?.split(' ').slice(1).join(' ') || 'User',
        payment_method: 'Card',
        card_url: CARD_PAYMENT_URL,
        api_key: LMBTECH_APP_KEY,
        secrate_key: LMBTECH_SECRET_KEY,
        amount: parseFloat(payment.amount),
        reference_id: referenceId,
        callback_url: CALLBACK_URL,
        cancel_url: CANCEL_URL,
        currency: 'RWF',
        country_code: 'RW',
        action: 'pay',
        service_paid: 'subscription',
        created_at: payment.created_at
      };

      // Generate HTML form
      const htmlForm = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Processing Card Payment...</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
              width: 90%;
            }
            .loader {
              width: 50px;
              height: 50px;
              border: 5px solid #f3f3f3;
              border-top: 5px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 30px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h1 {
              color: #333;
              margin-bottom: 10px;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
            .info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
              text-align: left;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .info-label {
              color: #666;
              font-weight: 500;
            }
            .info-value {
              color: #333;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loader"></div>
            <h1>Processing Payment</h1>
            <p>You are being redirected to the secure payment page...</p>
            
            <div class="info">
              <div class="info-item">
                <span class="info-label">Amount:</span>
                <span class="info-value">RWF ${payment.amount.toLocaleString()}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Reference:</span>
                <span class="info-value">${referenceId}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${user.email}</span>
              </div>
            </div>
          </div>

          <form id="paymentForm" method="POST" action="${CARD_PAYMENT_URL}" style="display: none;">
            ${Object.entries(paymentData)
              .map(([key, value]) => 
                `<input type="hidden" name="${key}" value="${value}" />`
              ).join('')}
          </form>

          <script>
            // Auto-submit after 1 second
            setTimeout(() => {
              document.getElementById('paymentForm').submit();
            }, 1000);
          </script>
        </body>
        </html>
      `;

      res.send(htmlForm);

    } catch (error) {
      console.error('❌ Form generation error:', error);
      res.status(500).send('Error generating payment form');
    }
  },

  /**
   * 🔍 Check Card Payment Status
   */
  async checkCardPaymentStatus(req, res) {
    try {
      const { referenceId } = req.params;

      // Get payment from database using provider_transaction_id
      const payments = await query(
        'SELECT * FROM payment_transactions WHERE provider_transaction_id = ?',
        [referenceId]
      );

      if (!payments || payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = payments[0];
      
      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('❌ Status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to check payment status'
      });
    }
  },

  /**
   * 📨 Handle Card Payment Callback
   */
  async handleCardCallback(req, res) {
    try {
      console.log('📨 Card payment callback received:', req.body);

      const {
        reference_id,
        transaction_id,
        status,
        amount,
        currency,
        payment_method
      } = req.body;

      if (!reference_id || !status) {
        console.error('Invalid callback data:', req.body);
        return res.status(400).json({ success: false, message: 'Invalid callback data' });
      }

      // Map Pesapal status to our system
      const mapStatus = (pesapalStatus) => {
        const statusMap = {
          'completed': 'completed',
          'success': 'completed',
          'failed': 'failed',
          'cancelled': 'cancelled',
          'pending': 'pending',
          'processing': 'pending'
        };
        return statusMap[pesapalStatus.toLowerCase()] || 'pending';
      };

      const mappedStatus = mapStatus(status);

      // Update payment in database using provider_transaction_id
      const updateSql = `
        UPDATE payment_transactions 
        SET status = ?, 
            updated_at = UTC_TIMESTAMP()
        WHERE provider_transaction_id = ?
      `;

      await query(updateSql, [mappedStatus, reference_id]);

      console.log(`✅ Card payment updated: ${reference_id} -> ${mappedStatus}`);

      // Create subscription if payment completed
      if (mappedStatus === 'completed') {
        const payment = await query(
          'SELECT user_id, subscription_id FROM payment_transactions WHERE provider_transaction_id = ?',
          [reference_id]
        );

        if (payment && payment.length > 0 && payment[0].user_id && payment[0].subscription_id) {
          await this.createUserSubscription(
            payment[0].user_id,
            payment[0].subscription_id,
            null,
            reference_id
          );
          console.log('✅ Subscription created for card payment:', reference_id);
        }
      }

      // Redirect to frontend
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      const redirectUrl = `${frontendUrl}/payment/status?reference=${reference_id}&status=${mappedStatus}`;
      
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('❌ Card callback error:', error);
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/payment/status?error=true`);
    }
  },

  /**
   * 📝 Create or Update User Subscription
   */
  async createUserSubscription(userId, subscriptionId, planType, paymentReference) {
    try {
      console.log('📝 Creating user subscription from card payment:', {
        userId,
        subscriptionId,
        paymentReference
      });

      // Check if subscription already exists for this payment
      const existingSub = await query(
        'SELECT id FROM user_subscriptions WHERE payment_reference = ?',
        [paymentReference]
      );

      if (existingSub && existingSub.length > 0) {
        console.log('✅ Subscription already exists for payment:', paymentReference);
        return true;
      }

      // Get plan details
      const plans = await query(
        'SELECT * FROM subscriptions WHERE id = ? AND is_active = true',
        [subscriptionId]
      );

      if (!plans || plans.length === 0) {
        throw new Error('Plan not found for subscription creation');
      }

      const plan = plans[0];

      // Dates
      const startDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateFormatted = endDate.toISOString().slice(0, 19).replace('T', ' ');

      // Check for existing active subscription
      const existingSubs = await query(
        `SELECT id FROM user_subscriptions 
         WHERE user_id = ? AND status = 'active' AND end_date > UTC_TIMESTAMP()`,
        [userId]
      );

      if (existingSubs && existingSubs.length > 0) {
        // Update existing
        await query(
          `UPDATE user_subscriptions 
           SET 
             subscription_id = ?,
             subscription_name = ?,
             subscription_price = ?,
             subscription_currency = ?,
             start_date = ?,
             end_date = ?,
             status = 'active',
             payment_reference = ?,
             updated_at = UTC_TIMESTAMP()
           WHERE user_id = ? AND status = 'active'`,
          [
            subscriptionId,
            plan.name,
            plan.price,
            plan.currency || 'RWF',
            startDate,
            endDateFormatted,
            paymentReference,
            userId
          ]
        );
        console.log('✅ Updated existing subscription for user:', userId);
      } else {
        // Create new
        await query(
          `INSERT INTO user_subscriptions (
            user_id, subscription_id, subscription_name, subscription_price, subscription_currency,
            start_date, end_date, status, payment_reference, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
          [
            userId,
            subscriptionId,
            plan.name,
            plan.price,
            plan.currency || 'RWF',
            startDate,
            endDateFormatted,
            paymentReference
          ]
        );
        console.log('✅ Created new subscription for user:', userId);
      }

      return true;
    } catch (error) {
      console.error('❌ Error creating user subscription:', error);
      throw error;
    }
  }
};

module.exports = cardPaymentController;