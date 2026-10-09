import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './StudentPaymentHistory.css';

const StudentPaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadPayments = async () => {
      if (!localStorage.getItem('Token')) {
        navigate('/auth/login');
        return;
      }
      try {
        const account = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
        if (account.data.role !== 'STUDENT') {
          navigate('/admin/admin-dashboard');
          return;
        }
        const response = await axios.get(`${api}/api/payments/my-history`, { withCredentials: true });
        if (active) setPayments(response.data);
      } catch (requestError) {
        console.error('Unable to load payment history:', requestError);
        if (requestError.response?.status === 401 || requestError.response?.status === 403) {
          localStorage.removeItem('Token');
          navigate('/auth/login');
        } else if (active) {
          setError(requestError.response?.data?.message || 'Unable to load payment history.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadPayments();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleDownload = async (payment) => {
    setDownloadingId(payment.id);
    setError('');
    try {
      const response = await axios.get(`${api}/api/payments/${payment.id}/receipt`, {
        responseType: 'blob',
        withCredentials: true,
      });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `Receipt-${payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (requestError) {
      console.error('Receipt download failed:', requestError);
      let message = 'Unable to download this receipt.';
      if (requestError.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await requestError.response.data.text());
          message = body.message || message;
        } catch (parseError) {
          console.error('Unable to read receipt error response:', parseError);
        }
      } else {
        message = requestError.response?.data?.message || message;
      }
      setError(message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="student-payment-history">
      <title>Student Payment History</title>
      <Navbar />
      <main className="content-wrapper">
        <h1 className="page-title">Payment status and history</h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: -12, marginBottom: 24 }}>
          Payments are collected offline and recorded by the administrator.
        </p>
        {loading && <p role="status">Loading payment history...</p>}
        {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
        {!loading && !error && payments.length === 0 && (
          <p className="no-payments">No payment records found.</p>
        )}
        {!loading && payments.length > 0 && (
          <div className="table-container">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Fee period</th>
                  <th>Payment date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.month} {payment.year}</td>
                    <td>{payment.status === 'Paid' ? payment.date : '—'}</td>
                    <td>₹{payment.amount}</td>
                    <td><span className={`status-badge ${payment.status.toLowerCase()}`}>{payment.status}</span></td>
                    <td>
                      <button
                        className="download-btn"
                        type="button"
                        onClick={() => handleDownload(payment)}
                        title={payment.status === 'Paid' ? 'Download receipt' : 'Receipt available after payment'}
                        aria-label={`Download receipt for ${payment.month} ${payment.year}`}
                        disabled={payment.status !== 'Paid' || downloadingId === payment.id}
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StudentPaymentHistory;
