const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',  // Add this for local development
    'https://fencing-india-464c5.firebaseapp.com',
    'https://fencing-india-464c5.web.app'
  ],
  credentials: true
}));

// Add body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://Shubham:%23-Xc4RVVM7VUk8Q@cluster0.vtjyioo.mongodb.net/fencing_association?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.log('MongoDB Connection Error:', err));

// ==================== ALL ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/register', require('./routes/registrationRoutes'));
app.use('/api/fencer', require('./routes/fencerRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/user-management', require('./routes/userManagementRoutes'));
app.use('/api/districts', require('./routes/districts'));
app.use('/api/fees', require('./routes/fees'));

// ==================== TEST ROUTE ====================
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Server running', 
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ==================== MINIMAL DEFAULT DATA ====================
const initializeDefaultData = async () => {
  try {
    const User = require('./models/User');
    const RegistrationFee = require('./models/RegistrationFee');

    // 1. Super Admin ONLY - Create ONLY if doesn't exist
    let superAdmin = await User.findOne({ email: 'superadmin@daf.com' });
    if (!superAdmin) {
      superAdmin = new User({
        email: 'superadmin@daf.com',
        password: 'superadmin123',
        role: 'super_admin',
        name: 'Super Administrator',
        isApproved: true,
        districtApproved: true,
        centralApproved: true
      });
      await superAdmin.save();
      console.log('✅ Super Admin created (first time only)');
    } else {
      console.log('✅ Super Admin already exists');
    }

    // 2. NO District Admins - Must be created through dashboard
    console.log('ℹ️  District admins must be created through Super Admin dashboard');

    // 3. Check if ANY fees exist - Create only if NO fees exist at all
    const existingFeesCount = await RegistrationFee.countDocuments();
    
    if (existingFeesCount === 0) {
      console.log('⚠️  No registration fees found. Creating minimal default fees...');
      
      // Create ONLY basic fees if database is completely empty
      const defaultFees = [
        { userType: 'fencer', amount: 500 },
        { userType: 'coach', amount: 1000 },
        { userType: 'referee', amount: 800 },
        { userType: 'school', amount: 2000 },
        { userType: 'club', amount: 3000 }
      ];

      for (const f of defaultFees) {
        await RegistrationFee.create({
          userType: f.userType,
          amount: f.amount, 
          updatedBy: superAdmin._id,
          updatedAt: new Date()
        });
        console.log(`✅ Created initial fee for ${f.userType}: ₹${f.amount}`);
      }
      console.log('✅ Initial fees created (database was empty)');
    } else {
      console.log(`✅ ${existingFeesCount} fee records already exist. No changes made.`);
      console.log('ℹ️  Fees must be managed through Super Admin dashboard');
    }

    console.log('✅ Default data initialization complete');

  } catch (error) {
    console.error('❌ Error initializing default data:', error);
  }
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('🔄 Checking for required default data...');
    // Initialize minimal data after 1.5 seconds
    setTimeout(initializeDefaultData, 1500);
  });
});