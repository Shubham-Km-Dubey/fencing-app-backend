const express = require('express');
const multer = require('multer');
const { bucket } = require('../config/firebase');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
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

// Single file upload to Firebase Storage
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Upload request received:', req.file?.originalname);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `uploads/${timestamp}_${randomString}_${sanitizedOriginalName}`;

    console.log('📁 Uploading to Firebase Storage:', fileName);

    // Create a file reference in the bucket
    const file = bucket.file(fileName);
    
    // Create a write stream to upload the file
    const blobStream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: false
    });

    // Handle stream events
    blobStream.on('error', (error) => {
      console.error('❌ Upload stream error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Upload failed', 
        details: error.message 
      });
    });

    blobStream.on('finish', async () => {
      try {
        // With Uniform Bucket-Level Access, we can't use makePublic()
        // Instead, we can generate a public URL directly
        // Firebase Storage files are accessible via this pattern:
        // https://firebasestorage.googleapis.com/v0/b/{bucket-name}/o/{file-path}?alt=media
        
        // Encode the file path for URL
        const encodedPath = encodeURIComponent(fileName).replace(/%2F/g, '/');
        
        // Generate public URL (alternative method)
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
        
        // Or use the standard Google Cloud Storage URL
        const gcsUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        
        console.log('✅ File uploaded successfully:', {
          originalName: req.file.originalname,
          publicUrl: publicUrl,
          gcsUrl: gcsUrl,
          size: req.file.size
        });

        // File data to return
        const fileData = {
          originalName: req.file.originalname,
          fileName: fileName,
          downloadURL: publicUrl, // Use Firebase public URL
          gcsUrl: gcsUrl, // Alternative URL
          contentType: req.file.mimetype,
          size: req.file.size,
          uploadedAt: new Date().toISOString(),
          storagePath: file.name
        };

        res.status(200).json({
          success: true,
          message: 'File uploaded successfully!',
          data: fileData
        });

      } catch (error) {
        console.error('❌ Error finalizing upload:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to finalize upload', 
          details: error.message 
        });
      }
    });

    // Start the upload
    blobStream.end(req.file.buffer);

  } catch (error) {
    console.error('💥 Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'File upload failed',
      details: error.message 
    });
  }
});

module.exports = router;