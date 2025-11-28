const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['fencer', 'coach', 'referee', 'school', 'club', 'district_admin', 'super_admin'],
        required: true
    },
    district: {
        type: String,
        required: function() {
            return this.role !== 'super_admin';
        }
    },
    // NEW FIELD — Stores the shortcode (e.g., NWD, SED, CD) from District.code
    districtShortcode: {
        type: String,
        uppercase: true,
        trim: true
    },
    name: {
        type: String
    },
    phone: {
        type: String
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    districtApproved: {
        type: Boolean,
        default: false
    },
    centralApproved: {
        type: Boolean,
        default: false
    },
    dafId: {
        type: String,
        unique: true,
        sparse: true
    },
    rejectionReason: {
        type: String
    },
    profileCompleted: {
        type: Boolean,
        default: false
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison method
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);