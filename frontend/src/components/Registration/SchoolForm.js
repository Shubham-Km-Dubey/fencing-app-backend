import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initializeCashfree, createPaymentSession, verifyPayment } from '../../services/paymentService';
import '../../styles/SchoolForm.css';

// API configuration
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000'
  : 'https://fencing-app-backend.onrender.com';

const SchoolForm = ({ user, registrationData, onCompleteRegistration }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(1000);
  const [feeLoading, setFeeLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    registrationNumber: '',
    schoolEmail: '',
    schoolContactNumber: '',
    representativeName: '',
    representativeNumber: '',
    representativeEmail: '',
    indoorHallMeasurement: '',
    acType: '',
    hasAuditorium: '',
    hasAssembleArea: '',
    hasParkingArea: '',
    numberOfStudents: '',
    coachName: '',
    permanentAddress: {
      addressLine1: '',
      addressLine2: '',
      state: '',
      district: '',
      pinCode: ''
    },
    selectedDistrict: '',
    documents: {
      schoolRegistrationCertificate: '',
      doc1: '',
      doc2: '',
      doc3: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  // FIXED: Fetch districts from correct API endpoint
  useEffect(() => {
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        console.log('🌐 Fetching districts from API...');
        
        // Use the CORRECT endpoint: /api/districts/public
        const response = await axios.get(`${API_BASE_URL}/api/districts/public`);
        console.log('📥 Districts API response:', response.data);

        // The response should be a direct array of districts
        if (response.data && Array.isArray(response.data)) {
          setDistricts(response.data);
          console.log('✅ Districts loaded successfully:', response.data.length, 'districts found');
        } else {
          console.warn('Unexpected districts response structure:', response.data);
          setDistricts([]);
        }
        
      } catch (error) {
        console.error('❌ Failed to fetch districts:', error);
        console.error('Error details:', error.response?.data);
        setDistricts([]);
        setMessage('Unable to load districts list. Please contact administrator.');
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
        const response = await axios.get(`${API_BASE_URL}/api/fees/school`);
        if (response.data.success) {
          setRegistrationFee(response.data.data.amount);
          console.log('✅ Registration fee loaded:', response.data.data.amount);
        }
      } catch (error) {
        console.error('Failed to fetch registration fee:', error);
        setRegistrationFee(1000);
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
    
    if (orderId && userType === 'school') {
      const checkPendingPayment = async () => {
        setMessage('Verifying your payment...');
        setLoading(true);
        
        try {
          const paymentResult = await checkPaymentStatus(orderId);
          
          if (paymentResult.success) {
            setMessage('Payment verified! Registration completed.');
            setPaymentVerified(true);
            localStorage.removeItem('pendingPaymentOrderId');
            localStorage.removeItem('pendingPaymentUserType');
            setTimeout(() => {
              onCompleteRegistration();
            }, 2000);
          } else {
            setMessage(`Payment verification failed: ${paymentResult.error}`);
            localStorage.removeItem('pendingPaymentOrderId');
            localStorage.removeItem('pendingPaymentUserType');
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
        schoolEmail: user?.email || '',
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
      if (!formData.selectedDistrict) {
        setMessage('Please select your district');
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
      
      const response = await axios.post(`${API_BASE_URL}/api/upload/single`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [fieldName]: percentCompleted }));
        }
      });

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
      const validPdfTypes = ['application/pdf'];
      const maxSize = 5 * 1024 * 1024;

      if (!validPdfTypes.includes(file.type)) {
        setMessage('Please upload PDF files only for certificates.');
        return;
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

      // First register the user if not already registered
      if (!user) {
        setMessage('Creating user account...');
        const userRegistrationData = {
          name: formData.schoolName,
          email: formData.email,
          password: formData.password,
          role: 'school',
          district: formData.selectedDistrict,
          districtShortcode,
          phone: formData.schoolContactNumber || '9999999999'
        };

        console.log('👤 Registering user:', userRegistrationData);

        try {
          const registerResponse = await axios.post(
            `${API_BASE_URL}/api/register/register`,
            userRegistrationData
          );
          console.log('✅ User registration successful:', registerResponse.data);
          setMessage('User account created. Proceeding to payment...');
        } catch (error) {
          console.error('❌ User registration error:', error.response?.data || error.message);
          if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
            console.log('ℹ️ User already exists, continuing with payment...');
            setMessage('User account exists. Proceeding to payment...');
          } else {
            throw new Error('User registration failed: ' + (error.response?.data?.error || error.message));
          }
        }
      }

      const orderData = {
        orderAmount: registrationFee,
        customerName: formData.schoolName,
        customerEmail: formData.email,
        customerPhone: formData.schoolContactNumber || formData.representativeNumber || '9999999999',
        userType: 'school',
        registrationData: {
          ...formData,
          districtShortcode,
          userId: user?._id,
          paymentAmount: registrationFee,
          paymentStatus: 'PENDING'
        }
      };

      console.log('💰 Payment order data for amount:', registrationFee, orderData);

      const paymentSession = await createPaymentSession(orderData);
      
      if (paymentSession.success) {
        setOrderId(paymentSession.data.order_id);
        
        localStorage.setItem('pendingPaymentOrderId', paymentSession.data.order_id);
        localStorage.setItem('pendingPaymentUserType', 'school');
        
        // Initialize Cashfree SDK
        console.log('🔄 Initializing Cashfree SDK...');
        const cashfree = await initializeCashfree();
        
        // Create checkout options for Cashfree
        const checkoutOptions = {
          paymentSessionId: paymentSession.data.payment_session_id,
          returnUrl: `${window.location.origin}/payment-success?order_id=${paymentSession.data.order_id}&user_type=school`,
          onSuccess: async (data) => {
            console.log('✅ Payment successful:', data);
            setMessage('Payment successful! Verifying payment...');
            
            // Verify payment with backend
            try {
              const verification = await verifyPayment(paymentSession.data.order_id);
              if (verification.success && verification.data.payment_status === 'SUCCESS') {
                setMessage('Payment verified! Registration completed.');
                setPaymentVerified(true);
                localStorage.removeItem('pendingPaymentOrderId');
                localStorage.removeItem('pendingPaymentUserType');
                
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required documents
      const requiredDocs = ['schoolRegistrationCertificate'];
      const missingDocs = requiredDocs.filter(doc => !formData.documents[doc]);

      if (missingDocs.length > 0) {
        setMessage(`Please upload all required documents: ${missingDocs.join(', ')}`);
        setLoading(false);
        return;
      }

      // Validate district selection
      if (!formData.selectedDistrict) {
        setMessage('Please select your district');
        setLoading(false);
        return;
      }

      // Validate school information
      if (!formData.schoolName || !formData.registrationNumber || !formData.schoolContactNumber || !formData.representativeName || !formData.representativeNumber) {
        setMessage('Please fill all required school information fields');
        setLoading(false);
        return;
      }

      console.log('🚀 Starting payment process for amount:', registrationFee);
      await initiatePayment();
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const acTypes = ['AC', 'Non-AC'];
  const yesNoOptions = ['Yes', 'No'];

  // Step indicator component
  const StepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Login Credentials</div>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">School Information</div>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Documents & Payment</div>
      </div>
    </div>
  );

  return (
    <div className="school-form-container">
      <div className="form-header">
        <h1>School Registration</h1>
        <p>Complete your school's profile to join Delhi Fencing Association</p>
      </div>

      <StepIndicator />

      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="school-form">
        
        {/* Step 1: Login Credentials */}
        {currentStep === 1 && (
          <section className="form-section login-credentials-section">
            <h2 className="section-title">
              <i className="fas fa-lock"></i>
              Login Credentials
            </h2>
            <p className="section-subtitle">Create login credentials for your school account</p>
            
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
                  placeholder="Enter school email address"
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
                Next: School Information
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </section>
        )}

        {/* Step 2: School Information */}
        {currentStep === 2 && (
          <>
            {/* Basic School Information */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-school"></i>
                Basic School Information
              </h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="schoolName">School Name *</label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter school name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registrationNumber">Registration/License Number *</label>
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter registration number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="schoolEmail">School Email *</label>
                  <input
                    type="email"
                    id="schoolEmail"
                    name="schoolEmail"
                    value={formData.schoolEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter school email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="schoolContactNumber">School Contact Number *</label>
                  <input
                    type="tel"
                    id="schoolContactNumber"
                    name="schoolContactNumber"
                    value={formData.schoolContactNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter school contact number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                  />
                </div>
              </div>
            </section>

            {/* Representative Information */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-user-tie"></i>
                Representative Information
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="representativeName">Representative Name *</label>
                  <input
                    type="text"
                    id="representativeName"
                    name="representativeName"
                    value={formData.representativeName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter representative name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="representativeNumber">Representative Number *</label>
                  <input
                    type="tel"
                    id="representativeNumber"
                    name="representativeNumber"
                    value={formData.representativeNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter representative number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="representativeEmail">Representative Email</label>
                  <input
                    type="email"
                    id="representativeEmail"
                    name="representativeEmail"
                    value={formData.representativeEmail}
                    onChange={handleInputChange}
                    placeholder="Enter representative email"
                  />
                </div>
              </div>
            </section>

            {/* Facility Information */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-building"></i>
                Facility Information
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="indoorHallMeasurement">Indoor Hall Measurement (sq. ft.) *</label>
                  <input
                    type="text"
                    id="indoorHallMeasurement"
                    name="indoorHallMeasurement"
                    value={formData.indoorHallMeasurement}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter measurement in sq. ft."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="acType">AC Type *</label>
                  <select
                    id="acType"
                    name="acType"
                    value={formData.acType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select AC Type</option>
                    {acTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="numberOfStudents">Number of Students Registered *</label>
                  <input
                    type="number"
                    id="numberOfStudents"
                    name="numberOfStudents"
                    value={formData.numberOfStudents}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter number of students"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hasAuditorium">Auditorium Available *</label>
                  <select
                    id="hasAuditorium"
                    name="hasAuditorium"
                    value={formData.hasAuditorium}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Option</option>
                    {yesNoOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="hasAssembleArea">Assembly Area Available *</label>
                  <select
                    id="hasAssembleArea"
                    name="hasAssembleArea"
                    value={formData.hasAssembleArea}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Option</option>
                    {yesNoOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="hasParkingArea">Parking Area Available *</label>
                  <select
                    id="hasParkingArea"
                    name="hasParkingArea"
                    value={formData.hasParkingArea}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Option</option>
                    {yesNoOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="coachName">Coach Name</label>
                  <input
                    type="text"
                    id="coachName"
                    name="coachName"
                    value={formData.coachName}
                    onChange={handleInputChange}
                    placeholder="Enter coach name"
                  />
                </div>

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
                    <option value="">{loadingDistricts ? 'Loading districts...' : 'Choose your district association'}</option>
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
              </div>
            </section>

            {/* Address Information */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-home"></i>
                School Address
              </h2>

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
                    placeholder="School Building, Street"
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
                  
                  <div className="document-item">
                    <label className="document-label">
                      School Registration Certificate *
                      <span className="document-requirement">(PDF - Max 5MB)</span>
                    </label>
                    <div className="file-upload-container">
                      <div 
                        className="file-upload-area"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'schoolRegistrationCertificate')}
                      >
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, 'schoolRegistrationCertificate')}
                          className="file-input"
                        />
                        <div className="upload-content">
                          <i className="fas fa-file-certificate"></i>
                          <div className="upload-text">
                            {formData.documents.schoolRegistrationCertificate ? (
                              <div className="file-success">
                                <i className="fas fa-check-circle"></i>
                                <span>Certificate Uploaded</span>
                              </div>
                            ) : (
                              <>
                                <span className="upload-title">Click to upload registration certificate</span>
                                <span className="upload-subtitle">or drag and drop PDF</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {uploadProgress.schoolRegistrationCertificate !== null && uploadProgress.schoolRegistrationCertificate !== undefined && (
                        <div className="upload-progress">
                          <div className="progress-info">
                            <span>Uploading: {uploadProgress.schoolRegistrationCertificate}%</span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${uploadProgress.schoolRegistrationCertificate}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                  <li>School registration certificate must be valid</li>
                  <li>Documents should be in PDF format</li>
                  <li>Maximum file size for each document is 5MB</li>
                  <li>Additional documents can include facility photos, accreditation certificates, etc.</li>
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
                <h3>Registration Fee: {feeLoading ? 'Loading...' : `₹${registrationFee}`}</h3>
                <p>Complete your school registration by making the payment. You will be redirected to secure payment gateway.</p>
                
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
              <button type="submit" className="submit-btn payment-btn" disabled={loading || paymentProcessing || paymentVerified}>
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

export default SchoolForm;