const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentSessionId: {
    type: String,
    // REMOVED required: true - make it optional
  },
  orderAmount: {
    type: Number,
    required: true
  },
  orderCurrency: {
    type: String,
    default: 'INR'
  },
  customerDetails: {
    customerId: String,
    customerName: String,
    customerEmail: String,
    customerPhone: String
  },
  userType: {
    type: String,
    enum: ['fencer', 'coach', 'referee', 'school', 'club'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  registrationData: {
    type: mongoose.Schema.Types.Mixed
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'],
    default: 'PENDING'
  },
  cashfreeOrderStatus: {
    type: String
  },
  paymentTime: {
    type: Date
  },
  paymentMethod: {
    type: String
  },
  transactionId: {
    type: String
  },
  refundStatus: {
    type: String,
    enum: ['NONE', 'REQUESTED', 'PROCESSED', 'FAILED'],
    default: 'NONE'
  }
}, {
  timestamps: true
});

// Index for faster queries
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ customerDetails: 1 });
PaymentSchema.index({ paymentStatus: 1 });
PaymentSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);