import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { initializeCashfree, createPaymentSession, verifyPayment } from '../../services/paymentService';
import '../../styles/FencerForm.css';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://fencing-app-backend.onrender.com';

const FencerForm = ({ user, registrationData, onCompleteRegistration }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(500);
  const [feeLoading, setFeeLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editApplicationId, setEditApplicationId] = useState(null);
  const [editApplicationData, setEditApplicationData] = useState(null);
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
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Check if we're in edit mode (from ApplicationStatus.js)
  useEffect(() => {
    const storedEditData = localStorage.getItem('editApplicationData');
    if (storedEditData) {
      try {
        const editData = JSON.parse(storedEditData);
        if (editData.isEditMode && editData.userType === 'fencer') {
          setIsEditMode(true);
          setEditApplicationId(editData.applicationId);
          setEditApplicationData(editData);

          // Pre-fill form with existing data
          setFormData(prev => ({
            ...prev,
            email: editData.email || user?.email || '',
            firstName: editData.firstName || '',
            middleName: editData.middleName || '',
            lastName: editData.lastName || '',
            aadharNumber: editData.aadharNumber || '',
            fathersName: editData.fathersName || '',
            mothersName: editData.mothersName || '',
            mobileNumber: editData.mobileNumber || '',
            dateOfBirth: editData.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : '',
            permanentAddress: editData.permanentAddress || {
              addressLine1: '',
              addressLine2: '',
              state: '',
              district: '',
              pinCode: ''
            },
            presentAddress: editData.presentAddress || {
              addressLine1: '',
              addressLine2: '',
              state: '',
              district: '',
              pinCode: ''
            },
            highestAchievement: editData.highestAchievement || '',
            coachName: editData.coachName || '',
            trainingCenter: editData.trainingCenter || '',
            selectedDistrict: editData.selectedDistrict || '',
            documents: editData.documents || {
              passportPhoto: '',
              aadharFront: '',
              aadharBack: '',
              birthCertificate: '',
              doc1: '',
              doc2: '',
              doc3: ''
            }
          }));

          // Check if present address is same as permanent
          if (editData.presentAddress && editData.permanentAddress) {
            const isSame = JSON.stringify(editData.presentAddress) === JSON.stringify(editData.permanentAddress);
            setIsSameAddress(isSame);
          }

          setMessage('Edit mode activated. You can update your application.');

          // Remove from localStorage after loading
          localStorage.removeItem('editApplicationData');
        }
      } catch (error) {
        console.error('Error parsing edit data:', error);
      }
    }
  }, [user]);

  // FIXED: District loading — now 100% reliable + handles all response types
  // FIXED: District loading — now uses correct endpoint
  useEffect(() => {
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        console.log('Fetching districts from:', `${API_BASE_URL}/api/districts/public`);
        const response = await axios.get(`${API_BASE_URL}/api/districts/public`);
        console.log('Districts API response:', response.data);

        let districtList = [];

        // The response from /api/districts/public should be a direct array
        if (Array.isArray(response.data)) {
          districtList = response.data;
        }

        const activeDistricts = districtList.filter(d => d.isActive !== false && d.name);
        setDistricts(activeDistricts);
        console.log('Districts loaded:', activeDistricts.map(d => d.name));

        if (activeDistricts.length === 0) {
          setMessage('No districts available. Please contact admin.');
        }
      } catch (error) {
        console.error('Failed to load districts:', error);
        setMessage('Using default districts (server unreachable)');

        // Fallback Delhi districts
        const fallback = [
          { _id: '1', name: 'Central Delhi', code: 'CD' },
          { _id: '2', name: 'North Delhi', code: 'ND' },
          { _id: '3', name: 'South Delhi', code: 'SD' },
          { _id: '4', name: 'East Delhi', code: 'ED' },
          { _id: '5', name: 'North East Delhi', code: 'NED' },
          { _id: '6', name: 'North West Delhi', code: 'NWD' },
          { _id: '7', name: 'West Delhi', code: 'WD' },
          { _id: '8', name: 'South West Delhi', code: 'SWD' },
          { _id: '9', name: 'New Delhi', code: 'ND' }
        ];
        setDistricts(fallback);
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, []);
  // Fetch registration fee from API (only for new registrations)
  useEffect(() => {
    if (!isEditMode) {
      const fetchRegistrationFee = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/fees/fencer`);
          if (response.data.success) {
            setRegistrationFee(response.data.data.amount);
            console.log('Registration fee loaded:', response.data.data.amount);
          }
        } catch (error) {
          console.error('Failed to fetch registration fee:', error);
          setRegistrationFee(500);
        } finally {
          setFeeLoading(false);
        }
      };
      fetchRegistrationFee();
    } else {
      setFeeLoading(false);
    }
  }, [isEditMode]);

  // FIXED: Check for pending payments ONLY when returning from payment gateway
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    const userType = urlParams.get('user_type');

    if (orderId && userType === 'fencer' && !isEditMode) {
      const checkPendingPayment = async () => {
        setMessage('Verifying your payment and completing registration...');
        setLoading(true);

        try {
          const paymentResult = await checkPaymentStatus(orderId);

          if (paymentResult.success) {
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
  }, [onCompleteRegistration, isEditMode]);

  // Pre-fill email and district if available from registration
  useEffect(() => {
    if (registrationData && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        email: user?.email || '',
        selectedDistrict: registrationData.district || ''
      }));
    }
  }, [registrationData, user, isEditMode]);

  // FIXED: handleAddressCopy as useCallback to fix React warning
  const handleAddressCopy = useCallback(() => {
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
  }, [isSameAddress]);

  useEffect(() => {
    handleAddressCopy();
  }, [isSameAddress, handleAddressCopy]);

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
      // For edit mode, skip password validation if passwords are empty
      if (!isEditMode) {
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
      } else {
        // In edit mode, only validate email
        if (!formData.email) {
          setMessage('Email is required');
          return;
        }
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
        console.log(`Payment check attempt ${attempt}/${maxAttempts}`);
        const result = await verifyPayment(orderId);

        if (result.data?.payment_status === 'SUCCESS' || result.data?.order_status === 'PAID') {
          console.log('Payment successful!');
          return { success: true, data: result.data };
        } else if (result.data?.payment_status === 'FAILED') {
          console.log('Payment failed');
          return { success: false, error: 'Payment failed' };
        }

        console.log('Payment still processing, waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Payment check attempt ${attempt} failed:`, error);
      }
    }

    return { success: false, error: 'Payment verification timeout' };
  };

  // Function to complete fencer registration after payment
  const completeFencerRegistration = async (registrationData) => {
    try {
      console.log('Completing fencer registration:', registrationData);

      const response = await axios.post(`${API_BASE_URL}/api/fencer/register`, registrationData);
      console.log('Fencer registration completed successfully:', response.data);

      return response.data;
    } catch (error) {
      console.error('Error completing fencer registration:', error);
      throw new Error('Failed to complete registration: ' + (error.response?.data?.error || error.message));
    }
  };

  // NEW: Function to update existing application (for edit mode)
  const updateFencerApplication = async () => {
    try {
      setIsResubmitting(true);
      setMessage('Updating your application...');

      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;

      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Prepare update data (exclude password fields in edit mode)
      const updateData = {
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

      console.log('Updating application with ID:', editApplicationId, updateData);

      const response = await axios.put(
        `${API_BASE_URL}/api/admin/update-application/fencer/${editApplicationId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setMessage('Application updated successfully! Submitted for district admin review.');

        // Clear edit mode flags
        setIsEditMode(false);
        setEditApplicationId(null);
        setEditApplicationData(null);

        // Redirect to application status after delay
        setTimeout(() => {
          window.location.href = '/application-status';
        }, 2000);

        return response.data;
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating fencer application:', error);
      throw new Error('Failed to update application: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsResubmitting(false);
    }
  };

  const initiatePayment = async () => {
    try {
      setPaymentProcessing(true);
      setMessage('Creating payment session...');

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

      console.log('Registration data prepared:', registrationData);

      const orderData = {
        orderAmount: registrationFee,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        customerEmail: formData.email,
        customerPhone: formData.mobileNumber || '9999999999',
        userType: 'fencer',
        registrationData: registrationData
      };

      console.log('Payment order data for amount:', registrationFee, orderData);

      const paymentSession = await createPaymentSession(orderData);

      if (paymentSession.success) {
        localStorage.setItem('pendingPaymentOrderId', paymentSession.data.order_id);
        localStorage.setItem('pendingPaymentUserType', 'fencer');
        localStorage.setItem('pendingRegistrationData', JSON.stringify(registrationData));

        // Initialize Cashfree SDK
        console.log('Initializing Cashfree SDK...');
        const cashfree = await initializeCashfree();

        // Create checkout options for Cashfree
        const checkoutOptions = {
          paymentSessionId: paymentSession.data.payment_session_id,
          returnUrl: `${window.location.origin}/payment-success?order_id=${paymentSession.data.order_id}&user_type=fencer`,
          onSuccess: async (data) => {
            console.log('Payment successful:', data);
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
            console.error('Payment failed:', data);
            setMessage(`Payment failed: ${data.error?.message || 'Unknown error'}`);
            setPaymentProcessing(false);
            setLoading(false);
            localStorage.removeItem('pendingPaymentOrderId');
            localStorage.removeItem('pendingPaymentUserType');
            localStorage.removeItem('pendingRegistrationData');
          },
          onRedirect: (data) => {
            console.log('Payment redirecting:', data);
          }
        };

        console.log('Opening Cashfree checkout...');
        // Open Cashfree checkout
        cashfree.checkout(checkoutOptions);

      } else {
        throw new Error(paymentSession.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
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
      // Validate required documents (only for new registrations or if documents are missing)
      if (!isEditMode) {
        const requiredDocs = ['passportPhoto', 'aadharFront', 'aadharBack', 'birthCertificate'];
        const missingDocs = requiredDocs.filter(doc => !formData.documents[doc]);

        if (missingDocs.length > 0) {
          setMessage(`Please upload all required documents: ${missingDocs.join(', ')}`);
          setLoading(false);
          return;
        }
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

      if (isEditMode) {
        // EDIT MODE: Update existing application (no payment needed)
        console.log('Starting application update...');
        await updateFencerApplication();
      } else {
        // NEW REGISTRATION: Proceed with payment
        console.log('Starting payment process for amount:', registrationFee);
        await initiatePayment();
      }

    } catch (error) {
      console.error('Registration/Update error:', error);
      setMessage(error.response?.data?.error || error.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">{isEditMode ? 'Account Info' : 'Login Credentials'}</div>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Personal Info</div>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">{isEditMode ? 'Documents & Update' : 'Documents & Payment'}</div>
      </div>
    </div>
  );

  // Cancel edit mode
  const handleCancelEdit = () => {
    if (window.confirm('Are you sure you want to cancel editing? Your changes will be lost.')) {
      setIsEditMode(false);
      setEditApplicationId(null);
      setEditApplicationData(null);
      window.location.href = '/application-status';
    }
  };

  return (
    <div className="fencer-form-container">
      <div className="form-header">
        <h1>
          {isEditMode ? '✏️ Edit Fencer Application' : 'Fencer Registration'}
          {isEditMode && <span className="edit-badge">Edit Mode</span>}
        </h1>
        <p>
          {isEditMode
            ? 'Update your application details and resubmit for district admin review.'
            : 'Complete your profile to join Delhi Fencing Association'}
        </p>
        {isEditMode && (
          <div className="edit-mode-notice">
            <p><strong>Note:</strong> You're editing a previously rejected application. No payment is required for resubmission.</p>
            <button className="cancel-edit-btn" onClick={handleCancelEdit}>
              Cancel Edit
            </button>
          </div>
        )}
      </div>

      <StepIndicator />

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="fencer-form">
        {/* Step 1: Login Credentials / Account Info */}
        {currentStep === 1 && (
          <section className="form-section login-credentials-section">
            <h2 className="section-title">
              {isEditMode ? 'Account Information' : 'Login Credentials'}
            </h2>
            <p className="section-subtitle">
              {isEditMode
                ? 'Your account information (password optional for updates)'
                : 'Create your login credentials for future access'}
            </p>

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
                  disabled={isEditMode} // Email cannot be changed in edit mode
                />
                {isEditMode && <small className="field-note">Email cannot be changed</small>}
              </div>
            </div>

            {!isEditMode && (
              <>
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
                      <div className={`password-strength ${formData.password.length < 6 ? 'weak' :
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
              </>
            )}

            {isEditMode && (
              <div className="form-row">
                <div className="form-group full-width">
                  <div className="info-box">
                    <p><strong>Edit Mode Notice:</strong></p>
                    <ul>
                      <li>You can update your personal and fencing information</li>
                      <li>Documents can be replaced if needed</li>
                      <li>No payment is required for resubmission</li>
                      <li>After updating, your application will go back to "pending" status</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions step-actions">
              {isEditMode && (
                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
              <div style={{ flex: 1 }}></div>
              <button type="button" className="next-btn" onClick={nextStep}>
                Next: Personal Information
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Personal & Fencing Information (same as before but with edit mode notes) */}
        {currentStep === 2 && (
          <>
            {/* Personal Information Section */}
            <section className="form-section">
              <h2 className="section-title">
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
                    disabled={isEditMode} // Aadhar cannot be changed
                  />
                  {isEditMode && <small className="field-note">Aadhar number cannot be changed</small>}
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
                    disabled={loadingDistricts || isEditMode} // District cannot be changed in edit mode
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
                  {isEditMode && <small className="field-note">District cannot be changed</small>}
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
                Previous
              </button>
              <button type="button" className="next-btn" onClick={nextStep}>
                Next: {isEditMode ? 'Documents & Update' : 'Documents & Payment'}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Documents & Payment/Update */}
        {currentStep === 3 && (
          <>
            {/* Documents Upload Section */}
            <section className="form-section">
              <h2 className="section-title">
                Documents Upload
              </h2>
              <p className="section-subtitle">
                {isEditMode
                  ? 'Update documents if needed. Existing documents will be kept if not changed.'
                  : 'Upload all required documents. Maximum file size: 5MB per file'}
              </p>

              <div className="documents-grid">
                {/* Required Documents */}
                <div className="document-group required">
                  <h3>Required Documents {!isEditMode && '*'}</h3>
                  <p className="document-subtitle">
                    {isEditMode
                      ? 'These documents are required. Upload new versions if needed.'
                      : 'These documents are mandatory for registration'}
                  </p>

                  {[
                    { key: 'passportPhoto', label: 'Passport Size Photo', type: 'image', icon: 'camera' },
                    { key: 'aadharFront', label: 'Aadhar Card Front', type: 'image', icon: 'id-card' },
                    { key: 'aadharBack', label: 'Aadhar Card Back', type: 'image', icon: 'id-card' },
                    { key: 'birthCertificate', label: 'Birth Certificate or 10th Certificate', type: 'pdf', icon: 'file-pdf' }
                  ].map((doc) => (
                    <div key={doc.key} className="document-item">
                      <label className="document-label">
                        {doc.label} {!isEditMode && '*'}
                        <span className="document-requirement">
                          ({doc.type === 'image' ? 'JPEG, JPG, PNG - Max 5MB' : 'PDF - Max 5MB'})
                        </span>
                        {isEditMode && formData.documents[doc.key] && (
                          <span className="document-exists">✓ Already uploaded</span>
                        )}
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
                                  <span>
                                    {isEditMode ? 'Document exists' : doc.label + ' Uploaded'}
                                  </span>
                                  {isEditMode && (
                                    <button
                                      type="button"
                                      className="replace-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        document.querySelector(`input[type="file"][accept="${doc.type === 'image' ? '.jpg,.jpeg,.png' : '.pdf'}"]`).click();
                                      }}
                                    >
                                      Replace
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <span className="upload-title">
                                    {isEditMode ? 'Upload new version' : `Click to upload ${doc.label.toLowerCase()}`}
                                  </span>
                                  <span className="upload-subtitle">
                                    or drag and drop {doc.type === 'image' ? 'image' : 'PDF'}
                                  </span>
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
                        {isEditMode && formData.documents[`doc${num}`] && (
                          <span className="document-exists">✓ Already uploaded</span>
                        )}
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
                                  <span>
                                    {isEditMode ? 'Document exists' : `Document ${num} Uploaded`}
                                  </span>
                                  {isEditMode && (
                                    <button
                                      type="button"
                                      className="replace-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        document.querySelector(`input[type="file"][accept=".pdf"]`).click();
                                      }}
                                    >
                                      Replace
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <span className="upload-title">
                                    {isEditMode ? 'Upload new document' : 'Click to upload document'}
                                  </span>
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
                  {isEditMode && <li>Only upload new documents if you need to replace existing ones</li>}
                </ul>
              </div>
            </section>

            {/* Payment/Update Notice */}
            {!isEditMode ? (
              <section className="form-section">
                <h2 className="section-title">
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
                      Test Mode - Using Sandbox Environment
                    </div>
                  )}

                  <div className="payment-features">
                    <div className="feature">
                      Secure Payment
                    </div>
                    <div className="feature">
                      Multiple Payment Options
                    </div>
                    <div className="feature">
                      Instant Receipt
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="form-section">
                <h2 className="section-title">
                  Resubmission Information
                </h2>
                <div className="update-notice">
                  <h3>
                    No Payment Required
                  </h3>
                  <p>Since you're updating a previously submitted application, no payment is required.</p>
                  <p>After updating your application, it will be submitted for district admin review again.</p>

                  <div className="update-features">
                    <div className="feature">
                      Free Resubmission
                    </div>
                    <div className="feature">
                      Quick Review Process
                    </div>
                    <div className="feature">
                      Status Updates
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="form-actions step-actions">
              <button type="button" className="prev-btn" onClick={prevStep}>
                Previous
              </button>
              <button
                type="submit"
                className={`submit-btn ${isEditMode ? 'update-btn' : 'payment-btn'}`}
                disabled={loading || paymentProcessing || paymentVerified || isResubmitting}
              >
                {isEditMode ? (
                  isResubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Updating Application...
                    </>
                  ) : (
                    'Update & Resubmit Application'
                  )
                ) : paymentVerified ? (
                  <>
                    Registration Completed!
                  </>
                ) : (loading || paymentProcessing) ? (
                  <>
                    <div className="spinner"></div>
                    {paymentProcessing ? 'Processing Payment...' : 'Processing...'}
                  </>
                ) : (
                  <>
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