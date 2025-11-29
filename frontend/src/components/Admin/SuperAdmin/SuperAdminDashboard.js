// SuperAdmin Dashboard - With District Admin Management
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../styles/AdminDashboard.css';
import FeeManagement from './FeeManagement';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://fencing-app-backend.onrender.com';

const SuperAdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [districtAdmins, setDistrictAdmins] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    code: '',
    address: '',
    contactNumber: ''
  });
  const [editAdmin, setEditAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    district: ''
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDistricts: 0,
    totalDistrictAdmins: 0,
    totalUsers: 0,
    totalFencers: 0,
    totalCoaches: 0,
    totalReferees: 0,
    totalClubs: 0,
    totalSchools: 0,
    pendingApplications: 0,
    totalRevenue: 0
  });

  // Helper function to get token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      alert('Authentication token not found. Please login again.');
      onLogout();
      return null;
    }
    return token;
  };

  // Check if user is properly authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      console.error('Authentication data missing');
      alert('Please login again.');
      onLogout();
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'super_admin') {
        alert('Access denied. Super admin privileges required.');
        onLogout();
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      onLogout();
    }
  }, [onLogout]);

  // Fetch dashboard statistics
  const loadDashboardStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/api/superadmin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setStats({
        totalDistricts: districts.length,
        totalDistrictAdmins: districtAdmins.length,
        totalUsers: 0,
        totalFencers: 0,
        totalCoaches: 0,
        totalReferees: 0,
        totalClubs: 0,
        totalSchools: 0,
        pendingApplications: 0,
        totalRevenue: 0
      });
    }
  };

  // Fetch all districts
  const loadDistricts = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/api/superadmin/districts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDistricts(res.data);
    } catch (err) {
      console.error('Failed to load districts:', err);
      alert('Failed to load districts: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fetch District Admins
  const loadDistrictAdmins = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/api/superadmin/district-admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDistrictAdmins(res.data);
    } catch (err) {
      console.error('Failed to load district admins:', err);
      alert('Failed to load district admins: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Create New District + Admin
  const handleCreateDistrictAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.district || !newAdmin.code || !newAdmin.contactNumber || !newAdmin.address) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;
      
      const adminData = {
        name: newAdmin.district,
        code: newAdmin.code,
        adminEmail: newAdmin.email,
        adminName: newAdmin.name,
        contactNumber: newAdmin.contactNumber || newAdmin.phone || '9876543210',
        address: newAdmin.address || `${newAdmin.district} District Office, Delhi`
      };

      const res = await axios.post(`${API_BASE_URL}/api/superadmin/districts`, adminData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.adminCredentials) {
        alert(`District Admin created successfully!\n\nEmail: ${res.data.adminCredentials.email}\nPassword: ${res.data.adminCredentials.password}\nShortcode: ${res.data.adminCredentials.shortcode}\n\nPlease save these credentials!`);
      } else {
        alert('District Admin created successfully!');
      }
      
      setShowCreateAdminModal(false);
      setNewAdmin({ name: '', email: '', phone: '', district: '', code: '', address: '', contactNumber: '' });
      
      await loadDistricts();
      await loadDistrictAdmins();
      await loadDashboardStats();
      
    } catch (err) {
      console.error('Create district admin error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
      alert('Failed to create district admin: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset District Admin Password
  const handleResetPassword = async (adminId, adminEmail) => {
    if (!confirm(`Are you sure you want to reset password for ${adminEmail}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const res = await axios.post(`${API_BASE_URL}/api/superadmin/district-admins/${adminId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Password reset successfully!\n\nNew Password: ${res.data.newPassword}\n\nPlease share this with the district admin.`);
      
    } catch (err) {
      console.error('Reset password error:', err);
      alert('Failed to reset password: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Edit District Admin
  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setEditAdmin({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      district: admin.district || ''
    });
    setShowEditAdminModal(true);
  };

  // Update District Admin
  const handleUpdateAdmin = async () => {
    if (!editAdmin.name || !editAdmin.email || !editAdmin.district) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setActionLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const res = await axios.put(`${API_BASE_URL}/api/superadmin/district-admins/${selectedAdmin._id}`, editAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('District admin updated successfully!');
      setShowEditAdminModal(false);
      await loadDistrictAdmins();
      await loadDistricts();
      
    } catch (err) {
      console.error('Update admin error:', err);
      alert('Failed to update district admin: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete District Admin
  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (!confirm(`Are you sure you want to delete ${adminEmail}? This will also delete the associated district.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getAuthToken();
      if (!token) return;

      await axios.delete(`${API_BASE_URL}/api/superadmin/district-admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('District admin deleted successfully!');
      await loadDistrictAdmins();
      await loadDistricts();
      await loadDashboardStats();
      
    } catch (err) {
      console.error('Delete admin error:', err);
      alert('Failed to delete district admin: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    const loadInitialData = async () => {
      await loadDistricts();
      await loadDashboardStats();
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'districtAdmins') {
      loadDistrictAdmins();
    }
  }, [activeTab]);

  const getStatusBadge = (status) => {
    const config = {
      pending: 'pending', 
      approved: 'approved', 
      rejected: 'rejected',
      active: 'approved',
      inactive: 'rejected',
      upcoming: 'upcoming', 
      ongoing: 'ongoing', 
      completed: 'completed',
      true: 'approved',
      false: 'pending'
    };
    const cls = config[status] || 'pending';
    return <span className={`status-badge ${cls}`}>
      {typeof status === 'boolean' ? (status ? 'Active' : 'Inactive') : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  return (
    <div className="district-admin-dashboard">
      {/* TOP NAVIGATION - SuperAdmin Version */}
      <nav className="top-navigation">
        <div className="nav-header">
          <div className="logo-section">
            <div className="logo-container">
              <div className="org-logo">
                <img src="/assets/logo.png" alt="Delhi Association for Fencing" />
                <div className="logo-fallback">DAF</div>
              </div>
              <div className="org-name">
                <h1>DELHI ASSOCIATION FOR FENCING</h1>
                <div className="subtitle">Super Administrator Portal</div>
              </div>
            </div>
          </div>

          <div className="user-info-section">
            <div className="district-info">
              <i className="fas fa-crown"></i>
              <span>Super Admin</span>
            </div>
            <div className="user-profile">
              <div className="profile-avatar">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <div style={{fontWeight: '600', color: 'white'}}>{user?.name || 'Super Admin'}</div>
                <div style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)'}}>{user?.email}</div>
              </div>
            </div>
            <button className="btn btn-danger" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        <div className="nav-menu">
          <ul className="nav-items">
            <li className="nav-item">
              <div className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <i className="fas fa-tachometer-alt"></i> <span>Overview</span>
              </div>
            </li>
            <li className="nav-item">
              <div className={`nav-link ${activeTab === 'districtAdmins' ? 'active' : ''}`} onClick={() => setActiveTab('districtAdmins')}>
                <i className="fas fa-user-shield"></i> <span>District Admins</span>
              </div>
            </li>
            <li className="nav-item">
              <div className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
                <i className="fas fa-clipboard-list"></i> <span>All Applications</span>
                {stats.pendingApplications > 0 && (
                  <span className="nav-badge">{stats.pendingApplications}</span>
                )}
              </div>
            </li>
            <li className="nav-item">
              <div className={`nav-link ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>
                <i className="fas fa-money-bill-wave"></i> <span>Fee Management</span>
              </div>
            </li>
            <li className="nav-item">
              <div className={`nav-link ${activeTab === 'certificates' ? 'active' : ''}`} onClick={() => setActiveTab('certificates')}>
                <i className="fas fa-certificate"></i> <span>Certificates & NOC</span>
              </div>
            </li>
            <li className="nav-item">
              <div className={`nav-link ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
                <i className="fas fa-rupee-sign"></i> <span>Finance</span>
              </div>
            </li>
            <li className="nav-item">
              <div className={`nav-link ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
                <i className="fas fa-trophy"></i> <span>State Events</span>
              </div>
            </li>
          </ul>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-map-marked-alt"></i></div>
                  <div className="stat-info">
                    <h3>Total Districts</h3>
                    <div className="stat-number">{stats.totalDistricts || districts.length}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-user-shield"></i></div>
                  <div className="stat-info">
                    <h3>District Admins</h3>
                    <div className="stat-number">{stats.totalDistrictAdmins || districtAdmins.length}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-users"></i></div>
                  <div className="stat-info">
                    <h3>Total Users</h3>
                    <div className="stat-number">{stats.totalUsers}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-clock"></i></div>
                  <div className="stat-info">
                    <h3>Pending Approvals</h3>
                    <div className="stat-number">{stats.pendingApplications}</div>
                  </div>
                </div>
              </div>

              <div className="user-stats-section">
                <div className="section-header">
                  <h2>State-wide User Statistics</h2>
                </div>
                <div className="user-stats-grid">
                  <div className="user-stat-card">
                    <div className="user-stat-icon">Fencer</div>
                    <div className="user-stat-number">{stats.totalFencers}</div>
                    <div className="user-stat-label">Fencers</div>
                  </div>
                  <div className="user-stat-card">
                    <div className="user-stat-icon">Coach</div>
                    <div className="user-stat-number">{stats.totalCoaches}</div>
                    <div className="user-stat-label">Coaches</div>
                  </div>
                  <div className="user-stat-card">
                    <div className="user-stat-icon">Referee</div>
                    <div className="user-stat-number">{stats.totalReferees}</div>
                    <div className="user-stat-label">Referees</div>
                  </div>
                  <div className="user-stat-card">
                    <div className="user-stat-icon">School</div>
                    <div className="user-stat-number">{stats.totalSchools}</div>
                    <div className="user-stat-label">Schools</div>
                  </div>
                  <div className="user-stat-card">
                    <div className="user-stat-icon">Club</div>
                    <div className="user-stat-number">{stats.totalClubs}</div>
                    <div className="user-stat-label">Clubs</div>
                  </div>
                </div>
              </div>

              {/* Active Districts List */}
              <div className="districts-section">
                <div className="section-header">
                  <h2>Active Districts ({districts.length})</h2>
                  <button className="btn btn-primary" onClick={() => setShowCreateAdminModal(true)}>
                    <i className="fas fa-plus"></i> Create New District
                  </button>
                </div>
                {districts.length === 0 ? (
                  <div className="no-data">
                    <p>No districts created yet. Create your first district to get started.</p>
                  </div>
                ) : (
                  <div className="districts-grid">
                    {districts.map(district => (
                      <div key={district._id} className="district-card">
                        <div className="district-header">
                          <h3>{district.name}</h3>
                          <span className="district-code">{district.code}</span>
                        </div>
                        <div className="district-info">
                          <div className="district-detail">
                            <i className="fas fa-user-shield"></i>
                            <span>{district.adminName}</span>
                          </div>
                          <div className="district-detail">
                            <i className="fas fa-envelope"></i>
                            <span>{district.adminEmail}</span>
                          </div>
                          <div className="district-detail">
                            <i className="fas fa-phone"></i>
                            <span>{district.contactNumber}</span>
                          </div>
                          <div className="district-detail">
                            <i className="fas fa-map-marker-alt"></i>
                            <span className="address">{district.address}</span>
                          </div>
                        </div>
                        <div className="district-status">
                          {getStatusBadge(district.isActive)}
                          <div className="created-date">
                            Created: {formatDate(district.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* District Admins Management Tab */}
          {activeTab === 'districtAdmins' && (
            <div className="applications-section">
              <div className="section-header">
                <h2>Manage District Administrators ({districtAdmins.length})</h2>
                <button className="btn btn-primary" onClick={() => setShowCreateAdminModal(true)}>
                  <i className="fas fa-plus"></i> Create District Admin
                </button>
              </div>

              <div className="applications-list">
                {loading ? (
                  <div className="loading">Loading district admins...</div>
                ) : districtAdmins.length === 0 ? (
                  <div className="no-data">
                    <p>No district administrators found. Create a new district to automatically create a district admin.</p>
                  </div>
                ) : (
                  districtAdmins.map(admin => (
                    <div key={admin._id} className="application-card">
                      <div className="application-header">
                        <div className="applicant-info">
                          <div className="applicant-avatar">
                            {admin.name?.charAt(0) || 'A'}
                          </div>
                          <div className="applicant-details">
                            <h4>{admin.name || 'District Admin'}</h4>
                            <div className="application-meta">
                              <span className="type-badge">{admin.district} District</span>
                              <span className="email">{admin.email}</span>
                              <span className="date">
                                Created: {formatDate(admin.createdAt)}
                              </span>
                              {admin.districtShortcode && (
                                <span className="shortcode">Code: {admin.districtShortcode}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="application-actions">
                          {getStatusBadge(admin.isApproved)}
                          <div className="admin-actions">
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={() => handleEditAdmin(admin)}
                              disabled={actionLoading}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-warning"
                              onClick={() => handleResetPassword(admin._id, admin.email)}
                              disabled={actionLoading}
                            >
                              <i className="fas fa-key"></i> Reset Password
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteAdmin(admin._id, admin.email)}
                              disabled={actionLoading}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Fee Management Tab */}
          {activeTab === 'fees' && (
            <FeeManagement />
          )}

          {/* Other tabs */}
          {activeTab === 'applications' && (
            <div style={{padding: '3rem', textAlign: 'center'}}>
              <h2>All Applications (State-wide)</h2>
              <p>Total Pending: {stats.pendingApplications}</p>
            </div>
          )}
          {activeTab === 'certificates' && (
            <div style={{padding: '3rem', textAlign: 'center'}}>
              <h2>Certificate & NOC Generator</h2>
              <p>Feature coming soon</p>
            </div>
          )}
          {activeTab === 'finance' && (
            <div style={{padding: '3rem', textAlign: 'center'}}>
              <h2>State Financial Reports</h2>
              <p>Total Revenue: ₹{stats.totalRevenue || 0}</p>
            </div>
          )}
          {activeTab === 'events' && (
            <div style={{padding: '3rem', textAlign: 'center'}}>
              <h2>State Event Management</h2>
              <p>Feature coming soon</p>
            </div>
          )}
        </div>
      </main>

      {/* Create District Admin Modal */}
      {showCreateAdminModal && (
        <div className="modal-overlay" onClick={() => setShowCreateAdminModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New District & Administrator</h3>
              <button className="btn-close" onClick={() => setShowCreateAdminModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>District Name *</label>
                <input 
                  type="text" 
                  value={newAdmin.district} 
                  onChange={e => setNewAdmin({...newAdmin, district: e.target.value})} 
                  placeholder="e.g., North West Delhi" 
                />
              </div>
              <div className="form-group">
                <label>District Code *</label>
                <input 
                  type="text" 
                  value={newAdmin.code} 
                  onChange={e => setNewAdmin({...newAdmin, code: e.target.value.toUpperCase()})} 
                  placeholder="e.g., NWD" 
                  style={{textTransform: 'uppercase'}}
                />
                <small>Short code for the district (3-4 letters)</small>
              </div>
              <div className="form-group">
                <label>Admin Full Name *</label>
                <input 
                  type="text" 
                  value={newAdmin.name} 
                  onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} 
                  placeholder="Enter admin's full name" 
                />
              </div>
              <div className="form-group">
                <label>Admin Email *</label>
                <input 
                  type="email" 
                  value={newAdmin.email} 
                  onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} 
                  placeholder="admin@district.com" 
                />
              </div>
              <div className="form-group">
                <label>Admin Phone *</label>
                <input 
                  type="text" 
                  value={newAdmin.contactNumber} 
                  onChange={e => setNewAdmin({...newAdmin, contactNumber: e.target.value})} 
                  placeholder="+91 98765 43210" 
                />
              </div>
              <div className="form-group">
                <label>District Office Address *</label>
                <textarea 
                  value={newAdmin.address} 
                  onChange={e => setNewAdmin({...newAdmin, address: e.target.value})} 
                  placeholder="Enter district office address"
                  rows="3"
                />
              </div>
              <div className="info-note">
                <i className="fas fa-info-circle"></i>
                A random secure password will be generated automatically for the admin account.
                The admin will need to use this email and the generated password to login.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreateAdminModal(false)}>Cancel</button>
              <button 
                className="btn btn-success" 
                onClick={handleCreateDistrictAdmin} 
                disabled={loading || !newAdmin.district || !newAdmin.code || !newAdmin.name || !newAdmin.email || !newAdmin.contactNumber || !newAdmin.address}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Creating...
                  </>
                ) : (
                  'Create District & Admin'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit District Admin Modal */}
      {showEditAdminModal && (
        <div className="modal-overlay" onClick={() => setShowEditAdminModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit District Administrator</h3>
              <button className="btn-close" onClick={() => setShowEditAdminModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Admin Full Name *</label>
                <input 
                  type="text" 
                  value={editAdmin.name} 
                  onChange={e => setEditAdmin({...editAdmin, name: e.target.value})} 
                  placeholder="Enter admin's full name" 
                />
              </div>
              <div className="form-group">
                <label>Admin Email *</label>
                <input 
                  type="email" 
                  value={editAdmin.email} 
                  onChange={e => setEditAdmin({...editAdmin, email: e.target.value})} 
                  placeholder="admin@district.com" 
                />
              </div>
              <div className="form-group">
                <label>Admin Phone</label>
                <input 
                  type="text" 
                  value={editAdmin.phone} 
                  onChange={e => setEditAdmin({...editAdmin, phone: e.target.value})} 
                  placeholder="+91 98765 43210" 
                />
              </div>
              <div className="form-group">
                <label>District *</label>
                <input 
                  type="text" 
                  value={editAdmin.district} 
                  onChange={e => setEditAdmin({...editAdmin, district: e.target.value})} 
                  placeholder="District name" 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEditAdminModal(false)}>Cancel</button>
              <button 
                className="btn btn-success" 
                onClick={handleUpdateAdmin} 
                disabled={actionLoading || !editAdmin.name || !editAdmin.email || !editAdmin.district}
              >
                {actionLoading ? (
                  <>
                    <div className="spinner"></div>
                    Updating...
                  </>
                ) : (
                  'Update Admin'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;