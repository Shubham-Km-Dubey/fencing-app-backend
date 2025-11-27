const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIDzXma-BhWFtk4QiDzv38jSLXQloqYu4",
  authDomain: "fencing-india-464c5.firebaseapp.com",
  projectId: "fencing-india-464c5",
  storageBucket: "fencing-india-464c5.firebasestorage.app",
  messagingSenderId: "376964814987",
  appId: "1:376964814987:web:caae8017b1aa8bb8a81c8e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage
const storage = getStorage(app);

console.log('✅ Firebase Storage initialized');

module.exports = { storage };