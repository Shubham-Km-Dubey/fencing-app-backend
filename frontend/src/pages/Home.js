import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://fencing-app-backend.onrender.com';

const Home = ({ onLogin, onStartRegistration }) => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    role: 'fencer',
    district: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [registrationFees, setRegistrationFees] = useState({});
  const [feesLoading, setFeesLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch registration fees from API
  useEffect(() => {
    const fetchRegistrationFees = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/fees`);
        if (response.data.success) {
          const feesMap = {};
          response.data.data.forEach(fee => {
            feesMap[fee.userType] = fee.amount;
          });
          setRegistrationFees(feesMap);
        }
      } catch (error) {
        console.error('Failed to fetch registration fees:', error);
        // Fallback to default fees if API fails
        setRegistrationFees({
          fencer: 500,
          coach: 1000,
          referee: 800,
          school: 2000,
          club: 3000
        });
      } finally {
        setFeesLoading(false);
      }
    };

    fetchRegistrationFees();
  }, []);

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);
      const data = response.data || {};

      console.log('🔐 Login API response:', data);

      // Support both shapes:
      // 1) { token, user: { ... } }
      // 2) { token, email, role, ... } (flattened)
      const token = data.token;
      const backendUser = data.user || data;

      if (!token) {
        console.error('❌ No token received from backend');
        setMessage('Login failed. Server did not return a token.');
        setLoading(false);
        return;
      }

      const userForApp = {
        ...backendUser,
        token
      };

      onLogin(userForApp);
      setMessage('Login successful! Redirecting...');
    } catch (error) {
      console.error('Login error:', error?.response?.data || error.message);
      setMessage('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const startDirectRegistration = (userType) => {
    navigate(`/register/${userType}`);
  };

  // User type cards data with dynamic fees
  const userTypes = [
    {
      type: 'fencer',
      title: 'Fencer',
      icon: 'fas fa-user',
      description: 'Individual fencing athlete registration',
      duration: '1 Year',
      fee: feesLoading ? 'Loading...' : `₹${registrationFees.fencer || 500}`,
      features: ['Tournament Participation', 'Ranking System', 'Training Log', 'Official Certificate'],
      color: '#4299e1'
    },
    {
      type: 'coach',
      title: 'Coach',
      icon: 'fas fa-chalkboard-teacher',
      description: 'Professional fencing coach registration',
      duration: '1 Year',
      fee: feesLoading ? 'Loading...' : `₹${registrationFees.coach || 1000}`,
      features: ['Coach Certification', 'Student Management', 'Training Programs', 'Performance Analytics'],
      color: '#38a169'
    },
    {
      type: 'referee',
      title: 'Referee',
      icon: 'fas fa-whistle',
      description: 'Official referee and judge registration',
      duration: '1 Year',
      fee: feesLoading ? 'Loading...' : `₹${registrationFees.referee || 800}`,
      features: ['Referee Certification', 'Match Assignments', 'Rule Updates', 'Workshop Access'],
      color: '#ed8936'
    },
    {
      type: 'school',
      title: 'School',
      icon: 'fas fa-school',
      description: 'Educational institution registration',
      duration: '1 Year',
      fee: feesLoading ? 'Loading...' : `₹${registrationFees.school || 2000}`,
      features: ['Team Management', 'Event Hosting', 'Coach Portal', 'Student Portal'],
      color: '#9f7aea'
    },
    {
      type: 'club',
      title: 'Club',
      icon: 'fas fa-users',
      description: 'Fencing club and academy registration',
      duration: '1 Year',
      fee: feesLoading ? 'Loading...' : `₹${registrationFees.club || 3000}`,
      features: ['Member Management', 'Facility Booking', 'Event Management', 'Branding Rights'],
      color: '#f56565'
    }
  ];

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-container">
          <div className="logo-brand">
            <img src={require('../assets/logo.png')} alt="Delhi Fencing Association" className="brand-logo" />
            <div className="brand-text">
              <h1 className="brand-title">Delhi Fencing Association</h1>
              <p className="brand-subtitle">Official Management System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        <div className="main-container">
          {/* Login Section */}
          <section className="login-section">
            <div className="login-container">
              <div className="login-header">
                <h2 className="login-title">Member Login</h2>
                <p className="login-subtitle">Access your DFA dashboard</p>
              </div>

              <div className="login-content">
                {message && (
                  <div className={`alert ${message.includes('successful') ? 'success' : 'error'}`}>
                    <i className={`fas ${message.includes('successful') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    {message}
                  </div>
                )}

                <form className="login-form" onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-group">
                      <i className="fas fa-envelope"></i>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-group">
                      <i className="fas fa-lock"></i>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt"></i>
                        Sign In to Dashboard
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Registration Section */}
          <section className="registration-section">
            <div className="registration-header">
              <h2 className="registration-title">New Registration</h2>
              <p className="registration-subtitle">Choose your role and join Delhi Fencing Association</p>
            </div>

            <div className="registration-cards-grid">
              {userTypes.map((userType) => (
                <div 
                  key={userType.type}
                  className="registration-card"
                  onClick={() => startDirectRegistration(userType.type)}
                  style={{ '--card-color': userType.color }}
                >
                  <div className="card-icon" style={{ backgroundColor: userType.color }}>
                    <i className={userType.icon}></i>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="card-title">{userType.title}</h3>
                    <p className="card-description">{userType.description}</p>
                    
                    <div className="card-details">
                      <div className="detail-item">
                        <span className="detail-label">Duration</span>
                        <span className="detail-value">{userType.duration}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Registration Fee</span>
                        <span className="detail-value fee">{userType.fee}</span>
                      </div>
                    </div>

                    <div className="card-features">
                      <h4>Features Included:</h4>
                      <ul className="features-list">
                        {userType.features.map((feature, index) => (
                          <li key={index} className="feature-item">
                            <i className="fas fa-check"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button className="register-btn" onClick={(e) => {
                    e.stopPropagation();
                    startDirectRegistration(userType.type);
                  }}>
                    <i className="fas fa-arrow-right"></i>
                    Register Now
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
