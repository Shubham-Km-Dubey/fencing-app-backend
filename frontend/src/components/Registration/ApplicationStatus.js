import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://fencing-app-backend.onrender.com';

const ApplicationStatus = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState(null);
  const [rejectionHistory, setRejectionHistory] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const navigate = useNavigate();

  // Get user from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserInfo(user);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user's profile and application data
  useEffect(() => {
    const fetchStatus = async () => {
      if (!userInfo) {
        setLoading(false);
        return;
      }

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const roleMap = {
          fencer: 'fencer',
          coach: 'coach',
          referee: 'referee',
          school: 'school',
          club: 'club',
        };

        const endpoint = `/api/${roleMap[userInfo.role]}/profile`;
        const { data } = await axios.get(endpoint, config);
        setProfile(data);
        
        // If user is rejected, fetch application data for editing
        if (data.status === 'rejected' || userInfo.canEditForm) {
          fetchApplicationDataForEditing(userInfo.role, config);
        }
      } catch (err) {
        console.log("Profile not found yet (normal for pending users)");
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchStatus();
    }
  }, [userInfo]);

  // Fetch application data for editing
  const fetchApplicationDataForEditing = async (userType, config) => {
    try {
      setFetchingData(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/my-application/${userType}`,
        config
      );
      
      if (response.data.success) {
        setApplicationData(response.data.data);
        setRejectionHistory(response.data.rejectionHistory || []);
        setCanEdit(response.data.canEdit || false);
      }
    } catch (error) {
      console.error('Error fetching application data:', error);
      // User might not have an application yet or not allowed to edit
    } finally {
      setFetchingData(false);
    }
  };

  // Handle edit form navigation
  const handleEditForm = () => {
    if (!userInfo || !userInfo.role) return;
    
    // Store application data for pre-filling the form
    if (applicationData) {
      localStorage.setItem('editApplicationData', JSON.stringify({
        ...applicationData,
        isEditMode: true,
        applicationId: applicationData._id,
        userType: userInfo.role
      }));
    }
    
    // Navigate to appropriate registration form
    navigate(`/register/${userInfo.role}`);
  };

  // Handle refresh status
  const handleRefresh = async () => {
    if (!userInfo) return;
    
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const roleMap = {
        fencer: 'fencer',
        coach: 'coach',
        referee: 'referee',
        school: 'school',
        club: 'club',
      };

      const endpoint = `/api/${roleMap[userInfo.role]}/profile`;
      const { data } = await axios.get(endpoint, config);
      setProfile(data);
      
      // If still rejected, refetch application data
      if (data.status === 'rejected' || userInfo.canEditForm) {
        await fetchApplicationDataForEditing(userInfo.role, config);
      }
    } catch (err) {
      console.log("Error refreshing status");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!userInfo) {
    return (
      <div style={styles.container}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <h2>Please log in to check your application status</h2>
        <button style={styles.btn} onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  if (userInfo.isApproved) {
    return (
      <div style={styles.container}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <h2>Welcome back!</h2>
        <p>Your account is approved and active.</p>
        {userInfo.dafId && (
          <div style={styles.dafIdBadge}>
            <strong>Your DAF ID:</strong> {userInfo.dafId}
          </div>
        )}
        <button style={styles.btn} onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (loading || fetchingData) {
    return (
      <div style={styles.container}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <h2>Loading your application status...</h2>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  const status = profile?.status;
  const latestRejection = rejectionHistory.length > 0 ? rejectionHistory[rejectionHistory.length - 1] : null;

  return (
    <div style={styles.container}>
      <img src={logo} alt="Logo" style={styles.logo} />
      <h2>Application Status</h2>
      <div style={styles.userInfo}>
        <p><strong>Email:</strong> {userInfo.email}</p>
        <p><strong>Role:</strong> {userInfo.role}</p>
        <p><strong>District:</strong> {userInfo.district || 'Not assigned'}</p>
      </div>

      {status === 'pending' && (
        <div style={styles.pending}>
          <h3 style={{ color: '#f39c12' }}>📋 Under Review</h3>
          <p>Your application is being reviewed by the District Administrator.</p>
          <p>Please check back later. You will get access once approved.</p>
          {profile?.submittedAt && (
            <p style={styles.smallText}>
              Submitted on: {formatDate(profile.submittedAt)}
            </p>
          )}
        </div>
      )}

      {(status === 'rejected' || userInfo.canEditForm) && (
        <div style={styles.rejected}>
          <h3 style={{ color: '#e74c3c' }}>❌ Application Requires Attention</h3>
          
          {latestRejection && (
            <div style={styles.rejectionDetails}>
              <p><strong>Latest Rejection Reason:</strong></p>
              <div style={styles.reasonBox}>
                {latestRejection.reason}
              </div>
              {latestRejection.remarks && (
                <p style={styles.remarks}><strong>Remarks:</strong> {latestRejection.remarks}</p>
              )}
              <p style={styles.smallText}>
                Rejected on: {formatDate(latestRejection.rejectedAt)}
              </p>
            </div>
          )}

          {userInfo.rejectionReason && !latestRejection && (
            <div style={styles.rejectionDetails}>
              <p><strong>Rejection Reason:</strong></p>
              <div style={styles.reasonBox}>
                {userInfo.rejectionReason}
              </div>
            </div>
          )}

          <p>Please correct the issues mentioned above and resubmit your application.</p>
          
          {rejectionHistory.length > 1 && (
            <div style={styles.historySection}>
              <p><strong>Rejection History ({rejectionHistory.length} times):</strong></p>
              <button 
                style={styles.historyBtn}
                onClick={() => {
                  // Show full history in alert or modal
                  const historyText = rejectionHistory.map((item, index) => 
                    `${index + 1}. ${formatDate(item.rejectedAt)}: ${item.reason}${item.remarks ? ` (${item.remarks})` : ''}`
                  ).join('\n');
                  alert(`Rejection History:\n\n${historyText}`);
                }}
              >
                View Full History
              </button>
            </div>
          )}

          {canEdit && applicationData && (
            <div style={styles.editSection}>
              <p>You can now edit your application form.</p>
              <button 
                style={styles.editBtn} 
                onClick={handleEditForm}
                disabled={fetchingData}
              >
                {fetchingData ? 'Loading...' : '✏️ Edit & Resubmit Application'}
              </button>
              <p style={styles.smallText}>
                Your previous application data will be pre-filled for editing.
              </p>
            </div>
          )}

          {!canEdit && (
            <div style={styles.infoBox}>
              <p>⏳ Your application is being processed. Editing is not available at this time.</p>
            </div>
          )}
        </div>
      )}

      {!status && !userInfo.canEditForm && (
        <div style={styles.pending}>
          <h3 style={{ color: '#f39c12' }}>📤 Application Submitted</h3>
          <p>Your payment was successful and application is submitted.</p>
          <p>Waiting for District Admin approval...</p>
          {profile?.createdAt && (
            <p style={styles.smallText}>
              Submitted on: {formatDate(profile.createdAt)}
            </p>
          )}
        </div>
      )}

      <div style={styles.actionButtons}>
        <button
          style={{ ...styles.btn, backgroundColor: '#3498db' }}
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Status'}
        </button>
        
        <button
          style={{ ...styles.btn, backgroundColor: '#95a5a6', marginLeft: '10px' }}
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

// Updated inline styles
const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '30px',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif',
  },
  logo: {
    width: '120px',
    marginBottom: '20px',
  },
  userInfo: {
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #3498db',
  },
  btn: {
    padding: '12px 24px',
    backgroundColor: '#2c3e50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '15px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  editBtn: {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '15px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  historyBtn: {
    padding: '8px 16px',
    backgroundColor: '#8e44ad',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px',
  },
  pending: { 
    margin: '20px 0', 
    padding: '20px', 
    backgroundColor: '#fef9e7', 
    borderRadius: '8px',
    borderLeft: '4px solid #f39c12',
  },
  rejected: { 
    margin: '20px 0', 
    padding: '25px', 
    backgroundColor: '#fadbd8', 
    borderRadius: '8px',
    borderLeft: '4px solid #e74c3c',
  },
  rejectionDetails: {
    textAlign: 'left',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: '15px',
    borderRadius: '6px',
    margin: '15px 0',
  },
  reasonBox: {
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e74c3c',
    margin: '10px 0',
    fontStyle: 'italic',
  },
  remarks: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginTop: '8px',
  },
  editSection: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderRadius: '8px',
    border: '1px dashed #27ae60',
  },
  historySection: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
    borderRadius: '6px',
  },
  infoBox: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: '6px',
    border: '1px solid #3498db',
  },
  dafIdBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '20px',
    margin: '15px 0',
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginTop: '8px',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '25px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '20px auto',
  },
};

// Add CSS for spinner animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default ApplicationStatus;