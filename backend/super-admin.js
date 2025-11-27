const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://Shubham:%23-Xc4RVVM7VUk8Q@cluster0.vtjyioo.mongodb.net/fencing_association?retryWrites=true&w=majority';

async function createSuperAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Check if super admin already exists
        let superAdmin = await User.findOne({ email: 'superadmin@daf.com' });
        
        if (superAdmin) {
            console.log('✅ Super Admin already exists');
            // Update password to be sure
            superAdmin.password = 'superadmin123';
            await superAdmin.save();
            console.log('✅ Super Admin password updated');
        } else {
            // Create new super admin
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
            console.log('✅ Super Admin created successfully!');
        }

        // Verify the account
        const verified = await superAdmin.matchPassword('superadmin123');
        console.log('🔐 Password verification:', verified ? '✅ SUCCESS' : '❌ FAILED');

        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createSuperAdmin();