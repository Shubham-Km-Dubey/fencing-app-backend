const express = require('express');
const multer = require('multer');
const { storage } = require('../config/firebase');
const { ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and documents
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype.includes('document') ||
      file.mimetype.includes('sheet')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
    }
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Upload route is working!',
    storage: 'Firebase Storage Ready',
    timestamp: new Date().toISOString()
  });
});

// Single file upload to Firebase Storage
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received:', req.file?.originalname);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `uploads/${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

    console.log('Uploading to Firebase Storage:', fileName);

    // Create storage reference
    const storageRef = ref(storage, fileName);

    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, req.file.buffer, {
      contentType: req.file.mimetype,
    });

    console.log('File uploaded to Firebase, getting download URL...');

    // Get public download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // File data to save to MongoDB (if needed)
    const fileData = {
      originalName: req.file.originalname,
      fileName: fileName,
      downloadURL: downloadURL,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      storagePath: snapshot.ref.fullPath
    };

    console.log('✅ File uploaded successfully:', fileData.originalName);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully to Firebase Storage!',
      data: fileData
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'File upload failed',
      details: error.message 
    });
  }
});

module.exports = router;