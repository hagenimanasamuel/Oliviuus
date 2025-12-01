/**
 * 🚀 LMBTech Payment System - MoMo Only
 */

const axios = require("axios");
const crypto = require("crypto");
const { query } = require('../config/dbConfig');

class PaymentService {
  constructor() {
    // 🔐 Load from environment variables
    this.appKey = process.env.LMBTECH_APP_KEY;
    this.secretKey = process.env.LMBTECH_SECRET_KEY;
    this.transactionFeePercentage = parseFloat(process.env.TRANSACTION_FEE_PERCENTAGE) || 5.0;

    if (!this.appKey || !this.secretKey) {
      throw new Error('Payment service configuration error');
    }

    this.authHeader = `Basic ${Buffer.from(`${this.appKey}:${this.secretKey}`).toString("base64")}`;
    this.apiUrl = process.env.LMBTECH_API_URL || "https://pay.lmbtech.rw/pay/config/api";

    // 🛡️ Service type for safety
    this.serviceType = process.env.LMBTECH_SERVICE_TYPE || 'test';
    this.servicePaid = this.serviceType === 'production' ? 'service_payment' : 'test';

    console.log("✅ PaymentService Ready - MoMo Only");
    console.log(`💰 Transaction fee percentage: ${this.transactionFeePercentage}%`);
  }

  // 🆕 Correct calculation - send reduced amount so user pays exactly subscription price
  calculateAmountToSend(desiredUserAmount) {
    // Provider charges 5% fee on the amount we send
    // So: userPays = amountWeSend + (amountWeSend * 0.05)
    // We want: userPays = desiredUserAmount
    // So: amountWeSend = desiredUserAmount / 1.05

    const providerFeePercentage = 0.05; // 5%

    // Calculate the amount to send
    const amountToSend = Math.floor(desiredUserAmount / (1 + providerFeePercentage));
    const providerFee = Math.round(amountToSend * providerFeePercentage);
    const userPays = amountToSend + providerFee;

    console.log(`💰 Correct Fee Calculation:`);
    console.log(`   We want user to pay: ${desiredUserAmount} RWF`);
    console.log(`   We send to provider: ${amountToSend} RWF`);
    console.log(`   Provider adds 5% fee: ${providerFee} RWF`);
    console.log(`   User pays total: ${userPays} RWF`);
    console.log(`   We receive net: ${amountToSend} RWF`);
    console.log(`   ✅ Exact match: ${userPays === desiredUserAmount ? 'YES' : 'NO'}`);

    return {
      amountToSend: amountToSend,
      providerFee: providerFee,
      userPays: userPays
    };
  }

  // 📤 API Request Handler
  async makeRequest(method, data = {}, options = {}) {
    const timeout = options.timeout || 45000;

    try {
      const config = {
        method: method.toUpperCase(),
        url: this.apiUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
        timeout,
        data,
      };

      if (method.toUpperCase() === "GET") {
        config.params = data;
        delete config.data;
      }

      const response = await axios(config);
      return response.data;

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return {
          status: "processing",
          message: "Payment is being processed"
        };
      }

      console.error('API Error:', error.response?.data || error.message);
      return {
        status: "error",
        message: "Payment service temporarily unavailable"
      };
    }
  }

  // 💰 Create MoMo Payment (CORRECTED)
  async createMoMoPayment(paymentData) {
    const { email, name, amount, phoneNumber, callbackUrl, planType, planName } = paymentData;

    const referenceId = this.generateReferenceId();

    // 🆕 Calculate what to send so user pays exactly the subscription amount
    const { amountToSend, providerFee, userPays } = this.calculateAmountToSend(amount);

    console.log(`💰 Final Payment Flow:`);
    console.log(`   Subscription price: ${amount} RWF`);
    console.log(`   We send to provider: ${amountToSend} RWF`);
    console.log(`   Provider adds fee: ${providerFee} RWF`);
    console.log(`   User pays total: ${userPays} RWF`);
    console.log(`   We receive: ${amountToSend} RWF`);

    const data = {
      email,
      name,
      payment_method: "MoMo",
      amount: amountToSend, // 🆕 Send calculated amount (e.g., 6667 for 7000)
      price: amountToSend,  // 🆕 Send calculated amount
      currency: "RWF",
      service_paid: this.servicePaid,
      callback_url: callbackUrl,
      reference_id: referenceId,
      action: "pay",
      payer_phone: phoneNumber,
    };

    data.signature = this.generateSignature(data);

    console.log(`📤 MoMo Payment Request:`, referenceId);
    console.log(`💸 We send to provider: ${amountToSend} RWF`);
    console.log(`👤 User will pay: ${userPays} RWF (${amountToSend} + ${providerFee} provider fee)`);
    console.log(`🎯 We receive net: ${amountToSend} RWF`);

    const apiResponse = await this.makeRequest('POST', data);

    return {
      ...apiResponse,
      referenceId,
      paymentMethod: 'MoMo',
      userPays: userPays,           // 🆕 What user pays (should equal subscription amount)
      amountWeReceive: amountToSend, // 🆕 What we receive (subscription minus fees)
      providerFee: providerFee,      // 🆕 Provider fee
      planType: planType,            // 🆕 Pass plan info for description
      planName: planName
    };
  }

  // 🔍 Check Payment Status
  async checkStatus(referenceId) {
    try {
      return await this.makeRequest('GET', { reference_id: referenceId });
    } catch (error) {
      console.error(`Status check error:`, error.message);
      return { status: 'unknown', message: 'Status check failed' };
    }
  }

  // ⏰ Utility: Delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🔧 Utility Methods
  generateReferenceId() {
    return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  generateSignature(data) {
    const payload = JSON.stringify(data);
    return crypto.createHash("sha256").update(payload + this.secretKey).digest("hex");
  }

  mapPaymentMethod() {
    return 'momo'; // Only MoMo now
  }

  // 💾 Database Operations (UPDATED with beautiful description format)
  async createPaymentRecord(paymentInfo) {
    const {
      userId, amount, referenceId, status = 'pending', planId = null,
      providerFee = 0, amountWeReceive = null, planType, planName
    } = paymentInfo;

    const sql = `
    INSERT INTO payment_transactions (
      user_id, amount, currency, status, transaction_type,
      provider, provider_transaction_id, description,
      subscription_id, fee_amount, net_amount, created_at, updated_at
    ) VALUES (?, ?, 'RWF', ?, 'one_time', ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
  `;

    // 🎯 Beautiful description format like upgrade service
    const description = planName ? `Plan purchase: ${planName}` : 'Payment - MoMo';

    try {
      await query(sql, [
        userId,
        amount, // Store the amount user pays
        status,
        'momo', // provider
        referenceId,
        description,
        planId, // subscription_id
        providerFee, // 🆕 Store provider fee amount
        amountWeReceive || amount // 🆕 Store net amount we receive
      ]);

      console.log(`💾 Payment record created: ${referenceId} - ${status}`);
      console.log(`📝 Description: ${description}`);
      console.log(`💰 Provider fee: ${providerFee} RWF`);
      console.log(`💰 Net amount we receive: ${amountWeReceive || amount} RWF`);
    } catch (error) {
      console.error('❌ Error creating payment record:', error);
      throw error;
    }
  }

  async updatePaymentStatus(referenceId, status, transactionId = null) {
    let sql, params;

    try {
      if (transactionId) {
        sql = `
        UPDATE payment_transactions 
        SET status = ?, provider_transaction_id = ?, updated_at = UTC_TIMESTAMP() 
        WHERE provider_transaction_id = ?
      `;
        params = [status, transactionId, referenceId];
      } else {
        sql = `
        UPDATE payment_transactions 
        SET status = ?, updated_at = UTC_TIMESTAMP() 
        WHERE provider_transaction_id = ?
      `;
        params = [status, referenceId];
      }

      const result = await query(sql, params);

      if (result.affectedRows === 0) {
        console.warn(`⚠️ No payment record found for reference: ${referenceId}`);
      } else {
        console.log(`🔄 Payment status updated: ${referenceId} -> ${status}`);
      }
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      throw error;
    }
  }

  async getPaymentByReference(referenceId) {
    try {
      const payments = await query(
        'SELECT * FROM payment_transactions WHERE provider_transaction_id = ?',
        [referenceId]
      );

      return payments && payments.length > 0 ? payments[0] : null;
    } catch (error) {
      console.error('❌ Error fetching payment by reference:', error);
      throw error;
    }
  }

  // 🔄 Background Status Checker (UPDATED to accept createUserSubscription function)
  async startBackgroundStatusCheck(referenceId, createUserSubscription) {
    console.log(`🔍 Starting background check: ${referenceId}`);

    for (let attempt = 1; attempt <= 18; attempt++) {
      try {
        await this.delay(5000);

        const payment = await this.getPaymentByReference(referenceId);
        if (!payment || payment.status !== 'pending') {
          break;
        }

        const apiStatus = await this.checkStatus(referenceId);
        if (apiStatus.status && apiStatus.status !== 'pending' && apiStatus.status !== 'processing') {
          const newStatus = this.mapPaymentStatus(apiStatus.status);
          await this.updatePaymentStatus(referenceId, newStatus);
          console.log(`✅ Background update: ${referenceId} -> ${newStatus}`);

          // 🆕 Create subscription if payment completed
          if (newStatus === 'completed' && payment.user_id && payment.subscription_id && createUserSubscription) {
            try {
              await createUserSubscription(
                payment.user_id,
                payment.subscription_id,
                null,
                referenceId
              );
              console.log('✅ Subscription created via background check:', referenceId);
            } catch (subError) {
              console.error('❌ Background subscription creation failed:', subError);
            }
          }

          break;
        }

      } catch (error) {
        console.error(`Background check error:`, error.message);
      }
    }

    console.log(`🏁 Background check completed: ${referenceId}`);
  }

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
}

module.exports = PaymentService;