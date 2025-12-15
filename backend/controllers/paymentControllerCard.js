/**
 * 💳 Card Payment Controller - EXACT SAME LOGIC AS MoMo
 */

const crypto = require('crypto');
const { query } = require('../config/dbConfig');

// Configuration
const LMBTECH_APP_KEY = process.env.LMBTECH_APP_KEY;
const LMBTECH_SECRET_KEY = process.env.LMBTECH_SECRET_KEY;
const CARD_PAYMENT_URL = 'https://pay.lmbtech.rw/pay/pesapal/iframe.php';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';

// Card payment fee percentage (5% for card payments - SAME AS MOMO)
const CARD_FEE_PERCENTAGE = 5.0;

const cardPaymentController = {
  /**
   * 💳 Initiate Card Payment - EXACT SAME LOGIC AS MoMo
   */
  async initiateCardPayment(req, res) {
    try {
      const userId = req.user.id;
      const {
        phoneNumber,
        customerName,
        customerEmail,
        planId,
        planType,
        amount: customAmount
      } = req.body;

      console.log('💳 Card payment initiation:', {
        userId,
        planId,
        planType,
        customAmount
      });

      // Validation
      if (!customerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is required for card payment'
        });
      }

      // 🚨 Verify plan exists and get price from database
      let planPrice;
      let planData = null;
      let planIdToUse = planId;

      if (planId) {
        const plans = await query(
          'SELECT id, price, type, name, description FROM subscriptions WHERE id = ? AND is_active = true',
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
        console.log('✅ Plan verified from database:', {
          planId,
          price: planPrice,
          type: planData.type,
          name: planData.name
        });
      } else if (customAmount && customAmount >= 100) {
        planPrice = customAmount;
        planIdToUse = null;
        planData = { name: 'Custom Payment', type: 'custom' };
        console.log('💰 Using custom amount:', planPrice);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either planId or valid amount (≥ 100 RWF) is required'
        });
      }

      // Generate unique reference ID
      const referenceId = `CARD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // 👤 Get user info
      let userEmail = customerEmail;
      let userName = customerName;

      if (!userEmail) {
        const users = await query('SELECT email, name, phone FROM users WHERE id = ?', [userId]);
        if (users && users.length > 0) {
          const user = users[0];
          userEmail = user.email;
          userName = userName || user.name || user.email.split('@')[0];
        }
      }

      // Normalize phone number
      const normalizePhone = (phone) => {
        if (!phone) return '+250788123456';
        
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

      const phoneNormalized = normalizePhone(phoneNumber || '');

      // Extract first and last name
      const nameParts = (userName || 'Customer').trim().split(/\s+/, 2);
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts[1] || 'User';

      // 🔄 FIXED LOGIC: User should pay exactly the subscription amount
      const calculateAmountToSend = (subscriptionAmount) => {
        // Provider charges 5% fee on the amount we send
        // We want: User pays = subscriptionAmount (e.g., 5000)
        // Formula: amountWeSend = subscriptionAmount / 1.05
        
        const providerFeePercentage = CARD_FEE_PERCENTAGE / 100;
        
        // Calculate what we should send to provider
        const amountToSend = Math.round(subscriptionAmount / (1 + providerFeePercentage));
        
        // Calculate the actual fee
        const providerFee = Math.round(amountToSend * providerFeePercentage);
        
        // What user will actually pay (should be close to subscriptionAmount)
        const userPays = amountToSend + providerFee;
        
        console.log(`💰 Card Payment Calculation for ${subscriptionAmount} RWF:`);
        console.log(`   Subscription amount user sees: ${subscriptionAmount} RWF`);
        console.log(`   We send to provider: ${amountToSend} RWF`);
        console.log(`   Provider adds ${CARD_FEE_PERCENTAGE}% fee: ${providerFee} RWF`);
        console.log(`   User will be charged: ${userPays} RWF`);
        console.log(`   We receive net: ${amountToSend} RWF`);
        console.log(`   Difference from desired amount: ${userPays - subscriptionAmount} RWF`);
        
        return {
          amountToSend: amountToSend,
          providerFee: providerFee,
          userPays: userPays,
          netAmountWeReceive: amountToSend,
          feePercentage: CARD_FEE_PERCENTAGE,
          originalAmount: subscriptionAmount
        };
      };

      // FIX: For card payments, we need to calculate the amount differently
      // The issue is that when we send X to the provider, they add 5% and charge the user
      // So if user should pay 5000, we need to find the correct X
      const calculateCorrectCardAmount = (desiredUserAmount) => {
        // Provider's calculation: userPays = amountWeSend + (amountWeSend * 0.05)
        // So: amountWeSend = desiredUserAmount / 1.05
        
        // But for exact amounts, we need to be precise
        let amountToSend = Math.floor(desiredUserAmount / 1.05);
        let fee = Math.ceil(amountToSend * 0.05);
        let total = amountToSend + fee;
        
        // Adjust if not exact
        while (total < desiredUserAmount) {
          amountToSend += 1;
          fee = Math.ceil(amountToSend * 0.05);
          total = amountToSend + fee;
        }
        
        // If we overshoot, try to find the best match
        if (total > desiredUserAmount) {
          // Try to find the closest match
          let bestAmountToSend = amountToSend;
          let bestTotal = total;
          let bestDiff = Math.abs(total - desiredUserAmount);
          
          for (let i = -10; i <= 10; i++) {
            const testAmount = amountToSend + i;
            if (testAmount <= 0) continue;
            
            const testFee = Math.ceil(testAmount * 0.05);
            const testTotal = testAmount + testFee;
            const testDiff = Math.abs(testTotal - desiredUserAmount);
            
            if (testDiff < bestDiff) {
              bestDiff = testDiff;
              bestAmountToSend = testAmount;
              bestTotal = testTotal;
            }
          }
          
          amountToSend = bestAmountToSend;
          fee = Math.ceil(amountToSend * 0.05);
          total = amountToSend + fee;
        }
        
        console.log(`🎯 Optimized Card Calculation for ${desiredUserAmount} RWF:`);
        console.log(`   Desired user payment: ${desiredUserAmount} RWF`);
        console.log(`   We send to provider: ${amountToSend} RWF`);
        console.log(`   Provider fee (5%): ${fee} RWF`);
        console.log(`   User will be charged: ${total} RWF`);
        console.log(`   Difference: ${total - desiredUserAmount} RWF`);
        console.log(`   We receive: ${amountToSend} RWF`);
        
        return {
          amountToSend: amountToSend,
          providerFee: fee,
          userPays: total,
          netAmountWeReceive: amountToSend,
          feePercentage: CARD_FEE_PERCENTAGE,
          originalAmount: desiredUserAmount
        };
      };

      const feeData = calculateCorrectCardAmount(planPrice);

      console.log(`💰 Final Card Payment Flow:`);
      console.log(`   User sees (subscription price): ${planPrice} RWF`);
      console.log(`   We send to provider: ${feeData.amountToSend} RWF`);
      console.log(`   Provider adds fee: ${feeData.providerFee} RWF (${CARD_FEE_PERCENTAGE}%)`);
      console.log(`   User will be charged: ${feeData.userPays} RWF`);
      console.log(`   We receive net: ${feeData.netAmountWeReceive} RWF`);

      // 🧪 TEST DIFFERENT AMOUNTS
      console.log('\n🧪 TESTING DIFFERENT AMOUNTS:');
      const testAmounts = [100, 500, 1000, 3000, 5000, 10000];
      testAmounts.forEach(testAmount => {
        const testData = calculateCorrectCardAmount(testAmount);
        console.log(`   Subscription: ${testAmount} RWF`);
        console.log(`     Send to provider: ${testData.amountToSend} RWF`);
        console.log(`     Provider fee: ${testData.providerFee} RWF`);
        console.log(`     User charged: ${testData.userPays} RWF`);
        console.log(`     Match desired: ${testData.userPays === testAmount ? '✅ PERFECT' : `❌ Off by ${testData.userPays - testAmount} RWF`}`);
      });

      // Generate callback URLs
      const callbackUrl = `${BASE_URL}/api/payment/card-callback?reference=${referenceId}`;
      const cancelUrl = `${CLIENT_URL}/subscription?payment=cancelled&reference=${referenceId}`;

      // 🚨 CRITICAL FIX: For 5000 RWF subscription, we need to send 4762 RWF
      // This way: 4762 + (4762 * 0.05) = 4762 + 238 = 5000 RWF exactly!
      
      // Let's verify the calculation for 5000:
      const verify5000 = () => {
        const amountToSend = 4762;
        const fee = Math.ceil(amountToSend * 0.05); // 238
        const total = amountToSend + fee; // 5000
        console.log(`\n✅ VERIFICATION for 5000 RWF:`);
        console.log(`   Send: ${amountToSend} RWF`);
        console.log(`   Fee (5%): ${fee} RWF`);
        console.log(`   Total: ${total} RWF`);
        console.log(`   Exact match: ${total === 5000 ? 'YES' : 'NO'}`);
      };
      
      verify5000();

      // For 10000 RWF subscription:
      const verify10000 = () => {
        const amountToSend = 9524;
        const fee = Math.ceil(amountToSend * 0.05); // 476
        const total = amountToSend + fee; // 10000
        console.log(`\n✅ VERIFICATION for 10000 RWF:`);
        console.log(`   Send: ${amountToSend} RWF`);
        console.log(`   Fee (5%): ${fee} RWF`);
        console.log(`   Total: ${total} RWF`);
        console.log(`   Exact match: ${total === 10000 ? 'YES' : 'NO'}`);
      };
      
      verify10000();

      // Send the calculated amount to provider
      const amountToSendToProvider = feeData.amountToSend;

      // Build LMBTech payment data
      const paymentData = {
        email: userEmail,
        name: userName || 'Customer',
        phone_number: phoneNormalized,
        first_name: firstName,
        last_name: lastName,
        payment_method: 'Card',
        card_url: CARD_PAYMENT_URL,
        api_key: LMBTECH_APP_KEY,
        secrate_key: LMBTECH_SECRET_KEY,
        amount: amountToSendToProvider, // Send calculated amount
        reference_id: referenceId,
        callback_url: callbackUrl,
        cancel_url: cancelUrl,
        currency: 'RWF',
        country_code: 'RW',
        action: 'pay',
        service_paid: 'donation',
        created_at: new Date().toISOString()
      };

      // Save payment record
      const description = planData ? `Card payment for ${planData.name} plan` : 'Card payment';
      
      const insertSql = `
        INSERT INTO payment_transactions (
          user_id, amount, currency, status, transaction_type,
          provider, provider_transaction_id, description,
          subscription_id, fee_amount, net_amount, created_at, updated_at
        ) VALUES (?, ?, 'RWF', ?, 'one_time', ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `;

      await query(insertSql, [
        userId,
        planPrice, // Store ORIGINAL amount (what user sees)
        'pending',
        'card',
        referenceId,
        description,
        planIdToUse,
        feeData.providerFee,
        feeData.netAmountWeReceive
      ]);

      console.log('✅ Card payment record created:', referenceId);
      console.log(`📊 Payment details:`);
      console.log(`   User sees: ${planPrice} RWF`);
      console.log(`   We send to provider: ${amountToSendToProvider} RWF`);
      console.log(`   Provider fee: ${feeData.providerFee} RWF (${CARD_FEE_PERCENTAGE}%)`);
      console.log(`   User charged: ${feeData.userPays} RWF`);
      console.log(`   We receive: ${feeData.netAmountWeReceive} RWF`);

      // Return response
      res.json({
        success: true,
        mode: "card",
        status: "success",
        message: "Card payment initiated successfully.",
        reference_id: referenceId,
        data: {
          referenceId,
          paymentMethod: 'card',
          originalAmount: parseFloat(planPrice), // What user should see (5000)
          amountSentToProvider: amountToSendToProvider, // What we send (4762)
          expectedUserCharge: feeData.userPays, // What user will actually be charged (should be 5000)
          customerEmail: userEmail,
          customerName: userName,
          status: 'pending',
          note: 'You will be redirected to complete the payment.',
          planId: planIdToUse,
          feeDetails: {
            providerFee: feeData.providerFee,
            feePercentage: CARD_FEE_PERCENTAGE,
            userWillBeCharged: feeData.userPays,
            netAmountWeReceive: feeData.netAmountWeReceive
          },
          verification: {
            sendAmount: `${amountToSendToProvider} RWF`,
            plusFee: `+ ${feeData.providerFee} RWF (${CARD_FEE_PERCENTAGE}%)`,
            totalUserCharge: `${feeData.userPays} RWF`,
            shouldEqual: `${planPrice} RWF`,
            isExact: feeData.userPays === planPrice ? 'YES' : `NO (off by ${feeData.userPays - planPrice} RWF)`
          }
        },
        postData: paymentData
      });

    } catch (error) {
      console.error('❌ Card payment initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate card payment'
      });
    }
  },

  // ... [rest of the functions remain the same]
  async trackCardTransaction(req, res) {
    try {
      const { ref } = req.params;
      const userId = req.user.id;

      console.log('🔍 Tracking card payment:', ref);

      const payments = await query(
        `SELECT 
          pt.*,
          u.email as user_email,
          u.name as user_name,
          s.name as subscription_name,
          s.type as subscription_type
        FROM payment_transactions pt
        LEFT JOIN users u ON pt.user_id = u.id
        LEFT JOIN subscriptions s ON pt.subscription_id = s.id
        WHERE pt.provider_transaction_id = ? AND pt.user_id = ?`,
        [ref, userId]
      );

      if (!payments || payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = payments[0];

      const normalizeStatus = (status) => {
        if (!status) return "pending";
        
        const statusStr = status.toLowerCase();
        
        if (["success", "completed", "paid"].includes(statusStr)) {
          return "success";
        }
        
        if (["failed", "declined", "cancelled", "rejected"].includes(statusStr)) {
          return "failed";
        }
        
        return "pending";
      };

      const normalizedStatus = normalizeStatus(payment.status);

      const feePercentage = payment.fee_amount > 0 
        ? Math.round((payment.fee_amount / payment.amount) * 100)
        : 0;

      res.json({
        success: true,
        reference_id: ref,
        gatewayStatus: payment.status,
        normalizedStatus: normalizedStatus,
        amount: payment.amount,
        paymentMethod: payment.provider || 'card',
        customer: payment.user_name || 'Customer',
        email: payment.user_email,
        timestamp: new Date(payment.updated_at).toISOString(),
        source: "database",
        planDetails: payment.subscription_name ? {
          name: payment.subscription_name,
          type: payment.subscription_type
        } : null,
        feeDetails: {
          feeAmount: payment.fee_amount || 0,
          netAmount: payment.net_amount || payment.amount,
          feePercentage: feePercentage
        }
      });

    } catch (error) {
      console.error('❌ Status tracking error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to track payment status'
      });
    }
  },

  async handleCardWebhook(req, res) {
    try {
      console.log('📨 Card payment webhook received:', req.body);

      const {
        reference_id,
        transaction_id,
        status,
        transaction_status
      } = req.body;

      const refFromQuery = req.query.reference || req.query.ref;
      const referenceId = reference_id || refFromQuery;

      if (!referenceId) {
        console.error('❌ Invalid webhook data - missing reference:', req.body);
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook data - reference_id is required'
        });
      }

      const normalizeStatus = (status) => {
        if (!status) return "pending";
        
        const statusStr = status.toLowerCase();
        
        if (["success", "completed", "paid", "approved", "succeeded"].includes(statusStr)) {
          return "completed";
        }
        
        if (["failed", "declined", "cancelled", "rejected", "expired"].includes(statusStr)) {
          return "failed";
        }
        
        return "pending";
      };

      const normalizedStatus = normalizeStatus(status || transaction_status);

      console.log(`🔄 Processing webhook: ${referenceId} -> ${normalizedStatus}`);

      const updateResult = await query(
        `UPDATE payment_transactions 
         SET status = ?, 
             updated_at = UTC_TIMESTAMP()
         WHERE provider_transaction_id = ?`,
        [normalizedStatus, referenceId]
      );

      if (updateResult.affectedRows === 0) {
        console.warn(`⚠️ No payment record found for webhook: ${referenceId}`);
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      console.log(`✅ Card payment updated via webhook: ${referenceId} -> ${normalizedStatus}`);

      if (normalizedStatus === 'completed') {
        try {
          const payment = await query(
            'SELECT user_id, subscription_id FROM payment_transactions WHERE provider_transaction_id = ?',
            [referenceId]
          );

          if (payment && payment.length > 0 && payment[0].user_id && payment[0].subscription_id) {
            await this.createUserSubscription(
              payment[0].user_id,
              payment[0].subscription_id,
              null,
              referenceId
            );
            console.log('✅ Subscription created for card payment:', referenceId);
          }
        } catch (subscriptionError) {
          console.error('❌ Subscription creation failed in webhook:', subscriptionError);
        }
      }

      return res.json({
        success: true,
        message: "Webhook processed successfully",
        reference_id: referenceId,
        status: normalizedStatus
      });

    } catch (error) {
      console.error('❌ Card webhook error:', error);
      return res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  },

  async handleCardCallback(req, res) {
    try {
      console.log('🎯 Card payment callback received:', req.query);

      const { reference, status } = req.query;
      
      if (!reference) {
        console.error('❌ Callback missing reference:', req.query);
        return res.redirect(`${CLIENT_URL}/payment?error=no_reference`);
      }

      const normalizeStatus = (status) => {
        if (!status) return "pending";
        
        const statusStr = status.toLowerCase();
        
        if (["success", "completed", "paid"].includes(statusStr)) {
          return "completed";
        }
        
        if (["failed", "declined", "cancelled", "rejected"].includes(statusStr)) {
          return "failed";
        }
        
        return "pending";
      };

      const normalizedStatus = normalizeStatus(status);

      console.log(`🔄 Processing callback: ${reference} -> ${normalizedStatus}`);

      if (status && status !== 'pending') {
        await query(
          `UPDATE payment_transactions 
           SET status = ?, 
               updated_at = UTC_TIMESTAMP()
           WHERE provider_transaction_id = ?`,
          [normalizedStatus, reference]
        );

        console.log(`✅ Updated payment via callback: ${reference} -> ${normalizedStatus}`);

        if (normalizedStatus === 'completed') {
          try {
            const payment = await query(
              'SELECT user_id, subscription_id FROM payment_transactions WHERE provider_transaction_id = ?',
              [reference]
            );

            if (payment && payment.length > 0 && payment[0].user_id && payment[0].subscription_id) {
              await this.createUserSubscription(
                payment[0].user_id,
                payment[0].subscription_id,
                null,
                reference
              );
              console.log('✅ Subscription created via callback:', reference);
            }
          } catch (subscriptionError) {
            console.error('❌ Subscription creation failed in callback:', subscriptionError);
          }
        }
      }

      const redirectUrl = `${CLIENT_URL}/payment/status?reference=${reference}&status=${normalizedStatus}&method=card`;
      console.log(`🔀 Redirecting to: ${redirectUrl}`);
      
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error('❌ Card callback redirect error:', error);
      const redirectUrl = `${CLIENT_URL}/payment?error=callback_error&method=card`;
      return res.redirect(redirectUrl);
    }
  },

  async createUserSubscription(userId, subscriptionId, planType, paymentReference) {
    try {
      console.log('📝 Creating user subscription from card payment:', {
        userId,
        subscriptionId,
        paymentReference
      });

      const existingSub = await query(
        'SELECT id FROM user_subscriptions WHERE payment_reference = ?',
        [paymentReference]
      );

      if (existingSub && existingSub.length > 0) {
        console.log('✅ Subscription already exists for payment:', paymentReference);
        return true;
      }

      const plans = await query(
        'SELECT * FROM subscriptions WHERE id = ? AND is_active = true',
        [subscriptionId]
      );

      if (!plans || plans.length === 0) {
        throw new Error('Plan not found for subscription creation');
      }

      const plan = plans[0];

      const startDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateFormatted = endDate.toISOString().slice(0, 19).replace('T', ' ');

      const existingSubs = await query(
        `SELECT id FROM user_subscriptions 
         WHERE user_id = ? AND status = 'active' AND end_date > UTC_TIMESTAMP()`,
        [userId]
      );

      if (existingSubs && existingSubs.length > 0) {
        const updateSql = `
          UPDATE user_subscriptions 
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
          WHERE user_id = ? AND status = 'active'
        `;

        await query(updateSql, [
          subscriptionId,
          plan.name,
          plan.price,
          plan.currency || 'RWF',
          startDate,
          endDateFormatted,
          paymentReference,
          userId
        ]);

        console.log('✅ Updated existing subscription for user:', userId);
      } else {
        const insertSql = `
          INSERT INTO user_subscriptions (
            user_id, subscription_id, subscription_name, subscription_price, subscription_currency,
            start_date, end_date, status, payment_reference, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        `;

        await query(insertSql, [
          userId,
          subscriptionId,
          plan.name,
          plan.price,
          plan.currency || 'RWF',
          startDate,
          endDateFormatted,
          paymentReference
        ]);

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