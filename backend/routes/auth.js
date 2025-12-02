const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const generateToken = (id) => {
    const jwtSecret = process.env.JWT_SECRET || 'development_secret_key';
    return jwt.sign({ id }, jwtSecret, {
        expiresIn: '30d',
    });
};

// Register User - UPDATED VERSION
router.post('/register', async (req, res) => {
    try {
        const { email, password, role, district, name, phone, districtShortcode } = req.body;
        console.log('📝 Registration attempt:', { email, role, district, districtShortcode });

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Validate required fields
        if (!email || !password || !role || !district) {
            console.log('❌ Missing required fields:', { email, password, role, district });
            return res.status(400).json({ 
                message: 'Email, password, role, and district are required' 
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            role,
            district,
            districtShortcode: districtShortcode || district.toUpperCase().replace(' ', '_'),
            name: name || email.split('@')[0],
            phone: phone || '',
            isApproved: false,
            districtApproved: false,
            centralApproved: false
        });

        if (user) {
            console.log('✅ User created successfully:', user.email, 'Role:', user.role);
            res.status(201).json({
                _id: user._id,
                email: user.email,
                role: user.role,
                district: user.district,
                districtShortcode: user.districtShortcode,
                name: user.name,
                phone: user.phone,
                isApproved: user.isApproved,
                districtApproved: user.districtApproved,
                centralApproved: user.centralApproved
            });
        }
    } catch (error) {
        console.error('💥 Registration error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Login User - ENHANCED VERSION
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Login attempt for:', email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await user.matchPassword(password);

        if (isPasswordValid) {
            console.log('🎉 Login successful for:', email, 'Role:', user.role);
            
            const userResponse = {
                _id: user._id,
                email: user.email,
                role: user.role,
                district: user.district,
                name: user.name,
                isApproved: user.isApproved,
                districtApproved: user.districtApproved,
                centralApproved: user.centralApproved,
                profileCompleted: user.profileCompleted,
                token: generateToken(user._id)
            };

            res.json(userResponse);
        } else {
            console.log('❌ Invalid password for user:', email);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('💥 Login system error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ==========================================================
// REMOVED ALL DEBUG/TEST ENDPOINTS for Production Readiness
// ==========================================================

module.exports = router;