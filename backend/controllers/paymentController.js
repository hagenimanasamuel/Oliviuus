/**
 * 🎯 Payment Controller - MoMo Only with Plan Verification
 */

const PaymentService = require('../services/paymentService');
const { query } = require('../config/dbConfig');

const paymentService = new PaymentService();

// 💬 Payment messages
const getPaymentMessage = (status) => {
  const messages = {
    'success': 'Payment initiated successfully',
    'processing': 'Payment is being processed',
    'pending': 'Payment initiated successfully',
    'error': 'Payment service is temporarily unavailable',
    'fail': 'Unable to process payment'
  };

  return messages[status] || 'Payment processing';
};

// 📝 Get payment note
const getPaymentNote = (status) => {
  if (status === 'processing') {
    return 'This may take a moment to process';
  }

  return 'Check your phone for payment prompt';
};

// 🗺️ Map payment status
const mapPaymentStatus = (providerStatus) => {
  const statusMap = {
    'success': 'completed',
    'completed': 'completed',
    'failed': 'failed',
    'pending': 'pending',
    'processing': 'pending',
    'cancelled': 'cancelled'
  };

  return statusMap[providerStatus?.toLowerCase()] || 'pending';
};

// 🆕 Enhanced error code mapping for frontend
const getErrorDetails = (errorMessage, plan) => {
  const errorLower = errorMessage.toLowerCase();

  // Insufficient funds errors
  if (errorLower.includes('insufficient') || errorLower.includes('insuffisant') ||
    errorLower.includes('low balance') || errorLower.includes('solde insuffisant') ||
    errorLower.includes('1005') || errorLower.includes('failed due to insufficient funds')) {
    return {
      code: 'INSUFFICIENT_FUNDS',
      title: 'Insufficient Funds',
      message: `Your Mobile Money account doesn't have enough balance to complete this payment.`,
      details: `You need ${plan ? formatCurrency(plan.price) : 'the required amount'} in your Mobile Money account.`,
      userAction: 'ADD_FUNDS_OR_CHANGE_PLAN',
      retryable: true
    };
  }

  // Invalid phone number errors
  if (errorLower.includes('invalid phone') || errorLower.includes('invalid number') ||
    errorLower.includes('phone not found') || errorLower.includes('numéro invalide') ||
    errorLower.includes('invalid payer phone')) {
    return {
      code: 'INVALID_PHONE_NUMBER',
      title: 'Invalid Phone Number',
      message: 'The phone number you entered is not valid for Mobile Money payments.',
      details: 'Please check your phone number and make sure it\'s registered with Mobile Money.',
      userAction: 'CHECK_PHONE_NUMBER',
      retryable: true
    };
  }

  // Network/connection errors
  if (errorLower.includes('network') || errorLower.includes('timeout') ||
    errorLower.includes('connection') || errorLower.includes('unreachable') ||
    errorLower.includes('econnrefused') || errorLower.includes('econnreset')) {
    return {
      code: 'NETWORK_ERROR',
      title: 'Network Issue',
      message: 'We\'re having trouble connecting to the payment service.',
      details: 'Please check your internet connection and try again in a moment.',
      userAction: 'CHECK_CONNECTION',
      retryable: true
    };
  }

  // Transaction declined errors
  if (errorLower.includes('declined') || errorLower.includes('rejected') ||
    errorLower.includes('failed') || errorLower.includes('refused') ||
    errorLower.includes('transaction declined')) {
    return {
      code: 'PAYMENT_DECLINED',
      title: 'Payment Declined',
      message: 'Your payment was declined by the Mobile Money service.',
      details: 'This could be due to security reasons or account restrictions.',
      userAction: 'CONTACT_OPERATOR',
      retryable: false
    };
  }

  // User cancellation errors
  if (errorLower.includes('cancelled') || errorLower.includes('canceled') ||
    errorLower.includes('user cancelled') || errorLower.includes('user canceled')) {
    return {
      code: 'USER_CANCELLED',
      title: 'Payment Cancelled',
      message: 'You cancelled the payment request.',
      details: 'The payment was cancelled before completion.',
      userAction: 'RETRY_PAYMENT',
      retryable: true
    };
  }

  // Daily limit exceeded
  if (errorLower.includes('limit') || errorLower.includes('daily limit') ||
    errorLower.includes('transaction limit')) {
    return {
      code: 'DAILY_LIMIT_EXCEEDED',
      title: 'Daily Limit Exceeded',
      message: 'You have reached your daily transaction limit.',
      details: 'Please try again tomorrow or contact your mobile operator.',
      userAction: 'WAIT_OR_CONTACT_OPERATOR',
      retryable: false
    };
  }

  // Account not active
  if (errorLower.includes('account not active') || errorLower.includes('inactive account') ||
    errorLower.includes('account suspended')) {
    return {
      code: 'ACCOUNT_INACTIVE',
      title: 'Account Not Active',
      message: 'Your Mobile Money account is not active for transactions.',
      details: 'Please contact your mobile operator to activate your account.',
      userAction: 'CONTACT_OPERATOR',
      retryable: false
    };
  }

  // Default system error
  return {
    code: 'SYSTEM_ERROR',
    title: 'System Error',
    message: 'We encountered an unexpected error while processing your payment.',
    details: 'Our team has been notified. Please try again later.',
    userAction: 'CONTACT_SUPPORT',
    retryable: false
  };
};

// Helper function for currency formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0
  }).format(amount);
};

// 🆕 Create or update user subscription after successful payment
const createUserSubscription = async (userId, subscriptionId, planType, paymentReference) => {
  try {
    console.log('📝 Creating user subscription:', { userId, subscriptionId, planType, paymentReference });

    // 🆕 Check if subscription already exists for this payment
    const existingSub = await query(
      'SELECT id FROM user_subscriptions WHERE payment_reference = ?',
      [paymentReference]
    );

    if (existingSub && existingSub.length > 0) {
      console.log('✅ Subscription already exists for payment:', paymentReference);
      return true; // Skip creation
    }

    // Get plan details to determine duration and features
    const plans = await query(
      'SELECT * FROM subscriptions WHERE id = ? AND is_active = true',
      [subscriptionId]
    );

    if (!plans || plans.length === 0) {
      throw new Error('Plan not found for subscription creation');
    }

    const plan = plans[0];

    // 🆕 Use UTC timestamps for all dates
    const startDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Monthly subscription
    const endDateFormatted = endDate.toISOString().slice(0, 19).replace('T', ' ');

    // Check if user already has an active subscription
    const existingSubs = await query(
      `SELECT id FROM user_subscriptions 
       WHERE user_id = ? AND status = 'active' AND end_date > UTC_TIMESTAMP()`,
      [userId]
    );

    if (existingSubs && existingSubs.length > 0) {
      // Update existing subscription
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
      // Create new subscription
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
};

const paymentController = {
  /**
   * 💰 Initiate MoMo Payment with Plan Verification
   */
  async initiatePayment(req, res) {
    try {
      const userId = req.user.id;
      const {
        phoneNumber,
        customerName,
        customerEmail,
        planId, // 🚨 Plan verification
        planType // 🚨 Plan verification
      } = req.body;

      console.log('📋 Payment initiation request:', {
        userId,
        phoneNumber,
        planId,
        planType,
        customerName,
        customerEmail
      });

      // 🛡️ Validation
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for Mobile Money payments',
          error: {
            code: 'MISSING_PHONE_NUMBER',
            title: 'Phone Number Required',
            message: 'Please enter your phone number to proceed with payment.',
            userAction: 'ENTER_PHONE_NUMBER'
          }
        });
      }

      // Validate phone number format
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      if (cleanedPhone.length < 9) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          error: {
            code: 'INVALID_PHONE_FORMAT',
            title: 'Invalid Phone Number',
            message: 'Please enter a valid phone number with at least 9 digits.',
            userAction: 'CHECK_PHONE_NUMBER'
          }
        });
      }

      // 🚨 Verify plan exists and get price from database
      let planPrice;
      let planData = null;
      let planIdToUse = planId;

      if (planId) {
        // Get plan price from database - USING 'subscriptions' table
        const plans = await query(
          'SELECT id, price, type, name FROM subscriptions WHERE id = ? AND is_active = true',
          [planId]
        );

        if (!plans || plans.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid subscription plan',
            error: {
              code: 'INVALID_PLAN',
              title: 'Invalid Plan',
              message: 'The selected subscription plan is not available.',
              userAction: 'SELECT_VALID_PLAN'
            }
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
      } else {
        // 🆕 Handle case where no plan ID is provided
        const { amount } = req.body;
        if (!amount || amount < 100) {
          return res.status(400).json({
            success: false,
            message: 'Valid amount is required when no plan is selected',
            error: {
              code: 'INVALID_AMOUNT',
              title: 'Invalid Amount',
              message: 'Please select a valid amount for payment.',
              userAction: 'SELECT_VALID_AMOUNT'
            }
          });
        }
        planPrice = amount;
        planIdToUse = null;
        console.log('⚠️ Using provided amount (direct payment):', planPrice);
      }

      // 👤 Get user info
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

      const callbackUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/payment/callback`;

      console.log('🚀 Initiating MoMo Payment:', {
        user: userEmail,
        amount: planPrice,
        planId: planIdToUse || 'direct',
        phoneNumber: phoneNumber
      });

      // Format phone for MoMo
      const customerPhone = phoneNumber.replace(/\s+/g, '').startsWith('+') ?
        phoneNumber.replace(/\s+/g, '') : `+25${phoneNumber.replace(/\s+/g, '')}`;

      const paymentResult = await paymentService.createMoMoPayment({
        email: userEmail,
        name: userName || 'Customer',
        amount: planPrice, // 🚨 Use original amount (fee will be calculated internally)
        phoneNumber: customerPhone,
        callbackUrl
      });

      console.log('📞 Payment API response:', paymentResult);

      // 🆕 Handle payment provider errors with detailed error information
      if (paymentResult.status === 'fail' || paymentResult.status === 'error') {
        const errorDetails = getErrorDetails(paymentResult.message || 'Payment failed', planData);

        // Determine initial status for failed payments
        const initialStatus = 'failed';

        // 💾 Save to database with plan info 
        await paymentService.createPaymentRecord({
          userId,
          amount: planPrice, // The amount user pays (100)
          referenceId: paymentResult.referenceId,
          status: initialStatus,
          planId: planIdToUse,
          providerFee: paymentResult.providerFee || 0,
          amountWeReceive: paymentResult.amountWeReceive || (planPrice - (paymentResult.providerFee || 0)) // What we receive (95)
        });

        return res.status(400).json({
          success: false,
          message: paymentResult.message || 'Payment initiation failed',
          error: {
            ...errorDetails,
            referenceId: paymentResult.referenceId,
            providerMessage: paymentResult.message,
            providerCode: paymentResult.response?.responsecode
          },
          data: {
            referenceId: paymentResult.referenceId,
            paymentMethod: 'MoMo',
            amount: parseInt(planPrice), // Return original amount to frontend
            status: initialStatus,
            feeAmount: paymentResult.feeAmount || 0 // 🆕 Include fee info
          }
        });
      }

      // Determine initial status for successful initiation
      let initialStatus = 'pending';
      if (paymentResult.status === 'success') {
        initialStatus = 'pending'; // Still pending until callback
      }

      // 💾 Save to database with plan info - UPDATED with fee info
      await paymentService.createPaymentRecord({
        userId,
        amount: planPrice,
        referenceId: paymentResult.referenceId,
        status: initialStatus,
        planId: planIdToUse,
        feeAmount: paymentResult.feeAmount || 0,
        amountWeReceive: paymentResult.amountWeReceive || planPrice // What we receive (95)
      });

      // 🎯 Start background status checking for pending payments
      if (initialStatus === 'pending') {
        paymentService.startBackgroundStatusCheck(paymentResult.referenceId, createUserSubscription)
          .catch(error => {
            console.error('Background check error:', error.message);
          });
      }

      // 📦 Prepare response
      const responseData = {
        success: paymentResult.status === 'success' || paymentResult.status === 'processing' || paymentResult.status === 'pending',
        message: getPaymentMessage(paymentResult.status),
        data: {
          referenceId: paymentResult.referenceId,
          paymentMethod: 'MoMo',
          amount: parseInt(planPrice), // Return original subscription amount to frontend (100)
          customerEmail: userEmail,
          customerName: userName,
          status: initialStatus,
          note: getPaymentNote(paymentResult.status),
          planId: planIdToUse,
          providerFee: paymentResult.providerFee || 0, // 🆕 Include provider fee info (5)
          amountWeReceive: paymentResult.amountWeReceive || (planPrice - (paymentResult.providerFee || 0)) // 🆕 Include net amount we receive (95)
        }
      };

      res.json(responseData);

    } catch (error) {
      console.error('❌ Payment Initiation Error:', error.message);
      console.error('Error stack:', error.stack);

      // 🆕 Handle unexpected errors with proper error format
      const errorDetails = getErrorDetails(error.message, null);

      res.status(500).json({
        success: false,
        message: 'Something went wrong. Please try again.',
        error: {
          ...errorDetails,
          systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  },

  /**
   * 🔍 Check Payment Status
   */
  async checkPaymentStatus(req, res) {
    try {
      const { referenceId } = req.params;

      console.log('🔍 Checking payment status:', referenceId);

      // Check database first
      const payment = await paymentService.getPaymentByReference(referenceId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
          error: {
            code: 'PAYMENT_NOT_FOUND',
            title: 'Payment Not Found',
            message: 'The payment reference could not be found.',
            userAction: 'CHECK_REFERENCE_ID'
          }
        });
      }

      // If still pending, check with payment provider
      if (payment.status === 'pending') {
        try {
          const apiStatus = await paymentService.checkStatus(referenceId);
          console.log('📊 Payment provider status:', apiStatus);

          if (apiStatus.status && apiStatus.status !== 'pending' && apiStatus.status !== 'processing') {
            const newStatus = mapPaymentStatus(apiStatus.status);
            await paymentService.updatePaymentStatus(referenceId, newStatus);
            payment.status = newStatus;
            console.log(`🔄 Payment status updated: ${referenceId} -> ${newStatus}`);

            // 🆕 Create subscription if payment completed
            if (newStatus === 'completed' && payment.user_id && payment.subscription_id) {
              try {
                await createUserSubscription(
                  payment.user_id,
                  payment.subscription_id,
                  null,
                  referenceId
                );
                console.log('✅ Subscription created via status check:', referenceId);
              } catch (subError) {
                console.error('❌ Subscription creation failed in status check:', subError);
              }
            }
          }
        } catch (apiError) {
          console.error('❌ Status check API error:', apiError.message);
          // Silently fail - use database status
        }
      }

      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('❌ Status Check Error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Unable to check payment status',
        error: {
          code: 'STATUS_CHECK_FAILED',
          title: 'Status Check Failed',
          message: 'We could not retrieve the payment status at this time.',
          userAction: 'TRY_AGAIN_LATER'
        }
      });
    }
  },

  /**
   * 📨 Payment Callback Handler
   */
  async handleCallback(req, res) {
    try {
      console.log('📨 Payment Callback Received:', req.body);

      const { reference_id, transaction_id, status } = req.body;

      if (!reference_id || !status) {
        console.error('❌ Invalid callback data:', req.body);
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data',
          error: {
            code: 'INVALID_CALLBACK_DATA',
            title: 'Invalid Callback',
            message: 'The payment callback contained invalid data.'
          }
        });
      }

      // Map status to our system
      const mappedStatus = mapPaymentStatus(status);

      // Update payment in database
      await paymentService.updatePaymentStatus(reference_id, mappedStatus, transaction_id);

      console.log(`✅ Callback processed: ${reference_id} -> ${mappedStatus}`);

      // 🆕 Create subscription if payment completed successfully
      if (mappedStatus === 'completed') {
        try {
          // Get payment details to find user and plan
          const payment = await paymentService.getPaymentByReference(reference_id);
          if (payment && payment.user_id && payment.subscription_id) {
            await createUserSubscription(
              payment.user_id,
              payment.subscription_id,
              null,
              reference_id
            );
            console.log('✅ Subscription created for payment:', reference_id);
          }
        } catch (subscriptionError) {
          console.error('❌ Subscription creation failed in callback:', subscriptionError);
          // Don't fail the callback - payment is still successful
        }
      }

      // Redirect to homepage with success message
      const frontendUrl = process.env.CLIENT_URL;
      res.redirect(`${frontendUrl}/?payment=success&reference=${reference_id}`);

    } catch (error) {
      console.error('❌ Callback Error:', error.message);
      const frontendUrl = process.env.CLIENT_URL;
      res.redirect(`${frontendUrl}/?payment=error`);
    }
  },

  // Export the function so it can be used by paymentService
  createUserSubscription
};

module.exports = paymentController;