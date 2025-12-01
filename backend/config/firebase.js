const admin = require('firebase-admin');
const path = require('path');

let bucket;

try {
  // Try to initialize from environment variables first
  const firebaseConfig = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "fencing-india-464c5",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY ? 
      process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: "googleapis.com"
  };

  if (firebaseConfig.private_key && firebaseConfig.client_email) {
    // Initialize from environment variables
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'fencing-india-464c5.firebasestorage.app'
    });
    console.log('✅ Firebase Admin initialized from environment variables');
  } else {
    // Try to load from file (for local development)
    const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'fencing-india-464c5.firebasestorage.app'
    });
    console.log('✅ Firebase Admin initialized from local file');
  }

  bucket = admin.storage().bucket();
  console.log('📦 Using bucket:', bucket.name);

} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  console.log('⚠️ Uploads will be disabled. Firebase not initialized.');
  bucket = null;
}

module.exports = { admin: admin, bucket: bucket };