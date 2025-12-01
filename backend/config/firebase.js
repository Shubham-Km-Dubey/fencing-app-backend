const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'fencing-india-464c5.firebasestorage.app' // ← This is correct!
});

// Get Firebase Storage bucket
const bucket = admin.storage().bucket();

console.log('✅ Firebase Admin initialized successfully');
console.log('📦 Using bucket:', bucket.name); // Should show the correct bucket

module.exports = { admin, bucket };