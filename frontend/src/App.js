import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import FencerForm from './components/Registration/FencerForm';
import CoachForm from './components/Registration/CoachForm';
import RefereeForm from './components/Registration/RefereeForm';
import SchoolForm from './components/Registration/SchoolForm';
import ClubForm from './components/Registration/ClubForm';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setRegistrationData(null);
    localStorage.removeItem('user');
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;