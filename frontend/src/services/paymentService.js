import { load } from '@cashfreepayments/cashfree-js';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://fencing-app-backend.onrender.com';

let cashfree;
export const initializeCashfree = async () => {
  try {
    // FIXED: Use sandbox for localhost, production for live domains
    const mode = window.location.hostname === 'localhost' ? 'sandbox' : 'production';
    console.log('🔐 Cashfree mode:', mode);
    
    cashfree = await load({
      mode: mode
    });
    return cashfree;
  } catch (error) {
    console.error('Failed to load Cashfree:', error);
    throw error;
  }
};

// Create payment session
export const createPaymentSession = async (orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment session error:', error);
    throw error;
  }
};

// Verify payment
export const verifyPayment = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/verify/${orderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};