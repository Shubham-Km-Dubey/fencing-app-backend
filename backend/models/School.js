const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // School Information
    schoolName: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    schoolEmail: { type: String, required: true },
    schoolContactNumber: { type: String, required: true },
    
    // Representative Information
    representativeName: { type: String, required: true },
    representativeNumber: { type: String, required: true },
    representativeEmail: { type: String, required: true },
    
    // Facility Information
    indoorHallMeasurement: { type: String, required: true },
    acNonAc: { type: String, enum: ['AC', 'Non-AC'], required: true },
    auditorium: { type: Boolean, required: true },
    assembleArea: { type: Boolean, required: true },
    parkingArea: { type: Boolean, required: true },
    
    // Address Information
    permanentAddress: {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        state: { type: String, required: true },
        district: { type: String, required: true },
        pinCode: { type: String, required: true }
    },
    
    // Additional Information
    numberOfStudents: { type: Number, required: true },
    coachName: { type: String, required: true },
    
    // District Information
    selectedDistrict: { type: String, required: true },
    
    // Document URLs
    documents: {
        registrationCertificate: { type: String }
    },
    
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('School', SchoolSchema);