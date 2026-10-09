import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Navbar from '../components/Navbar';

const AdminNotificationSender = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!localStorage.getItem('Token')) {
        navigate('/auth/login');
        return;
      }
      try {
        const response = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
        if (response.data.role !== 'ADMIN') {
          navigate(response.data.role === 'STUDENT' ? '/student/student-dashboard' : '/auth/login');
          return;
        }
        setVerifying(false);
      } catch (requestError) {
        console.error('Unable to verify admin access:', requestError);
        localStorage.removeItem('Token');
        navigate('/auth/login');
      }
    };

    verifyAdmin();
  }, [navigate]);

  if (verifying) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
        <Navbar />
        <main style={{ maxWidth: 850, margin: '80px auto', padding: '32px 20px 80px' }}>
          <p>Verifying administrator access...</p>
        </main>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${api}/api/notifications/broadcast`, form, {
        withCredentials: true,
      });
      setSuccess(`Update sent to ${response.data.recipientCount} student${response.data.recipientCount === 1 ? '' : 's'}.`);
      setForm({ title: '', message: '' });
    } catch (requestError) {
      console.error('Unable to send student update:', requestError);
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
        return;
      }
      setError(requestError.response?.data?.message || 'Unable to send this update.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: 850, margin: '80px auto', padding: '32px 20px 80px' }}>
        <Link to="/admin/admin-dashboard">Back to dashboard</Link>
        <section style={{
          marginTop: 20,
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
          padding: 24,
        }}>
          <h1 style={{ marginTop: 0 }}>Send a student update</h1>
          <p style={{ color: '#64748b' }}>
            This announcement will appear in the notifications page of every student account.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Title</span>
              <input
                required
                maxLength={160}
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. Water supply update"
                style={fieldStyle}
              />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Update or message</span>
              <textarea
                required
                maxLength={2000}
                rows={6}
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Enter the update students should receive."
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
            </label>
            {error && <div role="alert" style={noticeStyle('error')}>{error}</div>}
            {success && <div role="status" style={noticeStyle('success')}>{success}</div>}
            <button type="submit" disabled={sending} style={{
              justifySelf: 'start',
              border: 0,
              borderRadius: 10,
              padding: '12px 18px',
              background: '#4f46e5',
              color: '#fff',
              fontWeight: 700,
              cursor: sending ? 'wait' : 'pointer',
              opacity: sending ? 0.7 : 1,
            }}>
              {sending ? 'Sending...' : 'Send update to all students'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

const fieldStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 15,
  background: '#fff',
  color: '#0f172a',
};

const noticeStyle = (type) => ({
  padding: 12,
  borderRadius: 10,
  background: type === 'error' ? '#fef2f2' : '#ecfdf5',
  color: type === 'error' ? '#b91c1c' : '#065f46',
});

export default AdminNotificationSender;
