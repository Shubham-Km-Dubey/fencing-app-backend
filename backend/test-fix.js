const mongoose = require('mongoose');
const User = require('./models/User');
const Fencer = require('./models/Fencer');

const MONGODB_URI = 'mongodb+srv://Shubham:%23-Xc4RVVM7VUk8Q@cluster0.vtjyioo.mongodb.net/fencing_association?retryWrites=true&w=majority';

async function testFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Delete any existing test user
    await User.deleteOne({ email: 'testfix@test.com' });
    
    // Create test user
    const user = new User({
      email: 'testfix@test.com',
      password: 'test123',
      role: 'fencer',
      district: 'North East',
      districtShortcode: 'NORTH_EAST',
      name: 'Test Fix User',
      phone: '9999999999',
      isApproved: false
    });
    await user.save();
    console.log('✅ Test user created');

    // Create test fencer application
    const fencer = new Fencer({
      userId: user._id,
      firstName: 'Test',
      lastName: 'Fix',
      aadharNumber: '999888777666',
      fathersName: 'Test Father',
      mothersName: 'Test Mother',
      mobileNumber: '8888888888',
      dateOfBirth: new Date('2000-01-01'),
      permanentAddress: {
        addressLine1: 'Test Address Line 1',
        state: 'Delhi',
        district: 'North East District',
        pinCode: '110001'
      },
      selectedDistrict: 'North East',
      districtShortcode: 'NORTH_EAST',
      documents: {
        passportPhoto: 'test.jpg',
        aadharFront: 'test.jpg',
        aadharBack: 'test.jpg',
        birthCertificate: 'test.pdf'
      },
      status: 'pending',
      paymentStatus: 'completed'
    });
    await fencer.save();
    console.log('✅ Test fencer application created');
    console.log('📍 District: North East');
    console.log('📋 Status: pending');
    console.log('');
    console.log('🎯 NOW CHECK YOUR DISTRICT ADMIN DASHBOARD!');
    console.log('You should see "Test Fix" in the applications list.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

testFix();