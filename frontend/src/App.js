import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import SuperAdminDashboard from './components/Admin/SuperAdmin/SuperAdminDashboard';
import FencerForm from './components/Registration/FencerForm';
import CoachForm from './components/Registration/CoachForm';
import RefereeForm from './components/Registration/RefereeForm';
import SchoolForm from './components/Registration/SchoolForm';
import ClubForm from './components/Registration/ClubForm';
import PaymentSuccess from './pages/PaymentSuccess';
import './styles/App.css';

// Create a simple Login component since the import might be failing
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');

    try {
      // For now, create a mock login
      const mockUser = {
        _id: '1',
        email: email,
        role: 'fencer',
        district: 'Central Delhi',
        name: 'Test User',
        isApproved: false,
        token: 'mock_token_' + Date.now()
      };
      
      onLogin(mockUser);
      setMessage('Login successful!');
    } catch (error) {
      setMessage('Login failed. Please try again.');
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '30px',
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
            placeholder="Enter your email"
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
            placeholder="Enter your password"
          />
        </div>
        {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2c3e50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Debug: Check if token exists
    console.log('🔐 App Mount - Token check:', token ? 'Present' : 'Missing');
    console.log('🔐 App Mount - User check:', userData ? 'Present' : 'Missing');
  }, []);

  const login = (userData) => {
    console.log('🔐 Login called with userData:', userData);

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // CRITICAL FIX: Store the token separately
    if (userData.token) {
      localStorage.setItem('token', userData.token);
      console.log('✅ Token stored in localStorage');
    } else {
      console.error('❌ No token in userData during login');
    }
  };

  const logout = () => {
    console.log('🔐 Logout called');
    setUser(null);
    setRegistrationData(null);
    // Remove both user and token from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const startRegistration = (userType, district) => {
    setRegistrationData({ userType, district });
  };

  const completeRegistration = () => {
    setRegistrationData(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              user ? 
                <Navigate to={
                  user.role === 'super_admin' ? '/super-admin' : 
                  user.role === 'district_admin' ? '/admin' : '/dashboard'
                } /> 
                : <Home onLogin={login} onStartRegistration={startRegistration} />
            } 
          />
          <Route 
            path="/login" 
            element={
              user ? 
                <Navigate to={
                  user.role === 'super_admin' ? '/super-admin' : 
                  user.role === 'district_admin' ? '/admin' : '/dashboard'
                } /> 
                : <Login onLogin={login} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={user ? <UserDashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user && user.role === 'district_admin' ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/super-admin" 
            element={user && user.role === 'super_admin' ? <SuperAdminDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/register/fencer" 
            element={<FencerForm user={user} registrationData={registrationData} onCompleteRegistration={completeRegistration} />} 
          />
          <Route 
            path="/register/coach" 
            element={<CoachForm user={user} registrationData={registrationData} onCompleteRegistration={completeRegistration} />} 
          />
          <Route 
            path="/register/referee" 
            element={<RefereeForm user={user} registrationData={registrationData} onCompleteRegistration={completeRegistration} />} 
          />
          <Route 
            path="/register/school" 
            element={<SchoolForm user={user} registrationData={registrationData} onCompleteRegistration={completeRegistration} />} 
          />
          <Route 
            path="/register/club" 
            element={<ClubForm user={user} registrationData={registrationData} onCompleteRegistration={completeRegistration} />} 
          />
          <Route 
            path="/payment-success" 
            element={<PaymentSuccess />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;