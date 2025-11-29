const express = require('express');
const auth = require('../middleware/auth');
const RegistrationFee = require('../models/RegistrationFee');
const User = require('../models/User');
const router = express.Router();

// Get all registration fees (public route - used by home page)
router.get('/', async (req, res) => {
  try {
    const fees = await RegistrationFee.find().sort({ userType: 1 });
    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration fees'
    });
  }
});

// Get fee by user type (public route - used by registration forms)
router.get('/:userType', async (req, res) => {
  try {
    const { userType } = req.params;
    const fee = await RegistrationFee.findOne({ userType });
    
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Registration fee not found for this user type'
      });
    }

    res.json({
      success: true,
      data: fee
    });
  } catch (error) {
    console.error('Get fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration fee'
    });
  }
});

// Update registration fee (super admin only)
router.put('/:userType', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { userType } = req.params;
    const { amount } = req.body;

    if (!amount || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const fee = await RegistrationFee.findOneAndUpdate(
      { userType },
      { 
        amount,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Registration fee updated successfully',
      data: fee
    });
  } catch (error) {
    console.error('Update fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update registration fee'
    });
  }
});

// Get all fees for admin management (super admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const fees = await RegistrationFee.find()
      .sort({ userType: 1 })
      .populate('updatedBy', 'name email');

    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    console.error('Get admin fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration fees'
    });
  }
});

module.exports = router;