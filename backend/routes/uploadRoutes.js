const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Upload route is working!',
    timestamp: new Date().toISOString()
  });
});

// File upload endpoint
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const fileData = {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      message: 'File received successfully (Firebase Storage integration needed)'
    };

    res.json({
      success: true,
      message: 'File uploaded successfully!',
      data: fileData
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;