const express = require('express');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Registration route is working!',
    timestamp: new Date().toISOString()
  });
});

// User registration endpoint
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, district, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // TODO: Add your actual registration logic here
    const userData = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      phone: phone || '',
      district: district || '',
      role: role || 'user',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userData
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

module.exports = router;