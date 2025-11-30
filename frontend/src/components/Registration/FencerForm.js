import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initializeCashfree, createPaymentSession, verifyPayment } from '../../services/paymentService';
import '../../styles/FencerForm.css';

// API configuration
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000'
  : 'https://fencing-app-backend.onrender.com';

const FencerForm = ({ user, registrationData, onCompleteRegistration }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(500);
  const [feeLoading, setFeeLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    lastName: '',
    aadharNumber: '',
    fathersName: '',
    mothersName: '',
    mobileNumber: '',
    dateOfBirth: '',
    permanentAddress: {
      addressLine1: '',
      addressLine2: '',
      state: '',
      district: '',
      pinCode: ''
    },
    presentAddress: {
      addressLine1: '',
      addressLine2: '',
      state: '',
      district: '',
      pinCode: ''
    },
    highestAchievement: '',
    coachName: '',
    trainingCenter: '',
    selectedDistrict: '',
    documents: {
      passportPhoto: '',
      aadharFront: '',
      aadharBack: '',
      birthCertificate: '',
      doc1: '',
      doc2: '',
      doc3: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // FIXED: Fetch districts from correct API endpoint
  useEffect(() => {
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        console.log('🌐 Fetching districts from API...');
        
        // Use the correct endpoint that returns active districts
        const response = await axios.get(`${API_BASE_URL}/api/districts`);
        console.log('📥 Districts API response:', response.data);

        // Handle the response based on your API structure
        if (response.data && Array.isArray(response.data)) {
          // If response is directly an array
          const activeDistricts = response.data.filter(district => 
            district.isActive !== false // Include all districts where isActive is not false
          );
          setDistricts(activeDistricts);
          console.log('✅ Active districts loaded:', activeDistricts);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // If response has { data: [] } structure
          const activeDistricts = response.data.data.filter(district => 
            district.isActive !== false
          );
          setDistricts(activeDistricts);
          console.log('✅ Active districts loaded:', activeDistricts);
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // If response has { success: true, data: [] } structure
          const activeDistricts = response.data.data.filter(district => 
            district.isActive !== false
          );
          setDistricts(activeDistricts);
          console.log('✅ Active districts loaded:', activeDistricts);
        } else {
          console.warn('Unexpected districts response structure:', response.data);
          setDistricts([]);
        }
        
      } catch (error) {
        console.error('❌ Failed to fetch districts:', error);
        console.error('Error details:', error.response?.data);
        
        // Try alternative endpoints if the main one fails
        try {
          console.log('🔄 Trying alternative endpoint...');
          const altResponse = await axios.get(`${API_BASE_URL}/api/register/districts`);
          if (altResponse.data && altResponse.data.success && Array.isArray(altResponse.data.data)) {
            setDistricts(altResponse.data.data);
            console.log('✅ Districts loaded from alternative endpoint');
          }
        } catch (altError) {
          console.error('❌ Alternative endpoint also failed:', altError);
          setDistricts([]);
          setMessage('Unable to load districts list. Please contact administrator.');
        }
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch registration fee from API
  useEffect(() => {
    const fetchRegistrationFee = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/fees/fencer`);
        if (response.data.success) {
          setRegistrationFee(response.data.data.amount);
          console.log('✅ Registration fee loaded:', response.data.data.amount);
        }
      } catch (error) {
        console.error('Failed to fetch registration fee:', error);
        setRegistrationFee(500); // Fallback amount
      } finally {
        setFeeLoading(false);
      }
    };
    fetchRegistrationFee();
  }, []);

  // FIXED: Check for pending payments ONLY when returning from payment gateway
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    const userType = urlParams.get('user_type');
    
    if (orderId && userType === 'fencer') {
      const checkPendingPayment = async () => {
        setMessage('Verifying your payment and completing registration...');
        setLoading(true);
        
        try {
          const paymentResult = await checkPaymentStatus(orderId);
          
          if (paymentResult.success) {
            // Get stored registration data and complete registration
            const storedData = localStorage.getItem('pendingRegistrationData');
            if (storedData) {
              const registrationData = JSON.parse(storedData);
              await completeFencerRegistration(registrationData);
            }
            
            setMessage('Payment verified! Registration completed successfully.');
            setPaymentVerified(true);
            localStorage.removeItem('pendingPaymentOrderId');
            localStorage.removeItem('pendingPaymentUserType');
            localStorage.removeItem('pendingRegistrationData');
            setTimeout(() => {
              onCompleteRegistration();
            }, 2000);
          } else {
            setMessage(`Payment verification failed: ${paymentResult.error}`);
            localStorage.removeItem('pendingPaymentOrderId');
            localStorage.removeItem('pendingPaymentUserType');
            localStorage.removeItem('pendingRegistrationData');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          setMessage('Failed to verify payment. Please contact support.');
        } finally {
          setLoading(false);
        }
      };
      
      checkPendingPayment();
    }
  }, [onCompleteRegistration]);

  // Pre-fill email and district if available from registration
  useEffect(() => {
    if (registrationData) {
      setFormData(prev => ({
        ...prev,
        email: user?.email || '',
        selectedDistrict: registrationData.district || ''
      }));
    }
  }, [registrationData, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
   
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddressCopy = () => {
    if (isSameAddress) {
      setFormData(prev => ({
        ...prev,
        presentAddress: { ...prev.permanentAddress }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        presentAddress: {
          addressLine1: '',
          addressLine2: '',
          state: '',
          district: '',
          pinCode: ''
        }
      }));
    }
  };

  useEffect(() => {
    handleAddressCopy();
  }, [isSameAddress]);

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setMessage('Please fill all required fields in login credentials');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setMessage('Password must be at least 6 characters long');
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!formData.firstName || !formData.lastName || !formData.aadharNumber || !formData.mobileNumber) {
        setMessage('Please fill all required personal information fields');
        return;
      }
      if (!formData.selectedDistrict) {
        setMessage('Please select your district');
        return;
      }
      if (!formData.permanentAddress.addressLine1 || !formData.permanentAddress.state || !formData.permanentAddress.district || !formData.permanentAddress.pinCode) {
        setMessage('Please fill all required address fields');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
    setMessage('');
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setMessage('');
  };

  const handleFileUpload = async (file, fieldName) => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
   
    try {
      setUploadProgress(prev => ({ ...prev, [fieldName]: 0 }));
     
      const response = await axios.post(
        `${API_BASE_URL}/api/upload/single`,
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [fieldName]: percentCompleted }));
          }
        }
      );

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [fieldName]: response.data.data.downloadURL
          }
        }));
       
        setUploadProgress(prev => ({ ...prev, [fieldName]: null }));
        return response.data.data.downloadURL;
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [fieldName]: null }));
      setMessage(`File upload failed: ${error.message}`);
      return null;
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const validPdfTypes = ['application/pdf'];
      const maxSize = 5 * 1024 * 1024;
      
      if (fieldName.includes('Photo') || fieldName.includes('aadhar')) {
        if (!validImageTypes.includes(file.type)) {
          setMessage('Please upload JPEG, JPG or PNG images only.');
          return;
        }
      } else {
        if (!validPdfTypes.includes(file.type)) {
          setMessage('Please upload PDF files only for certificates.');
          return;
        }
      }
      
      if (file.size > maxSize) {
        setMessage('File size should be less than 5MB.');
        return;
      }
      
      handleFileUpload(file, fieldName);
    }
  };

  // Drag and Drop Functions
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, fieldName) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
   
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange({ target: { files } }, fieldName);
    }
  };

  // PAYMENT FUNCTIONS - UPDATED FOR CASHFREE SDK
  const checkPaymentStatus = async (orderId, maxAttempts = 30) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Payment check attempt ${attempt}/${maxAttempts}`);
        const result = await verifyPayment(orderId);
        
        if (result.data?.payment_status === 'SUCCESS' || result.data?.order_status === 'PAID') {
          console.log('✅ Payment successful!');
          return { success: true, data: result.data };
        } else if (result.data?.payment_status === 'FAILED') {
          console.log('❌ Payment failed');
          return { success: false, error: 'Payment failed' };
        }
        
        console.log('⏳ Payment still processing, waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Payment check attempt ${attempt} failed:`, error);
      }
    }
    
    return { success: false, error: 'Payment verification timeout' };
  };

  // Function to complete fencer registration after payment
  const completeFencerRegistration = async (registrationData) => {
    try {
      console.log('💾 Completing fencer registration:', registrationData);
      
      const response = await axios.post(`${API_BASE_URL}/api/fencer/register`, registrationData);
      console.log('✅ Fencer registration completed successfully:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error completing fencer registration:', error);
      throw new Error('Failed to complete registration: ' + (error.response?.data?.error || error.message));
    }
  };

  const initiatePayment = async () => {
    try {
      setPaymentProcessing(true);
      setMessage('Creating payment session...');

      // Find selected district object to get SHORT CODE from DB
      const selectedDistrictObj = districts.find(
        d => d.name === formData.selectedDistrict
      );
      const districtShortcode =
        selectedDistrictObj?.code ||
        formData.selectedDistrict.toUpperCase().replace(/\s+/g, '_');

      // Prepare the complete registration data
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        aadharNumber: formData.aadharNumber,
        fathersName: formData.fathersName,
        mothersName: formData.mothersName,
        mobileNumber: formData.mobileNumber,
        dateOfBirth: formData.dateOfBirth,
        permanentAddress: formData.permanentAddress,
        presentAddress: formData.presentAddress,
        highestAchievement: formData.highestAchievement,
        coachName: formData.coachName,
        trainingCenter: formData.trainingCenter,
        selectedDistrict: formData.selectedDistrict,
        documents: formData.documents
      };

      console.log('📝 Registration data prepared:', registrationData);

      const orderData = {
        orderAmount: registrationFee,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        customerEmail: formData.email,
        customerPhone: formData.mobileNumber || '9999999999',
        userType: 'fencer',
        registrationData: registrationData
      };

      console.log('💰 Payment order data for amount:', registrationFee, orderData);

      const paymentSession = await createPaymentSession(orderData);
      
      if (paymentSession.success) {
        setOrderId(paymentSession.data.order_id);
        
        localStorage.setItem('pendingPaymentOrderId', paymentSession.data.order_id);
        localStorage.setItem('pendingPaymentUserType', 'fencer');
        localStorage.setItem('pendingRegistrationData', JSON.stringify(registrationData));
        
        // Initialize Cashfree SDK
        console.log('🔄 Initializing Cashfree SDK...');
        const cashfree = await initializeCashfree();
        
        // Create checkout options for Cashfree
        const checkoutOptions = {
          paymentSessionId: paymentSession.data.payment_session_id,
          returnUrl: `${window.location.origin}/payment-success?order_id=${paymentSession.data.order_id}&user_type=fencer`,
          onSuccess: async (data) => {
            console.log('✅ Payment successful:', data);
            setMessage('Payment successful! Completing registration...');
            
            // Verify payment with backend
            try {
              const verification = await verifyPayment(paymentSession.data.order_id);
              if (verification.success && verification.data.payment_status === 'SUCCESS') {
                // Complete registration after successful payment
                await completeFencerRegistration(registrationData);
                
                setMessage('Registration completed successfully! Awaiting district approval.');
                setPaymentVerified(true);
                localStorage.removeItem('pendingPaymentOrderId');
                localStorage.removeItem('pendingPaymentUserType');
                localStorage.removeItem('pendingRegistrationData');
                
                setTimeout(() => {
                  onCompleteRegistration();
                }, 2000);
              } else {
                setMessage('Payment verification failed. Please contact support.');
                setPaymentProcessing(false);
                setLoading(false);
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setMessage('Payment verification failed. Please contact support.');
              setPaymentProcessing(false);
              setLoading(false);
            }
          },
          onFailure: (data) => {
            console.error('❌ Payment failed:', data);
            setMessage(`Payment failed: ${data.error?.message || 'Unknown error'}`);
            setPaymentProcessing(false);
            setLoading(false);
            localStorage.removeItem('pendingPaymentOrderId');
            localStorage.removeItem('pendingPaymentUserType');
            localStorage.removeItem('pendingRegistrationData');
          },
          onRedirect: (data) => {
            console.log('🔄 Payment redirecting:', data);
          }
        };

        console.log('🎯 Opening Cashfree checkout...');
        // Open Cashfree checkout
        cashfree.checkout(checkoutOptions);
        
      } else {
        throw new Error(paymentSession.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      setMessage(`Payment failed: ${error.message}`);
      setPaymentProcessing(false);
      setLoading(false);
      localStorage.removeItem('pendingPaymentOrderId');
      localStorage.removeItem('pendingPaymentUserType');
      localStorage.removeItem('pendingRegistrationData');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Validate required documents
      const requiredDocs = ['passportPhoto', 'aadharFront', 'aadharBack', 'birthCertificate'];
      const missingDocs = requiredDocs.filter(doc => !formData.documents[doc]);
      
      if (missingDocs.length > 0) {
        setMessage(`Please upload all required documents: ${missingDocs.join(', ')}`);
        setLoading(false);
        return;
      }

      if (!formData.selectedDistrict) {
        setMessage('Please select your district');
        setLoading(false);
        return;
      }

      // Validate personal information
      if (!formData.firstName || !formData.lastName || !formData.aadharNumber || !formData.mobileNumber) {
        setMessage('Please fill all required personal information fields');
        setLoading(false);
        return;
      }

      console.log('🚀 Starting payment process for amount:', registrationFee);
      await initiatePayment();
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      setMessage(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Login Credentials</div>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Personal Info</div>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Documents & Payment</div>
      </div>
    </div>
  );

  return (
    <div className="fencer-form-container">
      <div className="form-header">
        <h1>Fencer Registration</h1>
        <p>Complete your profile to join Delhi Fencing Association</p>
      </div>
      
      <StepIndicator />
      
      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="fencer-form">
        {/* Step 1: Login Credentials */}
        {currentStep === 1 && (
          <section className="form-section login-credentials-section">
            <h2 className="section-title">
              <i className="fas fa-lock"></i>
              Login Credentials
            </h2>
            <p className="section-subtitle">Create your login credentials for future access</p>
           
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Create a password"
                  minLength="6"
                />
                {formData.password && (
                  <div className={`password-strength ${
                    formData.password.length < 6 ? 'weak' :
                    formData.password.length < 8 ? 'medium' : 'strong'
                  }`}>
                    {formData.password.length < 6 ? 'Weak password' :
                     formData.password.length < 8 ? 'Medium strength' : 'Strong password'}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Confirm your password"
                  minLength="6"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="password-strength weak">
                    Passwords do not match
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-actions step-actions">
              <div></div>
              <button type="button" className="next-btn" onClick={nextStep}>
                Next: Personal Information
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Personal & Fencing Information */}
        {currentStep === 2 && (
          <>
            {/* Personal Information Section */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-user"></i>
                Personal Information
              </h2>
             
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="middleName">Middle Name</label>
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Enter your middle name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="aadharNumber">Aadhar Number *</label>
                  <input
                    type="text"
                    id="aadharNumber"
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter 12-digit Aadhar number"
                    pattern="[0-9]{12}"
                    maxLength="12"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fathersName">Father's Name *</label>
                  <input
                    type="text"
                    id="fathersName"
                    name="fathersName"
                    value={formData.fathersName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter father's full name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mothersName">Mother's Name *</label>
                  <input
                    type="text"
                    id="mothersName"
                    name="mothersName"
                    value={formData.mothersName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter mother's full name"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mobileNumber">Mobile Number *</label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter 10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </section>

            {/* Address Information Section */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-home"></i>
                Address Information
              </h2>
              
              {/* Permanent Address */}
              <div className="address-section">
                <h3>Permanent Address *</h3>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="permanentAddress.addressLine1">Address Line 1 *</label>
                    <input
                      type="text"
                      id="permanentAddress.addressLine1"
                      name="permanentAddress.addressLine1"
                      value={formData.permanentAddress.addressLine1}
                      onChange={handleInputChange}
                      required
                      placeholder="House No, Building, Street"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="permanentAddress.addressLine2">Address Line 2</label>
                    <input
                      type="text"
                      id="permanentAddress.addressLine2"
                      name="permanentAddress.addressLine2"
                      value={formData.permanentAddress.addressLine2}
                      onChange={handleInputChange}
                      placeholder="Area, Locality"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="permanentAddress.state">State *</label>
                    <input
                      type="text"
                      id="permanentAddress.state"
                      name="permanentAddress.state"
                      value={formData.permanentAddress.state}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="permanentAddress.district">District *</label>
                    <input
                      type="text"
                      id="permanentAddress.district"
                      name="permanentAddress.district"
                      value={formData.permanentAddress.district}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter district"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="permanentAddress.pinCode">PIN Code *</label>
                    <input
                      type="text"
                      id="permanentAddress.pinCode"
                      name="permanentAddress.pinCode"
                      value={formData.permanentAddress.pinCode}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter 6-digit PIN"
                      pattern="[0-9]{6}"
                      maxLength="6"
                    />
                  </div>
                </div>
              </div>
              
              {/* Present Address */}
              <div className="address-section">
                <div className="address-copy-toggle">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isSameAddress}
                      onChange={(e) => setIsSameAddress(e.target.checked)}
                    />
                    Same as Permanent Address
                  </label>
                </div>
                {!isSameAddress && (
                  <>
                    <h3>Present Address *</h3>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label htmlFor="presentAddress.addressLine1">Address Line 1 *</label>
                        <input
                          type="text"
                          id="presentAddress.addressLine1"
                          name="presentAddress.addressLine1"
                          value={formData.presentAddress.addressLine1}
                          onChange={handleInputChange}
                          required={!isSameAddress}
                          placeholder="House No, Building, Street"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label htmlFor="presentAddress.addressLine2">Address Line 2</label>
                        <input
                          type="text"
                          id="presentAddress.addressLine2"
                          name="presentAddress.addressLine2"
                          value={formData.presentAddress.addressLine2}
                          onChange={handleInputChange}
                          placeholder="Area, Locality"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="presentAddress.state">State *</label>
                        <input
                          type="text"
                          id="presentAddress.state"
                          name="presentAddress.state"
                          value={formData.presentAddress.state}
                          onChange={handleInputChange}
                          required={!isSameAddress}
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="presentAddress.district">District *</label>
                        <input
                          type="text"
                          id="presentAddress.district"
                          name="presentAddress.district"
                          value={formData.presentAddress.district}
                          onChange={handleInputChange}
                          required={!isSameAddress}
                          placeholder="Enter district"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="presentAddress.pinCode">PIN Code *</label>
                        <input
                          type="text"
                          id="presentAddress.pinCode"
                          name="presentAddress.pinCode"
                          value={formData.presentAddress.pinCode}
                          onChange={handleInputChange}
                          required={!isSameAddress}
                          placeholder="Enter 6-digit PIN"
                          pattern="[0-9]{6}"
                          maxLength="6"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Fencing Information Section */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-trophy"></i>
                Fencing Information
              </h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="selectedDistrict">Select District Association *</label>
                  <select
                    id="selectedDistrict"
                    name="selectedDistrict"
                    value={formData.selectedDistrict}
                    onChange={handleInputChange}
                    required
                    disabled={loadingDistricts}
                  >
                    <option value="">
                      {loadingDistricts ? 'Loading districts...' : 'Choose your district association'}
                    </option>
                    {districts.map(district => (
                      <option key={district._id || district.code} value={district.name}>
                        {district.name} {district.code ? `(${district.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {loadingDistricts && (
                    <div className="loading-text">Loading available districts...</div>
                  )}
                  {districts.length === 0 && !loadingDistricts && (
                    <div className="info-text">No districts available. Please contact administrator.</div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="coachName">Coach Name</label>
                  <input
                    type="text"
                    id="coachName"
                    name="coachName"
                    value={formData.coachName}
                    onChange={handleInputChange}
                    placeholder="Enter coach's name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="trainingCenter">Training Center</label>
                  <input
                    type="text"
                    id="trainingCenter"
                    name="trainingCenter"
                    value={formData.trainingCenter}
                    onChange={handleInputChange}
                    placeholder="Enter training center name"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="highestAchievement">Highest Achievement</label>
                  <textarea
                    id="highestAchievement"
                    name="highestAchievement"
                    value={formData.highestAchievement}
                    onChange={handleInputChange}
                    placeholder="Describe your highest achievement in fencing"
                    rows="3"
                  />
                </div>
              </div>
            </section>
            
            <div className="form-actions step-actions">
              <button type="button" className="prev-btn" onClick={prevStep}>
                <i className="fas fa-arrow-left"></i>
                Previous
              </button>
              <button type="button" className="next-btn" onClick={nextStep}>
                Next: Documents & Payment
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </>
        )}

        {/* Step 3: Documents & Payment */}
        {currentStep === 3 && (
          <>
            {/* Documents Upload Section */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-file-upload"></i>
                Documents Upload
              </h2>
              <p className="section-subtitle">Upload all required documents. Maximum file size: 5MB per file</p>
              
              <div className="documents-grid">
                {/* Required Documents */}
                <div className="document-group required">
                  <h3>Required Documents</h3>
                  <p className="document-subtitle">These documents are mandatory for registration</p>
                 
                  {[
                    { key: 'passportPhoto', label: 'Passport Size Photo', type: 'image', icon: 'camera' },
                    { key: 'aadharFront', label: 'Aadhar Card Front', type: 'image', icon: 'id-card' },
                    { key: 'aadharBack', label: 'Aadhar Card Back', type: 'image', icon: 'id-card' },
                    { key: 'birthCertificate', label: 'Birth Certificate or 10th Certificate', type: 'pdf', icon: 'file-pdf' }
                  ].map((doc) => (
                    <div key={doc.key} className="document-item">
                      <label className="document-label">
                        {doc.label} *
                        <span className="document-requirement">
                          ({doc.type === 'image' ? 'JPEG, JPG, PNG - Max 5MB' : 'PDF - Max 5MB'})
                        </span>
                      </label>
                      <div className="file-upload-container">
                        <div
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, doc.key)}
                        >
                          <input
                            type="file"
                            accept={doc.type === 'image' ? '.jpg,.jpeg,.png' : '.pdf'}
                            onChange={(e) => handleFileChange(e, doc.key)}
                            className="file-input"
                          />
                          <div className="upload-content">
                            <i className={`fas fa-${doc.icon}`}></i>
                            <div className="upload-text">
                              {formData.documents[doc.key] ? (
                                <div className="file-success">
                                  <i className="fas fa-check-circle"></i>
                                  <span>{doc.label} Uploaded</span>
                                </div>
                              ) : (
                                <>
                                  <span className="upload-title">Click to upload {doc.label.toLowerCase()}</span>
                                  <span className="upload-subtitle">or drag and drop {doc.type === 'image' ? 'image' : 'PDF'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {uploadProgress[doc.key] !== null && uploadProgress[doc.key] !== undefined && (
                          <div className="upload-progress">
                            <div className="progress-info">
                              <span>Uploading: {uploadProgress[doc.key]}%</span>
                            </div>
                            <div className="progress-bar-container">
                              <div
                                className="progress-bar"
                                style={{ width: `${uploadProgress[doc.key]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Documents */}
                <div className="document-group additional">
                  <h3>Additional Documents (Optional)</h3>
                  <p className="document-subtitle">Supporting documents for your application</p>
                 
                  {[1, 2, 3].map(num => (
                    <div key={num} className="document-item">
                      <label className="document-label">
                        Additional Document {num}
                        <span className="document-requirement">(PDF - Max 5MB)</span>
                      </label>
                      <div className="file-upload-container">
                        <div
                          className="file-upload-area"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, `doc${num}`)}
                        >
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, `doc${num}`)}
                            className="file-input"
                          />
                          <div className="upload-content">
                            <i className="fas fa-file-alt"></i>
                            <div className="upload-text">
                              {formData.documents[`doc${num}`] ? (
                                <div className="file-success">
                                  <i className="fas fa-check-circle"></i>
                                  <span>Document {num} Uploaded</span>
                                </div>
                              ) : (
                                <>
                                  <span className="upload-title">Click to upload document</span>
                                  <span className="upload-subtitle">or drag and drop PDF</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {uploadProgress[`doc${num}`] !== null && uploadProgress[`doc${num}`] !== undefined && (
                          <div className="upload-progress">
                            <div className="progress-info">
                              <span>Uploading: {uploadProgress[`doc${num}`]}%</span>
                            </div>
                            <div className="progress-bar-container">
                              <div
                                className="progress-bar"
                                style={{ width: `${uploadProgress[`doc${num}`]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Instructions */}
              <div className="upload-instructions">
                <h4>Upload Instructions:</h4>
                <ul>
                  <li>Ensure all documents are clear and readable</li>
                  <li>Photos should be recent and passport-sized</li>
                  <li>Aadhar card should show all details clearly</li>
                  <li>Certificates should be in PDF format</li>
                  <li>Maximum file size for each document is 5MB</li>
                </ul>
              </div>
            </section>

            {/* Payment Notice */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-credit-card"></i>
                Payment Information
              </h2>
              <div className="payment-notice">
                <h3>
                  Registration Fee:{' '}
                  {feeLoading ? 'Loading...' : `₹${registrationFee}`}
                </h3>
                <p>Complete your registration by making the payment. You will be redirected to secure payment gateway.</p>
               
                {process.env.NODE_ENV !== 'production' && (
                  <div className="test-mode-banner">
                    <i className="fas fa-vial"></i>
                    Test Mode - Using Sandbox Environment
                  </div>
                )}
                
                <div className="payment-features">
                  <div className="feature">
                    <i className="fas fa-shield-alt"></i>
                    <span>Secure Payment</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-credit-card"></i>
                    <span>Multiple Payment Options</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-file-invoice"></i>
                    <span>Instant Receipt</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="form-actions step-actions">
              <button type="button" className="prev-btn" onClick={prevStep}>
                <i className="fas fa-arrow-left"></i>
                Previous
              </button>
              <button
                type="submit"
                className="submit-btn payment-btn"
                disabled={loading || paymentProcessing || paymentVerified}
              >
                {paymentVerified ? (
                  <>
                    <i className="fas fa-check-circle"></i>
                    Registration Completed!
                  </>
                ) : (loading || paymentProcessing) ? (
                  <>
                    <div className="spinner"></div>
                    {paymentProcessing ? 'Processing Payment...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-credit-card"></i>
                    Make Payment & Complete Registration
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};
export default FencerForm;