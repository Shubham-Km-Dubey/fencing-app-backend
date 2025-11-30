const express = require("express");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Fencer = require("../models/Fencer");
const Coach = require("../models/Coach");
const Referee = require("../models/Referee");
const School = require("../models/School");
const Club = require("../models/Club");

const router = express.Router();

// ==============================
// CASHFREE CONFIG
// ==============================
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
const CASHFREE_BASE_URL =
  process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// MOCK mode is ONLY active if keys are missing
const USE_MOCK =
  !CASHFREE_APP_ID ||
  CASHFREE_APP_ID === "TEST_APP_ID" ||
  !CASHFREE_SECRET_KEY;

console.log("🔐 Cashfree Config Loaded:", {
  baseURL: CASHFREE_BASE_URL,
  appIdPresent: !!CASHFREE_APP_ID,
  secretPresent: !!CASHFREE_SECRET_KEY,
  mockMode: USE_MOCK,
});

// ==============================
// CREATE PAYMENT SESSION
// ==============================
router.post("/create-session", async (req, res) => {
  try {
    const {
      orderAmount,
      customerName,
      customerEmail,
      customerPhone,
      userType,
      registrationData,
    } = req.body;

    console.log("📦 Creating payment session for:", customerEmail);

    // CREATE ORDER ID
    const orderId = `ORDER_${Date.now()}`;

    // Customer ID cannot contain @ . etc — must be alphanumeric or _ -
    const safeCustomerId = customerEmail.replace(/[^a-zA-Z0-9_-]/g, "_");

    // ==============================
    // MOCK MODE
    // ==============================
    if (USE_MOCK) {
      console.log("⚠️ MOCK MODE ACTIVE — no Cashfree keys available");

      const payment = new Payment({
        orderId,
        orderAmount,
        orderCurrency: "INR",
        userType,
        customerDetails: {
          customerId: safeCustomerId,
          customerName,
          customerEmail,
          customerPhone,
        },
        registrationData,
        paymentStatus: "PENDING",
      });
      await payment.save();

      // For mock mode, simulate successful payment immediately
      payment.paymentStatus = "completed";
      payment.cashfreeOrderStatus = "PAID";
      payment.paymentTime = new Date();
      payment.transactionId = `mock_txn_${Date.now()}`;
      await payment.save();

      // Complete registration immediately for mock mode
      await completeRegistration(payment);

      return res.json({
        success: true,
        data: {
          payment_session_id: `mock_session_${Date.now()}`,
          order_id: orderId,
          order_amount: orderAmount,
          payment_url: `${FRONTEND_URL}/payment-success?order_id=${orderId}&status=success`,
        },
      });
    }

    // ==============================
    // REAL CASHFREE API CALL
    // ==============================
    const cfPayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: safeCustomerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${FRONTEND_URL}/payment-success?order_id={order_id}&user_type=${userType}`,
        notify_url: `${BACKEND_URL}/api/payments/webhook`,
      },
      order_note: `Registration fee for ${userType}`,
    };

    console.log("➡️ Sending order to Cashfree:", cfPayload);

    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01", // Correct version
      },
      body: JSON.stringify(cfPayload),
    });

    const data = await response.json();
    console.log("📥 Cashfree Response:", data);

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          "Cashfree authentication failed. Check keys."
      );
    }

    // Save Payment Record
    const payment = new Payment({
      orderId,
      paymentSessionId: data.payment_session_id,
      orderAmount,
      orderCurrency: "INR",
      userType,
      customerDetails: {
        customerId: safeCustomerId,
        customerName,
        customerEmail,
        customerPhone,
      },
      registrationData,
      paymentStatus: "PENDING",
    });
    await payment.save();

    // FIXED: Return only the data needed for Cashfree SDK - no payment_url
    return res.json({
      success: true,
      data: {
        order_id: orderId,
        payment_session_id: data.payment_session_id,
        order_amount: orderAmount,
        // No payment_url - frontend will use Cashfree SDK with payment_session_id
      },
    });
  } catch (error) {
    console.error("❌ Payment Error:", error.message || error);

    return res.status(500).json({
      success: false,
      error: "Payment session creation failed",
      details: error.message,
    });
  }
});

// ==============================
// VERIFY PAYMENT
// ==============================
router.get("/verify/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    console.log("🔍 Verifying payment:", orderId);

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    // MOCK
    if (USE_MOCK) {
      payment.paymentStatus = "completed";
      payment.cashfreeOrderStatus = "PAID";
      payment.paymentTime = new Date();
      payment.transactionId = `mock_txn_${Date.now()}`;
      await payment.save();
      await completeRegistration(payment);

      return res.json({
        success: true,
        data: {
          order_id: orderId,
          order_status: "PAID",
          payment_status: "completed",
        },
      });
    }

    // REAL CASHFREE VERIFICATION
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    const data = await response.json();
    console.log("📥 Verify Response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Verification failed");
    }

    if (data.order_status === "PAID") {
      payment.paymentStatus = "completed";
      payment.cashfreeOrderStatus = "PAID";
      payment.paymentTime = new Date();
      payment.transactionId = data.payment_transaction_id;
      await payment.save();

      await completeRegistration(payment);
    } else if (data.order_status === "FAILED") {
      payment.paymentStatus = "failed";
      payment.cashfreeOrderStatus = "FAILED";
      await payment.save();
    }

    res.json({
      success: true,
      data: {
        order_id: orderId,
        order_status: data.order_status,
        payment_status: payment.paymentStatus,
      },
    });
  } catch (error) {
    console.error("❌ Verify Error:", error);

    res.status(500).json({
      success: false,
      error: "Payment verification failed",
      details: error.message,
    });
  }
});

// ==============================
// COMPLETE REGISTRATION
// ==============================
async function completeRegistration(payment) {
  try {
    const { userType, registrationData, customerDetails } = payment;

    const user = await User.findOne({ email: customerDetails.customerEmail });

    if (user) {
      user.profileCompleted = true;
      user.isApproved = false;
      user.districtApproved = false;
      await user.save();
    }

    const modelMap = {
      fencer: Fencer,
      coach: Coach,
      referee: Referee,
      school: School,
      club: Club,
    };

    const Model = modelMap[userType];

    if (Model) {
      await new Model({
        ...registrationData,
        userId: user?._id,
        paymentStatus: "completed",
        paymentOrderId: payment.orderId,
      }).save();
    }

    console.log(`🎉 Registration saved for ${userType}:`, user.email);
  } catch (error) {
    console.error("❌ Registration Completion Error:", error);
  }
}

// ==============================
// WEBHOOK
// ==============================
router.post("/webhook", express.json(), async (req, res) => {
  try {
    console.log("🔔 Webhook Received:", req.body);

    const event = req.body.event;
    const orderId = req.body.data?.order?.order_id;

    if (event === "ORDER.PAYMENT_SUCCESS") {
      const payment = await Payment.findOne({ orderId });
      if (payment && payment.paymentStatus !== "completed") {
        payment.paymentStatus = "completed";
        payment.cashfreeOrderStatus = "PAID";
        payment.paymentTime = new Date();
        payment.transactionId = req.body.data.payment.transaction_id;
        await payment.save();

        await completeRegistration(payment);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;