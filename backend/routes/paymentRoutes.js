const express = require('express');
const router = express.Router();

// Cashfree credentials (store these in environment variables)
const CASHFREE_CONFIG = {
  appId: process.env.CASHFREE_APP_ID || 'TEST_APP_ID', // Get from Cashfree dashboard
  secretKey: process.env.CASHFREE_SECRET_KEY || 'TEST_SECRET_KEY', // Get from Cashfree dashboard
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg'
};

// Create payment session
router.post('/create-session', async (req, res) => {
  try {
    const { 
      orderId, 
      orderAmount, 
      customerName, 
      customerEmail, 
      customerPhone,
      fencerData 
    } = req.body;

    console.log('Creating payment session for:', customerEmail);

    // Generate unique order ID if not provided
    const generatedOrderId = orderId || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare request to Cashfree
    const paymentData = {
      order_id: generatedOrderId,
      order_amount: orderAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerEmail,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'https://fencing-india-464c5.web.app'}/payment-success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL || 'https://fencing-app-backend.onrender.com'}/api/payments/webhook`
      }
    };

    // For testing without actual Cashfree credentials
    if (CASHFREE_CONFIG.appId === 'TEST_APP_ID') {
      // Return mock payment session for testing
      return res.json({
        success: true,
        data: {
          payment_session_id: `mock_session_${Date.now()}`,
          order_id: generatedOrderId,
          order_amount: orderAmount,
          payment_url: `${process.env.FRONTEND_URL || 'https://fencing-india-464c5.web.app'}/mock-payment`
        }
      });
    }

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
      // Save order details to database (you can save fencerData here)
      console.log('Payment session created:', generatedOrderId);
      
      res.json({
        success: true,
        data: {
          payment_session_id: cashfreeData.payment_session_id,
          order_id: generatedOrderId,
          order_amount: orderAmount,
          payment_url: cashfreeData.payment_link // Cashfree payment page URL
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

// Verify payment
router.get('/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // For testing
    if (CASHFREE_CONFIG.appId === 'TEST_APP_ID') {
      return res.json({
        success: true,
        data: {
          order_id: orderId,
          order_status: 'PAID',
          payment_amount: 500,
          payment_currency: 'INR',
          payment_time: new Date().toISOString()
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

    res.json({
      success: true,
      data: cashfreeData
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

// Webhook for payment notifications
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('Payment webhook received:', webhookData);

    // Verify webhook signature (important for security)
    // Update your database with payment status
    // Send confirmation email, etc.

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;