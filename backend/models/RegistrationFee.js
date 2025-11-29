// backend/models/RegistrationFee.js
const mongoose = require('mongoose');

const RegistrationFeeSchema = new mongoose.Schema({
  userType: {
    type: String,
    required: true,
    enum: ['fencer', 'coach', 'referee', 'school', 'club'],
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RegistrationFee', RegistrationFeeSchema);
