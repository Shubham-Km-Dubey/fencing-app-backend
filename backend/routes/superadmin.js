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

console.log('Superadmin routes loaded');

// Strong random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 12; i++) {  // ← This line was wrong before, now fixed
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

const generateDAFId = (type) => {
  const prefix = {
    fencer: 'DAF-F',
    coach: 'DAF-C',
    referee: 'DAF-R',
    school: 'DAF-S',
    club: 'DAF-CL'
  }[type];

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNum}${Date.now().toString().slice(-4)}`;
};

// PUBLIC TEST
router.get('/test-public', (req, res) => {
  res.json({ message: 'Super Admin routes working!', time: new Date().toISOString() });
});

// DASHBOARD STATS
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Access denied' });

    const [totalUsers, pendingCentral, totalDistricts, totalApps] = await Promise.all([
      User.countDocuments({ role: { $ne: 'super_admin' } }),
      User.countDocuments({ districtApproved: true, centralApproved: false, isApproved: false }),
      District.countDocuments(),
      User.countDocuments({ role: { $in: ['fencer', 'coach', 'referee', 'school', 'club'] } })
    ]);

    res.json({
      totalUsers,
      pendingCentralApprovals: pendingCentral,
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

// DISTRICTS
router.get('/districts', auth, async (req, res) => {
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

// DISTRICT ADMIN MANAGEMENT — FINAL WORKING
router.get('/district-admins', auth, async (req, res) => {
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

module.exports = router;