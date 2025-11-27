const mongoose = require('mongoose');
require('dotenv').config();

// Import your user models (adjust paths as needed)
const User = require('../models/User');
const Fencer = require('../models/Fencer');
const Coach = require('../models/Coach');
const Admin = require('../models/Admin');

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test users (optional)
    await User.deleteMany({ email: { $in: [
      'fencer@test.com',
      'coach@test.com', 
      'admin@test.com',
      'superadmin@test.com'
    ]}});
    console.log('🧹 Cleared existing test users');

    // 1. Create Fencer User
    const fencerUser = new User({
      email: 'fencer@test.com',
      password: 'fencer123',
      role: 'fencer',
      isApproved: true,
      profileCompleted: true,
      createdAt: new Date()
    });
    await fencerUser.save();
    console.log('✅ Fencer user created:', fencerUser.email);

    // Create Fencer Profile
    const fencerProfile = new Fencer({
      userId: fencerUser._id,
      firstName: 'Test',
      lastName: 'Fencer',
      email: 'fencer@test.com',
      aadharNumber: '123456789012',
      mobileNumber: '9876543210',
      dateOfBirth: '2000-01-01',
      permanentAddress: {
        addressLine1: '123 Fencing Street',
        state: 'Delhi',
        district: 'North East',
        pinCode: '110001'
      },
      selectedDistrict: 'North East',
      documents: {
        passportPhoto: 'https://example.com/photo1.jpg',
        aadharFront: 'https://example.com/aadhar1.jpg',
        aadharBack: 'https://example.com/aadhar2.jpg',
        birthCertificate: 'https://example.com/certificate1.pdf'
      },
      status: 'approved',
      registrationDate: new Date(),
      approvedAt: new Date(),
      approvedBy: 'system'
    });
    await fencerProfile.save();
    console.log('✅ Fencer profile created');

    // 2. Create Coach User
    const coachUser = new User({
      email: 'coach@test.com',
      password: 'coach123',
      role: 'coach',
      isApproved: true,
      profileCompleted: true,
      createdAt: new Date()
    });
    await coachUser.save();
    console.log('✅ Coach user created:', coachUser.email);

    // Create Coach Profile
    const coachProfile = new Coach({
      userId: coachUser._id,
      firstName: 'Test',
      lastName: 'Coach',
      email: 'coach@test.com',
      aadharNumber: '123456789013',
      mobileNumber: '9876543211',
      dateOfBirth: '1985-01-01',
      qualifications: ['Level 2 Fencing Coach', 'Sports Authority Certified'],
      experience: '10 years',
      specialization: 'Foil and Epee',
      trainingCenters: ['Delhi Fencing Academy', 'Sports Complex'],
      studentsTrained: 50,
      documents: {
        passportPhoto: 'https://example.com/photo2.jpg',
        aadharFront: 'https://example.com/aadhar3.jpg',
        aadharBack: 'https://example.com/aadhar4.jpg',
        certificates: 'https://example.com/coach_certificates.pdf'
      },
      status: 'approved',
      registrationDate: new Date(),
      approvedAt: new Date(),
      approvedBy: 'system'
    });
    await coachProfile.save();
    console.log('✅ Coach profile created');

    // 3. Create Admin User
    const adminUser = new User({
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      isApproved: true,
      profileCompleted: true,
      createdAt: new Date()
    });
    await adminUser.save();
    console.log('✅ Admin user created:', adminUser.email);

    // Create Admin Profile
    const adminProfile = new Admin({
      userId: adminUser._id,
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@test.com',
      mobileNumber: '9876543212',
      department: 'Fencing Administration',
      permissions: ['user_management', 'payment_management', 'content_management'],
      assignedDistrict: 'All Districts',
      status: 'active'
    });
    await adminProfile.save();
    console.log('✅ Admin profile created');

    // 4. Create Super Admin User
    const superAdminUser = new User({
      email: 'superadmin@test.com',
      password: 'superadmin123',
      role: 'superadmin',
      isApproved: true,
      profileCompleted: true,
      createdAt: new Date()
    });
    await superAdminUser.save();
    console.log('✅ Super Admin user created:', superAdminUser.email);

    console.log('\n🎉 All test users created successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('========================');
    console.log('Fencer:');
    console.log('  Email: fencer@test.com');
    console.log('  Password: fencer123');
    console.log('  Role: fencer');
    console.log('\nCoach:');
    console.log('  Email: coach@test.com');
    console.log('  Password: coach123');
    console.log('  Role: coach');
    console.log('\nAdmin:');
    console.log('  Email: admin@test.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('\nSuper Admin:');
    console.log('  Email: superadmin@test.com');
    console.log('  Password: superadmin123');
    console.log('  Role: superadmin');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
createTestUsers();