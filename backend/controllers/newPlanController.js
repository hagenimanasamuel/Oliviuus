const PaymentService = require('../services/paymentService');
const { query } = require('../config/dbConfig');

const paymentService = new PaymentService();

// 🆕 Import the subscription creation function from paymentController
const paymentController = require('./paymentController');

const newPlanController = {
  /**
   * 🆕 Purchase New Plan (starts after current subscription ends)
   */
  async purchaseNewPlan(req, res) {
    try {
      const userId = req.user.id;
      const {
        plan_id,
        phoneNumber,
        customerName,
        customerEmail,
        start_after_current = true
      } = req.body;

      console.log('🆕 New plan purchase request:', {
        userId,
        plan_id,
        start_after_current,
        phoneNumber: phoneNumber?.substring(0, 6) + '...'
      });

      // 🛡️ Basic validation
      if (!plan_id || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Plan ID and phone number are required',
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            title: 'Missing Information',
            message: 'Please provide all required information.',
            userAction: 'COMPLETE_FORM'
          }
        });
      }

      // Validate phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 9) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number',
          error: {
            code: 'INVALID_PHONE',
            title: 'Invalid Phone Number',
            message: 'Please enter a valid phone number.',
            userAction: 'CHECK_PHONE_NUMBER'
          }
        });
      }

      // Get plan details
      const plan = await getPlanDetails(plan_id);
      if (!plan) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan selected',
          error: {
            code: 'INVALID_PLAN',
            title: 'Invalid Plan',
            message: 'The selected plan is not available.',
            userAction: 'SELECT_VALID_PLAN'
          }
        });
      }

      // Get current active subscription to determine start date
      const currentSub = await getCurrentSubscription(userId);
      const startDate = calculateStartDate(currentSub, start_after_current);

      // Process payment
      const paymentResult = await paymentService.createMoMoPayment({
        email: customerEmail,
        name: customerName,
        amount: plan.price,
        phoneNumber: cleanPhone,
        callbackUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payment/callback`,
        planType: plan.type,
        planName: plan.name
      });

      console.log('💰 New plan payment initiated:', {
        userId,
        plan: plan.name,
        amount: plan.price,
        startDate: startDate,
        referenceId: paymentResult.referenceId
      });

      // Handle payment provider errors
      if (paymentResult.status === 'fail' || paymentResult.status === 'error') {
        return res.status(400).json({
          success: false,
          message: paymentResult.message || 'Payment initiation failed',
          error: {
            code: 'PAYMENT_FAILED',
            title: 'Payment Failed',
            message: 'We could not process your payment. Please try again.',
            userAction: 'TRY_AGAIN'
          }
        });
      }

      // 🛡️ DO NOT create subscription here - wait for payment completion
      // Only create payment record for now
      await paymentService.createPaymentRecord({
        userId,
        amount: plan.price,
        referenceId: paymentResult.referenceId,
        status: paymentResult.status === 'success' ? 'completed' : 'pending',
        planId: plan_id,
        providerFee: paymentResult.providerFee,
        amountWeReceive: paymentResult.amountWeReceive,
        planType: plan.type,
        planName: plan.name
      });

      // 🛡️ If payment is immediately successful, create subscription using the centralized function
      if (paymentResult.status === 'success') {
        try {
          await paymentController.createUserSubscription(
            userId,
            plan_id,
            null,
            paymentResult.referenceId
          );
          console.log('✅ New subscription created via immediate success:', paymentResult.referenceId);
        } catch (subError) {
          console.error('❌ Subscription creation failed in immediate success:', subError);
        }
      } else {
        // 🛡️ Start background status checking with the subscription creation function
        paymentService.startBackgroundStatusCheck(paymentResult.referenceId, paymentController.createUserSubscription)
          .catch(error => {
            console.error('Background check error:', error.message);
          });
      }

      res.json({
        success: true,
        message: 'New plan purchase initiated successfully',
        data: {
          referenceId: paymentResult.referenceId,
          amount: plan.price,
          status: paymentResult.status === 'success' ? 'completed' : 'pending',
          planName: plan.name,
          startDate: startDate,
          subscriptionDetails: {
            starts: startDate,
            plan: plan.name,
            price: plan.price
          }
        }
      });

    } catch (error) {
      console.error('❌ New plan purchase error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Something went wrong. Please try again.',
        error: {
          code: 'PURCHASE_ERROR',
          title: 'Purchase Failed',
          message: 'We encountered an issue processing your purchase.',
          userAction: 'TRY_AGAIN_LATER',
          systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  },

  /**
   * 🆕 Handle new plan purchase callback
   */
  async handleNewPlanCallback(req, res) {
    try {
      console.log('📨 New Plan Callback Received:', req.body);

      const { reference_id, transaction_id, status } = req.body;

      if (!reference_id || !status) {
        console.error('❌ Invalid new plan callback data:', req.body);
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data'
        });
      }

      // Map status to our system
      const mappedStatus = mapPaymentStatus(status);

      // Update payment in database
      await paymentService.updatePaymentStatus(reference_id, mappedStatus, transaction_id);

      console.log(`✅ New plan callback processed: ${reference_id} -> ${mappedStatus}`);

      // 🛡️ Create subscription if payment completed successfully using centralized function
      if (mappedStatus === 'completed') {
        try {
          // Get payment details to find user and plan
          const payment = await paymentService.getPaymentByReference(reference_id);
          if (payment && payment.user_id && payment.subscription_id) {
            await paymentController.createUserSubscription(
              payment.user_id,
              payment.subscription_id,
              null,
              reference_id
            );
            console.log('✅ New subscription created via callback:', reference_id);
          }
        } catch (subscriptionError) {
          console.error('❌ New subscription creation failed in callback:', subscriptionError);
          // Don't fail the callback - payment is still successful
        }
      }

      // Redirect to frontend with status
      const frontendUrl = process.env.CLIENT_URL;
      res.redirect(`${frontendUrl}/subscription?purchase=success&reference=${reference_id}`);

    } catch (error) {
      console.error('❌ New plan callback error:', error.message);
      const frontendUrl = process.env.CLIENT_URL;
      res.redirect(`${frontendUrl}/subscription?purchase=error`);
    }
  }
};

// Helper functions
async function getPlanDetails(planId) {
  const sql = `
    SELECT * FROM subscriptions 
    WHERE id = ? AND is_active = true AND is_visible = true
  `;
  const results = await query(sql, [planId]);
  return results.length > 0 ? results[0] : null;
}

async function getCurrentSubscription(userId) {
  const sql = `
    SELECT * FROM user_subscriptions 
    WHERE user_id = ? AND status = 'active' AND end_date > UTC_TIMESTAMP()
    ORDER BY end_date DESC LIMIT 1
  `;
  const results = await query(sql, [userId]);
  return results.length > 0 ? results[0] : null;
}

function calculateStartDate(currentSub, startAfterCurrent) {
  if (!currentSub || !startAfterCurrent) {
    // Use UTC timestamp for immediate start
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  
  // Start the day after current subscription ends (using UTC)
  const currentEndDate = new Date(currentSub.end_date);
  const startDate = new Date(currentEndDate.getTime() + (1000 * 60 * 60 * 24)); // +1 day
  return startDate.toISOString().slice(0, 19).replace('T', ' ');
}

// 🛡️ Map payment status (same as in paymentController)
function mapPaymentStatus(providerStatus) {
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

module.exports = newPlanController;