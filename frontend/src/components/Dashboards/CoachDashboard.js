import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CoachDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [trainingPrograms, setTrainingPrograms] = useState([]);
  const [coachingEvents, setCoachingEvents] = useState([]);
  const [certifications, setCertifications] = useState([]);

  useEffect(() => {
    fetchCoachData();
  }, []);

  const fetchCoachData = async () => {
    try {
      const token = user.token;
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      
      // Mock data for coach-specific features
      const mockStudents = [
        {
          id: 1,
          name: 'Aarav Sharma',
          dafId: 'DAF-F123456',
          weapon: 'Foil',
          level: 'Intermediate',
          attendance: '95%',
          lastSession: '2024-01-15',
          progress: 'Excellent'
        },
        {
          id: 2,
          name: 'Rohan Kumar',
          dafId: 'DAF-F123457',
          weapon: 'Epee',
          level: 'Beginner',
          attendance: '88%',
          lastSession: '2024-01-14',
          progress: 'Good'
        },
        {
          id: 3,
          name: 'Priya Singh',
          dafId: 'DAF-F123458',
          weapon: 'Sabre',
          level: 'Advanced',
          attendance: '92%',
          lastSession: '2024-01-13',
          progress: 'Outstanding'
        },
        {
          id: 4,
          name: 'Ankit Verma',
          dafId: 'DAF-F123459',
          weapon: 'Foil',
          level: 'Intermediate',
          attendance: '85%',
          lastSession: '2024-01-12',
          progress: 'Improving'
        }
      ];

      const mockTrainingPrograms = [
        {
          id: 1,
          title: 'Advanced Foil Techniques',
          level: 'Intermediate',
          duration: '8 weeks',
          students: 8,
          status: 'active',
          startDate: '2024-01-10'
        },
        {
          id: 2,
          title: 'Beginner Epee Foundation',
          level: 'Beginner',
          duration: '12 weeks',
          students: 5,
          status: 'active',
          startDate: '2024-01-15'
        }
      ];

      const mockCoachingEvents = [
        {
          id: 1,
          title: 'Foil Masterclass Workshop',
          date: '2024-02-10',
          type: 'workshop',
          participants: 15,
          location: 'North East Sports Complex',
          status: 'upcoming'
        },
        {
          id: 2,
          title: 'District Coaching Seminar',
          date: '2024-02-25',
          type: 'seminar',
          participants: 25,
          location: 'DFA Headquarters',
          status: 'upcoming'
        }
      ];

      const mockCertifications = [
        {
          name: 'DFA Certified Advanced Coach',
          issued: '2023-05-15',
          validUntil: '2025-05-15',
          status: 'active'
        },
        {
          name: 'FIE Level 1 Coaching Certificate',
          issued: '2022-08-20',
          validUntil: '2024-08-20',
          status: 'active'
        }
      ];

      setStudents(mockStudents);
      setTrainingPrograms(mockTrainingPrograms);
      setCoachingEvents(mockCoachingEvents);
      setCertifications(mockCertifications);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coach data:', error);
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    if (user.isApproved) {
      return {
        status: 'approved',
        title: 'Active Coach',
        message: 'You are a certified coach with Delhi Fencing Association.',
        icon: '👨‍🏫',
        color: 'success',
        showDAFId: true
      };
    } else if (user.districtApproved && !user.centralApproved) {
      return {
        status: 'pending_central',
        title: 'Pending Central Approval',
        message: 'Your coaching application is waiting for central approval.',
        icon: '⏳',
        color: 'warning',
        showDAFId: false
      };
    } else if (user.rejectionReason) {
      return {
        status: 'rejected',
        title: 'Application Requires Updates',
        message: 'Your coaching application needs corrections.',
        icon: '❌',
        color: 'danger',
        showDAFId: false
      };
    } else {
      return {
        status: 'pending',
        title: 'Under Review',
        message: 'Your coaching application is being reviewed.',
        icon: '⏳',
        color: 'warning',
        showDAFId: false
      };
    }
  };

  const getWeaponIcon = (weapon) => {
    const icons = {
      'Foil': '⚔️',
      'Epee': '🗡️',
      'Sabre': '🔪'
    };
    return icons[weapon] || '🤺';
  };

  const getProgressColor = (progress) => {
    const colors = {
      'Outstanding': 'success',
      'Excellent': 'primary',
      'Good': 'warning',
      'Improving': 'info',
      'Needs Work': 'danger'
    };
    return colors[progress] || 'info';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading coach dashboard...</div>
      </div>
    );
  }

  const statusConfig = getStatusConfig();

  return (
    <div className="dashboard coach-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Coach Dashboard</h1>
          <p>Training the next generation of fencers</p>
        </div>
        <div className="user-actions">
          <span className="user-info">Coach • {user.district} District</span>
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
          className={`nav-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <i className="fas fa-users"></i> My Students ({students.length})
        </button>
        <button 
          className={`nav-btn ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          <i className="fas fa-dumbbell"></i> Training Programs
        </button>
        <button 
          className={`nav-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <i className="fas fa-calendar"></i> Coaching Events
        </button>
        <button 
          className={`nav-btn ${activeTab === 'certifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('certifications')}
        >
          <i className="fas fa-certificate"></i> Certifications
        </button>
        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i> Coach Profile
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
                      Your Coach DAF ID: <strong>{user.dafId}</strong>
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

            <div className="coach-stats">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Active Students</h3>
                    <div className="stat-number">{students.length}</div>
                    <div className="stat-trend">Across all programs</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-dumbbell"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Training Programs</h3>
                    <div className="stat-number">{trainingPrograms.length}</div>
                    <div className="stat-trend">Currently running</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Student Progress</h3>
                    <div className="stat-number">85%</div>
                    <div className="stat-trend">Average improvement</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-trophy"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Tournament Wins</h3>
                    <div className="stat-number">12</div>
                    <div className="stat-trend">This season</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button 
                  className="action-card"
                  onClick={() => setActiveTab('students')}
                >
                  <i className="fas fa-user-plus"></i>
                  <span>Manage Students</span>
                  <small>View and update student progress</small>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveTab('training')}
                >
                  <i className="fas fa-clipboard-list"></i>
                  <span>Training Programs</span>
                  <small>Create and manage programs</small>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveTab('events')}
                >
                  <i className="fas fa-calendar-plus"></i>
                  <span>Schedule Session</span>
                  <small>Plan training sessions</small>
                </button>
                
                <button className="action-card">
                  <i className="fas fa-file-alt"></i>
                  <span>Progress Reports</span>
                  <small>Generate student reports</small>
                </button>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Student Activity</h3>
              <div className="activity-list">
                {students.slice(0, 3).map(student => (
                  <div key={student.id} className="activity-item">
                    <div className="activity-avatar">
                      {getWeaponIcon(student.weapon)}
                    </div>
                    <div className="activity-content">
                      <p>
                        <strong>{student.name}</strong> showed <span className={`progress-${getProgressColor(student.progress)}`}>{student.progress}</span> progress in {student.weapon}
                      </p>
                      <span className="activity-time">
                        Last session: {new Date(student.lastSession).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`attendance-badge ${student.attendance === '95%' ? 'excellent' : 'good'}`}>
                      {student.attendance}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-section">
            <div className="section-header">
              <h2>My Students</h2>
              <div className="section-actions">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input type="text" placeholder="Search students..." />
                </div>
                <button className="btn btn-primary">
                  <i className="fas fa-user-plus"></i> Add Student
                </button>
              </div>
            </div>

            <div className="students-grid">
              {students.map(student => (
                <div key={student.id} className="student-card">
                  <div className="student-header">
                    <div className="student-avatar">
                      {getWeaponIcon(student.weapon)}
                    </div>
                    <div className="student-info">
                      <h4>{student.name}</h4>
                      <p>DAF ID: {student.dafId}</p>
                      <div className="student-meta">
                        <span className="weapon-badge">{student.weapon}</span>
                        <span className="level-badge">{student.level}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="student-stats">
                    <div className="stat">
                      <label>Attendance</label>
                      <span className={`attendance ${student.attendance === '95%' ? 'excellent' : 'good'}`}>
                        {student.attendance}
                      </span>
                    </div>
                    <div className="stat">
                      <label>Progress</label>
                      <span className={`progress progress-${getProgressColor(student.progress)}`}>
                        {student.progress}
                      </span>
                    </div>
                    <div className="stat">
                      <label>Last Session</label>
                      <span className="date">{new Date(student.lastSession).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="student-actions">
                    <button className="btn btn-outline btn-sm">
                      <i className="fas fa-chart-line"></i> Progress
                    </button>
                    <button className="btn btn-outline btn-sm">
                      <i className="fas fa-edit"></i> Update
                    </button>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-comment"></i> Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="training-section">
            <div className="section-header">
              <h2>Training Programs</h2>
              <button className="btn btn-primary">
                <i className="fas fa-plus"></i> Create Program
              </button>
            </div>

            <div className="programs-list">
              {trainingPrograms.map(program => (
                <div key={program.id} className="program-card">
                  <div className="program-header">
                    <h3>{program.title}</h3>
                    <span className={`status-badge ${program.status}`}>
                      {program.status}
                    </span>
                  </div>
                  
                  <div className="program-details">
                    <div className="detail">
                      <i className="fas fa-chart-bar"></i>
                      <span>Level: {program.level}</span>
                    </div>
                    <div className="detail">
                      <i className="fas fa-clock"></i>
                      <span>Duration: {program.duration}</span>
                    </div>
                    <div className="detail">
                      <i className="fas fa-users"></i>
                      <span>Students: {program.students}</span>
                    </div>
                    <div className="detail">
                      <i className="fas fa-calendar"></i>
                      <span>Started: {new Date(program.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="program-actions">
                    <button className="btn btn-outline">
                      <i className="fas fa-eye"></i> View Details
                    </button>
                    <button className="btn btn-primary">
                      <i className="fas fa-edit"></i> Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="events-section">
            <h2>Coaching Events & Workshops</h2>
            <div className="events-grid">
              {coachingEvents.map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className={`event-status ${event.status}`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="event-details">
                    <p><i className="fas fa-calendar"></i> {new Date(event.date).toLocaleDateString()}</p>
                    <p><i className="fas fa-map-marker-alt"></i> {event.location}</p>
                    <p><i className="fas fa-users"></i> {event.participants} participants</p>
                    <p><i className="fas fa-tag"></i> {event.type}</p>
                  </div>

                  <div className="event-actions">
                    <button className="btn btn-outline">
                      View Details
                    </button>
                    <button className="btn btn-primary">
                      Manage Participants
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="certifications-section">
            <h2>My Certifications</h2>
            <div className="certifications-list">
              {certifications.map((cert, index) => (
                <div key={index} className="certification-card">
                  <div className="cert-header">
                    <h3>{cert.name}</h3>
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
                      <i className="fas fa-download"></i> Download
                    </button>
                    <button className="btn btn-outline">
                      <i className="fas fa-eye"></i> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && profile?.profile && (
          <div className="profile-section">
            <h2>Coach Profile</h2>
            <div className="profile-card">
              <div className="profile-header">
                <h3>
                  {profile.profile.firstName} 
                  {profile.profile.middleName && ` ${profile.profile.middleName}`} 
                  {profile.profile.lastName && ` ${profile.profile.lastName}`}
                </h3>
                <span className="user-role-badge">Certified Coach</span>
              </div>
              
              <div className="profile-details">
                <div className="detail-group">
                  <h4>Professional Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Coach Level:</span>
                    <span className="detail-value">{profile.profile.level || 'Advanced Coach'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Specialization:</span>
                    <span className="detail-value">{profile.profile.specialization || 'Foil & Epee'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Experience:</span>
                    <span className="detail-value">{profile.profile.experience || '8 years'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Training Center:</span>
                    <span className="detail-value">{profile.profile.trainingCenter || 'North East Fencing Academy'}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <h4>Coaching Philosophy</h4>
                  <div className="coaching-philosophy">
                    <p>
                      Dedicated to developing technically sound fencers with strong fundamentals 
                      and competitive spirit. Focus on individual growth and team success.
                    </p>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn btn-primary">
                  <i className="fas fa-edit"></i> Update Profile
                </button>
                <button className="btn btn-outline">
                  <i className="fas fa-download"></i> Download Coach ID
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;