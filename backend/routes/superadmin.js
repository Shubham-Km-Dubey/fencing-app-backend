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

// Create new district
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
            return res.status(400).json({ message: 'District already exists' });
        }

        // Check if admin email already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin email already registered' });
        }

        // Create district admin user
        const adminPassword = generateRandomPassword();
        const districtAdmin = new User({
            email: adminEmail,
            password: adminPassword,
            role: 'district_admin',
            district: name,
            name: adminName,
            isApproved: true,
            districtApproved: true
        });
        await districtAdmin.save();

        // Create district
        const district = new District({
            name,
            code,
            adminEmail,
            adminName,
            contactNumber,
            address,
            createdBy: user._id
        });
        await district.save();

        res.json({
            district,
            adminCredentials: {
                email: adminEmail,
                password: adminPassword
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
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

        // Generate DAF ID
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
    return Math.random().toString(36).slice(-8);
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