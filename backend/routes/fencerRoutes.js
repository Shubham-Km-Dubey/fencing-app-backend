const express = require('express');
const router = express.Router();

// Fencer registration endpoint
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
      documents,
      userId
    } = req.body;

    console.log('Fencer registration request received:', {
      email,
      firstName,
      lastName,
      selectedDistrict
    });

    // Basic validation
    if (!email || !password || !firstName || !lastName || !aadharNumber) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing: email, password, firstName, lastName, aadharNumber'
      });
    }

    // Validate required documents
    const requiredDocs = ['passportPhoto', 'aadharFront', 'aadharBack', 'birthCertificate'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc]);

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required documents: ${missingDocs.join(', ')}`
      });
    }

    // TODO: Add your actual registration logic here
    // 1. Check if fencer already exists with email or aadhar
    // 2. Hash password
    // 3. Save fencer to MongoDB
    // 4. Send confirmation email (optional)

    const fencerData = {
      id: Math.random().toString(36).substr(2, 9),
      email,
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
      selectedDistrict: selectedDistrict || '',
      documents: documents || {},
      status: 'pending', // pending, approved, rejected
      registrationDate: new Date().toISOString(),
      userId: userId || null
    };

    console.log('Fencer registration successful:', fencerData.email);

    res.status(201).json({
      success: true,
      message: 'Fencer registration submitted successfully!',
      data: fencerData
    });

  } catch (error) {
    console.error('Fencer registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Fencer routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;