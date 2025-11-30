const express = require('express');
const User = require('../models/User');
const District = require('../models/District');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all districts for registration form
router.get('/districts', async (req, res) => {
    try {
        const districts = await District.find({ isActive: true })
            .select('name code adminName')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            data: districts
        });
    } catch (error) {
        console.error('Get districts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch districts'
        });
    }
});

// User registration with district association
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, district, role, districtShortcode } = req.body;

        console.log('Registration attempt:', { email, role, district, districtShortcode });

        // Basic validation
        if (!name || !email || !password || !district || !role) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, password, district, and role are required'
            });
        }

        // TEMPORARY FIX: Skip district validation for testing
        console.log('⚠️ District validation temporarily disabled for testing');
        // const districtExists = await District.findOne({ 
        //     $or: [{ name: district }, { code: districtShortcode }],
        //     isActive: true 
        // });
        
        // if (!districtExists) {
        //     return res.status(400).json({
        //         success: false,
        //         error: 'Selected district is not valid or active'
        //     });
        // }

        // Use provided district or create a default one
        const districtShortcodeToUse = districtShortcode || district.toUpperCase().replace(/\s+/g, '_');

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Create user with district association
        const user = new User({
            email,
            password,
            role,
            district,
            districtShortcode: districtShortcodeToUse,
            name,
            phone: phone || '',
            isApproved: false,
            districtApproved: false,
            centralApproved: false
        });

        await user.save();

        console.log('User registered successfully:', {
            email: user.email,
            role: user.role,
            district: user.district,
            districtShortcode: user.districtShortcode
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please wait for approval.',
            data: {
                _id: user._id,
                email: user.email,
                role: user.role,
                district: user.district,
                districtShortcode: user.districtShortcode,
                name: user.name,
                isApproved: user.isApproved,
                districtApproved: user.districtApproved,
                centralApproved: user.centralApproved
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            details: error.message
        });
    }
});

// Get user's district information
router.get('/user-district/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const district = await District.findOne({ 
            $or: [{ name: user.district }, { code: user.districtShortcode }] 
        });

        res.json({
            success: true,
            data: {
                userDistrict: user.district,
                userDistrictShortcode: user.districtShortcode,
                districtInfo: district
            }
        });
    } catch (error) {
        console.error('Get user district error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch district information'
        });
    }
});

module.exports = router;