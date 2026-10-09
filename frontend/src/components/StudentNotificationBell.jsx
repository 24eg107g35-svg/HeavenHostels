import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import axios from 'axios';
import api from '../api';

const StudentNotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('Token')) return undefined;

    let active = true;
    let intervalId;
    const loadUnreadCount = async () => {
      try {
        const response = await axios.get(`${api}/api/notifications/mine/unread-count`, {
          withCredentials: true,
        });
        if (active) setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Unable to load student notification badge:', error);
        if (active && error.response?.status === 401) {
          localStorage.removeItem('Token');
          navigate('/auth/login');
        }
      }
    };

    const initializeBell = async () => {
      try {
        const profile = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
        if (!active || profile.data.role !== 'STUDENT') return;
        setVisible(true);
        await loadUnreadCount();
        if (!active) return;
        intervalId = window.setInterval(loadUnreadCount, 30000);
        window.addEventListener('student-notifications-updated', loadUnreadCount);
      } catch (error) {
        console.error('Unable to verify student notification access:', error);
        if (active && error.response?.status === 401) {
          localStorage.removeItem('Token');
          navigate('/auth/login');
        }
      }
    };

    initializeBell();
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('student-notifications-updated', loadUnreadCount);
    };
  }, [navigate]);

  if (!visible) return null;

  return (
    <Link
      to="/student/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      title="Notifications"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 42,
        height: 42,
        borderRadius: 999,
        color: '#4338ca',
        background: '#eef2ff',
        textDecoration: 'none',
      }}
    >
      <Bell size={21} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -5,
          minWidth: 19,
          height: 19,
          padding: '0 4px',
          borderRadius: 999,
          background: '#dc2626',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 10,
          fontWeight: 800,
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default StudentNotificationBell;
