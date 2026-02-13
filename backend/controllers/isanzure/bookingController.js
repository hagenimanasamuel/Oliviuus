// backend/controllers/isanzure/bookingController.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');
const PaymentService = require('../../services/isanzure/paymentService');
const AvailabilityService = require('../../services/isanzure/availabilityService');

const paymentService = new PaymentService();

// Debug helper
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] 🔍 ${message}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] 🔍 ${message}`);
  }
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

// 💬 Payment messages
const getPaymentMessage = (status) => {
  const messages = {
    'success': 'Booking payment initiated successfully',
    'processing': 'Booking payment is being processed',
    'pending': 'Booking payment initiated successfully',
    'error': 'Payment service is temporarily unavailable',
    'fail': 'Unable to process booking payment'
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

// ✅ Get authenticated user
const getAuthenticatedUser = async (req) => {
  try {
    const userId = req.user?.id || req.user?.oliviuus_id;
    
    if (!userId) {
      debugLog('❌ No authenticated user found');
      return null;
    }

    debugLog('🔍 Looking up user in iSanzure:', userId);

    const checkSql = `
      SELECT 
        u.id,
        u.user_uid,
        u.oliviuus_user_id,
        u.user_type,
        u.public_phone,
        u.public_email,
        COALESCE(sso.first_name, 'iSanzure') as first_name,
        COALESCE(sso.last_name, 'User') as last_name,
        COALESCE(sso.username, CONCAT('user-', u.id)) as username,
        CONCAT(
          COALESCE(sso.first_name, 'iSanzure'),
          ' ',
          COALESCE(sso.last_name, 'User')
        ) as full_name
      FROM users u
      LEFT JOIN oliviuus_db.users sso ON u.oliviuus_user_id = sso.id
      WHERE u.oliviuus_user_id = ?
      LIMIT 1
    `;

    let users = await isanzureQuery(checkSql, [userId]);

    if (users.length === 0) {
      debugLog('⚠️ User not in iSanzure, auto-creating as tenant');
      
      const insertSql = `
        INSERT INTO users (
          oliviuus_user_id,
          user_type,
          registration_source,
          created_at,
          updated_at
        ) VALUES (?, 'tenant', 'oliviuus_sso', UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `;

      await isanzureQuery(insertSql, [userId]);
      users = await isanzureQuery(checkSql, [userId]);
    }

    const user = users[0];
    
    debugLog('✅ Authenticated user found:', {
      id: user.id,
      user_uid: user.user_uid,
      name: user.full_name
    });

    return user;
  } catch (error) {
    debugLog('❌ Error getting user:', error.message);
    return null;
  }
};

// ============================================
// 1. CHECK BOOKING AVAILABILITY - NEW
// ============================================
exports.checkBookingAvailability = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    const {
      propertyUid,
      startDate,
      endDate,
      bookingPeriod,
      duration
    } = req.body;

    debugLog('🔍 Checking booking availability:', {
      propertyUid,
      startDate,
      endDate,
      bookingPeriod,
      duration,
      userId: user?.id
    });

    // Get property ID
    const propertyQuery = `SELECT id FROM properties WHERE property_uid = ?`;
    const propertyResult = await isanzureQuery(propertyQuery, [propertyUid]);

    if (propertyResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    const propertyId = propertyResult[0].id;

    // ✅ CHECK 1: Property availability (existing bookings)
    const availability = await AvailabilityService.checkPropertyAvailability(
      propertyId,
      startDate,
      endDate
    );

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        code: availability.reasons?.[0] || 'PROPERTY_NOT_AVAILABLE',
        message: availability.message || 'Property is not available for selected dates',
        details: availability.details
      });
    }

    // ✅ CHECK 2: User duplicate booking (if logged in)
    if (user) {
      const userDuplicate = await AvailabilityService.checkUserDuplicateBooking(
        user.id,
        propertyId,
        startDate,
        endDate
      );

      if (!userDuplicate.available) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_BOOKING',
          message: 'You already have a booking for this property during these dates',
          details: userDuplicate.details
        });
      }
    }

    // ✅ All checks passed
    res.json({
      success: true,
      message: 'Property is available for selected dates',
      data: {
        available: true,
        propertyId,
        startDate,
        endDate,
        bookingPeriod,
        duration
      }
    });

  } catch (error) {
    debugLog('❌ Availability check error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to check availability',
      code: 'AVAILABILITY_CHECK_FAILED',
      error: error.message
    });
  }
};

// ============================================
// 2. CREATE BOOKING AFTER PAYMENT
// ============================================
const createBookingAfterPayment = async (referenceId) => {
  try {
    debugLog('🎯 Creating booking after successful payment:', referenceId);

    // Get payment record
    const payment = await paymentService.getBookingPaymentByReference(referenceId);
    
    if (!payment) {
      debugLog('❌ Payment not found:', referenceId);
      return false;
    }

    // Check if booking already exists for this transaction
    const existingBookingCheck = await isanzureQuery(`
      SELECT b.id, b.booking_uid, b.status 
      FROM bookings b
      JOIN transactions t ON b.id = t.booking_id
      WHERE t.id = ?
    `, [payment.transaction_id]);

    if (existingBookingCheck.length > 0) {
      debugLog('✅ Booking already exists for transaction:', {
        transactionId: payment.transaction_id,
        bookingUid: existingBookingCheck[0].booking_uid,
        status: existingBookingCheck[0].status
      });
      return { 
        bookingId: existingBookingCheck[0].id, 
        bookingUid: existingBookingCheck[0].booking_uid 
      };
    }

    // Check by payment_reference
    const existingByRef = await isanzureQuery(`
      SELECT id, booking_uid, status 
      FROM bookings 
      WHERE payment_reference = ?
    `, [referenceId]);

    if (existingByRef.length > 0) {
      debugLog('✅ Booking already exists for reference:', {
        referenceId,
        bookingUid: existingByRef[0].booking_uid,
        status: existingByRef[0].status
      });
      return { 
        bookingId: existingByRef[0].id, 
        bookingUid: existingByRef[0].booking_uid 
      };
    }

    // Get property details with cancellation policy
    const propertyQuery = `
      SELECT 
        p.id, 
        p.landlord_id, 
        p.title, 
        p.property_uid,
        COALESCE(pr.cancellation_policy, 'flexible') as cancellation_policy
      FROM properties p
      LEFT JOIN property_rules pr ON p.id = pr.property_id
      WHERE p.id = ?
    `;
    
    const properties = await isanzureQuery(propertyQuery, [payment.property_id]);
    
    if (properties.length === 0) {
      throw new Error('Property not found');
    }

    const property = properties[0];
    const cancellationPolicy = property.cancellation_policy || 'flexible';

    debugLog('📋 Using cancellation policy:', {
      propertyId: property.id,
      policy: cancellationPolicy
    });

    // Create booking
    const insertBookingSql = `
      INSERT INTO bookings (
        booking_uid,
        payment_reference,
        property_id,
        landlord_id,
        tenant_id,
        booking_period,
        start_date,
        duration,
        end_date,
        total_amount,
        optional_services,
        special_requests,
        status,
        cancellation_policy,
        created_at,
        confirmed_at
      ) VALUES (
        UUID(),
        ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        'pending',
        ?,
        UTC_TIMESTAMP(),
        NULL
      )
    `;

    const bookingResult = await isanzureQuery(insertBookingSql, [
      referenceId,
      property.id,
      property.landlord_id,
      payment.user_id,
      payment.booking_period,
      payment.start_date,
      payment.duration,
      payment.end_date,
      payment.amount,
      payment.optional_services ? JSON.stringify(payment.optional_services) : null,
      payment.special_requests || null,
      cancellationPolicy
    ]);

    const bookingId = bookingResult.insertId;

    // Get booking UID
    const uidResult = await isanzureQuery(
      'SELECT booking_uid FROM bookings WHERE id = ?',
      [bookingId]
    );
    const bookingUid = uidResult[0].booking_uid;

    // Create payment schedule
    const periodCovered = JSON.stringify({
      start: payment.start_date,
      end: payment.end_date,
      period: payment.booking_period,
      duration: payment.duration
    });

    await isanzureQuery(`
      INSERT INTO booking_payments (
        payment_uid,
        booking_id,
        payment_type,
        period_covered,
        due_date,
        amount,
        status,
        paid_at,
        transaction_id,
        created_at
      ) VALUES (
        UUID(),
        ?,
        'full_payment',
        ?,
        ?,
        ?,
        'paid',
        UTC_TIMESTAMP(),
        ?,
        UTC_TIMESTAMP()
      )
    `, [bookingId, periodCovered, payment.start_date, payment.amount, payment.transaction_id]);

    // Update transaction with booking_id
    await isanzureQuery(`
      UPDATE transactions 
      SET booking_id = ? 
      WHERE id = ?
    `, [bookingId, payment.transaction_id]);

    debugLog('✅✅ BOOKING CREATED:', { 
      bookingUid, 
      referenceId,
      cancellationPolicy,
      status: 'pending'
    });

    return { bookingId, bookingUid };

  } catch (error) {
    debugLog('❌ Error creating booking:', error.message);
    return false;
  }
};

// ============================================
// 3. INITIATE BOOKING PAYMENT - WITH PRE-PAYMENT CHECKS
// ============================================
exports.initiateBookingPayment = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: {
          code: 'AUTH_REQUIRED',
          title: 'Please Log In',
          message: 'You need to be logged in to make a booking.',
          userAction: 'LOGIN'
        }
      });
    }

    const {
      propertyUid,
      bookingPeriod,
      startDate,
      duration,
      totalAmount,
      phoneNumber,
      paymentMethod = 'mobile_money',
      firstName,
      lastName,
      email,
      specialRequests,
      optionalServices,
      cancel_url
    } = req.body;

    debugLog('📋 Booking payment initiation:', {
      userId: user.id,
      propertyUid,
      amount: totalAmount,
      paymentMethod,
      bookingPeriod
    });

    // ========== VALIDATION ==========
    if (!startDate || !duration || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: { code: 'MISSING_FIELDS' }
      });
    }

    if (paymentMethod === 'mobile_money') {
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for Mobile Money',
          error: { code: 'MISSING_PHONE_NUMBER' }
        });
      }
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      if (cleanedPhone.length < 9) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number',
          error: { code: 'INVALID_PHONE_FORMAT' }
        });
      }
    }

    if (paymentMethod === 'card') {
      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'First name and last name are required for card payments',
          error: { code: 'MISSING_CARD_HOLDER_NAME' }
        });
      }
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required for card payments',
          error: { code: 'MISSING_EMAIL' }
        });
      }
    }

    // ========== CALCULATE END DATE ==========
    const endDate = new Date(startDate);
    switch (bookingPeriod) {
      case 'monthly': endDate.setMonth(endDate.getMonth() + duration); break;
      case 'weekly': endDate.setDate(endDate.getDate() + (duration * 7)); break;
      case 'daily': case 'nightly': endDate.setDate(endDate.getDate() + duration); break;
    }
    const endDateFormatted = endDate.toISOString().split('T')[0];

    // ========== GET PROPERTY ==========
    const propertyQuery = `
      SELECT 
        p.id, 
        p.property_uid, 
        p.title, 
        p.landlord_id,
        p.property_type,
        COALESCE(pr.cancellation_policy, 'flexible') as cancellation_policy
      FROM properties p
      LEFT JOIN property_rules pr ON p.id = pr.property_id
      WHERE p.property_uid = ? AND p.status = 'active'
    `;
    const properties = await isanzureQuery(propertyQuery, [propertyUid]);
    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not available',
        error: { code: 'PROPERTY_NOT_FOUND' }
      });
    }
    const property = properties[0];

    // ========== AVAILABILITY CHECK ==========
    const availability = await AvailabilityService.checkPropertyAvailability(
      property.id,
      startDate,
      endDateFormatted
    );
    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: availability.message || 'Property is not available for selected dates',
        error: { code: 'PROPERTY_NOT_AVAILABLE' }
      });
    }

    // ========== DUPLICATE CHECK FOR WHOLE PROPERTIES ==========
    const wholePropertyTypes = ['ghetto', 'living_house', 'villa', 'bungalow', 'townhouse'];
    if (wholePropertyTypes.includes(property.property_type)) {
      const userDuplicate = await AvailabilityService.checkUserBookingLimit(
        user.id,
        property.id,
        startDate,
        endDateFormatted
      );
      if (!userDuplicate.available) {
        return res.status(409).json({
          success: false,
          message: 'You already have an active booking for this property',
          error: { code: 'DUPLICATE_BOOKING' }
        });
      }
    }

    // ========== FORMAT PHONE ==========
    let customerPhone = null;
    if (phoneNumber) {
      customerPhone = phoneNumber.replace(/\s+/g, '').startsWith('+') ?
        phoneNumber.replace(/\s+/g, '') : `+25${phoneNumber.replace(/\s+/g, '')}`;
    }

    const callbackUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/booking/callback`;
    const cancelUrl = cancel_url || `${process.env.CLIENT_URL || 'http://localhost:5173'}/booking/${propertyUid}`;

    // ========== PROCESS PAYMENT ==========
    let paymentResult;

    // 📱 MOBILE MONEY
    if (paymentMethod === 'mobile_money') {
      paymentResult = await paymentService.createMoMoPayment({
        email: email || user.public_email || `${user.user_uid}@isanzure.rw`,
        name: user.full_name || `${user.first_name} ${user.last_name}`.trim() || `User-${user.id}`,
        amount: totalAmount,
        phoneNumber: customerPhone,
        callbackUrl,
        description: `Booking: ${property.title}`
      });

      if (paymentResult.status === 'success') {
        await paymentService.createBookingPaymentRecord({
          userId: user.id,
          propertyId: property.id,
          amount: totalAmount,
          referenceId: paymentResult.referenceId,
          status: 'pending',
          bookingPeriod,
          duration,
          startDate,
          endDate: endDateFormatted,
          specialRequests,
          optionalServices,
          cancellationPolicy: property.cancellation_policy,
          paymentMethod
        });

        paymentService.startBackgroundStatusCheck(
          paymentResult.referenceId,
          createBookingAfterPayment
        ).catch(error => debugLog('Background check error:', error.message));

        return res.json({
          success: true,
          mode: 'momo',
          message: `Payment request sent to ${phoneNumber}. Please check your phone.`,
          reference_id: paymentResult.referenceId,
          paymentMethod,
          phone: phoneNumber,
          amount: totalAmount,
          instructions: [
            "1. Check your phone for a payment request",
            "2. Enter your PIN to accept",
            "3. Or press reject to cancel",
            "4. This page will update automatically"
          ]
        });
      }
    }

    // 💳 CARD PAYMENT
else if (paymentMethod === 'card') {
  const cardFirstName = firstName || user.first_name || 'iSanzure';
  const cardLastName = lastName || user.last_name || 'User';
  const cardEmail = email || user.public_email || `${user.user_uid}@isanzure.rw`;

  paymentResult = await paymentService.createCardPayment({
    userId: user.id,
    email: cardEmail,
    firstName: cardFirstName,
    lastName: cardLastName,
    phoneNumber: customerPhone || user.public_phone || '',
    amount: totalAmount,
    description: `Booking: ${property.title}`,
    propertyUid,
    bookingPeriod,
    startDate,
    duration,
    specialRequests,
    optionalServices,
    cancelUrl
  });

  if (paymentResult.status === 'success') {
    // ✅ FIX: Save payment as 'pending', NOT 'success'
    await paymentService.createBookingPaymentRecord({
      userId: user.id,
      propertyId: property.id,
      amount: totalAmount,
      referenceId: paymentResult.referenceId,
      status: 'pending',  // ← CRITICAL: Must be 'pending', not 'success'
      bookingPeriod,
      duration,
      startDate,
      endDate: endDateFormatted,
      specialRequests,
      optionalServices,
      cancellationPolicy: property.cancellation_policy,
      paymentMethod
    });

    // ✅ FIX: Start tracking card payments too!
    paymentService.startBackgroundStatusCheck(
      paymentResult.referenceId,
      createBookingAfterPayment
    ).catch(error => debugLog('Background check error:', error.message));

    return res.json({
      success: true,
      mode: 'card',
      message: 'Card payment initiated. Please complete payment in the opened window.',
      reference_id: paymentResult.referenceId,
      postData: paymentResult.postData
    });
  }
}

    // ❌ PAYMENT FAILED
    if (paymentResult?.status === 'fail') {
      await paymentService.createBookingPaymentRecord({
        userId: user.id,
        propertyId: property.id,
        amount: totalAmount,
        referenceId: paymentResult.referenceId,
        status: 'failed',
        bookingPeriod,
        duration,
        startDate,
        endDate: endDateFormatted,
        specialRequests,
        optionalServices,
        cancellationPolicy: property.cancellation_policy,
        paymentMethod
      });

      return res.status(400).json({
        success: false,
        message: paymentResult.message || 'Payment failed',
        error: { code: 'PAYMENT_FAILED' }
      });
    }

  } catch (error) {
    debugLog('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: { code: 'SYSTEM_ERROR' }
    });
  }
};

// ============================================
// 4. CHECK PAYMENT STATUS
// ============================================
exports.checkBookingPaymentStatus = async (req, res) => {
  try {
    const { referenceId } = req.params;

    debugLog('🔍 Checking payment status:', referenceId);

    // Get payment from database
    const payment = await paymentService.getBookingPaymentByReference(referenceId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        error: {
          code: 'PAYMENT_NOT_FOUND',
          title: 'Payment Not Found',
          message: 'The payment reference could not be found.'
        }
      });
    }

    // If still pending, check with provider
    if (payment.status === 'pending') {
      try {
        const apiStatus = await paymentService.checkStatus(referenceId);
        
        if (apiStatus.status && apiStatus.status !== 'pending' && apiStatus.status !== 'processing') {
          const newStatus = mapPaymentStatus(apiStatus.status);
          await paymentService.updateBookingPaymentStatus(referenceId, newStatus);
          payment.status = newStatus;
          
          // If completed, create booking
          if (newStatus === 'completed') {
            await createBookingAfterPayment(referenceId);
          }
        }
      } catch (apiError) {
        debugLog('Status check API error:', apiError.message);
      }
    }

    // Get booking if exists
    let bookingUid = null;
    if (payment.booking_id) {
      const booking = await isanzureQuery(
        'SELECT booking_uid FROM bookings WHERE id = ?',
        [payment.booking_id]
      );
      bookingUid = booking[0]?.booking_uid;
    }

    res.json({
      success: true,
      data: {
        referenceId,
        status: payment.status,
        amount: payment.amount,
        bookingUid,
        paidAt: payment.paid_at
      }
    });

  } catch (error) {
    debugLog('❌ Status check error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to check payment status'
    });
  }
};

// ============================================
// 5. PAYMENT CALLBACK HANDLER
// ============================================
exports.handleBookingPaymentCallback = async (req, res) => {
  try {
    debugLog('📨 Callback received:', req.body);

    const { reference_id, transaction_id, status } = req.body;

    if (!reference_id || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid callback data' 
      });
    }

    // Map status
    const mappedStatus = mapPaymentStatus(status);
    
    debugLog(`🔄 Updating payment: ${reference_id} -> ${mappedStatus}`);

    // Update payment status
    await paymentService.updateBookingPaymentStatus(reference_id, mappedStatus, transaction_id);

    // If completed, create booking
    if (mappedStatus === 'completed') {
      await createBookingAfterPayment(reference_id);
    }

    // ALWAYS return 200 OK
    res.status(200).json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    debugLog('❌ Callback error:', error.message);
    res.status(200).json({
      success: false,
      message: 'Error processing callback',
      error: error.message
    });
  }
};

// ============================================
// 📞 PAYMENT WEBHOOK - Server-to-server ONLY
// ============================================
exports.handlePaymentWebhook = async (req, res) => {
  try {
    // ✅ Handle BOTH POST and GET!
    let reference_id, transaction_id, status;
    
    if (req.method === 'POST') {
      // Proper webhook - JSON body
      reference_id = req.body.reference_id;
      transaction_id = req.body.transaction_id;
      status = req.body.status;
    } else {
      // Browser redirect - GET with query params
      reference_id = req.query.reference_id || req.query.reference;
      transaction_id = req.query.transaction_id;
      status = req.query.status;
    }

    debugLog('📨 Webhook received:', { 
      method: req.method,
      reference_id, 
      transaction_id, 
      status 
    });

    if (!reference_id || !status) {
      return res.status(400).json({ success: false, message: 'Invalid webhook' });
    }

    // Update payment status
    const mappedStatus = mapPaymentStatus(status);
    await paymentService.updateBookingPaymentStatus(reference_id, mappedStatus, transaction_id);
    
    if (mappedStatus === 'completed') {
      await createBookingAfterPayment(reference_id);
    }

    // ✅ If GET request (browser), redirect to frontend
    if (req.method === 'GET') {
      // Set ngrok-skip-browser-warning header
      res.setHeader('ngrok-skip-browser-warning', 'true');
      
      // Redirect to your frontend result page
      return res.redirect(`${process.env.FRONTEND_URL}/booking/result?reference_id=${reference_id}&status=${status}`);
    }

    // ✅ If POST request, return JSON
    res.status(200).json({ success: true });

  } catch (error) {
    debugLog('❌ Webhook error:', error.message);
    
    if (req.method === 'GET') {
      res.redirect(`${process.env.FRONTEND_URL}/booking/error`);
    } else {
      res.status(200).json({ success: false, message: error.message });
    }
  }
};


// ============================================
// 🔙 LEGACY CALLBACK - Keep for backward compatibility
// ============================================
exports.handleBookingPaymentCallback = async (req, res) => {
  // This is called by YOUR frontend after redirect
  // Or by LMBTech as fallback
  return exports.handlePaymentWebhook(req, res);
};

module.exports = {
  checkBookingAvailability: exports.checkBookingAvailability,
  initiateBookingPayment: exports.initiateBookingPayment,
  checkBookingPaymentStatus: exports.checkBookingPaymentStatus,
  handlePaymentWebhook: exports.handlePaymentWebhook,
  handleBookingPaymentCallback: exports.handleBookingPaymentCallback
};