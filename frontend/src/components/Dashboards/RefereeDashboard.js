import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RefereeDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({});

  useEffect(() => {
    fetchRefereeData();
  }, []);

  const fetchRefereeData = async () => {
    try {
      const token = user.token;
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      
      // Mock data for referee-specific features
      const mockUpcomingMatches = [
        {
          id: 1,
          tournament: 'Delhi State Championships',
          category: 'Senior Men Foil',
          date: '2024-02-15',
          time: '10:00 AM',
          venue: 'North East Sports Complex',
          role: 'Main Referee',
          priority: 'high'
        },
        {
          id: 2,
          tournament: 'Inter-District Youth Cup',
          category: 'U-17 Women Epee',
          date: '2024-02-18',
          time: '2:00 PM',
          venue: 'DFA Headquarters',
          role: 'Line Judge',
          priority: 'medium'
        },
        {
          id: 3,
          tournament: 'National Qualifiers',
          category: 'Senior Mixed Sabre',
          date: '2024-02-22',
          time: '9:30 AM',
          venue: 'Central Stadium',
          role: 'Video Reviewer',
          priority: 'high'
        }
      ];

      const mockCompletedMatches = [
        {
          id: 1,
          tournament: 'District Level Tournament',
          category: 'Junior Men Foil',
          date: '2024-01-20',
          decisions: 45,
          accuracy: '98%',
          feedback: 'Excellent',
          rating: '4.8/5'
        },
        {
          id: 2,
          tournament: 'State Ranking Event',
          category: 'Senior Women Epee',
          date: '2024-01-25',
          decisions: 38,
          accuracy: '95%',
          feedback: 'Very Good',
          rating: '4.5/5'
        }
      ];

      const mockCertifications = [
        {
          name: 'DFA Certified National Referee',
          level: 'National',
          issued: '2023-06-10',
          validUntil: '2025-06-10',
          status: 'active'
        },
        {
          name: 'FIE Basic Referee Certificate',
          level: 'International',
          issued: '2022-11-15',
          validUntil: '2024-11-15',
          status: 'active'
        },
        {
          name: 'Video Replay Official',
          level: 'Advanced',
          issued: '2023-09-01',
          validUntil: '2025-09-01',
          status: 'active'
        }
      ];

      const mockPerformanceStats = {
        totalMatches: 156,
        currentSeason: 24,
        accuracy: '96.5%',
        averageRating: '4.7/5',
        weapons: ['Foil', 'Epee', 'Sabre'],
        highestLevel: 'National'
      };

      setUpcomingMatches(mockUpcomingMatches);
      setCompletedMatches(mockCompletedMatches);
      setCertifications(mockCertifications);
      setPerformanceStats(mockPerformanceStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching referee data:', error);
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    if (user.isApproved) {
      return {
        status: 'approved',
        title: 'Active Referee',
        message: 'You are a certified referee with Delhi Fencing Association.',
        icon: '⚖️',
        color: 'success',
        showDAFId: true
      };
    } else if (user.districtApproved && !user.centralApproved) {
      return {
        status: 'pending_central',
        title: 'Pending Central Approval',
        message: 'Your referee application is waiting for central approval.',
        icon: '⏳',
        color: 'warning',
        showDAFId: false
      };
    } else if (user.rejectionReason) {
      return {
        status: 'rejected',
        title: 'Application Requires Updates',
        message: 'Your referee application needs corrections.',
        icon: '❌',
        color: 'danger',
        showDAFId: false
      };
    } else {
      return {
        status: 'pending',
        title: 'Under Review',
        message: 'Your referee application is being reviewed.',
        icon: '⏳',
        color: 'warning',
        showDAFId: false
      };
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'danger',
      'medium': 'warning',
      'low': 'info'
    };
    return colors[priority] || 'info';
  };

  const getWeaponIcon = (weapon) => {
    const icons = {
      'Foil': '⚔️',
      'Epee': '🗡️',
      'Sabre': '🔪'
    };
    return icons[weapon] || '🤺';
  };

  const getAccuracyColor = (accuracy) => {
    const percent = parseInt(accuracy);
    if (percent >= 95) return 'success';
    if (percent >= 90) return 'primary';
    if (percent >= 85) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading referee dashboard...</div>
      </div>
    );
  }

  const statusConfig = getStatusConfig();

  return (
    <div className="dashboard referee-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Referee Dashboard</h1>
          <p>Ensuring fair play and accurate officiating</p>
        </div>
        <div className="user-actions">
          <span className="user-info">Referee • {user.district} District</span>
          <button className="btn btn-danger" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-home"></i> Overview
        </button>
        <button 
          className={`nav-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <i className="fas fa-calendar-alt"></i> Match Schedule
        </button>
        <button 
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="fas fa-history"></i> Match History
        </button>
        <button 
          className={`nav-btn ${activeTab === 'certifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('certifications')}
        >
          <i className="fas fa-certificate"></i> Certifications
        </button>
        <button 
          className={`nav-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <i className="fas fa-chart-line"></i> Performance
        </button>
        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i> Referee Profile
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className={`status-banner ${statusConfig.color}`}>
              <div className="status-content">
                <div className="status-icon">{statusConfig.icon}</div>
                <div className="status-info">
                  <h3>{statusConfig.title}</h3>
                  <p>{statusConfig.message}</p>
                  {statusConfig.showDAFId && user.dafId && (
                    <div className="daf-id">
                      Your Referee DAF ID: <strong>{user.dafId}</strong>
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

            <div className="referee-stats">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-whistle"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Matches Officiated</h3>
                    <div className="stat-number">{performanceStats.totalMatches}</div>
                    <div className="stat-trend">Career total</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-bullseye"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Decision Accuracy</h3>
                    <div className="stat-number">{performanceStats.accuracy}</div>
                    <div className="stat-trend">Current season</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Average Rating</h3>
                    <div className="stat-number">{performanceStats.averageRating}</div>
                    <div className="stat-trend">Based on feedback</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Upcoming Matches</h3>
                    <div className="stat-number">{upcomingMatches.length}</div>
                    <div className="stat-trend">Next 30 days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button 
                  className="action-card"
                  onClick={() => setActiveTab('schedule')}
                >
                  <i className="fas fa-calendar-day"></i>
                  <span>View Schedule</span>
                  <small>Upcoming matches</small>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveTab('history')}
                >
                  <i className="fas fa-file-alt"></i>
                  <span>Match Reports</span>
                  <small>Past performances</small>
                </button>
                
                <button className="action-card">
                  <i className="fas fa-book"></i>
                  <span>Rule Updates</span>
                  <small>Latest FIE rules</small>
                </button>
                
                <button className="action-card">
                  <i className="fas fa-video"></i>
                  <span>Video Review</span>
                  <small>Training materials</small>
                </button>
              </div>
            </div>

            <div className="upcoming-matches">
              <h3>Upcoming Matches</h3>
              <div className="matches-list">
                {upcomingMatches.slice(0, 3).map(match => (
                  <div key={match.id} className="match-item">
                    <div className="match-icon">
                      <i className="fas fa-whistle"></i>
                    </div>
                    <div className="match-content">
                      <p>
                        <strong>{match.tournament}</strong> - {match.category}
                      </p>
                      <span className="match-meta">
                        {new Date(match.date).toLocaleDateString()} • {match.time} • {match.venue}
                      </span>
                      <span className={`role-badge ${match.priority}`}>
                        {match.role}
                      </span>
                    </div>
                    <div className="match-actions">
                      <button className="btn btn-outline btn-sm">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-section">
            <div className="section-header">
              <h2>Match Schedule</h2>
              <div className="section-actions">
                <div className="date-filter">
                  <select>
                    <option>All Dates</option>
                    <option>This Week</option>
                    <option>Next Week</option>
                    <option>This Month</option>
                  </select>
                </div>
                <button className="btn btn-outline">
                  <i className="fas fa-download"></i> Export Schedule
                </button>
              </div>
            </div>

            <div className="matches-table">
              <div className="table-header">
                <div className="col-tournament">Tournament</div>
                <div className="col-category">Category</div>
                <div className="col-date">Date & Time</div>
                <div className="col-venue">Venue</div>
                <div className="col-role">Role</div>
                <div className="col-priority">Priority</div>
                <div className="col-actions">Actions</div>
              </div>
              
              <div className="table-body">
                {upcomingMatches.map(match => (
                  <div key={match.id} className="table-row">
                    <div className="col-tournament">
                      <strong>{match.tournament}</strong>
                    </div>
                    <div className="col-category">
                      {match.category}
                    </div>
                    <div className="col-date">
                      <div>{new Date(match.date).toLocaleDateString()}</div>
                      <small>{match.time}</small>
                    </div>
                    <div className="col-venue">
                      {match.venue}
                    </div>
                    <div className="col-role">
                      <span className="role-tag">{match.role}</span>
                    </div>
                    <div className="col-priority">
                      <span className={`priority-badge ${getPriorityColor(match.priority)}`}>
                        {match.priority}
                      </span>
                    </div>
                    <div className="col-actions">
                      <button className="btn btn-outline btn-sm">
                        View
                      </button>
                      <button className="btn btn-primary btn-sm">
                        Confirm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="section-header">
              <h2>Match History</h2>
              <div className="section-actions">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input type="text" placeholder="Search matches..." />
                </div>
                <select>
                  <option>All Tournaments</option>
                  <option>State Championships</option>
                  <option>National Events</option>
                </select>
              </div>
            </div>

            <div className="history-grid">
              {completedMatches.map(match => (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    <h3>{match.tournament}</h3>
                    <span className="match-date">
                      {new Date(match.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="match-category">
                    {match.category}
                  </div>

                  <div className="match-stats">
                    <div className="stat">
                      <label>Decisions Made</label>
                      <span className="stat-value">{match.decisions}</span>
                    </div>
                    <div className="stat">
                      <label>Accuracy</label>
                      <span className={`stat-value accuracy-${getAccuracyColor(match.accuracy)}`}>
                        {match.accuracy}
                      </span>
                    </div>
                    <div className="stat">
                      <label>Rating</label>
                      <span className="stat-value rating">{match.rating}</span>
                    </div>
                  </div>

                  <div className="match-feedback">
                    <strong>Feedback:</strong> {match.feedback}
                  </div>

                  <div className="match-actions">
                    <button className="btn btn-outline">
                      <i className="fas fa-eye"></i> View Details
                    </button>
                    <button className="btn btn-primary">
                      <i className="fas fa-download"></i> Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="certifications-section">
            <h2>Referee Certifications</h2>
            <div className="certifications-list">
              {certifications.map((cert, index) => (
                <div key={index} className="certification-card">
                  <div className="cert-header">
                    <div>
                      <h3>{cert.name}</h3>
                      <span className="cert-level">{cert.level} Level</span>
                    </div>
                    <span className={`status-badge ${cert.status}`}>
                      {cert.status}
                    </span>
                  </div>
                  
                  <div className="cert-details">
                    <div className="detail">
                      <strong>Issued:</strong> {new Date(cert.issued).toLocaleDateString()}
                    </div>
                    <div className="detail">
                      <strong>Valid Until:</strong> {new Date(cert.validUntil).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="cert-actions">
                    <button className="btn btn-outline">
                      <i className="fas fa-download"></i> Certificate
                    </button>
                    <button className="btn btn-outline">
                      <i className="fas fa-eye"></i> Details
                    </button>
                    <button className="btn btn-primary">
                      <i className="fas fa-sync"></i> Renew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-section">
            <h2>Performance Analytics</h2>
            
            <div className="performance-stats">
              <div className="stat-cards">
                <div className="stat-card large">
                  <h3>Overall Accuracy</h3>
                  <div className="stat-number main">{performanceStats.accuracy}</div>
                  <div className="stat-trend">Lifetime average</div>
                </div>
                
                <div className="stat-card">
                  <h3>Matches This Season</h3>
                  <div className="stat-number">{performanceStats.currentSeason}</div>
                  <div className="stat-trend">Active assignments</div>
                </div>
                
                <div className="stat-card">
                  <h3>Weapons Qualified</h3>
                  <div className="stat-number">{performanceStats.weapons?.length}</div>
                  <div className="stat-trend">All weapons</div>
                </div>
              </div>
            </div>

            <div className="weapons-proficiency">
              <h3>Weapons Proficiency</h3>
              <div className="weapons-grid">
                {performanceStats.weapons?.map((weapon, index) => (
                  <div key={index} className="weapon-card">
                    <div className="weapon-icon">
                      {getWeaponIcon(weapon)}
                    </div>
                    <div className="weapon-info">
                      <h4>{weapon}</h4>
                      <div className="proficiency-level">Expert</div>
                      <div className="matches-count">48 matches officiated</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && profile?.profile && (
          <div className="profile-section">
            <h2>Referee Profile</h2>
            <div className="profile-card">
              <div className="profile-header">
                <h3>
                  {profile.profile.firstName} 
                  {profile.profile.middleName && ` ${profile.profile.middleName}`} 
                  {profile.profile.lastName && ` ${profile.profile.lastName}`}
                </h3>
                <span className="user-role-badge">Certified Referee</span>
              </div>
              
              <div className="profile-details">
                <div className="detail-group">
                  <h4>Referee Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Referee Level:</span>
                    <span className="detail-value">{performanceStats.highestLevel} Level</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Weapons Qualified:</span>
                    <span className="detail-value">{performanceStats.weapons?.join(', ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Experience:</span>
                    <span className="detail-value">{performanceStats.totalMatches} matches officiated</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Home District:</span>
                    <span className="detail-value">{user.district} District</span>
                  </div>
                </div>

                <div className="detail-group">
                  <h4>Refereeing Philosophy</h4>
                  <div className="refereeing-philosophy">
                    <p>
                      Committed to fair and consistent officiating with focus on accurate decision-making 
                      and maintaining the spirit of fencing. Strong emphasis on continuous learning and 
                      adherence to FIE rules and regulations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn btn-primary">
                  <i className="fas fa-edit"></i> Update Profile
                </button>
                <button className="btn btn-outline">
                  <i className="fas fa-download"></i> Download Referee ID
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefereeDashboard;