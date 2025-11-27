const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://Shubham:%23-Xc4RVVM7VUk8Q@cluster0.vtjyioo.mongodb.net/fencing_association?retryWrites=true&w=majority';

async function testAccounts() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Test super admin
        const superAdmin = await User.findOne({ email: 'superadmin@daf.com' });
        console.log('\n🔍 Super Admin Check:');
        console.log('Exists:', !!superAdmin);
        if (superAdmin) {
            console.log('Role:', superAdmin.role);
            console.log('Password set:', !!superAdmin.password);
            
            // Test password
            const valid = await superAdmin.matchPassword('superadmin123');
            console.log('Password "superadmin123" valid:', valid);
        }

        // Test district admins
        console.log('\n🔍 District Admins Check:');
        const districtAdmins = await User.find({ role: 'district_admin' });
        districtAdmins.forEach(admin => {
            console.log(`- ${admin.email}: ${admin.district}`);
        });

        // Test password for northeast
        const neAdmin = await User.findOne({ email: 'northeast@daf.com' });
        if (neAdmin) {
            const valid = await neAdmin.matchPassword('admin123');
            console.log('NE Admin password "admin123" valid:', valid);
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAccounts();