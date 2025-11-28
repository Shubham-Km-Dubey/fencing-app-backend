// SuperAdmin Dashboard - Same Design as District Admin + Extra Super Powers
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../styles/AdminDashboard.css';

const SuperAdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [districtAdmins, setDistrictAdmins] = useState([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Stats (will be fetched from backend later — placeholder for now)
  const [stats] = useState({
    totalDistricts: 11,
    totalDistrictAdmins: 11,
    totalUsers: 2847,
    totalFencers: 1823,
    totalCoaches: 312,
    totalReferees: 89,
    totalClubs: 47,
    totalSchools: 156,
    pendingApplications: 23,
    totalRevenue: 2847500
  });

  // Sample events (same as district admin for consistency)
  const [events] = useState([
    {
      id: 1,
      title: 'Delhi State Fencing Championship 2025',
      type: 'tournament',
      startDate: '2025-03-10',
      endDate: '2025-03-14',
      venue: 'Thyagraj Sports Complex',
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'National Coaching Certification Program',
      type: 'training',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      venue: 'DAF Headquarters',
      status: 'ongoing'
    }
  ]);

  // Fetch District Admins
  const loadDistrictAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/superadmin/district-admins', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDistrictAdmins(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load district admins');
    } finally {
      setLoading(false);
    }
  };

  // Create New District Admin
  const handleCreateDistrictAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.district || !newAdmin.password) {
      alert('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/superadmin/create-district-admin', newAdmin, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('District Admin created successfully!');
      setShowCreateAdminModal(false);
      setNewAdmin({ name: '', email: '', phone: '', district: '', password: '' });
      loadDistrictAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'districtAdmins') {
      loadDistrictAdmins();
    }
  }, [activeTab]);

  const getStatusBadge = (status) => {
    const config = {
      pending: 'pending', approved: 'approved', rejected: 'rejected',
      upcoming: 'upcoming', ongoing: 'ongoing', completed: 'completed'
    };
    const cls = config[status] || 'pending';
    return <span className={`status-badge ${cls}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

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
                <span className="nav-badge">23</span>
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
                <div className="stat-card"><div className="stat-icon"><i className="fas fa-map-marked-alt"></i></div><div className="stat-info"><h3>Total Districts</h3><div className="stat-number">{stats.totalDistricts}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><i className="fas fa-user-shield"></i></div><div className="stat-info"><h3>District Admins</h3><div className="stat-number">{stats.totalDistrictAdmins}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><i className="fas fa-users"></i></div><div className="stat-info"><h3>Total Users</h3><div className="stat-number">{stats.totalUsers}</div></div></div>
                <div className="stat-card"><div className="stat-icon"><i className="fas fa-rupee-sign"></i></div><div className="stat-info"><h3>Total Revenue</h3><div className="stat-number">₹{(stats.totalRevenue/100000).toFixed(1)}L</div></div></div>
              </div>

              <div className="user-stats-section">
                <div className="section-header"><h2>State-wide User Statistics</h2></div>
                <div className="user-stats-grid">
                  <div className="user-stat-card"><div className="user-stat-icon">Fencer</div><div className="user-stat-number">{stats.totalFencers}</div><div className="user-stat-label">Fencers</div></div>
                  <div className="user-stat-card"><div className="user-stat-icon">Coach</div><div className="user-stat-number">{stats.totalCoaches}</div><div className="user-stat-label">Coaches</div></div>
                  <div className="user-stat-card"><div className="user-stat-icon">Referee</div><div className="user-stat-number">{stats.totalReferees}</div><div className="user-stat-label">Referees</div></div>
                  <div className="user-stat-card"><div className="user-stat-icon">School</div><div className="user-stat-number">{stats.totalSchools}</div><div className="user-stat-label">Schools</div></div>
                  <div className="user-stat-card"><div className="user-stat-icon">Club</div><div className="user-stat-number">{stats.totalClubs}</div><div className="user-stat-label">Clubs</div></div>
                </div>
              </div>

              <div className="events-section">
                <div className="section-header"><h2>Upcoming State Events</h2></div>
                <div className="events-categories">
                  <div className="event-category">
                    <div className="event-category-header"><h3>Major Events</h3></div>
                    <div className="events-grid">
                      {events.map(e => (
                        <div key={e.id} className="event-card">
                          <div className="event-header"><span className="event-type-badge">{e.type}</span>{getStatusBadge(e.status)}</div>
                          <h3 className="event-title">{e.title}</h3>
                          <div className="event-details">
                            <div className="event-detail"><i className="fas fa-calendar"></i><span>{formatDate(e.startDate)} - {formatDate(e.endDate)}</span></div>
                            <div className="event-detail"><i className="fas fa-map-marker-alt"></i><span>{e.venue}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* District Admins Management Tab */}
          {activeTab === 'districtAdmins' && (
            <div className="applications-section">
              <div className="section-header">
                <h2>Manage District Administrators</h2>
                <button className="btn btn-primary" onClick={() => setShowCreateAdminModal(true)}>
                  <i className="fas fa-plus"></i> Create District Admin
                </button>
              </div>

              <div className="applications-list">
                {loading ? <p>Loading...</p> : districtAdmins.length === 0 ? <p>No district admins found</p> :
                  districtAdmins.map(admin => (
                    <div key={admin.id} className="application-card">
                      <div className="application-header">
                        <div className="applicant-info">
                          <div className="applicant-avatar">DA</div>
                          <div className="applicant-details">
                            <h4>{admin.name}</h4>
                            <div className="application-meta">
                              <span className="type-badge">{admin.district} District</span>
                              <span className="email">{admin.email}</span>
                              <span className="date">Created: {formatDate(admin.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(admin.status || 'active')}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Other tabs will be added later (Certificates, Finance, etc.) */}
          {activeTab === 'applications' && <div style={{padding: '3rem', textAlign: 'center'}}><h2>All Applications (State-wide) - Coming Soon</h2></div>}
          {activeTab === 'certificates' && <div style={{padding: '3rem', textAlign: 'center'}}><h2>Certificate & NOC Generator - Coming Next</h2></div>}
          {activeTab === 'finance' && <div style={{padding: '3rem', textAlign: 'center'}}><h2>State Financial Reports - Coming Soon</h2></div>}
          {activeTab === 'events' && <div style={{padding: '3rem', textAlign: 'center'}}><h2>State Event Management - Coming Soon</h2></div>}
        </div>
      </main>

      {/* Create District Admin Modal */}
      {showCreateAdminModal && (
        <div className="modal-overlay" onClick={() => setShowCreateAdminModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New District Administrator</h3>
              <button className="btn-close" onClick={() => setShowCreateAdminModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} placeholder="Enter name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} placeholder="admin@district.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={newAdmin.phone} onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label>District</label>
                <select value={newAdmin.district} onChange={e => setNewAdmin({...newAdmin, district: e.target.value})}>
                  <option value="">Select District</option>
                  <option>Central Delhi</option>
                  <option>North Delhi</option>
                  <option>South Delhi</option>
                  <option>East Delhi</option>
                  <option>West Delhi</option>
                  <option>New Delhi</option>
                  <option>North West Delhi</option>
                  <option>South West Delhi</option>
                  <option>Shahdara</option>
                  <option>North East Delhi</option>
                  <option>South East Delhi</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} placeholder="Minimum 6 characters" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreateAdminModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleCreateDistrictAdmin} disabled={loading}>
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;