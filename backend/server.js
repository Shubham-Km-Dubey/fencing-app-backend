const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// In backend/server.js, add this with your other route imports:
app.use('/api/fencer', require('./routes/fencerRoutes'));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://Shubham:%23-Xc4RVVM7VUk8Q@cluster0.vtjyioo.mongodb.net/fencing_association?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// Initialize default admins - FIXED VERSION
const initializeDefaultAdmins = async () => {
    const User = require('./models/User');
    const District = require('./models/District');
    
    console.log('🔄 Initializing default admin accounts...');

    // SUPER ADMIN - FIXED
    try {
        let superAdmin = await User.findOne({ email: 'superadmin@daf.com' });
        if (!superAdmin) {
            console.log('🔧 Creating Super Admin...');
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
            console.log('✅ Super Admin created: superadmin@daf.com');
        } else {
            console.log('✅ Super Admin already exists: superadmin@daf.com');
            // Ensure password is correct
            superAdmin.password = 'superadmin123';
            await superAdmin.save();
            console.log('✅ Super Admin password updated');
        }

        // Verify super admin password
        const passwordValid = await superAdmin.matchPassword('superadmin123');
        console.log('🔐 Super Admin password test:', passwordValid ? '✅ VALID' : '❌ INVALID');
    } catch (error) {
        console.error('❌ Super Admin creation failed:', error.message);
    }

    // DISTRICT ADMINS
    const districtAdmins = [
        {
            email: 'northeast@daf.com',
            password: 'admin123',
            role: 'district_admin',
            district: 'North East',
            name: 'North East District Admin'
        },
        {
            email: 'northwest@daf.com',
            password: 'admin123',
            role: 'district_admin',
            district: 'North West', 
            name: 'North West District Admin'
        }
    ];

    for (const adminData of districtAdmins) {
        try {
            let admin = await User.findOne({ email: adminData.email });
            if (!admin) {
                admin = new User({
                    ...adminData,
                    isApproved: true,
                    districtApproved: true
                });
                await admin.save();
                console.log(`✅ District Admin created: ${adminData.email}`);
            } else {
                console.log(`✅ District Admin exists: ${adminData.email}`);
                // Ensure password is correct
                admin.password = adminData.password;
                admin.isApproved = true;
                admin.districtApproved = true;
                await admin.save();
                console.log(`✅ District Admin updated: ${adminData.email}`);
            }

            // Create district record if it doesn't exist
            let district = await District.findOne({ name: adminData.district });
            if (!district) {
                district = new District({
                    name: adminData.district,
                    code: adminData.district.toUpperCase().replace(' ', '_'),
                    adminEmail: adminData.email,
                    adminName: adminData.name,
                    contactNumber: '9876543210',
                    address: `${adminData.district} District Office, Delhi`,
                    createdBy: admin._id
                });
                await district.save();
                console.log(`✅ District created: ${adminData.district}`);
            } else {
                console.log(`✅ District exists: ${adminData.district}`);
            }

            // Verify district admin password
            const passwordValid = await admin.matchPassword(adminData.password);
            console.log(`🔐 ${adminData.district} Admin password test:`, passwordValid ? '✅ VALID' : '❌ INVALID');

        } catch (error) {
            console.error(`❌ District Admin ${adminData.email} failed:`, error.message);
        }
    }

    console.log('🎉 Admin initialization completed!');
    
    // Final verification
    try {
        const totalAdmins = await User.countDocuments({ 
            role: { $in: ['super_admin', 'district_admin'] } 
        });
        console.log(`📊 Total admin accounts: ${totalAdmins}`);
        
        const superAdminCheck = await User.findOne({ email: 'superadmin@daf.com' });
        console.log(`👑 Super Admin status: ${superAdminCheck ? 'EXISTS' : 'MISSING'}`);
    } catch (error) {
        console.error('❌ Final verification failed:', error.message);
    }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
// Import routes
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/register', require('./routes/registrationRoutes')); // Add this line
// Add your other routes here...

// Temporarily comment out superadmin route until file is created
// app.use('/api/superadmin', require('./routes/superadmin'));
console.log('⚠️ Super Admin routes temporarily disabled - file not found');

// Test route to check server status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        superAdminRoute: 'Temporarily disabled'
    });
});
// Test route to check server status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Test route to check admin accounts
app.get('/api/debug/admins', async (req, res) => {
    try {
        const User = require('./models/User');
        const admins = await User.find({ 
            role: { $in: ['super_admin', 'district_admin'] } 
        }).select('email role district isApproved districtApproved centralApproved');
        
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;

// Start server after MongoDB connection is established
mongoose.connection.once('open', () => {
    console.log('🚀 Starting server initialization...');
    
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        
        // Initialize admins after server starts
        setTimeout(() => {
            initializeDefaultAdmins();
        }, 1000);
    });
});

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

// Handle server errors
app.on('error', (err) => {
    console.error('❌ Server error:', err);
});

module.exports = app;
