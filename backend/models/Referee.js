const mongoose = require('mongoose');

const RefereeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Personal Information
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    mobileNumber: { type: String, required: true },
    aadharNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    fathersName: { type: String, required: true },
    mothersName: { type: String, required: true },
    
    // Address Information
    permanentAddress: {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        state: { type: String, required: true },
        district: { type: String, required: true },
        pinCode: { type: String, required: true }
    },
    presentAddress: {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        state: { type: String, required: true },
        district: { type: String, required: true },
        pinCode: { type: String, required: true }
    },
    
    // Professional Information
    level: {
        type: String,
        enum: [
            'National Participation',
            'Certificate Course',
            'Diploma',
            'FIE Coaching Courses',
            'More then 5 years',
            'More then 15 years',
            'FCA',
            'FIE'
        ],
        required: true
    },
    highestAchievement: { type: String },
    trainingCenter: { type: String },
    
    // District Information
    selectedDistrict: { type: String, required: true },
    
    // Document URLs
    documents: {
        photo: { type: String },
        aadharFront: { type: String },
        aadharBack: { type: String },
        refereeCertificate: { type: String },
        doc1: { type: String },
        doc2: { type: String },
        doc3: { type: String }
    },
    
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Referee', RefereeSchema);