import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const StudentComplaint = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ category: 'Maintenance', title: '', description: '' });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/auth/login');
          return;
        }

        const response = await axios.get(`${api}/api/complaints/mine`, { withCredentials: true });
        setSubmissions(response.data || []);
      } catch (error) {
        console.error('Unable to load complaint page:', error);
        setMessageType('error');
        setMessage('Unable to load your account. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      setMessageType('error');
      setMessage('Please provide a title and a description for your complaint.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const response = await axios.post(`${api}/api/complaints`, {
        title: `${form.category}: ${form.title.trim()}`,
        description: form.description.trim(),
      }, { withCredentials: true });
      setSubmissions((current) => [response.data, ...current]);
      setForm({ category: 'Maintenance', title: '', description: '' });
      setMessageType('success');
      setMessage('Complaint submitted successfully.');
    } catch (error) {
      console.error('Complaint submission failed:', error);
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Unable to submit your complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading complaint center...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '80px auto', padding: '32px 20px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
        <section style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)', padding: 24 }}>
          <h1 style={{ marginTop: 0 }}>Raise a complaint</h1>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>Category</span>
              <select name="category" value={form.category} onChange={handleChange} style={fieldStyle}>
                <option>Maintenance</option>
                <option>Room</option>
                <option>Mess</option>
                <option>Security</option>
                <option>Other</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span>Title</span>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Brief summary" style={fieldStyle} />
            </label>

            <label style={{ display: 'grid', gap: 8 }}>
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={handleChange} rows={6} placeholder="Describe the problem" style={{ ...fieldStyle, resize: 'vertical' }} />
            </label>

            {message && (
              <div role={messageType === 'error' ? 'alert' : 'status'} style={{
                background: messageType === 'error' ? '#fef2f2' : '#ecfdf5',
                border: `1px solid ${messageType === 'error' ? '#fecaca' : '#a7f3d0'}`,
                color: messageType === 'error' ? '#b91c1c' : '#065f46',
                borderRadius: 12,
                padding: '10px 12px',
              }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={submitting} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '14px 18px', borderRadius: 12, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit complaint'}
            </button>
          </form>
        </section>

        <section style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)', padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Recent complaints</h2>
          {submissions.length === 0 ? (
            <p style={{ color: '#64748b' }}>No complaints filed yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {submissions.map((item) => (
                <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <strong>{item.title}</strong>
                    <span style={{ background: '#e0f2fe', color: '#0f766e', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>{item.status}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
                    Ticket #{item.id} · Submitted {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <div>{item.description}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
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

export default StudentComplaint;
