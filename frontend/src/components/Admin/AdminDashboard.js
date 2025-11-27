// District Admin Dashboard - WITH REAL API INTEGRATION
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Load real applications from API
  const loadRealApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/applications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setApplications(response.data);
      
      // Update stats
      const pendingApps = response.data.filter(app => app.status === 'pending').length;
      setStats(prev => ({
        ...prev,
        pendingApplications: pendingApps
      }));
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Approve application
  const handleApprove = async (applicationId, type) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/admin/approve/${type}/${applicationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      alert(response.data.message);
      loadRealApplications(); // Reload applications
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application');
    }
  };

  // Reject application
  const handleReject = async (applicationId, type, reason) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      const response = await axios.post(
        `http://localhost:5000/api/admin/reject/${type}/${applicationId}`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      alert(response.data.message);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedApplication(null);
      loadRealApplications(); // Reload applications
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    }
  };

  // Load application details
  const loadApplicationDetails = async (applicationId, type) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/application/${type}/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setSelectedApplication(response.data);
      // You can show a detailed modal here
      alert(`Loaded details for ${response.data.name || response.data.firstName}`);
    } catch (error) {
      console.error('Error loading application details:', error);
      alert('Failed to load application details');
    }
  };

  const openRejectModal = (application) => {
    setSelectedApplication(application);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  useEffect(() => {
    if (activeTab === 'applications') {
      loadRealApplications();
    }
  }, [activeTab]);

  const getStatusBadge = (status) => {
    const config = {
      pending: { class: 'pending', text: 'Pending' },
      approved: { class: 'approved', text: 'Approved' },
      rejected: { class: 'rejected', text: 'Rejected' },
      upcoming: { class: 'upcoming', text: 'Upcoming' },
      ongoing: { class: 'ongoing', text: 'Ongoing' },
      completed: { class: 'completed', text: 'Completed' }
    };
    
    const { class: badgeClass, text } = config[status] || config.pending;
    return <span className={`status-badge ${badgeClass}`}>{text}</span>;
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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
          <i className="fas fa-calendar"></i>
          <span>{formatDate(event.startDate)} {event.startDate !== event.endDate && `to ${formatDate(event.endDate)}`}</span>
        </div>
        
        <div className="event-detail">
          <i className="fas fa-clock"></i>
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        
        <div className="event-detail">
          <i className="fas fa-map-marker-alt"></i>
          <span>{event.venue}</span>
        </div>
        
        <div className="event-detail">
          <i className="fas fa-rupee-sign"></i>
          <span>Fee: ₹{event.registrationFee}</span>
        </div>
        
        <div className="event-detail">
          <i className="fas fa-users"></i>
          <span>For: {event.userTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ')}</span>
        </div>
      </div>

      <div className="event-participants">
        <span>{event.participants}/{event.maxParticipants} Registered</span>
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
              <span className="type-badge">{application.type}</span>
              <span className="email">{application.email}</span>
              <span className="date">Applied: {formatDate(application.submittedAt)}</span>
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
            <span>{user.district}</span>
          </div>
        </div>
      </div>

      {application.status === 'pending' && (
        <div className="application-actions">
          <button 
            className="btn btn-success"
            onClick={() => handleApprove(application.id, application.type)}
          >
            <i className="fas fa-check"></i> Approve
          </button>
          <button 
            className="btn btn-danger"
            onClick={() => openRejectModal(application)}
          >
            <i className="fas fa-times"></i> Reject
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => loadApplicationDetails(application.id, application.type)}
          >
            <i className="fas fa-eye"></i> View Details
          </button>
        </div>
      )}
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
                <div className="subtitle">{user.district} District Admin Portal</div>
              </div>
            </div>
          </div>
          
          <div className="user-info-section">
            <div className="district-info">
              <i className="fas fa-map-marker-alt"></i>
              <span>{user.district} District</span>
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
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        <div className="nav-menu">
          <ul className="nav-items">
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
              >
                <i className="fas fa-clipboard-list"></i>
                <span>Applications</span>
                <span className="nav-badge">{stats.pendingApplications}</span>
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <i className="fas fa-users"></i>
                <span>User Management</span>
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                <i className="fas fa-calendar-alt"></i>
                <span>Event Management</span>
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'finance' ? 'active' : ''}`}
                onClick={() => setActiveTab('finance')}
              >
                <i className="fas fa-chart-bar"></i>
                <span>Financial Reports</span>
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className={`nav-link ${activeTab === 'certificates' ? 'active' : ''}`}
                onClick={() => setActiveTab('certificates')}
              >
                <i className="fas fa-certificate"></i>
                <span>Certificates</span>
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
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Total Users</h3>
                    <div className="stat-number">{stats.totalUsers}</div>
                    <div className="stat-trend">{stats.activeUsers} active</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-clipboard-check"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Pending Applications</h3>
                    <div className="stat-number">{stats.pendingApplications}</div>
                    <div className="stat-trend">Awaiting review</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Upcoming Events</h3>
                    <div className="stat-number">{stats.upcomingEvents}</div>
                    <div className="stat-trend">Scheduled</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-rupee-sign"></i>
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
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="user-stat-number">{stats.totalFencers}</div>
                    <div className="user-stat-label">Fencers</div>
                  </div>
                  
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      <i className="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div className="user-stat-number">{stats.totalCoaches}</div>
                    <div className="user-stat-label">Coaches</div>
                  </div>
                  
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      <i className="fas fa-gavel"></i>
                    </div>
                    <div className="user-stat-number">{stats.totalReferees}</div>
                    <div className="user-stat-label">Referees</div>
                  </div>
                  
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      <i className="fas fa-school"></i>
                    </div>
                    <div className="user-stat-number">{stats.totalSchools}</div>
                    <div className="user-stat-label">Schools</div>
                  </div>
                  
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      <i className="fas fa-building"></i>
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
                    <i className="fas fa-plus"></i> Create Event
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
                <h2>Application Management - {user.district} District</h2>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  {loading && <span>Loading...</span>}
                  <span>Pending: {applications.filter(app => app.status === 'pending').length}</span>
                  <span>Total: {applications.length}</span>
                </div>
              </div>
              
              <div className="applications-list">
                {loading ? (
                  <div style={{textAlign: 'center', padding: '3rem', color: 'var(--gray-medium)'}}>
                    <i className="fas fa-spinner fa-spin" style={{fontSize: '2rem', marginBottom: '1rem'}}></i>
                    <p>Loading applications...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '3rem', color: 'var(--gray-medium)'}}>
                    <i className="fas fa-check-circle" style={{fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-color)'}}></i>
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
                  <i className="fas fa-plus"></i> Create Event
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
              <h3>Reject Application</h3>
              <button className="btn-close" onClick={() => setShowRejectModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p>You are about to reject the application from <strong>{selectedApplication.name}</strong>.</p>
              <p>Please provide a reason for rejection:</p>
              
              <div className="form-group">
                <label>Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter specific reason for rejection..."
                  rows="4"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleReject(selectedApplication.id, selectedApplication.type, rejectionReason)}
                disabled={!rejectionReason.trim()}
              >
                <i className="fas fa-times"></i> Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;