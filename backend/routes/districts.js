// backend/routes/districts.js
const express = require('express');
const router = express.Router();
const District = require('../models/District');

// PUBLIC: Get all districts for registration dropdown
router.get('/public', async (req, res) => {
  try {
    const districts = await District.find()
      .select('name code')  // Only send name and shortcode
      .sort({ name: 1 });

    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;