const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// NEW: Public fee route (used by Home page)
app.use('/api/fees', require('./routes/fees'));

// ==================== TEST ROUTE ====================
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Server running', 
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ==================== INITIALIZE DEFAULT DATA ====================
const initializeDefaultData = async () => {
  try {
    const User = require('./models/User');
    const District = require('./models/District');
    const RegistrationFee = require('./models/RegistrationFee');

    // 1. Super Admin
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
      console.log('Super Admin created');
    }

    // 2. Default District Admins + Districts
    const defaults = [
      { email: 'northeast@daf.com', name: 'North East District Admin', district: 'North East' },
      { email: 'northwest@daf.com', name: 'North West District Admin', district: 'North West' }
    ];

    for (const d of defaults) {
      let admin = await User.findOne({ email: d.email });
      if (!admin) {
        admin = new User({
          email: d.email,
          password: 'admin123',
          role: 'district_admin',
          district: d.district,
          name: d.name,
          isApproved: true,
          districtApproved: true,
          centralApproved: true
        });
        await admin.save();

        await District.findOneAndUpdate(
          { name: d.district },
          {
            name: d.district,
            code: d.district.toUpperCase().replace(' ', '_'),
            adminEmail: d.email,
            adminName: d.name,
            contactNumber: '9876543210',
            address: `${d.district} District Office, Delhi`,
            createdBy: admin._id
          },
          { upsert: true }
        );
        console.log(`Created district admin: ${d.email}`);
      }
    }

    // 3. Default Registration Fees (only if not exist)
    const defaultFees = [
      { userType: 'fencer', amount: 500 },
      { userType: 'coach', amount: 1000 },
      { userType: 'referee', amount: 800 },
      { userType: 'school', amount: 2000 },
      { userType: 'club', amount: 3000 }
    ];

    for (const f of defaultFees) {
      await RegistrationFee.findOneAndUpdate(
        { userType: f.userType },
        { 
          amount: f.amount, 
          updatedBy: superAdmin._id,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }
    console.log('Default registration fees initialized');

    console.log('All default data ready!');

  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Initialize everything after 1.5 seconds
  setTimeout(initializeDefaultData, 1500);
  });
});