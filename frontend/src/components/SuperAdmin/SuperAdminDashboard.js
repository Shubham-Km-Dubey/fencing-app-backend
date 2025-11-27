import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SuperAdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalDistricts: 0,
    totalApplications: 0
  });
  const [districts, setDistricts] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    // Mock data for now - we'll replace with actual API calls later
    setStats({
      totalUsers: 256,
      pendingApprovals: 12,
      totalDistricts: 7,
      totalApplications: 189
    });

    setDistricts([
      { name: 'North East', admin: 'northeast@daf.com', users: 45, status: 'Active' },
      { name: 'North West', admin: 'northwest@daf.com', users: 38, status: 'Active' },
      { name: 'East', admin: 'east@daf.com', users: 32, status: 'Active' },
      { name: 'West', admin: 'west@daf.com', users: 29, status: 'Active' },
      { name: 'South', admin: 'south@daf.com', users: 41, status: 'Active' },
      { name: 'Central', admin: 'central@daf.com', users: 35, status: 'Active' },
      { name: 'New Delhi', admin: 'newdelhi@daf.com', users: 36, status: 'Active' }
    ]);

    setPendingApprovals([
      { id: 1, name: 'Raj Sharma', type: 'fencer', district: 'North East', appliedOn: '2024-01-15' },
      { id: 2, name: 'Priya Singh', type: 'coach', district: 'South', appliedOn: '2024-01-14' },
      { id: 3, name: 'Modern School', type: 'school', district: 'Central', appliedOn: '2024-01-13' }
    ]);
  };

  const handleApprove = (id) => {
    alert(`Approved application ${id}`);
    // Remove from pending approvals
    setPendingApprovals(prev => prev.filter(app => app.id !== id));
  };

  const handleReject = (id) => {
    const reason = prompt('Enter reason for rejection:');
    if (reason) {
      alert(`Rejected application ${id}. Reason: ${reason}`);
      setPendingApprovals(prev => prev.filter(app => app.id !== id));
    }
  };

  return (
    <div className="dashboard super-admin-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Super Admin Dashboard</h1>
          <p>Central Management System - Delhi Fencing Association</p>
        </div>
        <div className="user-actions">
          <span className="user-info">Welcome, {user.name || user.email}</span>
          <button className="btn btn-danger" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fas fa-tachometer-alt"></i> Overview
        </button>
        <button 
          className={`nav-btn ${activeTab === 'districts' ? 'active' : ''}`}
          onClick={() => setActiveTab('districts')}
        >
          <i className="fas fa-map-marker-alt"></i> Districts ({districts.length})
        </button>
        <button 
          className={`nav-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <i className="fas fa-check-circle"></i> Approvals ({stats.pendingApprovals})
        </button>
        <button 
          className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <i className="fas fa-users"></i> Users ({stats.totalUsers})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="overview-section">
            <h2>System Overview</h2>
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <div className="stat-number">{stats.totalUsers}</div>
                  <div className="stat-trend">+12 this week</div>
                </div>
              </div>
              
              <div className="stat-card warning">
                <div className="stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-info">
                  <h3>Pending Approvals</h3>
                  <div className="stat-number">{stats.pendingApprovals}</div>
                  <div className="stat-trend">Waiting for review</div>
                </div>
              </div>
              
              <div className="stat-card success">
                <div className="stat-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="stat-info">
                  <h3>Districts</h3>
                  <div className="stat-number">{stats.totalDistricts}</div>
                  <div className="stat-trend">All active</div>
                </div>
              </div>
              
              <div className="stat-card info">
                <div className="stat-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-info">
                  <h3>Total Applications</h3>
                  <div className="stat-number">{stats.totalApplications}</div>
                  <div className="stat-trend">+8 today</div>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <i className="fas fa-user-plus success"></i>
                  <div className="activity-content">
                    <p>New fencer registration from North East district</p>
                    <span className="activity-time">2 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <i className="fas fa-check-circle primary"></i>
                  <div className="activity-content">
                    <p>District admin approved 3 applications from South district</p>
                    <span className="activity-time">5 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <i className="fas fa-school warning"></i>
                  <div className="activity-content">
                    <p>New school registration from Central district</p>
                    <span className="activity-time">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'districts' && (
          <div className="districts-section">
            <div className="section-header">
              <h2>District Management</h2>
              <button className="btn btn-primary">
                <i className="fas fa-plus"></i> Add New District
              </button>
            </div>
            
            <div className="districts-grid">
              {districts.map((district, index) => (
                <div key={index} className="district-card">
                  <div className="district-header">
                    <h3>{district.name}</h3>
                    <span className={`status-badge ${district.status.toLowerCase()}`}>
                      {district.status}
                    </span>
                  </div>
                  <div className="district-info">
                    <p><i className="fas fa-envelope"></i> {district.admin}</p>
                    <p><i className="fas fa-users"></i> {district.users} Users</p>
                  </div>
                  <div className="district-actions">
                    <button className="btn btn-outline btn-sm">
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button className="btn btn-outline btn-sm">
                      <i className="fas fa-chart-bar"></i> Stats
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="approvals-section">
            <h2>Pending Central Approvals</h2>
            <div className="approvals-list">
              {pendingApprovals.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-check-circle success"></i>
                  <h3>No Pending Approvals</h3>
                  <p>All applications have been processed.</p>
                </div>
              ) : (
                pendingApprovals.map(application => (
                  <div key={application.id} className="approval-card">
                    <div className="approval-info">
                      <div className="applicant-details">
                        <h4>{application.name}</h4>
                        <div className="application-meta">
                          <span className="type-badge">{application.type}</span>
                          <span className="district-badge">{application.district}</span>
                          <span className="date">Applied: {application.appliedOn}</span>
                        </div>
                      </div>
                    </div>
                    <div className="approval-actions">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(application.id)}
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(application.id)}
                      >
                        <i className="fas fa-times"></i> Reject
                      </button>
                      <button className="btn btn-outline btn-sm">
                        <i className="fas fa-eye"></i> View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h2>User Management</h2>
            <div className="section-actions">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input type="text" placeholder="Search users..." />
              </div>
              <div className="filter-options">
                <select>
                  <option>All Roles</option>
                  <option>Fencer</option>
                  <option>Coach</option>
                  <option>Referee</option>
                  <option>School</option>
                  <option>Club</option>
                </select>
                <select>
                  <option>All Districts</option>
                  <option>North East</option>
                  <option>North West</option>
                  <option>East</option>
                  <option>West</option>
                  <option>South</option>
                  <option>Central</option>
                  <option>New Delhi</option>
                </select>
              </div>
            </div>
            
            <div className="users-table">
              <div className="table-header">
                <div>User</div>
                <div>Role</div>
                <div>District</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              <div className="table-content">
                <div className="table-row">
                  <div className="user-cell">
                    <div className="user-avatar">RS</div>
                    <div className="user-details">
                      <strong>Raj Sharma</strong>
                      <span>raj@email.com</span>
                    </div>
                  </div>
                  <div><span className="role-badge fencer">Fencer</span></div>
                  <div>North East</div>
                  <div><span className="status-badge approved">Approved</span></div>
                  <div className="action-buttons">
                    <button className="btn-icon" title="View">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn-icon" title="Edit">
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                </div>
                
                <div className="table-row">
                  <div className="user-cell">
                    <div className="user-avatar">PS</div>
                    <div className="user-details">
                      <strong>Priya Singh</strong>
                      <span>priya@email.com</span>
                    </div>
                  </div>
                  <div><span className="role-badge coach">Coach</span></div>
                  <div>South</div>
                  <div><span className="status-badge pending">Pending</span></div>
                  <div className="action-buttons">
                    <button className="btn-icon" title="View">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn-icon" title="Approve">
                      <i className="fas fa-check"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;