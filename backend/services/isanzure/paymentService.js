// backend/services/isanzure/paymentService.js
const axios = require("axios");
const crypto = require("crypto");
const { isanzureQuery } = require('../../config/isanzureDbConfig');

class PaymentService {
  constructor() {
    // 🔐 Load from environment variables
    this.appKey = process.env.LMBTECH_APP_KEY;
    this.secretKey = process.env.LMBTECH_SECRET_KEY;

    if (!this.appKey || !this.secretKey) {
      throw new Error('Payment service configuration error');
    }

    this.authHeader = `Basic ${Buffer.from(`${this.appKey}:${this.secretKey}`).toString("base64")}`;
    this.apiUrl = process.env.LMBTECH_API_URL || "https://pay.lmbtech.rw/pay/config/api";
    this.cardCheckoutUrl = "https://pay.lmbtech.rw/pay/pesapal/iframe.php";
    this.serviceType = process.env.LMBTECH_SERVICE_TYPE || 'test';
    this.servicePaid = this.serviceType === 'production' ? 'service_payment' : 'test';

    console.log("✅ iSanzure PaymentService Ready");
    console.log("💰 MoMo + Card Support with Separate Webhook/Return URLs");
  }

  // ============================================
  // 🔧 UTILITY METHODS
  // ============================================

  generateReferenceId(prefix = 'ISANZURE') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}-${timestamp}-${random}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // 📤 API REQUEST HANDLER
  // ============================================

  async makeRequest(method, data = {}) {
    try {
      const config = {
        method: method.toUpperCase(),
        url: this.apiUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
      };

      if (method.toUpperCase() === "GET") {
        config.params = data;
      } else {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (err) {
      console.error("❌ LMBTech API Error:", err.response?.data || err.message);
      throw new Error(err.response?.data?.message || "Payment service request failed");
    }
  }

  // ============================================
  // 📱 MOBILE MONEY PAYMENT - COMPLETE
  // ============================================

  async createMoMoPayment(paymentData) {
    const {
      email,
      name,
      amount,
      phoneNumber,
      description
    } = paymentData;

    const referenceId = this.generateReferenceId('MOMO');
    
    // ✅ Webhook URL only - no return URL for MoMo (phone-based)
    const webhookUrl = `${process.env.BASE_URL}/api/booking/webhook`;

    console.log(`💰 MoMo Payment:`);
    console.log(`   Reference: ${referenceId}`);
    console.log(`   Amount: ${amount} RWF`);
    console.log(`   Phone: ${phoneNumber}`);
    console.log(`   Email: ${email}`);
    console.log(`   Webhook: ${webhookUrl}`);

    try {
      const payload = {
        email,
        name,
        payment_method: "MoMo",
        amount: String(amount),
        price: String(amount),
        payer_phone: phoneNumber,
        service_paid: this.servicePaid,
        reference_id: referenceId,
        callback_url: webhookUrl,  // 👈 Webhook only - server-to-server
        currency: "RWF",
        action: "pay",
      };

      const result = await this.makeRequest("POST", payload);

      console.log(`✅ MoMo payment initiated: ${referenceId}`);

      return {
        status: 'success',
        message: 'Payment request sent to phone',
        referenceId,
        paymentMethod: 'mobile_money',
        response: result
      };

    } catch (error) {
      console.error('❌ MoMo payment error:', error.message);
      return {
        status: 'fail',
        message: error.message || 'Failed to initiate mobile money payment',
        referenceId,
        paymentMethod: 'mobile_money'
      };
    }
  }

  // ============================================
  // 💳 CARD PAYMENT - COMPLETE FIXED with 3 URLs
  // ============================================

async createCardPayment(paymentData) {
  const {
    email,
    firstName,
    lastName,
    phoneNumber,
    amount,
    description,
    userId,
    propertyUid,
    bookingPeriod,
    startDate,
    duration,
    specialRequests,
    optionalServices,
    cancelUrl
  } = paymentData;

  const referenceId = this.generateReferenceId('CARD');
  
  const webhookUrl = `${process.env.BASE_URL}/api/booking/webhook`;
  const redirectUrl = `${process.env.FRONTEND_URL}/booking/processing`;

  console.log(`💳 Card Payment:`);
  console.log(`   Reference: ${referenceId}`);
  console.log(`   Amount: ${amount} RWF`);
  console.log(`   Webhook URL: ${webhookUrl}`);
  console.log(`   Redirect URL: ${redirectUrl}`);

  try {
    const payload = {
      email,
      name: `${firstName} ${lastName}`.trim(),
      payment_method: "card",
      amount: String(amount),
      service_paid: this.servicePaid,
      reference_id: referenceId,
      callback_url: webhookUrl,
      card_redirect_url: redirectUrl,
      action: "pay"
    };

    console.log('📤 Sending card payment request:');
    console.log(JSON.stringify(payload, null, 2));

    const result = await this.makeRequest("POST", payload);

    console.log('📥 LMBTech response:', JSON.stringify(result, null, 2));

    // ✅ FIX: Always use the correct Pesapal URL
    const pesapalUrl = `https://pay.lmbtech.rw/pay/pesapal/iframe.php?reference_id=${referenceId}`;
    
    console.log(`✅ Redirecting to Pesapal: ${pesapalUrl}`);

    return {
      status: 'success',
      message: 'Card payment initiated',
      referenceId,
      paymentMethod: 'card',
      redirect_url: pesapalUrl, // 👈 FORCE correct URL
      response: result
    };

  } catch (error) {
    console.error('❌ Card payment error:', error.message);
    return {
      status: 'fail',
      message: error.message || 'Failed to initiate card payment',
      referenceId,
      paymentMethod: 'card'
    };
  }
}

  // ============================================
  // 🔍 CHECK PAYMENT STATUS
  // ============================================

  async checkPaymentStatus(referenceId) {
    try {
      const result = await this.makeRequest("GET", { reference_id: referenceId });
      
      let status = 'pending';
      const statusStr = String(result?.status || result?.transaction_status || '').toLowerCase();
      
      if (['success', 'successful', 'completed', 'paid', 'approved', 'confirmed'].includes(statusStr)) {
        status = 'completed';
      } else if (['fail', 'failed', 'error', 'declined', 'cancelled', 'rejected'].includes(statusStr)) {
        status = 'failed';
      }
      
      return { status, response: result };
    } catch (error) {
      console.error('❌ Status check error:', error.message);
      return { status: 'unknown' };
    }
  }

  // ============================================
  // 🔄 BACKGROUND STATUS CHECKER
  // ============================================

  async startBackgroundStatusCheck(referenceId, onSuccessCallback) {
    console.log(`🔍 Starting background check: ${referenceId}`);
    
    // Wait 5 seconds before first check
    await this.delay(5000);
    
    let attempts = 0;
    const maxAttempts = 24; // 24 attempts = 72 seconds (3s interval)

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const payment = await this.getBookingPaymentByReference(referenceId);
        if (!payment || payment.status !== 'pending') {
          break;
        }

        const result = await this.checkPaymentStatus(referenceId);
        
        if (result.status && result.status !== 'pending') {
          await this.updateBookingPaymentStatus(referenceId, result.status);
          console.log(`✅ Background update: ${referenceId} -> ${result.status}`);

          if (result.status === 'completed' && onSuccessCallback) {
            await onSuccessCallback(referenceId);
          }
          break;
        }

      } catch (error) {
        console.error(`Background check error:`, error.message);
      }
      
      if (attempts < maxAttempts) {
        await this.delay(3000);
      }
    }

    console.log(`🏁 Background check completed: ${referenceId} (${attempts} attempts)`);
  }

  // ============================================
  // 💾 DATABASE OPERATIONS
  // ============================================

async createBookingPaymentRecord(data) {
  const {
    userId,
    propertyId,
    amount,
    referenceId,
    status,
    bookingPeriod,
    duration,
    startDate,
    endDate,
    specialRequests,
    optionalServices,
    cancellationPolicy,
    paymentMethod
  } = data;

  try {
    const transactionSql = `
      INSERT INTO transactions (
        transaction_uid,
        from_user_id,
        to_user_id,
        amount,
        currency_code,
        transaction_type,
        status,
        payment_method,
        gateway_data,
        notes,
        created_at,
        completed_at
      ) VALUES (
        UUID(),
        ?,
        NULL,
        ?,
        'RWF',
        'rent_payment',
        ?,
        ?,
        ?,
        ?,
        UTC_TIMESTAMP(),
        CASE WHEN ? = 'completed' THEN UTC_TIMESTAMP() ELSE NULL END
      )
    `;

    const gatewayData = JSON.stringify({
      referenceId,
      propertyId,
      bookingPeriod,
      duration,
      startDate,
      endDate,
      specialRequests,
      optionalServices,
      cancellationPolicy,
      paymentMethod
    });

    const result = await isanzureQuery(transactionSql, [
      userId,
      amount,
      status,
      paymentMethod,
      gatewayData,
      `Booking payment - ${bookingPeriod} (${paymentMethod})`,
      status
    ]);

    console.log(`✅ Payment record created: ${referenceId} - ${status} (${paymentMethod})`);
    return result.insertId;
    
  } catch (error) {
    console.error('❌ Error creating payment record:', error);
    throw error;
  }
}

  async getBookingPaymentByReference(referenceId) {
    try {
      const sql = `
        SELECT 
          t.id as transaction_id,
          t.from_user_id as user_id,
          t.amount,
          t.status,
          t.completed_at as paid_at,
          t.booking_id,
          JSON_UNQUOTE(JSON_EXTRACT(t.gateway_data, '$.propertyId')) as property_id,
          JSON_UNQUOTE(JSON_EXTRACT(t.gateway_data, '$.bookingPeriod')) as booking_period,
          JSON_UNQUOTE(JSON_EXTRACT(t.gateway_data, '$.duration')) as duration,
          JSON_UNQUOTE(JSON_EXTRACT(t.gateway_data, '$.startDate')) as start_date,
          JSON_UNQUOTE(JSON_EXTRACT(t.gateway_data, '$.endDate')) as end_date,
          JSON_UNQUOTE(JSON_EXTRACT(t.gateway_data, '$.specialRequests')) as special_requests,
          JSON_EXTRACT(t.gateway_data, '$.optionalServices') as optional_services,
          JSON_UNQUOTE(JSON_EXTRACT(t.gateway_data, '$.cancellationPolicy')) as cancellation_policy
        FROM transactions t
        WHERE JSON_UNQUOTE(JSON_EXTRACT(t.gateway_data, '$.referenceId')) = ?
      `;
      
      const results = await isanzureQuery(sql, [referenceId]);
      
      if (results.length === 0) return null;
      
      const row = results[0];
      
      return {
        ...row,
        duration: row.duration ? parseInt(row.duration) : null,
        optional_services: row.optional_services ? JSON.parse(row.optional_services) : null,
        cancellation_policy: row.cancellation_policy || 'flexible'
      };
    } catch (error) {
      console.error('❌ Error getting booking payment:', error);
      return null;
    }
  }

  async updateBookingPaymentStatus(referenceId, status, transactionId = null) {
    try {
      let sql, params;
      
      if (transactionId) {
        sql = `
          UPDATE transactions 
          SET status = ?, 
              completed_at = CASE WHEN ? = 'completed' THEN UTC_TIMESTAMP() ELSE NULL END,
              provider_transaction_id = ? 
          WHERE JSON_UNQUOTE(JSON_EXTRACT(gateway_data, '$.referenceId')) = ?
        `;
        params = [status, status, transactionId, referenceId];
      } else {
        sql = `
          UPDATE transactions 
          SET status = ?, 
              completed_at = CASE WHEN ? = 'completed' THEN UTC_TIMESTAMP() ELSE NULL END
          WHERE JSON_UNQUOTE(JSON_EXTRACT(gateway_data, '$.referenceId')) = ?
        `;
        params = [status, status, referenceId];
      }

      const result = await isanzureQuery(sql, params);
      
      if (result.affectedRows > 0) {
        console.log(`✅ Payment status updated: ${referenceId} -> ${status}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;