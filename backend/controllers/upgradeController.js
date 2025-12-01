const UpgradeService = require('../services/upgradeService');
const { query } = require('../config/dbConfig');

const upgradeService = new UpgradeService();

// 🆕 Enhanced error mapping for upgrades
const getUpgradeErrorDetails = (errorMessage) => {
  const errorLower = errorMessage.toLowerCase();

  const errorMap = {
    'no active subscription': {
      code: 'NO_ACTIVE_SUBSCRIPTION',
      title: 'No Active Subscription',
      message: 'You need an active subscription to upgrade.',
      userAction: 'SUBSCRIBE_FIRST'
    },
    'invalid plan': {
      code: 'INVALID_PLAN',
      title: 'Invalid Plan',
      message: 'The selected upgrade plan is not available.',
      userAction: 'SELECT_VALID_PLAN'
    },
    'invalid upgrade': {
      code: 'INVALID_UPGRADE',
      title: 'Invalid Upgrade',
      message: 'You can only upgrade to a higher-tier plan.',
      userAction: 'SELECT_HIGHER_PLAN'
    },
    'security token': {
      code: 'INVALID_TOKEN',
      title: 'Security Error',
      message: 'Security validation failed. Please refresh and try again.',
      userAction: 'REFRESH_PAGE'
    }
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (errorLower.includes(key)) {
      return value;
    }
  }

  // Default error
  return {
    code: 'UPGRADE_ERROR',
    title: 'Upgrade Failed',
    message: 'We encountered an issue processing your upgrade.',
    userAction: 'TRY_AGAIN_LATER'
  };
};

const upgradeController = {
  /**
   * 💰 Calculate Upgrade Cost
   */
  async calculateUpgradeCost(req, res) {
    try {
      const userId = req.user.id;
      const { planId } = req.body;

      console.log('🧮 Upgrade cost calculation request:', { userId, planId });

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: 'Plan ID is required',
          error: {
            code: 'MISSING_PLAN_ID',
            title: 'Plan Required',
            message: 'Please select a plan to upgrade to.',
            userAction: 'SELECT_PLAN'
          }
        });
      }

      const costCalculation = await upgradeService.calculateUpgradeCost(userId, planId);

      res.json({
        success: true,
        data: costCalculation
      });

    } catch (error) {
      console.error('❌ Upgrade cost calculation error:', error.message);
      
      const errorDetails = getUpgradeErrorDetails(error.message);

      res.status(400).json({
        success: false,
        message: error.message,
        error: errorDetails
      });
    }
  },

  /**
   * 🚀 Initiate Upgrade Payment
   */
  async initiateUpgrade(req, res) {
    try {
      const userId = req.user.id;
      const {
        plan_id,
        phoneNumber,
        customerName,
        customerEmail,
        security_token
      } = req.body;

      console.log('🚀 Upgrade initiation request:', {
        userId,
        plan_id,
        phoneNumber: phoneNumber?.substring(0, 6) + '...' // Log partially for security
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

      // Process upgrade payment
      const upgradeResult = await upgradeService.processUpgrade(userId, {
        newPlanId: plan_id,
        phoneNumber: cleanPhone,
        customerName: customerName,
        customerEmail: customerEmail,
        security_token: security_token
      });

      res.json({
        success: true,
        message: 'Upgrade payment initiated successfully',
        data: upgradeResult
      });

    } catch (error) {
      console.error('❌ Upgrade initiation error:', error.message);
      
      const errorDetails = getUpgradeErrorDetails(error.message);

      res.status(400).json({
        success: false,
        message: error.message,
        error: {
          ...errorDetails,
          systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  },

  /**
   * 📋 Get Available Upgrades
   */
  async getAvailableUpgrades(req, res) {
    try {
      const userId = req.user.id;

      console.log('📋 Fetching available upgrades for user:', userId);

      const upgradeData = await upgradeService.getAvailableUpgrades(userId);

      res.json({
        success: true,
        data: upgradeData
      });

    } catch (error) {
      console.error('❌ Get available upgrades error:', error.message);
      
      const errorDetails = getUpgradeErrorDetails(error.message);

      res.status(400).json({
        success: false,
        message: error.message,
        error: errorDetails
      });
    }
  },

  /**
   * 🔍 Check Upgrade Status
   */
  async checkUpgradeStatus(req, res) {
    try {
      const { referenceId } = req.params;
      const userId = req.user.id;

      console.log('🔍 Checking upgrade status:', referenceId);

      // Get upgrade payment record
      const payment = await upgradeService.getUpgradePaymentByReference(referenceId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Upgrade payment not found',
          error: {
            code: 'UPGRADE_NOT_FOUND',
            title: 'Upgrade Not Found',
            message: 'The upgrade reference could not be found.',
            userAction: 'CHECK_REFERENCE_ID'
          }
        });
      }

      // Verify ownership
      if (payment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: {
            code: 'ACCESS_DENIED',
            title: 'Access Denied',
            message: 'You do not have permission to view this upgrade.',
            userAction: 'CHECK_REFERENCE_ID'
          }
        });
      }

      // If still pending, check with payment provider
      if (payment.status === 'pending') {
        try {
          const apiStatus = await upgradeService.paymentService.checkStatus(referenceId);
          console.log('📊 Upgrade payment provider status:', apiStatus);

          if (apiStatus.status && apiStatus.status !== 'pending' && apiStatus.status !== 'processing') {
            await upgradeService.handleUpgradeCallback(referenceId, apiStatus.status);
            // Refetch updated payment
            const updatedPayment = await upgradeService.getUpgradePaymentByReference(referenceId);
            payment.status = updatedPayment.status;
          }
        } catch (apiError) {
          console.error('❌ Upgrade status check API error:', apiError.message);
          // Silently fail - use database status
        }
      }

      // Get current subscription to verify upgrade
      const currentSub = await upgradeService.getCurrentSubscription(userId);

      res.json({
        success: true,
        data: {
          payment: payment,
          currentSubscription: currentSub,
          upgradeCompleted: payment.status === 'completed'
        }
      });

    } catch (error) {
      console.error('❌ Upgrade status check error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Unable to check upgrade status',
        error: {
          code: 'STATUS_CHECK_FAILED',
          title: 'Status Check Failed',
          message: 'We could not retrieve the upgrade status at this time.',
          userAction: 'TRY_AGAIN_LATER'
        }
      });
    }
  },

  /**
   * 📨 Upgrade Callback Handler
   */
  async handleUpgradeCallback(req, res) {
    try {
      console.log('📨 Upgrade Callback Received:', req.body);

      const { reference_id, transaction_id, status } = req.body;

      if (!reference_id || !status) {
        console.error('❌ Invalid upgrade callback data:', req.body);
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data'
        });
      }

      // Process upgrade callback
      const result = await upgradeService.handleUpgradeCallback(reference_id, status, transaction_id);

      console.log(`✅ Upgrade callback processed: ${reference_id} -> ${result.status}`);

      // Redirect to frontend with status
      const frontendUrl = process.env.CLIENT_URL;
      res.redirect(`${frontendUrl}/subscription?upgrade=${result.status}&reference=${reference_id}`);

    } catch (error) {
      console.error('❌ Upgrade callback error:', error.message);
      const frontendUrl = process.env.CLIENT_URL;
      res.redirect(`${frontendUrl}/subscription?upgrade=error`);
    }
  }
};

module.exports = upgradeController;