const express = require('express');
const auth = require('../middleware/auth');
// 👈 NEW: Import the centralized DAF ID utility
const { generateDAFId } = require('../utils/common'); 
const User = require('../models/User');
const District = require('../models/District');
const Fencer = require('../models/Fencer');
const Coach = require('../models/Coach');
const Referee = require('../models/Referee');
const School = require('../models/School');
const Club = require('../models/Club');
const router = express.Router();

console.log('Superadmin routes loaded');

// Strong random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

// ❌ REMOVED local generateDAFId function which is now in common.js

// ❌ REMOVED PUBLIC TEST route for production readiness

// DASHBOARD STATS
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });

    // Pending Central Approvals logic is now simplified to just check for unapproved users
    const [totalUsers, totalDistricts, totalApps] = await Promise.all([
      User.countDocuments({ role: { $ne: 'super_admin' } }),
      District.countDocuments(),
      User.countDocuments({ role: { $in: ['fencer', 'coach', 'referee', 'school', 'club'] } })
    ]);
    
    // Count users waiting for ANY approval
    const pendingApplications = await User.countDocuments({ 
        isApproved: false, 
        role: { $in: ['fencer', 'coach', 'referee', 'school', 'club'] } 
    });


    res.json({
      totalUsers,
      // Updated: This now shows total pending applications for all roles
      totalPendingApprovals: pendingApplications, 
      totalDistricts,
      totalApplications: totalApps,
      totalFencers: await Fencer.countDocuments(),
      totalCoaches: await Coach.countDocuments(),
      totalReferees: await Referee.countDocuments(),
      totalSchools: await School.countDocuments(),
      totalClubs: await Club.countDocuments(),
      totalRevenue: 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DISTRICTS (No major changes needed here)
router.get('/districts', auth, async (req, res) => {
    // ... (Keep existing code)
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });
    const districts = await District.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json(districts);
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/districts', auth, async (req, res) => {
    // ... (Keep existing code)
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });

    const { name, code, adminEmail, adminName, contactNumber = '', address = '' } = req.body;
    if (!name || !code || !adminEmail || !adminName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const exists = await District.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (exists) return res.status(400).json({ message: 'District name or code already exists' });

    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) return res.status(400).json({ message: 'Email already registered' });

    const password = generateRandomPassword();

    await User.create({
      email: adminEmail,
      password,
      role: 'district_admin',
      district: name,
      districtShortcode: code.toUpperCase(),
      name: adminName,
      phone: contactNumber,
      isApproved: true,
      districtApproved: true,
      centralApproved: true,
      profileCompleted: true
    });

    await District.create({
      name,
      code: code.toUpperCase(),
      adminEmail,
      adminName,
      contactNumber,
      address: address || `${name} District Office, Delhi`,
      createdBy: req.user.id
    });

    res.json({
      message: 'District & admin created',
      adminCredentials: { email: adminEmail, password, shortcode: code.toUpperCase() }
    });
  } catch (error) {
    console.error('Create district error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DISTRICT ADMIN MANAGEMENT (No changes needed here)
router.get('/district-admins', auth, async (req, res) => {
    // ... (Keep existing code)
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const districtAdmins = await User.find({ role: 'district_admin' })
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json(districtAdmins);
  } catch (error) {
    console.error('Get district admins error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/district-admins/:id/reset-password', auth, async (req, res) => {
    // ... (Keep existing code)
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });

    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'district_admin') return res.status(404).json({ message: 'Not found' });

    const newPass = generateRandomPassword();
    admin.password = newPass;
    await admin.save();

    res.json({ message: 'Password reset', newPassword: newPass });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/district-admins/:id', auth, async (req, res) => {
    // ... (Keep existing code)
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });

    const { name, email, phone, district } = req.body;
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'district_admin') return res.status(404).json({ message: 'Not found' });

    if (email && email !== admin.email && await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.phone = phone ?? admin.phone;
    if (district) admin.district = district;

    await admin.save();

    if (district) {
      await District.updateOne(
        { adminEmail: admin.email },
        { name: district, adminName: name || admin.name }
      );
    }

    res.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/district-admins/:id', auth, async (req, res) => {
    // ... (Keep existing code)
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });

    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'district_admin') return res.status(404).json({ message: 'Not found' });

    await District.deleteOne({ adminEmail: admin.email });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SUPER ADMIN APPLICATION MANAGEMENT (SINGLE-STEP APPROVAL) ====================

// Get all unapproved applications (Super Admin view)
router.get('/member-applications', auth, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find users who have NOT been approved yet (isApproved: false)
        const unapprovedUsers = await User.find({ 
            isApproved: false, 
            role: { $in: ['fencer', 'coach', 'referee', 'school', 'club'] } 
        })
        .select('email role district registrationDate name');

        res.json(unapprovedUsers);
    } catch (error) {
        console.error('Super Admin /member-applications error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// Approve user by ID (Super Admin action)
router.post('/approve-user/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const userId = req.params.userId;
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userType = user.role;

        // 1. Generate DAF ID
        const dafId = generateDAFId(userType);

        // 2. Find the associated specific application record
        let applicationModel = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[userType];

        let application = await applicationModel.findOne({ userId: userId });

        if (application) {
            // Update application status
            application.status = 'approved'; 
            await application.save();
        }

        // 3. Update User: Final Approval
        user.isApproved = true;
        user.centralApproved = true; // Mark central approval done
        user.dafId = dafId;
        user.rejectionReason = undefined;
        await user.save();

        res.json({ 
            message: `User ${user.email} approved by Super Admin.`,
            dafId
        });
    } catch (error) {
        console.error('Super Admin /approve-user error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject user by ID (Super Admin action)
router.post('/reject-user/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const userId = req.params.userId;
        const { reason } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userType = user.role;

        // Find the associated specific application record and reject it
        let applicationModel = { 
            'fencer': Fencer, 'coach': Coach, 'referee': Referee, 'school': School, 'club': Club 
        }[userType];

        let application = await applicationModel.findOne({ userId: userId });

        if (application) {
            application.status = 'rejected'; 
            await application.save();
        }

        // Update User: Reset all approval flags
        user.isApproved = false;
        user.districtApproved = false;
        user.centralApproved = false;
        user.dafId = undefined;
        user.rejectionReason = reason;
        await user.save();

        res.json({ message: `User ${user.email} rejected by Super Admin.` });
    } catch (error) {
        console.error('Super Admin /reject-user error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;