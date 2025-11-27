const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Club Information
    clubName: { type: String, required: true },
    clubEmail: { type: String, required: true },
    clubContactNumber: { type: String, required: true },
    
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
    numberOfCoaches: { type: Number, required: true },
    coachesList: [{ type: String }], // Array of coach names
    
    // District Information
    selectedDistrict: { type: String, required: true },
    
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Club', ClubSchema);