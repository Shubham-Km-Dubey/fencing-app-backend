import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://fencing-app-backend.onrender.com';

const FeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [message, setMessage] = useState('');

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const loadFees = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/fees/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFees(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load fees:', error);
      setMessage('Failed to load registration fees');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (fee) => {
    setEditingFee(fee);
    setEditAmount(fee.amount.toString());
  };

  const cancelEdit = () => {
    setEditingFee(null);
    setEditAmount('');
    setMessage('');
  };

  const updateFee = async (userType) => {
    if (!editAmount || isNaN(editAmount) || parseInt(editAmount) < 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    try {
      const token = getAuthToken();
      const response = await axios.put(
        `${API_BASE_URL}/api/fees/${userType}`,
        { amount: parseInt(editAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage('Fee updated successfully!');
        setEditingFee(null);
        setEditAmount('');
        await loadFees(); // Reload fees to show updated data
      }
    } catch (error) {
      console.error('Failed to update fee:', error);
      setMessage('Failed to update fee: ' + (error.response?.data?.message || error.message));
    }
  };

  const getUserTypeLabel = (userType) => {
    const labels = {
      fencer: 'Fencer',
      coach: 'Coach',
      referee: 'Referee',
      school: 'School',
      club: 'Club'
    };
    return labels[userType] || userType;
  };

  useEffect(() => {
    loadFees();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fee-management">
      <div className="section-header">
        <h2>Registration Fee Management</h2>
        <p>Manage registration fees for different user types</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading fees...</div>
      ) : (
        <div className="fees-table-container">
          <table className="fees-table">
            <thead>
              <tr>
                <th>User Type</th>
                <th>Current Fee (₹)</th>
                <th>Last Updated</th>
                <th>Updated By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(fee => (
                <tr key={fee._id}>
                  <td>
                    <div className="user-type-info">
                      <div className="user-type-label">{getUserTypeLabel(fee.userType)}</div>
                      <div className="user-type-id">{fee.userType}</div>
                    </div>
                  </td>
                  <td>
                    {editingFee && editingFee.userType === fee.userType ? (
                      <div className="edit-amount-input">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          min="0"
                          step="50"
                          className="amount-input"
                        />
                        <span className="currency-symbol">₹</span>
                      </div>
                    ) : (
                      <div className="current-amount">₹{fee.amount}</div>
                    )}
                  </td>
                  <td>
                    <div className="update-date">
                      {formatDate(fee.updatedAt)}
                    </div>
                  </td>
                  <td>
                    <div className="updated-by">
                      {fee.updatedBy ? (
                        <>
                          <div className="admin-name">{fee.updatedBy.name}</div>
                          <div className="admin-email">{fee.updatedBy.email}</div>
                        </>
                      ) : (
                        <span className="not-available">System</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {editingFee && editingFee.userType === fee.userType ? (
                      <div className="edit-actions">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => updateFee(fee.userType)}
                        >
                          <i className="fas fa-check"></i> Save
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={cancelEdit}
                        >
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => startEdit(fee)}
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .fee-management {
          padding: 20px;
        }

        .section-header {
          margin-bottom: 30px;
        }

        .section-header h2 {
          color: #2d3748;
          margin-bottom: 8px;
        }

        .section-header p {
          color: #718096;
          font-size: 14px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .alert.success {
          background-color: #f0fff4;
          border: 1px solid #9ae6b4;
          color: #276749;
        }

        .alert.error {
          background-color: #fed7d7;
          border: 1px solid #feb2b2;
          color: #c53030;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .fees-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .fees-table {
          width: 100%;
          border-collapse: collapse;
        }

        .fees-table th {
          background-color: #f7fafc;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 1px solid #e2e8f0;
        }

        .fees-table td {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .fees-table tr:last-child td {
          border-bottom: none;
        }

        .user-type-info {
          display: flex;
          flex-direction: column;
        }

        .user-type-label {
          font-weight: 600;
          color: #2d3748;
        }

        .user-type-id {
          font-size: 12px;
          color: #718096;
          text-transform: uppercase;
        }

        .current-amount {
          font-weight: 600;
          color: #2d3748;
          font-size: 16px;
        }

        .edit-amount-input {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .amount-input {
          padding: 8px 12px 8px 30px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          width: 120px;
          font-size: 14px;
        }

        .currency-symbol {
          position: absolute;
          left: 12px;
          color: #718096;
          font-weight: 500;
        }

        .update-date {
          font-size: 13px;
          color: #718096;
        }

        .updated-by {
          display: flex;
          flex-direction: column;
        }

        .admin-name {
          font-weight: 500;
          color: #2d3748;
        }

        .admin-email {
          font-size: 12px;
          color: #718096;
        }

        .not-available {
          color: #a0aec0;
          font-style: italic;
        }

        .edit-actions {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-primary {
          background-color: #4299e1;
          color: white;
        }

        .btn-primary:hover {
          background-color: #3182ce;
        }

        .btn-success {
          background-color: #48bb78;
          color: white;
        }

        .btn-success:hover {
          background-color: #38a169;
        }

        .btn-outline {
          background-color: transparent;
          border: 1px solid #cbd5e0;
          color: #4a5568;
        }

        .btn-outline:hover {
          background-color: #f7fafc;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default FeeManagement;