import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Check } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const StudentNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        if (!localStorage.getItem('Token')) {
          navigate('/auth/login');
          return;
        }
        const profile = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
        if (profile.data.role !== 'STUDENT') {
          navigate(profile.data.role === 'ADMIN' ? '/admin/admin-dashboard' : '/auth/login');
          return;
        }
        const response = await axios.get(`${api}/api/notifications/mine`, {
          withCredentials: true,
        });
        if (active) setNotifications(response.data || []);
      } catch (requestError) {
        console.error('Unable to load notifications:', requestError);
        if (active && requestError.response?.status === 401) {
          localStorage.removeItem('Token');
          navigate('/auth/login');
        } else if (active) {
          setError(requestError.response?.data?.message || 'Unable to load notifications.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotifications();
    return () => {
      active = false;
    };
  }, [navigate]);

  const markRead = async (id) => {
    try {
      const response = await axios.patch(`${api}/api/notifications/${id}/read`, {}, {
        withCredentials: true,
      });
      setNotifications((current) => current.map((item) => item.id === id ? response.data : item));
      window.dispatchEvent(new Event('student-notifications-updated'));
      setError('');
    } catch (requestError) {
      console.error('Unable to mark notification as read:', requestError);
      setError(requestError.response?.status === 404
        ? 'This notification is no longer available.'
        : requestError.response?.data?.message || 'Unable to update this notification.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '80px auto', padding: '32px 20px 80px' }}>
        <section style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)', padding: 24 }}>
          <h1 style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 0 }}>
            <Bell size={24} /> Notifications
          </h1>
          {loading && <p>Loading notifications...</p>}
          {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
          {!loading && !error && notifications.length === 0 && (
            <p style={{ color: '#64748b' }}>You don't have any notifications.</p>
          )}
          <div style={{ display: 'grid', gap: 12 }}>
            {notifications.map((notification) => (
              <article key={notification.id} style={{
                border: '1px solid #e2e8f0',
                borderLeft: notification.read ? '4px solid #cbd5e1' : '4px solid #4f46e5',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                alignItems: 'flex-start',
              }}>
                <div>
                  <h2 style={{ fontSize: 17, margin: '0 0 7px' }}>{notification.title}</h2>
                  <p style={{ margin: '0 0 8px', color: '#475569', whiteSpace: 'pre-wrap' }}>{notification.message}</p>
                  <time style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </time>
                </div>
                {!notification.read && (
                  <button
                    type="button"
                    onClick={() => markRead(notification.id)}
                    aria-label={`Mark ${notification.title} as read`}
                    title="Mark as read"
                    style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', border: 0, borderRadius: 9, padding: 9, background: '#eef2ff', color: '#4338ca', cursor: 'pointer' }}
                  >
                    <Check size={18} />
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StudentNotifications;
