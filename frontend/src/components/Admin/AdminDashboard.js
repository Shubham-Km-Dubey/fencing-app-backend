// District Admin Dashboard - WITH REAL API INTEGRATION
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/AdminDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://fencing-app-backend.onrender.com';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedApplicationDetails, setSelectedApplicationDetails] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [applicationDocuments, setApplicationDocuments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFencers: 0,
    totalCoaches: 0,
    totalReferees: 0,
    totalSchools: 0,
    totalClubs: 0,
    activeUsers: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    resubmittedApplications: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
    completedEvents: 0,
    totalRevenue: 0
  });

  const [events] = useState([
    {
      id: 1,
      title: 'North East District Championship 2024',
      type: 'tournament',
      startDate: '2024-02-15',
      endDate: '2024-02-17',
      startTime: '09:00',
      endTime: '18:00',
      venue: 'Delhi Sports Complex',
      participants: 45,
      maxParticipants: 100,
      status: 'upcoming',
      registrationFee: 500,
      userTypes: ['fencer', 'coach']
    },
    {
      id: 2,
      title: 'Youth Fencing Training Camp',
      type: 'training',
      startDate: '2024-01-25',
      endDate: '2024-01-30',
      startTime: '08:00',
      endTime: '16:00',
      venue: 'District Sports Center',
      participants: 30,
      maxParticipants: 50,
      status: 'ongoing',
      registrationFee: 300,
      userTypes: ['fencer']
    }
  ]);

  // FIXED: Safely get district name
  const userDistrict = (() => {
    if (user?.district) return user.district;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        return parsed.district || 'Your District';
      } catch (e) {
        return 'Your District';
      }
    }
    return 'Your District';
  })();

  // Load real applications from API
  const loadRealApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user')).token 
        : null;

      const response = await axios.get(`${API_BASE_URL}/api/admin/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data);
      
      const pendingApps = response.data.filter(app => app.status === 'pending').length;
      const resubmittedApps = response.data.filter(app => app.resubmissionCount > 0).length;
      
      setStats(prev => ({
        ...prev,
        pendingApplications: pendingApps,
        resubmittedApplications: resubmittedApps
      }));
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Load application details with rejection history
  const loadApplicationDetails = async (applicationId, type) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user')).token 
        : null;

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/application/${type}/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSelectedApplicationDetails(response.data);
      setShowViewModal(true);
      
    } catch (error) {
      console.error('Error loading application details:', error);
      alert('Failed to load application details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Load application documents
  const loadApplicationDocuments = async (applicationId, type) => {
    setLoadingDocuments(true);
    try {
      const token = localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user')).token 
        : null;

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/documents/${type}/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setApplicationDocuments(response.data.data);
        setShowDocumentsModal(true);
      } else {
        alert('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      alert('Failed to load documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Approve application
  const handleApprove = async (applicationId, type) => {
    if (!window.confirm('Are you sure you want to approve this application?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user')).token 
        : null;

      const response = await axios.post(
        `${API_BASE_URL}/api/admin/approve/${type}/${applicationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        alert(`Application approved! DAF ID: ${response.data.dafId}`);
        loadRealApplications();
        setShowViewModal(false);
      } else {
        alert(response.data.message || 'Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert(error.response?.data?.message || 'Failed to approve application');
    }
  };

  // Reject application - REJECTION REASON IS NOW REQUIRED
  const handleReject = async (applicationId, type, reason, remarks) => {
    if (!reason || !reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    if (!window.confirm('Are you sure you want to reject this application?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user')).token 
        : null;

      const response = await axios.post(
        `${API_BASE_URL}/api/admin/reject/${type}/${applicationId}`,
        { reason, remarks },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        alert(response.data.message);
        setShowRejectModal(false);
        setRejectionReason('');
        setRejectionRemarks('');
        setSelectedApplication(null);
        loadRealApplications();
        setShowViewModal(false);
      } else {
        alert(response.data.message || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert(error.response?.data?.message || 'Failed to reject application');
    }
  };

  const openRejectModal = (application) => {
    setSelectedApplication(application);
    setRejectionReason('');
    setRejectionRemarks('');
    setShowRejectModal(true);
  };

  const openViewModal = (application) => {
    loadApplicationDetails(application.id, application.type);
  };

  const openDocumentsModal = (application) => {
    loadApplicationDocuments(application.id, application.type);
  };

  useEffect(() => {
    if (activeTab === 'applications') {
      loadRealApplications();
    }
  }, [activeTab]);

  const getStatusBadge = (status) => {
    const config = {
      pending: { class: 'pending', text: 'Pending', icon: '⏳' },
      approved: { class: 'approved', text: 'Approved', icon: '✅' },
      rejected: { class: 'rejected', text: 'Rejected', icon: '❌' },
      upcoming: { class: 'upcoming', text: 'Upcoming', icon: '📅' },
      ongoing: { class: 'ongoing', text: 'Ongoing', icon: '⚡' },
      completed: { class: 'completed', text: 'Completed', icon: '🏁' }
    };
    
    const { class: badgeClass, text, icon } = config[status] || config.pending;
    return (
      <span className={`status-badge ${badgeClass}`}>
        {icon} {text}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      fencer: '🤺',
      coach: '👨‍🏫',
      referee: '⚖️',
      school: '🏫',
      club: '🏢'
    };
    return icons[type] || '👤';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const EventCard = ({ event }) => (
    <div className="event-card">
      <div className="event-header">
        <span className="event-type-badge">{event.type}</span>
        {getStatusBadge(event.status)}
      </div>
      
      <h3 className="event-title">{event.title}</h3>
      
      <div className="event-details">
        <div className="event-detail">
          📅 {formatDate(event.startDate)} {event.startDate !== event.endDate && `to ${formatDate(event.endDate)}`}
        </div>
        
        <div className="event-detail">
          ⏰ {event.startTime} - {event.endTime}
        </div>
        
        <div className="event-detail">
          📍 {event.venue}
        </div>
        
        <div className="event-detail">
          💰 ₹{event.registrationFee}
        </div>
        
        <div className="event-detail">
          👥 For: {event.userTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ')}
        </div>
      </div>

      <div className="event-participants">
        <span>👥 {event.participants}/{event.maxParticipants} Registered</span>
        <button className="btn btn-outline btn-sm">View</button>
      </div>
    </div>
  );

  const EventCategorySection = ({ title, events }) => (
    <div className="event-category">
      <div className="event-category-header">
        <h3>{title}</h3>
        <span className="event-count">{events.length}</span>
      </div>
      
      <div className="events-grid">
        {events.slice(0, 2).map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      
      {events.length > 2 && (
        <button className="see-all-btn" onClick={() => setActiveTab('events')}>
          See All {title} Events ({events.length})
        </button>
      )}
    </div>
  );

  const ApplicationCard = ({ application }) => (
    <div className="application-card">
      <div className="application-header">
        <div className="applicant-info">
          <div className="applicant-avatar">
            {getTypeIcon(application.type)}
          </div>
          <div className="applicant-details">
            <h4>{application.name}</h4>
            <div className="application-meta">
              <span className="type-badge">{application.type.toUpperCase()}</span>
              <span className="email">📧 {application.email}</span>
              <span className="date">📅 Applied: {formatDate(application.submittedAt)}</span>
              {application.resubmissionCount > 0 && (
                <span className="resubmission-badge">
                  🔄 Resubmitted: {application.resubmissionCount} time{application.resubmissionCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        {getStatusBadge(application.status)}
      </div>
      
      <div className="application-details">
        <div className="detail-grid">
          <div className="detail-item">
            <label>Registration Date</label>
            <span>{formatDate(application.registrationDate)}</span>
          </div>
          <div className="detail-item">
            <label>Application Type</label>
            <span>{application.type.charAt(0).toUpperCase() + application.type.slice(1)}</span>
          </div>
          <div className="detail-item">
            <label>District</label>
            <span>{application.selectedDistrict || userDistrict}</span>
          </div>
        </div>
      </div>

      <div className="application-actions">
        {application.status === 'pending' && (
          <>
            <button 
              className="btn btn-success"
              onClick={() => handleApprove(application.id, application.type)}
            >
              ✅ Approve
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => openRejectModal(application)}
            >
              ❌ Reject
            </button>
          </>
        )}
        <button 
          className="btn btn-outline"
          onClick={() => openViewModal(application)}
          disabled={loadingDetails}
        >
          {loadingDetails ? 'Loading...' : '👁️ View Details'}
        </button>
        <button 
          className="btn btn-info"
          onClick={() => openDocumentsModal(application)}
          disabled={loadingDocuments}
        >
          {loadingDocuments ? 'Loading...' : '📄 View Documents'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="district-admin-dashboard">
      {/* TOP NAVIGATION */}
      <nav className="top-navigation">
        <div className="nav-header">
          <div className="logo-section">
            <div className="logo-container">
              <div className="org-logo">
                <img 
                  src="/logo.png" 
                  alt="Delhi Association for Fencing"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="logo-fallback">DAF</div>
              </div>
              <div className="org-name">
                <h1>DELHI ASSOCIATION FOR FENCING</h1>
                <div className="subtitle">{userDistrict} District Admin Portal</div>
              </div>
            </div>
          </div>
          
          <div className="user-info-section">
            <div className="district-info">
              <span>📍 {userDistrict} District</span>
            </div>
            <div className="user-profile">
              <div className="profile-avatar">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
              <div>
                <div style={{fontWeight: '600', color: 'white'}}>{user?.name || 'Admin'}</div>
                <div style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)'}}>{user?.email}</div>
              </div>
            </div>
            <button className="btn btn-danger" onClick={onLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* NAV MENU */}
        <div className="nav-menu">
          <ul className="nav-items">
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Dashboard
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
              >
                📋 Applications
                <span className="nav-badge">{stats.pendingApplications}</span>
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                👥 User Management
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                📅 Event Management
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'finance' ? 'active' : ''}`}
                onClick={() => setActiveTab('finance')}
              >
                💰 Financial Reports
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'certificates' ? 'active' : ''}`}
                onClick={() => setActiveTab('certificates')}
              >
                🏆 Certificates
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
                  <div className="stat-icon">
                    👥
                  </div>
                  <div className="stat-info">
                    <h3>Total Users</h3>
                    <div className="stat-number">{stats.totalUsers}</div>
                    <div className="stat-trend">{stats.activeUsers} active</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    📋
                  </div>
                  <div className="stat-info">
                    <h3>Pending Applications</h3>
                    <div className="stat-number">{stats.pendingApplications}</div>
                    <div className="stat-trend">Awaiting review</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    🔄
                  </div>
                  <div className="stat-info">
                    <h3>Resubmitted</h3>
                    <div className="stat-number">{stats.resubmittedApplications}</div>
                    <div className="stat-trend">Updated applications</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    💰
                  </div>
                  <div className="stat-info">
                    <h3>Total Revenue</h3>
                    <div className="stat-number">₹{(stats.totalRevenue/1000).toFixed(0)}K</div>
                    <div className="stat-trend">This year</div>
                  </div>
                </div>
              </div>

              <div className="user-stats-section">
                <div className="section-header">
                  <h2>User Statistics</h2>
                </div>
                <div className="user-stats-grid">
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      🤺
                    </div>
                    <div className="user-stat-number">{stats.totalFencers}</div>
                    <div className="user-stat-label">Fencers</div>
                  </div>
                  
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      👨‍🏫
                    </div>
                    <div className="user-stat-number">{stats.totalCoaches}</div>
                    <div className="user-stat-label">Coaches</div>
                  </div>
                  
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      ⚖️
                    </div>
                    <div className="user-stat-number">{stats.totalReferees}</div>
                    <div className="user-stat-label">Referees</div>
                  </div>
                  
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      🏫
                    </div>
                    <div className="user-stat-number">{stats.totalSchools}</div>
                    <div className="user-stat-label">Schools</div>
                  </div>
                  
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      🏢
                    </div>
                    <div className="user-stat-number">{stats.totalClubs}</div>
                    <div className="user-stat-label">Clubs</div>
                  </div>
                </div>
              </div>

              <div className="events-section">
                <div className="section-header">
                  <h2>Events Overview</h2>
                  <button className="btn btn-primary">
                    ＋ Create Event
                  </button>
                </div>
                
                <div className="events-categories">
                  <EventCategorySection 
                    title="Upcoming Events"
                    events={events.filter(event => event.status === 'upcoming')}
                  />
                  
                  <EventCategorySection 
                    title="Ongoing Events"
                    events={events.filter(event => event.status === 'ongoing')}
                  />
                  
                  <EventCategorySection 
                    title="Completed Events"
                    events={events.filter(event => event.status === 'completed')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="applications-section">
              <div className="section-header">
                <h2>Application Management - {userDistrict} District</h2>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  {loading && <span>⏳ Loading...</span>}
                  <span className="pending-badge">📋 Pending: {applications.filter(app => app.status === 'pending').length}</span>
                  <span className="total-badge">📊 Total: {applications.length}</span>
                  <span className="resubmit-badge">🔄 Resubmitted: {applications.filter(app => app.resubmissionCount > 0).length}</span>
                  <button className="btn btn-sm btn-outline" onClick={loadRealApplications}>
                    🔄 Refresh
                  </button>
                </div>
              </div>
              
              <div className="applications-list">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading applications...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No Applications Found</h3>
                    <p>There are no pending applications in your district.</p>
                  </div>
                ) : (
                  applications.map(application => (
                    <ApplicationCard key={`${application.type}-${application.id}`} application={application} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="events-section">
              <div className="section-header">
                <h2>All Events</h2>
                <button className="btn btn-primary">
                  ＋ Create Event
                </button>
              </div>
              
              <div className="events-categories">
                <EventCategorySection 
                  title="Upcoming Events"
                  events={events.filter(event => event.status === 'upcoming')}
                />
                
                <EventCategorySection 
                  title="Ongoing Events"
                  events={events.filter(event => event.status === 'ongoing')}
                />
                
                <EventCategorySection 
                  title="Completed Events"
                  events={events.filter(event => event.status === 'completed')}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Rejection Modal */}
      {showRejectModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>❌ Reject Application</h3>
              <button className="btn-close" onClick={() => setShowRejectModal(false)}>
                ✕ Close
              </button>
            </div>
            
            <div className="modal-body">
              <p>You are about to reject the application from <strong>{selectedApplication.name}</strong>.</p>
              <p>Please provide a reason for rejection (user will see this):</p>
              
              <div className="form-group">
                <label>Rejection Reason <span style={{color: 'red', fontSize: '0.9rem'}}>* Required</span></label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter specific reason for rejection..."
                  rows="4"
                  className="rejection-textarea"
                />
                {!rejectionReason.trim() && (
                  <small className="error-text">
                    Reason is required to reject the application
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Internal Remarks (Optional)</label>
                <textarea
                  value={rejectionRemarks}
                  onChange={(e) => setRejectionRemarks(e.target.value)}
                  placeholder="Internal notes for other admins..."
                  rows="3"
                  className="remarks-textarea"
                />
                <small className="help-text">
                  This will not be shown to the user
                </small>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleReject(selectedApplication.id, selectedApplication.type, rejectionReason, rejectionRemarks)}
                disabled={!rejectionReason.trim()}
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Application Details Modal */}
      {showViewModal && selectedApplicationDetails && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>👁️ Application Details</h3>
              <button className="btn-close" onClick={() => {
                setShowViewModal(false);
                setSelectedApplicationDetails(null);
              }}>
                ✕ Close
              </button>
            </div>
            
            <div className="modal-body">
              {loadingDetails ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading details...</p>
                </div>
              ) : (
                <>
                  <div className="applicant-summary">
                    <h4>{selectedApplicationDetails.firstName} {selectedApplicationDetails.lastName}</h4>
                    <div className="summary-details">
                      <span><strong>Email:</strong> {selectedApplicationDetails.userId?.email}</span>
                      <span><strong>Type:</strong> {selectedApplicationDetails.type || 'Fencer'}</span>
                      <span><strong>District:</strong> {selectedApplicationDetails.selectedDistrict}</span>
                      <span><strong>Status:</strong> {getStatusBadge(selectedApplicationDetails.status)}</span>
                      {selectedApplicationDetails.resubmissionCount > 0 && (
                        <span className="resubmission-info">
                          <strong>Resubmissions:</strong> {selectedApplicationDetails.resubmissionCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedApplicationDetails.rejectionHistory && selectedApplicationDetails.rejectionHistory.length > 0 && (
                    <div className="rejection-history-section">
                      <h5>📋 Rejection History</h5>
                      <div className="rejection-list">
                        {selectedApplicationDetails.rejectionHistory.map((rejection, index) => (
                          <div key={index} className="rejection-item">
                            <div className="rejection-header">
                              <span className="rejection-number">#{index + 1}</span>
                              <span className="rejection-date">{formatDateTime(rejection.rejectedAt)}</span>
                            </div>
                            <div className="rejection-reason">
                              <strong>Reason:</strong> {rejection.reason}
                            </div>
                            {rejection.remarks && (
                              <div className="rejection-remarks">
                                <strong>Remarks:</strong> {rejection.remarks}
                              </div>
                            )}
                            <div className="rejection-admin">
                              <small>By: {rejection.rejectedBy?.name || 'Admin'}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="application-details-section">
                    <h5>📄 Application Information</h5>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Aadhar Number</label>
                        <span>{selectedApplicationDetails.aadharNumber}</span>
                      </div>
                      <div className="detail-item">
                        <label>Mobile Number</label>
                        <span>{selectedApplicationDetails.mobileNumber}</span>
                      </div>
                      <div className="detail-item">
                        <label>Date of Birth</label>
                        <span>{formatDate(selectedApplicationDetails.dateOfBirth)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Father's Name</label>
                        <span>{selectedApplicationDetails.fathersName}</span>
                      </div>
                      <div className="detail-item">
                        <label>Mother's Name</label>
                        <span>{selectedApplicationDetails.mothersName}</span>
                      </div>
                      {selectedApplicationDetails.coachName && (
                        <div className="detail-item">
                          <label>Coach Name</label>
                          <span>{selectedApplicationDetails.coachName}</span>
                        </div>
                      )}
                      {selectedApplicationDetails.trainingCenter && (
                        <div className="detail-item">
                          <label>Training Center</label>
                          <span>{selectedApplicationDetails.trainingCenter}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedApplicationDetails.highestAchievement && (
                    <div className="achievement-section">
                      <h5>🏆 Highest Achievement</h5>
                      <p>{selectedApplicationDetails.highestAchievement}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-info" onClick={() => {
                setShowViewModal(false);
                openDocumentsModal(selectedApplication);
              }}>
                📄 View Documents
              </button>
              {selectedApplicationDetails.status === 'pending' && (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => handleApprove(selectedApplicationDetails._id, selectedApplicationDetails.type || 'fencer')}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      setShowViewModal(false);
                      openRejectModal({
                        id: selectedApplicationDetails._id,
                        type: selectedApplicationDetails.type || 'fencer',
                        name: `${selectedApplicationDetails.firstName} ${selectedApplicationDetails.lastName}`
                      });
                    }}
                  >
                    ❌ Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Documents Modal */}
      {showDocumentsModal && applicationDocuments && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>📄 Application Documents</h3>
              <button className="btn-close" onClick={() => {
                setShowDocumentsModal(false);
                setApplicationDocuments(null);
              }}>
                ✕ Close
              </button>
            </div>
            
            <div className="modal-body">
              {loadingDocuments ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading documents...</p>
                </div>
              ) : (
                <>
                  <div className="documents-header">
                    <h4>Documents for: {applicationDocuments.applicantName}</h4>
                    <p>Click on any document to view/download</p>
                  </div>
                  
                  <div className="documents-grid">
                    {Object.entries(applicationDocuments.documents).map(([key, url]) => {
                      if (!url) return null;
                      
                      const documentLabels = {
                        passportPhoto: '🖼️ Passport Photo',
                        aadharFront: '🆔 Aadhar Front',
                        aadharBack: '🆔 Aadhar Back',
                        birthCertificate: '📜 Birth Certificate',
                        doc1: '📄 Document 1',
                        doc2: '📄 Document 2',
                        doc3: '📄 Document 3'
                      };
                      
                      const label = documentLabels[key] || key;
                      const isImage = key.includes('Photo') || key.includes('aadhar');
                      
                      return (
                        <div key={key} className="document-item">
                          <div className="document-label">
                            {label}
                          </div>
                          <div className="document-preview">
                            {isImage ? (
                              <img 
                                src={url} 
                                alt={label}
                                onClick={() => window.open(url, '_blank')}
                                className="document-image"
                              />
                            ) : (
                              <div 
                                className="document-pdf"
                                onClick={() => window.open(url, '_blank')}
                              >
                                📄 PDF Document
                              </div>
                            )}
                          </div>
                          <div className="document-actions">
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={() => window.open(url, '_blank')}
                            >
                              👁️ View
                            </button>
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${key}_${applicationDocuments.applicantName}`;
                                link.click();
                              }}
                            >
                              ⬇️ Download
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {Object.values(applicationDocuments.documents).filter(url => url).length === 0 && (
                    <div className="no-documents">
                      <p>No documents uploaded for this application.</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => {
                setShowDocumentsModal(false);
                setShowViewModal(true);
              }}>
                ← Back to Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;