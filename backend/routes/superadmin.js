const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const District = require('../models/District');
const Fencer = require('../models/Fencer');
const Coach = require('../models/Coach');
const Referee = require('../models/Referee');
const School = require('../models/School');
const Club = require('../models/Club');
const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const totalUsers = await User.countDocuments({ role: { $ne: 'super_admin' } });
        const pendingCentralApprovals = await User.countDocuments({ 
            districtApproved: true, 
            centralApproved: false,
            isApproved: false 
        });
        const totalDistricts = await District.countDocuments();
        const totalApplications = await User.countDocuments({ 
            role: { $in: ['fencer', 'coach', 'referee', 'school', 'club'] } 
        });

        res.json({
            totalUsers,
            pendingCentralApprovals,
            totalDistricts,
            totalApplications
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all districts
router.get('/districts', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const districts = await District.find().populate('createdBy', 'email name');
        res.json(districts);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Create new district + district admin with shortcode
router.post('/districts', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { name, code, adminEmail, adminName, contactNumber, address } = req.body;

        // Check if district already exists
        const existingDistrict = await District.findOne({ 
            $or: [{ name }, { code }] 
        });
        if (existingDistrict) {
            return res.status(400).json({ message: 'District with this name or code already exists' });
        }

        // Check if admin email already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin email already registered' });
        }

        // Generate random password
        const adminPassword = generateRandomPassword();

        // Create district admin user with shortcode
        const districtAdmin = new User({
            email: adminEmail,
            password: adminPassword,
            role: 'district_admin',
            district: name,
            districtShortcode: code.toUpperCase(),   // Saves NWD, SED, CD, etc.
            name: adminName,
            phone: contactNumber || '',
            isApproved: true,
            districtApproved: true,
            centralApproved: true,
            profileCompleted: true
        });
        await districtAdmin.save();

        // Create district document
        const district = new District({
            name,
            code: code.toUpperCase(),
            adminEmail,
            adminName,
            contactNumber,
            address,
            createdBy: user._id
        });
        await district.save();

        res.json({
            message: 'District and admin created successfully',
            district,
            adminCredentials: {
                email: adminEmail,
                password: adminPassword,
                shortcode: code.toUpperCase()
            }
        });
    } catch (error) {
        console.error('Create district error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get pending central approvals
router.get('/pending-approvals', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const pendingUsers = await User.find({ 
            districtApproved: true, 
            centralApproved: false,
            isApproved: false 
        }).select('email role district registrationDate');

        const pendingApplications = [];

        for (const user of pendingUsers) {
            let profile = null;
            switch (user.role) {
                case 'fencer':
                    profile = await Fencer.findOne({ userId: user._id });
                    break;
                case 'coach':
                    profile = await Coach.findOne({ userId: user._id });
                    break;
                case 'referee':
                    profile = await Referee.findOne({ userId: user._id });
                    break;
                case 'school':
                    profile = await School.findOne({ userId: user._id });
                    break;
                case 'club':
                    profile = await Club.findOne({ userId: user._id });
                    break;
            }

            if (profile) {
                pendingApplications.push({
                    userId: user._id,
                    email: user.email,
                    role: user.role,
                    district: user.district,
                    registrationDate: user.registrationDate,
                    profile: profile
                });
            }
        }

        res.json(pendingApplications);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Approve user centrally
router.post('/approve/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { userId } = req.params;

        const userToApprove = await User.findById(userId);
        if (!userToApprove) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!userToApprove.districtApproved) {
            return res.status(400).json({ message: 'User not approved by district' });
        }

        const dafId = generateDAFId(userToApprove.role);

        userToApprove.centralApproved = true;
        userToApprove.isApproved = true;
        userToApprove.dafId = dafId;
        await userToApprove.save();

        res.json({ 
            message: 'User approved successfully', 
            dafId 
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Reject user centrally
router.post('/reject/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { userId } = req.params;
        const { reason } = req.body;

        const userToReject = await User.findById(userId);
        if (!userToReject) {
            return res.status(404).json({ message: 'User not found' });
        }

        userToReject.centralApproved = false;
        userToReject.isApproved = false;
        userToReject.rejectionReason = reason;
        await userToReject.save();

        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Helper functions
const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + 'A1!';
};

const generateDAFId = (type) => {
    const prefix = {
        'fencer': 'DAF-F',
        'coach': 'DAF-C',
        'referee': 'DAF-R',
        'school': 'DAF-S',
        'club': 'DAF-CL'
    }[type];
    
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}${Date.now().toString().slice(-4)}`;
};

module.exports = router;