const express = require('express');
const Fencer = require('../models/Fencer');
const User = require('../models/User');
const District = require('../models/District');
const router = express.Router();

// Fencer registration endpoint - UPDATED WITH DISTRICT ASSOCIATION
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      middleName,
      lastName,
      aadharNumber,
      fathersName,
      mothersName,
      mobileNumber,
      dateOfBirth,
      permanentAddress,
      presentAddress,
      highestAchievement,
      coachName,
      trainingCenter,
      selectedDistrict,
      documents
    } = req.body;

    console.log('Fencer registration request:', {
      email,
      firstName,
      lastName,
      selectedDistrict
    });

    // Basic validation
    if (!email || !password || !firstName || !lastName || !aadharNumber || !selectedDistrict) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing: email, password, firstName, lastName, aadharNumber, selectedDistrict'
      });
    }

    // Validate district exists and get shortcode
    const district = await District.findOne({ name: selectedDistrict, isActive: true });
    if (!district) {
      return res.status(400).json({
        success: false,
        error: 'Selected district is not valid'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Check if fencer with same Aadhar already exists
    const existingFencer = await Fencer.findOne({ aadharNumber });
    if (existingFencer) {
      return res.status(400).json({
        success: false,
        error: 'Fencer with this Aadhar number already exists'
      });
    }

    // Validate required documents
    const requiredDocs = ['passportPhoto', 'aadharFront', 'aadharBack', 'birthCertificate'];
    const missingDocs = requiredDocs.filter(doc => !documents || !documents[doc]);

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required documents: ${missingDocs.join(', ')}`
      });
    }

    // Create user account first
    const user = new User({
      email,
      password,
      role: 'fencer',
      district: selectedDistrict,
      districtShortcode: district.code,
      name: `${firstName} ${lastName}`.trim(),
      phone: mobileNumber || '',
      isApproved: false,
      districtApproved: false,
      centralApproved: false
    });

    await user.save();

    // Create fencer profile
    const fencer = new Fencer({
      userId: user._id,
      firstName,
      middleName: middleName || '',
      lastName,
      aadharNumber,
      fathersName: fathersName || '',
      mothersName: mothersName || '',
      mobileNumber: mobileNumber || '',
      dateOfBirth: dateOfBirth || '',
      permanentAddress: permanentAddress || {},
      presentAddress: presentAddress || {},
      highestAchievement: highestAchievement || '',
      coachName: coachName || '',
      trainingCenter: trainingCenter || '',
      selectedDistrict: selectedDistrict,
      districtShortcode: district.code,
      documents: documents || {},
      status: 'pending',
      paymentStatus: 'completed'
    });

    await fencer.save();

    console.log('Fencer registration completed:', {
      email: user.email,
      district: user.district,
      districtShortcode: user.districtShortcode,
      fencerId: fencer._id
    });

    res.status(201).json({
      success: true,
      message: 'Fencer registration submitted successfully! Awaiting district approval.',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          district: user.district,
          districtShortcode: user.districtShortcode
        },
        fencer: {
          _id: fencer._id,
          firstName: fencer.firstName,
          lastName: fencer.lastName,
          status: fencer.status
        }
      }
    });

  } catch (error) {
    console.error('Fencer registration error:', error);
    
    // Clean up: if user was created but fencer failed, delete the user
    if (req.body.email) {
      await User.findOneAndDelete({ email: req.body.email });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

// Get fencers by district (for district admin)
router.get('/district/:district', async (req, res) => {
  try {
    const { district } = req.params;
    const fencers = await Fencer.find({ selectedDistrict: district })
      .populate('userId', 'email name districtApproved centralApproved isApproved')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: fencers
    });
  } catch (error) {
    console.error('Get fencers by district error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fencers'
    });
  }
});

// Get all fencers (for super admin)
router.get('/', async (req, res) => {
  try {
    const fencers = await Fencer.find()
      .populate('userId', 'email name district districtApproved centralApproved isApproved')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: fencers
    });
  } catch (error) {
    console.error('Get all fencers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fencers'
    });
  }
});

module.exports = router;