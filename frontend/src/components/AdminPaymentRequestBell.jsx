import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import axios from 'axios';
import api from '../api';

const AdminPaymentRequestBell = () => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('Token')) return undefined;

    let active = true;
    let intervalId;
    const loadCount = async () => {
      try {
        const response = await axios.get(`${api}/api/payment-confirmations/pending/count`, {
          withCredentials: true,
        });
        if (active) setPendingCount(response.data.pendingCount);
      } catch (error) {
        console.error('Unable to load pending payment request count:', error);
        if (active && error.response?.status === 401) {
          localStorage.removeItem('Token');
          navigate('/auth/login');
        }
      }
    };
    const initialize = async () => {
      try {
        const profile = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
        if (!active || profile.data.role !== 'ADMIN') return;
        setVisible(true);
        await loadCount();
        if (!active) return;
        intervalId = window.setInterval(loadCount, 30000);
        window.addEventListener('payment-confirmation-requests-updated', loadCount);
      } catch (error) {
        console.error('Unable to verify admin payment notifications:', error);
        if (active && error.response?.status === 401) {
          localStorage.removeItem('Token');
          navigate('/auth/login');
        }
      }
    };

    initialize();
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('payment-confirmation-requests-updated', loadCount);
    };
  }, [navigate]);

  if (!visible) return null;
  return (
    <Link
      to="/admin/payment-collection"
      aria-label={pendingCount > 0 ? `Payment requests, ${pendingCount} pending` : 'Payment requests'}
      title="Student payment requests"
      className="navbar-icon-link"
      style={{ position: 'relative' }}
    >
      <Bell size={20} />
      {pendingCount > 0 && (
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
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </Link>
  );
};

export default AdminPaymentRequestBell;
