import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/ClubForm.css';

const ClubForm = ({ user, registrationData, onCompleteRegistration }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [numberOfCoaches, setNumberOfCoaches] = useState(0);
  const [coaches, setCoaches] = useState([]);
  
  const [formData, setFormData] = useState({
    // Login Credentials
    email: '',
    password: '',
    confirmPassword: '',
    
    // Club/Academy Information
    clubName: '',
    clubEmail: '',
    clubContactNumber: '',
    representativeName: '',
    representativeNumber: '',
    representativeEmail: '',
    indoorHallMeasurement: '',
    acType: '',
    hasAuditorium: '',
    hasAssembleArea: '',
    hasParkingArea: '',
    numberOfStudents: '',
    
    // Address Information
    permanentAddress: {
      addressLine1: '',
      addressLine2: '',
      state: '',
      district: '',
      pinCode: ''
    },
    
    // District Information
    selectedDistrict: '',
    
    // Document URLs (will be set after upload)
    documents: {
      clubRegistrationCertificate: '',
      doc1: '',
      doc2: '',
      doc3: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  // Pre-fill email and district if available from registration
  useEffect(() => {
    if (registrationData) {
      setFormData(prev => ({
        ...prev,
        email: user?.email || '',
        clubEmail: user?.email || '',
        selectedDistrict: registrationData.district || ''
      }));
    }
  }, [registrationData, user]);

  // Initialize coaches array when numberOfCoaches changes
  useEffect(() => {
    const newCoaches = [];
    for (let i = 0; i < numberOfCoaches; i++) {
      newCoaches.push(coaches[i] || { name: '', qualification: '', experience: '' });
    }
    setCoaches(newCoaches);
  }, [numberOfCoaches]);

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

  const handleCoachChange = (index, field, value) => {
    const updatedCoaches = [...coaches];
    updatedCoaches[index] = {
      ...updatedCoaches[index],
      [field]: value
    };
    setCoaches(updatedCoaches);
  };

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
      const validPdfTypes = ['application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required documents
      const requiredDocs = ['clubRegistrationCertificate'];
      const missingDocs = requiredDocs.filter(doc => !formData.documents[doc]);

      if (missingDocs.length > 0) {
        setMessage(`Please upload all required documents: ${missingDocs.join(', ')}`);
        setLoading(false);
        return;
      }

      const submissionData = {
        ...formData,
        coaches: coaches,
        userId: user?._id
      };

      const response = await axios.post('http://localhost:5000/api/club/register', submissionData);
      
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
        <div className="step-label">Club Information</div>
      </div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Documents & Payment</div>
      </div>
    </div>
  );

  return (
    <div className="club-form-container">
      <div className="form-header">
        <h1>Club/Academy Registration</h1>
        <p>Complete your club/academy profile to join Delhi Fencing Association</p>
      </div>

      <StepIndicator />

      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="club-form">
        
        {/* Step 1: Login Credentials */}
        {currentStep === 1 && (
          <section className="form-section login-credentials-section">
            <h2 className="section-title">
              <i className="fas fa-lock"></i>
              Login Credentials
            </h2>
            <p className="section-subtitle">Create login credentials for your club/academy account</p>
            
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
                  placeholder="Enter club/academy email address"
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
                Next: Club Information
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Club Information */}
        {currentStep === 2 && (
          <>
            {/* Basic Club Information */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-chess-knight"></i>
                Basic Club/Academy Information
              </h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="clubName">Club/Academy Name *</label>
                  <input
                    type="text"
                    id="clubName"
                    name="clubName"
                    value={formData.clubName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter club/academy name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="clubEmail">Club/Academy Email *</label>
                  <input
                    type="email"
                    id="clubEmail"
                    name="clubEmail"
                    value={formData.clubEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter club/academy email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="clubContactNumber">Club/Academy Contact Number *</label>
                  <input
                    type="tel"
                    id="clubContactNumber"
                    name="clubContactNumber"
                    value={formData.clubContactNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter contact number"
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
                  <label htmlFor="numberOfCoaches">Number of Coaches *</label>
                  <input
                    type="number"
                    id="numberOfCoaches"
                    name="numberOfCoaches"
                    value={numberOfCoaches}
                    onChange={(e) => setNumberOfCoaches(parseInt(e.target.value) || 0)}
                    required
                    placeholder="Enter number of coaches"
                    min="0"
                  />
                </div>

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
              </div>
            </section>

            {/* Coaches Information - Dynamic Fields */}
            {numberOfCoaches > 0 && (
              <section className="form-section">
                <h2 className="section-title">
                  <i className="fas fa-users"></i>
                  Coaches Information
                </h2>
                <p className="section-subtitle">Please provide details for all {numberOfCoaches} coach(es)</p>

                {coaches.map((coach, index) => (
                  <div key={index} className="coach-section">
                    <h3 className="coach-title">Coach {index + 1}</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`coach-name-${index}`}>Coach Name *</label>
                        <input
                          type="text"
                          id={`coach-name-${index}`}
                          value={coach.name}
                          onChange={(e) => handleCoachChange(index, 'name', e.target.value)}
                          required
                          placeholder="Enter coach name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`coach-qualification-${index}`}>Qualification *</label>
                        <input
                          type="text"
                          id={`coach-qualification-${index}`}
                          value={coach.qualification}
                          onChange={(e) => handleCoachChange(index, 'qualification', e.target.value)}
                          required
                          placeholder="Enter qualification"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`coach-experience-${index}`}>Experience (Years) *</label>
                        <input
                          type="number"
                          id={`coach-experience-${index}`}
                          value={coach.experience}
                          onChange={(e) => handleCoachChange(index, 'experience', e.target.value)}
                          required
                          placeholder="Years of experience"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Address Information */}
            <section className="form-section">
              <h2 className="section-title">
                <i className="fas fa-home"></i>
                Club/Academy Address
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
                    placeholder="Club/Academy Building, Street"
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
                      Club/Academy Registration Certificate *
                      <span className="document-requirement">(PDF - Max 5MB)</span>
                    </label>
                    <div className="file-upload-container">
                      <div 
                        className="file-upload-area"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'clubRegistrationCertificate')}
                      >
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, 'clubRegistrationCertificate')}
                          className="file-input"
                        />
                        <div className="upload-content">
                          <i className="fas fa-file-certificate"></i>
                          <div className="upload-text">
                            {formData.documents.clubRegistrationCertificate ? (
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
                      {uploadProgress.clubRegistrationCertificate !== null && uploadProgress.clubRegistrationCertificate !== undefined && (
                        <div className="upload-progress">
                          <div className="progress-info">
                            <span>Uploading: {uploadProgress.clubRegistrationCertificate}%</span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${uploadProgress.clubRegistrationCertificate}%` }}
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
                  <li>Club/Academy registration certificate must be valid</li>
                  <li>Documents should be in PDF format</li>
                  <li>Maximum file size for each document is 5MB</li>
                  <li>Additional documents can include facility photos, coach certificates, etc.</li>
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
                <h3>Registration Fee: ₹1500</h3>
                <p>Complete your club/academy registration by making the payment. Your registration will be processed after successful payment.</p>
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

export default ClubForm;