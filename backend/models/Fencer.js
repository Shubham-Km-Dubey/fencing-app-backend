const mongoose = require('mongoose');

const FencerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Personal Information
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    middleName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    aadharNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{12}$/, 'Please provide a valid 12-digit Aadhar number']
    },
    fathersName: {
        type: String,
        required: true,
        trim: true
    },
    mothersName: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Please provide a valid 10-digit mobile number']
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    
    // Address Information
    permanentAddress: {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        state: { type: String, required: true },
        district: { type: String, required: true },
        pinCode: { 
            type: String, 
            required: true,
            match: [/^\d{6}$/, 'Please provide a valid 6-digit PIN code']
        }
    },
    presentAddress: {
        addressLine1: { type: String },
        addressLine2: { type: String },
        state: { type: String },
        district: { type: String },
        pinCode: { 
            type: String,
            match: [/^\d{6}$/, 'Please provide a valid 6-digit PIN code']
        }
    },
    
    // Fencing Information
    highestAchievement: {
        type: String,
        trim: true
    },
    coachName: {
        type: String,
        trim: true
    },
    trainingCenter: {
        type: String,
        trim: true
    },
    
    // District Information
    selectedDistrict: {
        type: String,
        required: true
    },
    districtShortcode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    
    // Documents
    documents: {
        passportPhoto: { type: String, required: true },
        aadharFront: { type: String, required: true },
        aadharBack: { type: String, required: true },
        birthCertificate: { type: String, required: true },
        doc1: { type: String },
        doc2: { type: String },
        doc3: { type: String }
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    // Payment Information
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentId: {
        type: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
FencerSchema.index({ userId: 1 });
FencerSchema.index({ selectedDistrict: 1 });
FencerSchema.index({ aadharNumber: 1 });
FencerSchema.index({ status: 1 });

module.exports = mongoose.model('Fencer', FencerSchema);