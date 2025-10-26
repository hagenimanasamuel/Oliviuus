const { query } = require("../config/dbConfig");
const pesapalService = require("../services/pesapalService");

const paymentController = {
  async initiatePayment(req, res) {
    try {
      const userId = req.user.id;
      const { amount, phoneNumber, paymentMethod = 'MPESA' } = req.body; // ADD paymentMethod

      // Validation
      if (!amount || amount < 100) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be at least 100 RWF'
        });
      }

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      // Format phone number
      const formattedPhone = phoneNumber.replace(/\s+/g, '');
      const customerPhone = formattedPhone.startsWith('+') ? formattedPhone : `+25${formattedPhone}`;

      // Get user info
      const userResult = await query('SELECT email FROM users WHERE id = ?', [userId]);
      if (!userResult || userResult.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = userResult[0];
      const emailUsername = user.email.split('@')[0];
      const firstName = emailUsername.split('.')[0] || 'Customer';
      const lastName = emailUsername.split('.')[1] || '';

      const orderId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const orderData = {
        orderId: orderId,
        amount: amount,
        currency: 'RWF',
        description: `Payment of ${amount} RWF`,
        customerEmail: user.email,
        customerPhone: customerPhone,
        firstName: firstName,
        lastName: lastName,
        countryCode: 'RW',
        callbackUrl: `${process.env.BASE_URL}/api/payment/callback`,
        cancellationUrl: `${process.env.FRONTEND_URL}/payment?status=cancelled`,
        paymentMethod: paymentMethod // ADD THIS
      };

      let pesapalResponse;

      // CHOOSE PAYMENT METHOD
      if (paymentMethod === 'MPESA') {
        pesapalResponse = await pesapalService.submitMpesaPayment(orderData);
      } else {
        pesapalResponse = await pesapalService.submitOrder(orderData);
      }

      // Create payment record
      const paymentSql = `
        INSERT INTO payments (user_id, order_id, amount, currency, status, customer_email, customer_phone, customer_name, pesapal_tracking_id, redirect_url, payment_method)
        VALUES (?, ?, ?, 'RWF', 'pending', ?, ?, ?, ?, ?, ?)
      `;

      await query(paymentSql, [
        userId, orderId, amount, user.email, customerPhone,
        `${firstName} ${lastName}`.trim(),
        pesapalResponse.order_tracking_id,
        pesapalResponse.redirect_url,
        paymentMethod
      ]);

      res.json({
        success: true,
        message: paymentMethod === 'MPESA' ? 'M-Pesa payment initiated' : 'Payment initiated',
        data: {
          orderId: orderId,
          redirectUrl: pesapalResponse.redirect_url,
          paymentMethod: paymentMethod
        }
      });

    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: error.message
      });
    }
  },

  async paymentCallback(req, res) {
    try {
      const { OrderTrackingId, OrderMerchantReference } = req.query;

      if (!OrderTrackingId || !OrderMerchantReference) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment?status=error`);
      }

      // Get transaction status from PesaPal
      const transactionStatus = await pesapalService.getTransactionStatus(OrderTrackingId);

      // Update payment status
      await query(
        'UPDATE payments SET status = ?, payment_method = ?, updated_at = NOW() WHERE order_id = ?',
        [transactionStatus.status, transactionStatus.payment_method, OrderMerchantReference]
      );

      // Redirect to frontend with status
      res.redirect(
        `${process.env.FRONTEND_URL}/payment?status=${transactionStatus.status}&orderId=${OrderMerchantReference}`
      );

    } catch (error) {
      console.error('Payment callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/payment?status=error`);
    }
  },

  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;

      const payments = await query(
        'SELECT * FROM payments WHERE order_id = ?',
        [orderId]
      );

      if (!payments || payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = payments[0];

      // If payment is still pending, check with PesaPal
      if (payment.status === 'pending' && payment.pesapal_tracking_id) {
        try {
          const transactionStatus = await pesapalService.getTransactionStatus(payment.pesapal_tracking_id);

          if (transactionStatus.status !== payment.status) {
            await query(
              'UPDATE payments SET status = ?, payment_method = ?, updated_at = NOW() WHERE order_id = ?',
              [transactionStatus.status, transactionStatus.payment_method, orderId]
            );
            payment.status = transactionStatus.status;
            payment.payment_method = transactionStatus.payment_method;
          }
        } catch (error) {
          console.error('Error checking status with PesaPal:', error);
        }
      }

      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  },

  async handleIPN(req, res) {
    try {
      console.log('📨 IPN Received:', req.body);

      const { OrderNotificationType, OrderMerchantReference, OrderTrackingId } = req.body;

      if (OrderNotificationType === 'IPN_CHANGE' && OrderTrackingId) {
        // Get latest transaction status from PesaPal
        const transactionStatus = await pesapalService.getTransactionStatus(OrderTrackingId);

        // Update payment status in database
        await query(
          'UPDATE payments SET status = ?, payment_method = ?, updated_at = NOW() WHERE order_id = ?',
          [transactionStatus.status, transactionStatus.payment_method, OrderMerchantReference]
        );

        console.log(`✅ IPN: Payment ${OrderMerchantReference} updated to: ${transactionStatus.status}`);
      }

      res.status(200).json({ success: true, message: 'IPN processed' });
    } catch (error) {
      console.error('❌ IPN handling error:', error);
      res.status(500).json({ success: false, message: 'Error processing IPN' });
    }
  }
};

module.exports = paymentController;