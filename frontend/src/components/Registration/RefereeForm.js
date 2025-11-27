import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/RefereeForm.css';

const RefereeForm = ({ user, registrationData, onCompleteRegistration }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Login Credentials
    email: '',
    password: '',
    confirmPassword: '',
    
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    mobileNumber: '',
    aadharNumber: '',
    fathersName: '',
    mothersName: '',
    
    // Address Information
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
    
    // Referee Information
    selectedDistrict: '',
    level: '',
    highestAchievement: '',
    trainingCenter: '',
    
    // Document URLs (will be set after upload)
    documents: {
      photo: '',
      aadharFront: '',
      aadharBack: '',
      refereeCertificate: '',
      doc1: '',
      doc2: '',
      doc3: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [isSameAddress, setIsSameAddress] = useState(false);

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
      // Validate email and password
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
    setCurrentStep(prev => prev + 1);
    setMessage('');
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setMessage('');
  };

  const handleFileUpload = async (file, fieldName) => {
    const formData = new FormData();
    formData.append('document', file);
    
    try {
      setUploadProgress(prev => ({ ...prev, [fieldName]: 0 }));
      
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [fieldName]: percentCompleted }));
        }
      });

      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [fieldName]: response.data.fileUrl
        }
      }));
      
      setUploadProgress(prev => ({ ...prev, [fieldName]: null }));
      return response.data.fileUrl;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [fieldName]: null }));
      setMessage('File upload failed. Please try again.');
      return null;
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const validPdfTypes = ['application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (fieldName.includes('photo') || fieldName.includes('aadhar')) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required documents
      const requiredDocs = ['photo', 'aadharFront', 'aadharBack', 'refereeCertificate'];
      const missingDocs = requiredDocs.filter(doc => !formData.documents[doc]);

      if (missingDocs.length > 0) {
        setMessage(`Please upload all required documents: ${missingDocs.join(', ')}`);
        setLoading(false);
        return;
      }

      const submissionData = {
        ...formData,
        userId: user?._id
      };

      const response = await axios.post('http://localhost:5000/api/referee/register', submissionData);
      
      setMessage('Registration submitted successfully! Proceeding to payment...');
      setTimeout(() => {
        // For now, skip payment and complete registration
        // In future, integrate payment gateway here
        onCompleteRegistration();
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const districts = ['North East', 'North West', 'South East', 'South West', 'Central'];
  const levels = [
    'National Participation',
    'Certificate Course',
    'Diploma',
    'FIE Coaching Courses',
    'More then 5 years',
    'More then 15 years',
    'FCA',
    'FIE'
  ];

  // Step indicator component
  const StepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Login Credentials</div>
      </div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Referee Information</div>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Documents & Payment</div>
      </div>
    </div>
  );

  return (
    <div className="referee-form-container">
      <div className="form-header">
        <h1>Referee Registration</h1>
        <p>Complete your profile to join Delhi Fencing Association as a Referee</p>
      </div>

      <StepIndicator />

      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="referee-form">
        
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
                Next: Referee Information
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Referee Information */}
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
              </div>

              <div className="form-row">
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

            {/* Referee Information Section */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-whistle"></i>
                Referee Information
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="selectedDistrict">Select District *</label>
                  <select
                    id="selectedDistrict"
                    name="selectedDistrict"
                    value={formData.selectedDistrict}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose your district</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="level">Referee Level *</label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select your level</option>
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
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
                    placeholder="Describe your highest achievement as a referee"
                    rows="4"
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
                      Passport Size Photo *
                      <span className="document-requirement">(JPEG, JPG, PNG - Max 5MB)</span>
                    </label>
                    <div className="file-upload-container">
                      <div 
                        className="file-upload-area"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'photo')}
                      >
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'photo')}
                          className="file-input"
                        />
                        <div className="upload-content">
                          <i className="fas fa-camera"></i>
                          <div className="upload-text">
                            {formData.documents.photo ? (
                              <div className="file-success">
                                <i className="fas fa-check-circle"></i>
                                <span>Photo Uploaded Successfully</span>
                              </div>
                            ) : (
                              <>
                                <span className="upload-title">Click to upload passport photo</span>
                                <span className="upload-subtitle">or drag and drop</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {uploadProgress.photo !== null && uploadProgress.photo !== undefined && (
                        <div className="upload-progress">
                          <div className="progress-info">
                            <span>Uploading: {uploadProgress.photo}%</span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${uploadProgress.photo}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="document-item">
                    <label className="document-label">
                      Aadhar Card Front *
                      <span className="document-requirement">(JPEG, JPG, PNG - Max 5MB)</span>
                    </label>
                    <div className="file-upload-container">
                      <div 
                        className="file-upload-area"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'aadharFront')}
                      >
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'aadharFront')}
                          className="file-input"
                        />
                        <div className="upload-content">
                          <i className="fas fa-id-card"></i>
                          <div className="upload-text">
                            {formData.documents.aadharFront ? (
                              <div className="file-success">
                                <i className="fas fa-check-circle"></i>
                                <span>Aadhar Front Uploaded</span>
                              </div>
                            ) : (
                              <>
                                <span className="upload-title">Click to upload Aadhar front</span>
                                <span className="upload-subtitle">or drag and drop</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {uploadProgress.aadharFront !== null && uploadProgress.aadharFront !== undefined && (
                        <div className="upload-progress">
                          <div className="progress-info">
                            <span>Uploading: {uploadProgress.aadharFront}%</span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${uploadProgress.aadharFront}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="document-item">
                    <label className="document-label">
                      Aadhar Card Back *
                      <span className="document-requirement">(JPEG, JPG, PNG - Max 5MB)</span>
                    </label>
                    <div className="file-upload-container">
                      <div 
                        className="file-upload-area"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'aadharBack')}
                      >
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, 'aadharBack')}
                          className="file-input"
                        />
                        <div className="upload-content">
                          <i className="fas fa-id-card"></i>
                          <div className="upload-text">
                            {formData.documents.aadharBack ? (
                              <div className="file-success">
                                <i className="fas fa-check-circle"></i>
                                <span>Aadhar Back Uploaded</span>
                              </div>
                            ) : (
                              <>
                                <span className="upload-title">Click to upload Aadhar back</span>
                                <span className="upload-subtitle">or drag and drop</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {uploadProgress.aadharBack !== null && uploadProgress.aadharBack !== undefined && (
                        <div className="upload-progress">
                          <div className="progress-info">
                            <span>Uploading: {uploadProgress.aadharBack}%</span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${uploadProgress.aadharBack}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="document-item">
                    <label className="document-label">
                      Referee Certificate *
                      <span className="document-requirement">(PDF - Max 5MB)</span>
                    </label>
                    <div className="file-upload-container">
                      <div 
                        className="file-upload-area"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'refereeCertificate')}
                      >
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, 'refereeCertificate')}
                          className="file-input"
                        />
                        <div className="upload-content">
                          <i className="fas fa-file-certificate"></i>
                          <div className="upload-text">
                            {formData.documents.refereeCertificate ? (
                              <div className="file-success">
                                <i className="fas fa-check-circle"></i>
                                <span>Certificate Uploaded</span>
                              </div>
                            ) : (
                              <>
                                <span className="upload-title">Click to upload certificate</span>
                                <span className="upload-subtitle">or drag and drop PDF</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {uploadProgress.refereeCertificate !== null && uploadProgress.refereeCertificate !== undefined && (
                        <div className="upload-progress">
                          <div className="progress-info">
                            <span>Uploading: {uploadProgress.refereeCertificate}%</span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${uploadProgress.refereeCertificate}%` }}
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
                <h3>Registration Fee: ₹500</h3>
                <p>Complete your registration by making the payment. Your registration will be processed after successful payment.</p>
                <div className="payment-features">
                  <div className="feature">
                    <i className="fas fa-shield-alt"></i>
                    <span>Secure Payment</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-clock"></i>
                    <span>Instant Confirmation</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-file-invoice"></i>
                    <span>Payment Receipt</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="form-actions step-actions">
              <button type="button" className="prev-btn" onClick={prevStep}>
                <i className="fas fa-arrow-left"></i>
                Previous
              </button>
              <button type="submit" className="submit-btn payment-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
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

export default RefereeForm;