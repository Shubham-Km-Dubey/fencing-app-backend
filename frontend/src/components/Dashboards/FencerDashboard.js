import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://fencing-app-backend.onrender.com';

const FencerDashboard = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async () => {
    try {
      const tokenFromUser = user?.token;
      const tokenFromStorage = localStorage.getItem('token');
      const token = tokenFromUser || tokenFromStorage;

      if (!token) {
        console.error('No auth token found for fetching profile');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    if (user.isApproved) {
      return {
        status: 'approved',
        title: 'Registration Approved',
        message: 'Your registration has been approved by Delhi Fencing Association.',
        icon: '✅',
        color: 'success',
        showDAFId: true,
      };
    } else if (user.districtApproved && !user.centralApproved) {
      return {
        status: 'pending_central',
        title: 'Pending Central Approval',
        message:
          'Your application has been approved by district admin and is waiting for central approval.',
        icon: '⏳',
        color: 'warning',
        showDAFId: false,
      };
    } else if (user.rejectionReason) {
      return {
        status: 'rejected',
        title: 'Application Requires Updates',
        message: 'Your application needs some corrections before it can be approved.',
        icon: '❌',
        color: 'danger',
        showDAFId: false,
      };
    } else {
      return {
        status: 'pending',
        title: 'Under Review',
        message: 'Your application is being reviewed by the district admin.',
        icon: '⏳',
        color: 'warning',
        showDAFId: false,
      };
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  const statusConfig = getStatusConfig();

  return (
    <div className="dashboard fencer-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Fencer Dashboard</h1>
          <p>Welcome to your fencing journey</p>
        </div>
        <div className="user-actions">
          <span className="user-info">Fencer • {user.district} District</span>
          <button className="btn btn-danger" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className={`status-banner ${statusConfig.color}`}>
          <div className="status-content">
            <div className="status-icon">{statusConfig.icon}</div>
            <div className="status-info">
              <h3>{statusConfig.title}</h3>
              <p>{statusConfig.message}</p>
              {statusConfig.showDAFId && user.dafId && (
                <div className="daf-id">
                  Your DAF ID: <strong>{user.dafId}</strong>
                </div>
              )}
              {user.rejectionReason && (
                <div className="rejection-reason">
                  <strong>Reason:</strong> {user.rejectionReason}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="stat-info">
                <h3>Upcoming Tournaments</h3>
                <div className="stat-number">0</div>
                <div className="stat-trend">Available soon</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-medal"></i>
              </div>
              <div className="stat-info">
                <h3>Current Rank</h3>
                <div className="stat-number">-</div>
                <div className="stat-trend">Participate to get ranked</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar"></i>
              </div>
              <div className="stat-info">
                <h3>Training Sessions</h3>
                <div className="stat-number">0</div>
                <div className="stat-trend">Check back later</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-award"></i>
              </div>
              <div className="stat-info">
                <h3>Achievements</h3>
                <div className="stat-number">0</div>
                <div className="stat-trend">Start your journey</div>
              </div>
            </div>
          </div>
        </div>

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
                <span className="user-role-badge">Fencer</span>
              </div>

              <div className="profile-details">
                <div className="detail-group">
                  <h4>Personal Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{user.email}</span>
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

                {profile.profile.coachName && (
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
                    {profile.profile.highestAchievement && (
                      <div className="detail-row">
                        <span className="detail-label">Highest Achievement:</span>
                        <span className="detail-value">
                          {profile.profile.highestAchievement}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="profile-actions">
                <button className="btn btn-outline">
                  <i className="fas fa-edit"></i> Update Profile
                </button>
                <button className="btn btn-outline">
                  <i className="fas fa-download"></i> Download ID Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FencerDashboard;
