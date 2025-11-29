const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

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
            console.log('❌ Missing credentials');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log('👤 User found:', {
            email: user.email,
            role: user.role,
            district: user.district,
            isApproved: user.isApproved,
            districtApproved: user.districtApproved,
            centralApproved: user.centralApproved
        });

        // Debug password verification
        console.log('🔑 Starting password verification...');
        console.log('Input password length:', password.length);
        console.log('Stored password hash exists:', !!user.password);
        console.log('Stored password hash length:', user.password ? user.password.length : 'N/A');

        try {
            const isPasswordValid = await user.matchPassword(password);
            console.log('✅ Password validation result:', isPasswordValid);

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

                console.log('📤 Sending user response:', {
                    email: userResponse.email,
                    role: userResponse.role,
                    isApproved: userResponse.isApproved,
                    districtApproved: userResponse.districtApproved,
                    centralApproved: userResponse.centralApproved
                });

                res.json(userResponse);
            } else {
                console.log('❌ Invalid password for user:', email);
                console.log('Password provided:', password);
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (passwordError) {
            console.error('💥 Password verification error:', passwordError);
            res.status(500).json({ message: 'Authentication error' });
        }

    } catch (error) {
        console.error('💥 Login system error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Test endpoint to check if user exists
router.get('/check-user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        console.log('🔍 Checking user:', email);

        const user = await User.findOne({ email });
        if (user) {
            console.log('✅ User found:', {
                email: user.email,
                role: user.role,
                district: user.district,
                passwordHash: user.password ? `Exists (${user.password.length} chars)` : 'Missing'
            });
            res.json({
                exists: true,
                email: user.email,
                role: user.role,
                district: user.district,
                hasPassword: !!user.password
            });
        } else {
            console.log('❌ User not found:', email);
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('💥 Check user error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Test endpoint to create test user
router.post('/create-test-user', async (req, res) => {
    try {
        const { email, password, role, district } = req.body;
        console.log('🧪 Creating test user:', { email, role, district });

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('❌ Test user already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create test user
        const user = await User.create({
            email,
            password,
            role,
            district,
            name: 'Test User',
            isApproved: true,
            districtApproved: true,
            centralApproved: role === 'super_admin' ? true : false
        });

        console.log('✅ Test user created successfully:', user.email);
        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            district: user.district,
            isApproved: user.isApproved,
            districtApproved: user.districtApproved,
            centralApproved: user.centralApproved
        });
    } catch (error) {
        console.error('💥 Test user creation error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Test endpoint to list all users (for debugging)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).select('email role district isApproved districtApproved centralApproved');
        console.log('📋 Total users in database:', users.length);
        
        users.forEach(user => {
            console.log(`- ${user.email} (${user.role}) - District: ${user.district} - Approved: ${user.isApproved}`);
        });

        res.json(users);
    } catch (error) {
        console.error('💥 Users list error:', error);
        res.status(500).json({ message: error.message });
    }
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fencing_secret', {
        expiresIn: '30d',
    });
};

module.exports = router;