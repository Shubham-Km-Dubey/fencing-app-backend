const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Fencer = require('../models/Fencer');
const Coach = require('../models/Coach');
const Referee = require('../models/Referee');
const School = require('../models/School');
const Club = require('../models/Club');
const router = express.Router();

// Cashfree credentials
const CASHFREE_CONFIG = {
  appId: process.env.CASHFREE_APP_ID || 'TEST_APP_ID',
  secretKey: process.env.CASHFREE_SECRET_KEY || 'TEST_SECRET_KEY',
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg'
};

// Create payment session and save registration data
router.post('/create-session', async (req, res) => {
  try {
    const { 
      orderAmount, 
      customerName, 
      customerEmail, 
      customerPhone,
      userType,
      registrationData
    } = req.body;

    console.log('Creating payment session for:', customerEmail, 'Type:', userType);

    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For testing without actual Cashfree credentials
    if (CASHFREE_CONFIG.appId === 'TEST_APP_ID' || !CASHFREE_CONFIG.appId.startsWith('1092')) {
      console.log('Using mock payment for testing');
      
      // Create payment record in database WITHOUT paymentSessionId
      const payment = new Payment({
        orderId: orderId,
        orderAmount: orderAmount,
        orderCurrency: 'INR',
        customerDetails: {
          customerId: customerEmail,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone
        },
        userType: userType,
        registrationData: registrationData,
        paymentStatus: 'PENDING'
      });

      await payment.save();

      return res.json({
        success: true,
        data: {
          payment_session_id: `mock_session_${Date.now()}`,
          order_id: orderId,
          order_amount: orderAmount,
          payment_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mock-payment?order_id=${orderId}&user_type=${userType}`
        }
      });
    }

    // Prepare payment data for Cashfree
    const paymentData = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerEmail,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?order_id={order_id}&user_type=${userType}`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`
      },
      order_note: `Registration fee for ${userType}`
    };

    // Real Cashfree API call
    const cashfreeResponse = await fetch(`${CASHFREE_CONFIG.baseURL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_CONFIG.appId,
        'x-client-secret': CASHFREE_CONFIG.secretKey,
        'x-api-version': '2022-09-01'
      },
      body: JSON.stringify(paymentData)
    });

    const cashfreeData = await cashfreeResponse.json();

    if (cashfreeData.payment_session_id) {
      // Create payment record WITH paymentSessionId
      const payment = new Payment({
        orderId: orderId,
        paymentSessionId: cashfreeData.payment_session_id,
        orderAmount: orderAmount,
        orderCurrency: 'INR',
        customerDetails: {
          customerId: customerEmail,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone
        },
        userType: userType,
        registrationData: registrationData,
        paymentStatus: 'PENDING'
      });

      await payment.save();

      console.log('Payment session created successfully:', orderId);
      
      res.json({
        success: true,
        data: {
          payment_session_id: cashfreeData.payment_session_id,
          order_id: orderId,
          order_amount: orderAmount,
          payment_url: cashfreeData.payment_link
        }
      });
    } else {
      throw new Error(cashfreeData.message || 'Failed to create payment session');
    }

  } catch (error) {
    console.error('Payment session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment session creation failed',
      details: error.message
    });
  }
});

// Verify payment and complete registration
router.get('/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log('Verifying payment for order:', orderId);

    // Find payment record
    const payment = await Payment.findOne({ orderId: orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // For testing - mock successful payment
    if (CASHFREE_CONFIG.appId === 'TEST_APP_ID') {
      console.log('Using mock payment verification');
      
      // Update payment status
      payment.paymentStatus = 'SUCCESS';
      payment.cashfreeOrderStatus = 'PAID';
      payment.paymentTime = new Date();
      payment.transactionId = `mock_txn_${Date.now()}`;
      await payment.save();

      // Complete the registration
      await completeRegistration(payment);

      return res.json({
        success: true,
        data: {
          order_id: orderId,
          order_status: 'PAID',
          payment_status: 'SUCCESS',
          payment_amount: payment.orderAmount,
          payment_currency: payment.orderCurrency,
          payment_time: payment.paymentTime,
          user_type: payment.userType
        }
      });
    }

    // Real Cashfree verification
    const cashfreeResponse = await fetch(`${CASHFREE_CONFIG.baseURL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': CASHFREE_CONFIG.appId,
        'x-client-secret': CASHFREE_CONFIG.secretKey,
        'x-api-version': '2022-09-01'
      }
    });

    const cashfreeData = await cashfreeResponse.json();

    // Update payment status based on Cashfree response
    if (cashfreeData.order_status === 'PAID') {
      payment.paymentStatus = 'SUCCESS';
      payment.cashfreeOrderStatus = cashfreeData.order_status;
      payment.paymentTime = new Date();
      payment.transactionId = cashfreeData.payment_transaction_id;
      await payment.save();

      // Complete the registration
      await completeRegistration(payment);
    } else {
      payment.paymentStatus = 'FAILED';
      payment.cashfreeOrderStatus = cashfreeData.order_status;
      await payment.save();
    }

    res.json({
      success: true,
      data: {
        order_id: orderId,
        order_status: cashfreeData.order_status,
        payment_status: payment.paymentStatus,
        payment_amount: payment.orderAmount,
        payment_currency: payment.orderCurrency,
        payment_time: payment.paymentTime,
        user_type: payment.userType
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      details: error.message
    });
  }
});

// Complete registration after successful payment
async function completeRegistration(payment) {
  try {
    const { userType, registrationData, customerDetails } = payment;

    console.log(`Completing registration for ${userType}:`, customerDetails.customerEmail);

    // Update user approval status
    const user = await User.findOne({ email: customerDetails.customerEmail });
    if (user) {
      user.isApproved = true;
      user.districtApproved = true;
      user.profileCompleted = true;
      await user.save();
    }

    // Save to specific collection based on user type
    switch (userType) {
      case 'fencer':
        const fencer = new Fencer({
          ...registrationData,
          userId: user?._id,
          paymentStatus: 'PAID',
          paymentOrderId: payment.orderId
        });
        await fencer.save();
        break;

      case 'coach':
        const coach = new Coach({
          ...registrationData,
          userId: user?._id,
          paymentStatus: 'PAID',
          paymentOrderId: payment.orderId
        });
        await coach.save();
        break;

      case 'referee':
        const referee = new Referee({
          ...registrationData,
          userId: user?._id,
          paymentStatus: 'PAID',
          paymentOrderId: payment.orderId
        });
        await referee.save();
        break;

      case 'school':
        const school = new School({
          ...registrationData,
          userId: user?._id,
          paymentStatus: 'PAID',
          paymentOrderId: payment.orderId
        });
        await school.save();
        break;

      case 'club':
        const club = new Club({
          ...registrationData,
          userId: user?._id,
          paymentStatus: 'PAID',
          paymentOrderId: payment.orderId
        });
        await club.save();
        break;
    }

    console.log(`Registration completed successfully for ${userType}:`, customerDetails.customerEmail);

  } catch (error) {
    console.error('Error completing registration:', error);
    throw error;
  }
}

// Webhook for payment notifications
router.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('Payment webhook received:', webhookData);

    const { data, event } = webhookData;
    
    if (event === 'ORDER.PAYMENT_SUCCESS') {
      const payment = await Payment.findOne({ orderId: data.order.order_id });
      if (payment && payment.paymentStatus !== 'SUCCESS') {
        payment.paymentStatus = 'SUCCESS';
        payment.cashfreeOrderStatus = data.order.order_status;
        payment.paymentTime = new Date();
        payment.transactionId = data.payment.transaction_id;
        await payment.save();

        // Complete registration
        await completeRegistration(payment);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

// Get payment status
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const payment = await Payment.findOne({ orderId: orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: payment.orderId,
        paymentStatus: payment.paymentStatus,
        orderAmount: payment.orderAmount,
        userType: payment.userType,
        createdAt: payment.createdAt,
        paymentTime: payment.paymentTime
      }
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status'
    });
  }
});

module.exports = router;