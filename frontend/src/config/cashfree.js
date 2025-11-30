// Cashfree Configuration
export const CASHFREE_CONFIG = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  paymentSessionId: '', // Will be set dynamically
  returnUrl: `${window.location.origin}/payment-success`, // Your success URL
  onSuccess: (data) => {
    console.log('Payment successful:', data);
    return data;
  },
  onFailure: (data) => {
    console.error('Payment failed:', data);
    return data;
  }
};

// Registration fee is now dynamic and fetched from backend API
// The fee amount will be retrieved from /api/fees/[userType] endpoint