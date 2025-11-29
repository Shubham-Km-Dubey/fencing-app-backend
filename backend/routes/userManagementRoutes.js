const express = require('express');
const User = require('../models/User');
const Fencer = require('../models/Fencer');
const Coach = require('../models/Coach');
const Referee = require('../models/Referee');
const School = require('../models/School');
const Club = require('../models/Club');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all users (for super admin) - UPDATED WITH BETTER ERROR HANDLING
router.get('/', auth, async (req, res) => {
    try {
        console.log('🔍 Fetching all users for super admin...');
        const user = await User.findById(req.user.id);
        
        // Only super admin can access all users
        if (user.role !== 'super_admin') {
            console.log('❌ Access denied: User is not super admin');
            return res.status(403).json({ message: 'Access denied. Super admin only.' });
        }

        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${users.length} users`);
        res.json(users);
    } catch (error) {
        console.error('💥 Get users error:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});

// Get all users for admin dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if user is admin or super admin
    if (user.role !== 'district_admin' && user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let userFilter = {};
    
    // If district admin, only show users from their district
    if (user.role === 'district_admin') {
      userFilter.district = user.district;
    }

    // Get counts for dashboard
    const totalUsers = await User.countDocuments(userFilter);
    const fencers = await Fencer.countDocuments();
    const coaches = await Coach.countDocuments();
    const referees = await Referee.countDocuments();
    const schools = await School.countDocuments();
    const clubs = await Club.countDocuments();
    
    const pendingApprovals = await User.countDocuments({ 
      ...userFilter,
      districtApproved: false,
      isApproved: false 
    });

    // Get recent registrations based on user role
    let recentUsers = [];
    if (user.role === 'super_admin') {
      recentUsers = await User.find(userFilter)
        .select('email role district registrationDate name')
        .sort({ registrationDate: -1 })
        .limit(10);
    } else {
      recentUsers = await User.find(userFilter)
        .select('email role district registrationDate name')
        .sort({ registrationDate: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          fencers,
          coaches,
          referees,
          schools,
          clubs,
          pendingApprovals
        },
        recentRegistrations: recentUsers
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Get users by type
router.get('/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const user = await User.findById(req.user.id);
    
    let userFilter = {};
    
    // If district admin, only show users from their district
    if (user.role === 'district_admin') {
      userFilter.district = user.district;
    }

    let users;
    switch (type) {
      case 'fencers':
        users = await User.find({ ...userFilter, role: 'fencer' }).select('-password');
        break;
      case 'coaches':
        users = await User.find({ ...userFilter, role: 'coach' }).select('-password');
        break;
      case 'referees':
        users = await User.find({ ...userFilter, role: 'referee' }).select('-password');
        break;
      case 'schools':
        users = await User.find({ ...userFilter, role: 'school' }).select('-password');
        break;
      case 'clubs':
        users = await User.find({ ...userFilter, role: 'club' }).select('-password');
        break;
      case 'district_admins':
        if (user.role !== 'super_admin') {
          return res.status(403).json({ message: 'Access denied' });
        }
        users = await User.find({ role: 'district_admin' }).select('-password');
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid user type'
        });
    }

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

module.exports = router;