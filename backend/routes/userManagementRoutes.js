const express = require('express');
const router = express.Router();

// Get all users for admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const User = require('../models/User');
    const Fencer = require('../models/Fencer');
    const Coach = require('../models/Coach');
    const Admin = require('../models/Admin');

    // Get counts for dashboard
    const totalUsers = await User.countDocuments();
    const fencers = await Fencer.countDocuments();
    const coaches = await Coach.countDocuments();
    const admins = await Admin.countDocuments();
    const pendingApprovals = await Fencer.countDocuments({ status: 'pending' }) + 
                            await Coach.countDocuments({ status: 'pending' });

    // Get recent registrations
    const recentFencers = await Fencer.find().sort({ registrationDate: -1 }).limit(5);
    const recentCoaches = await Coach.find().sort({ registrationDate: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          fencers,
          coaches,
          admins,
          pendingApprovals
        },
        recentRegistrations: {
          fencers: recentFencers,
          coaches: recentCoaches
        }
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
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    let users;
    switch (type) {
      case 'fencers':
        users = await Fencer.find().populate('userId');
        break;
      case 'coaches':
        users = await Coach.find().populate('userId');
        break;
      case 'admins':
        users = await Admin.find().populate('userId');
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