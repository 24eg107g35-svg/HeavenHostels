import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Navbar from '../components/Navbar';

const statuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

const AdminComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadComplaints = useCallback(async () => {
    setError('');
    try {
      const response = await axios.get(`${api}/api/complaints`, { withCredentials: true });
      setComplaints(response.data);
    } catch (requestError) {
      console.error('Unable to load complaints:', requestError);
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
        return;
      }
      setError(requestError.response?.data?.message || 'Unable to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem('Token')) {
      navigate('/auth/login');
      return;
    }
    loadComplaints();
  }, [loadComplaints, navigate]);

  const updateStatus = async (complaintId, status) => {
    setUpdatingId(complaintId);
    setError('');
    setMessage('');
    try {
      const response = await axios.patch(`${api}/api/complaints/${complaintId}/status`, { status }, {
        withCredentials: true,
      });
      setComplaints((current) => current.map((complaint) => (
        complaint.id === complaintId ? response.data : complaint
      )));
      setMessage(`Complaint #${complaintId} status updated.`);
    } catch (requestError) {
      console.error('Unable to update complaint status:', requestError);
      setError(requestError.response?.data?.message || 'Unable to update complaint status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '80px auto', padding: '32px 20px 80px' }}>
        <Link to="/admin/admin-dashboard">Back to dashboard</Link>
        <h1>Student complaints</h1>
        <p>Review each complaint and update its resolution status.</p>
        {error && <div role="alert" style={noticeStyle('error')}>{error}</div>}
        {message && <div role="status" style={noticeStyle('success')}>{message}</div>}
        {loading ? (
          <p>Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <p>No complaints have been submitted.</p>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {complaints.map((complaint) => (
              <article key={complaint.id} style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 20,
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: '0 0 8px' }}>{complaint.title}</h2>
                    <p style={{ margin: '0 0 8px', color: '#475569' }}>{complaint.description}</p>
                    <div style={{ color: '#64748b', fontSize: 14 }}>
                      Ticket #{complaint.id} · {complaint.studentName} ({complaint.studentEmail})
                      {complaint.roomNumber ? ` · Room ${complaint.roomNumber}` : ''}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                      Submitted {new Date(complaint.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <label style={{ display: 'grid', alignContent: 'start', gap: 6 }}>
                    <span>Complaint status</span>
                    <select
                      value={complaint.status}
                      disabled={updatingId === complaint.id}
                      onChange={(event) => updateStatus(complaint.id, event.target.value)}
                      style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 12px' }}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{status.replace('_', ' ')}</option>
                      ))}
                    </select>
                    {updatingId === complaint.id && <span role="status">Saving status...</span>}
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const noticeStyle = (type) => ({
  margin: '16px 0',
  padding: 12,
  borderRadius: 10,
  background: type === 'error' ? '#fef2f2' : '#ecfdf5',
  color: type === 'error' ? '#b91c1c' : '#065f46',
});

export default AdminComplaints;
