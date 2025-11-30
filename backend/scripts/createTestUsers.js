const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import all your models
const User = require('../models/User');
const Fencer = require('../models/Fencer');
const Coach = require('../models/Coach');
const Club = require('../models/Club');
const School = require('../models/School');
const Referee = require('../models/Referee');
const District = require('../models/District');

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({ 
      email: { 
        $in: [
          'fencer@test.com',
          'coach@test.com',
          'club@test.com', 
          'school@test.com',
          'referee@test.com',
          'district@test.com',
          'superadmin@test.com'
        ] 
      } 
    });
    console.log('🧹 Cleared existing test users');

    // 1. Create Fencer User
    const fencerUser = new User({
      email: 'fencer@test.com',
      password: 'fencer123',
      role: 'fencer',
      district: 'North East',
      name: 'Test Fencer',
      isApproved: true,
      districtApproved: true,
      centralApproved: true,
      profileCompleted: true
    });
    await fencerUser.save();
    console.log('✅ Fencer user created');

    const fencerProfile = new Fencer({
      userId: fencerUser._id,
      firstName: 'Test',
      lastName: 'Fencer',
      email: 'fencer@test.com',
      aadharNumber: '123456789012',
      mobileNumber: '9876543210',
      dateOfBirth: new Date('2000-01-01'),
      fathersName: 'Father Fencer',
      mothersName: 'Mother Fencer',
      permanentAddress: {
        addressLine1: '123 Fencing Street',
        state: 'Delhi',
        district: 'North East',
        pinCode: '110001'
      },
      presentAddress: {
        addressLine1: '123 Fencing Street',
        state: 'Delhi',
        district: 'North East', 
        pinCode: '110001'
      },
      selectedDistrict: 'North East',
      highestAchievement: 'State Level Championship',
      coachName: 'Test Coach',
      trainingCenter: 'Delhi Fencing Academy',
      documents: {
        passportPhoto: 'https://example.com/photo1.jpg',
        aadharFront: 'https://example.com/aadhar1.jpg',
        aadharBack: 'https://example.com/aadhar2.jpg',
        birthCertificate: 'https://example.com/certificate1.pdf'
      },
      status: 'approved'
    });
    await fencerProfile.save();
    console.log('✅ Fencer profile created');

    // 2. Create Coach User
    const coachUser = new User({
      email: 'coach@test.com',
      password: 'coach123',
      role: 'coach',
      district: 'North West',
      name: 'Test Coach',
      isApproved: true,
      districtApproved: true,
      centralApproved: true,
      profileCompleted: true
    });
    await coachUser.save();
    console.log('✅ Coach user created');

    const coachProfile = new Coach({
      userId: coachUser._id,
      firstName: 'Test',
      lastName: 'Coach',
      email: 'coach@test.com',
      aadharNumber: '123456789013',
      mobileNumber: '9876543211',
      dateOfBirth: new Date('1985-01-01'),
      fathersName: 'Father Coach',
      mothersName: 'Mother Coach',
      permanentAddress: {
        addressLine1: '456 Coaching Avenue',
        state: 'Delhi',
        district: 'North West',
        pinCode: '110002'
      },
      presentAddress: {
        addressLine1: '456 Coaching Avenue',
        state: 'Delhi',
        district: 'North West',
        pinCode: '110002'
      },
      level: 'More then 5 years',
      highestAchievement: 'National Level Coach',
      trainingCenter: 'Sports Complex',
      selectedDistrict: 'North West',
      documents: {
        photo: 'https://example.com/coach_photo.jpg',
        aadharFront: 'https://example.com/coach_aadhar1.jpg',
        aadharBack: 'https://example.com/coach_aadhar2.jpg',
        coachCertificate: 'https://example.com/coach_cert.pdf'
      },
      status: 'approved'
    });
    await coachProfile.save();
    console.log('✅ Coach profile created');

    // 3. Create Club User
    const clubUser = new User({
      email: 'club@test.com',
      password: 'club123',
      role: 'club',
      district: 'South East',
      name: 'Test Club',
      isApproved: true,
      districtApproved: true,
      centralApproved: true,
      profileCompleted: true
    });
    await clubUser.save();
    console.log('✅ Club user created');

    const clubProfile = new Club({
      userId: clubUser._id,
      clubName: 'Delhi Fencing Club',
      clubEmail: 'club@test.com',
      clubContactNumber: '9876543212',
      representativeName: 'Club Representative',
      representativeNumber: '9876543213',
      representativeEmail: 'rep@test.com',
      indoorHallMeasurement: '20x40 meters',
      acNonAc: 'AC',
      auditorium: true,
      assembleArea: true,
      parkingArea: true,
      permanentAddress: {
        addressLine1: '789 Club Road',
        state: 'Delhi',
        district: 'South East',
        pinCode: '110003'
      },
      numberOfStudents: 50,
      numberOfCoaches: 3,
      coachesList: ['Coach One', 'Coach Two', 'Coach Three'],
      selectedDistrict: 'South East',
      status: 'approved'
    });
    await clubProfile.save();
    console.log('✅ Club profile created');

    // 4. Create School User
    const schoolUser = new User({
      email: 'school@test.com',
      password: 'school123',
      role: 'school',
      district: 'South West',
      name: 'Test School',
      isApproved: true,
      districtApproved: true,
      centralApproved: true,
      profileCompleted: true
    });
    await schoolUser.save();
    console.log('✅ School user created');

    const schoolProfile = new School({
      userId: schoolUser._id,
      schoolName: 'Delhi Public School',
      registrationNumber: 'SCH123456',
      schoolEmail: 'school@test.com',
      schoolContactNumber: '9876543214',
      representativeName: 'School Principal',
      representativeNumber: '9876543215',
      representativeEmail: 'principal@test.com',
      indoorHallMeasurement: '15x30 meters',
      acNonAc: 'Non-AC',
      auditorium: true,
      assembleArea: true,
      parkingArea: true,
      permanentAddress: {
        addressLine1: '321 School Lane',
        state: 'Delhi',
        district: 'South West',
        pinCode: '110004'
      },
      numberOfStudents: 25,
      coachName: 'School Coach',
      selectedDistrict: 'South West',
      documents: {
        registrationCertificate: 'https://example.com/school_cert.pdf'
      },
      status: 'approved'
    });
    await schoolProfile.save();
    console.log('✅ School profile created');

    // 5. Create Referee User
    const refereeUser = new User({
      email: 'referee@test.com',
      password: 'referee123',
      role: 'referee',
      district: 'Central',
      name: 'Test Referee',
      isApproved: true,
      districtApproved: true,
      centralApproved: true,
      profileCompleted: true
    });
    await refereeUser.save();
    console.log('✅ Referee user created');

    const refereeProfile = new Referee({
      userId: refereeUser._id,
      firstName: 'Test',
      lastName: 'Referee',
      email: 'referee@test.com',
      aadharNumber: '123456789014',
      mobileNumber: '9876543216',
      dateOfBirth: new Date('1975-01-01'),
      fathersName: 'Father Referee',
      mothersName: 'Mother Referee',
      permanentAddress: {
        addressLine1: '654 Referee Road',
        state: 'Delhi',
        district: 'Central',
        pinCode: '110005'
      },
      presentAddress: {
        addressLine1: '654 Referee Road',
        state: 'Delhi',
        district: 'Central',
        pinCode: '110005'
      },
      level: 'FIE',
      highestAchievement: 'International Referee',
      trainingCenter: 'National Sports Center',
      selectedDistrict: 'Central',
      documents: {
        photo: 'https://example.com/referee_photo.jpg',
        aadharFront: 'https://example.com/referee_aadhar1.jpg',
        aadharBack: 'https://example.com/referee_aadhar2.jpg',
        refereeCertificate: 'https://example.com/referee_cert.pdf'
      },
      status: 'approved'
    });
    await refereeProfile.save();
    console.log('✅ Referee profile created');

    // 6. Create District Admin User
    const districtUser = new User({
      email: 'district@test.com',
      password: 'district123',
      role: 'district_admin',
      district: 'All Districts',
      name: 'Test District Admin',
      isApproved: true,
      districtApproved: true,
      centralApproved: true,
      profileCompleted: true
    });
    await districtUser.save();
    console.log('✅ District Admin user created');

    // 7. Create Super Admin User
    const superAdminUser = new User({
      email: 'superadmin@test.com',
      password: 'superadmin123',
      role: 'super_admin',
      name: 'Test Super Admin',
      isApproved: true,
      districtApproved: true,
      centralApproved: true,
      profileCompleted: true
    });
    await superAdminUser.save();
    console.log('✅ Super Admin user created');

    console.log('\n🎉 ALL TEST USERS CREATED SUCCESSFULLY!');
    console.log('\n📋 TEST USER CREDENTIALS:');
    console.log('========================');
    console.log('Fencer:     fencer@test.com / fencer123');
    console.log('Coach:      coach@test.com / coach123');
    console.log('Club:       club@test.com / club123');
    console.log('School:     school@test.com / school123');
    console.log('Referee:    referee@test.com / referee123');
    console.log('District:   district@test.com / district123');
    console.log('Super Admin: superadmin@test.com / superadmin123');

    console.log('\n🎯 You can now use these to test your dashboard!');

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