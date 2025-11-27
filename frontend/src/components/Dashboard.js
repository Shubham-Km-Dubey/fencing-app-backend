import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    registeredEvents: 0
  });

  useEffect(() => {
    fetchUserProfile();
    fetchDashboardStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = user.token;
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    // Mock data for demonstration
    setStats({
      totalEvents: 12,
      upcomingEvents: 3,
      registeredEvents: 2
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Pending Review';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">
          <i className="fas fa-shield-alt logo-icon"></i>
          <h1>DAF Member Dashboard</h1>
        </div>
        <div className="user-info">
          <span>Welcome, {profile?.user?.email}</span>
          <button className="btn btn-danger" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Status Card */}
        <div className={`status-card ${getStatusColor(profile?.user?.isApproved ? 'approved' : profile?.user?.rejectionReason ? 'rejected' : 'pending')}`}>
          <div className="status-header">
            <h2>Registration Status</h2>
            <span className="status-icon">
              {getStatusIcon(profile?.user?.isApproved ? 'approved' : profile?.user?.rejectionReason ? 'rejected' : 'pending')}
            </span>
          </div>
          
          {profile?.user?.isApproved ? (
            <div className="status-content approved">
              <h3>Congratulations! Your application has been approved.</h3>
              <div className="daf-id-section">
                <p>Your Official DAF ID:</p>
                <div className="daf-id">{profile.user.dafId}</div>
              </div>
              <p className="welcome-message">
                Welcome to Delhi Association for Fencing! You can now participate in all upcoming events and tournaments.
              </p>
            </div>
          ) : profile?.user?.rejectionReason ? (
            <div className="status-content rejected">
              <h3>Application Requires Updates</h3>
              <div className="rejection-reason">
                <strong>Reason for Rejection:</strong>
                <p>{profile.user.rejectionReason}</p>
              </div>
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate(`/register/${user.role}`)}
                >
                  <i className="fas fa-edit"></i> Edit Application
                </button>
                <button className="btn btn-secondary">
                  <i className="fas fa-question-circle"></i> Get Help
                </button>
              </div>
            </div>
          ) : (
            <div className="status-content pending">
              <h3>Application Under Review</h3>
              <p>
                Your application is currently being reviewed by the {user.district} District Admin.
                You will be notified once a decision has been made.
              </p>
              <div className="pending-info">
                <p><strong>District:</strong> {user.district}</p>
                <p><strong>Applied On:</strong> {new Date(profile?.user?.registrationDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="stat-info">
              <h3>Total Events</h3>
              <div className="stat-number">{stats.totalEvents}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-info">
              <h3>Upcoming Events</h3>
              <div className="stat-number">{stats.upcomingEvents}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="stat-info">
              <h3>Registered Events</h3>
              <div className="stat-number">{stats.registeredEvents}</div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        {profile?.profile && (
          <div className="profile-section">
            <h2>Your Profile Information</h2>
            <div className="profile-card">
              <div className="profile-header">
                <h3>
                  {profile.profile.firstName} 
                  {profile.profile.middleName && ` ${profile.profile.middleName}`} 
                  {profile.profile.lastName && ` ${profile.profile.lastName}`}
                </h3>
                <span className="user-role-badge">{user.role}</span>
              </div>
              
              <div className="profile-details">
                <div className="detail-group">
                  <h4>Personal Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{profile.user.email}</span>
                  </div>
                  {profile.profile.mobileNumber && (
                    <div className="detail-row">
                      <span className="detail-label">Mobile:</span>
                      <span className="detail-value">{profile.profile.mobileNumber}</span>
                    </div>
                  )}
                  {profile.profile.dateOfBirth && (
                    <div className="detail-row">
                      <span className="detail-label">Date of Birth:</span>
                      <span className="detail-value">
                        {new Date(profile.profile.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {profile.profile.permanentAddress && (
                  <div className="detail-group">
                    <h4>Address</h4>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">
                        {profile.profile.permanentAddress.addressLine1}
                        {profile.profile.permanentAddress.addressLine2 && 
                          `, ${profile.profile.permanentAddress.addressLine2}`}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">District:</span>
                      <span className="detail-value">
                        {profile.profile.permanentAddress.district}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">PIN Code:</span>
                      <span className="detail-value">
                        {profile.profile.permanentAddress.pinCode}
                      </span>
                    </div>
                  </div>
                )}

                {/* Additional fields based on user type */}
                {user.role === 'fencer' && profile.profile.coachName && (
                  <div className="detail-group">
                    <h4>Fencing Details</h4>
                    <div className="detail-row">
                      <span className="detail-label">Coach:</span>
                      <span className="detail-value">{profile.profile.coachName}</span>
                    </div>
                    {profile.profile.trainingCenter && (
                      <div className="detail-row">
                        <span className="detail-label">Training Center:</span>
                        <span className="detail-value">{profile.profile.trainingCenter}</span>
                      </div>
                    )}
                  </div>
                )}

                {user.role === 'coach' && profile.profile.level && (
                  <div className="detail-group">
                    <h4>Coaching Details</h4>
                    <div className="detail-row">
                      <span className="detail-label">Level:</span>
                      <span className="detail-value">{profile.profile.level}</span>
                    </div>
                  </div>
                )}

                {user.role === 'school' && profile.profile.schoolName && (
                  <div className="detail-group">
                    <h4>School Details</h4>
                    <div className="detail-row">
                      <span className="detail-label">School Name:</span>
                      <span className="detail-value">{profile.profile.schoolName}</span>
                    </div>
                  </div>
                )}

                {user.role === 'club' && profile.profile.clubName && (
                  <div className="detail-group">
                    <h4>Club Details</h4>
                    <div className="detail-row">
                      <span className="detail-label">Club Name:</span>
                      <span className="detail-value">{profile.profile.clubName}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate(`/register/${user.role}`)}
                >
                  <i className="fas fa-edit"></i> Update Profile
                </button>
                <button className="btn btn-outline">
                  <i className="fas fa-download"></i> Download Certificate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => navigate('/events')}>
              <i className="fas fa-calendar-plus"></i>
              <span>Register for Events</span>
            </button>
            
            <button className="action-card">
              <i className="fas fa-file-invoice"></i>
              <span>View Payment History</span>
            </button>
            
            <button className="action-card">
              <i className="fas fa-id-card"></i>
              <span>Download ID Card</span>
            </button>
            
            <button className="action-card">
              <i className="fas fa-question-circle"></i>
              <span>Get Support</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;