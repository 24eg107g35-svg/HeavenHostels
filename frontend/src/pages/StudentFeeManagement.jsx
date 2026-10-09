import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const StudentFeeManagement = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [confirmationRequests, setConfirmationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    let accountId;
    const refreshHistory = async () => {
      try {
        const [historyResponse, requestResponse] = await Promise.all([
          axios.get(`${api}/api/payments/my-history`, { withCredentials: true }),
          axios.get(`${api}/api/payment-confirmations/mine`, { withCredentials: true }),
        ]);
        if (active) {
          setPayments(historyResponse.data);
          setConfirmationRequests(requestResponse.data);
        }
      } catch (requestError) {
        console.error('Unable to refresh payment status:', requestError);
        if (active && (requestError.response?.status === 401 || requestError.response?.status === 403)) {
          localStorage.removeItem('Token');
          navigate('/auth/login');
        } else if (active) {
          setError(requestError.response?.data?.message || 'Unable to refresh your payment status.');
        }
      }
    };
    const loadFeeStatus = async () => {
      if (!localStorage.getItem('Token')) {
        navigate('/auth/login');
        return;
      }
      try {
        const accountResponse = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
        if (accountResponse.data.role !== 'STUDENT') {
          navigate('/admin/admin-dashboard');
          return;
        }
        accountId = accountResponse.data.id;
        const profileResponse = await axios.get(`${api}/api/students/me`, { withCredentials: true });
        const profile = profileResponse.data;

        const [historyResponse, requestResponse] = await Promise.all([
          axios.get(`${api}/api/payments/my-history`, { withCredentials: true }),
          axios.get(`${api}/api/payment-confirmations/mine`, { withCredentials: true }),
        ]);
        if (!active) return;
        setStudent(profile);
        setPayments(historyResponse.data);
        setConfirmationRequests(requestResponse.data);
      } catch (requestError) {
        console.error('Unable to load student fee status:', requestError);
        if (requestError.response?.status === 401 || requestError.response?.status === 403) {
          localStorage.removeItem('Token');
          navigate('/auth/login');
        } else if (active) {
          setError(requestError.response?.data?.message || 'Unable to load your fee status.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadFeeStatus();
    const intervalId = window.setInterval(() => {
      if (accountId) refreshHistory();
    }, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  const today = new Date();
  const currentPayment = payments.find((payment) => (
    payment.year === today.getFullYear()
    && payment.month?.toLowerCase() === monthNames[today.getMonth()].slice(0, 3).toLowerCase()
  ));
  const status = currentPayment?.status || student?.paymentstatus || 'Unpaid';
  const currentRequest = confirmationRequests.find((request) => (
    request.year === today.getFullYear()
    && request.month?.toLowerCase() === monthNames[today.getMonth()].slice(0, 3).toLowerCase()
  ));

  const notifyAdminPaymentReceived = async () => {
    setRequesting(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.post(`${api}/api/payment-confirmations/mine`, {}, {
        withCredentials: true,
      });
      setConfirmationRequests((current) => [
        response.data,
        ...current.filter((request) => request.id !== response.data.id),
      ]);
      setMessage('Your offline payment request was sent to the administrator. Your fee remains pending until the administrator confirms receipt.');
    } catch (requestError) {
      const responseMessage = requestError.response?.data?.message;
      if (requestError.response?.status === 409) {
        setError(responseMessage || 'This payment request cannot be submitted in the current account or payment state.');
        try {
          const [historyResponse, requestResponse] = await Promise.all([
            axios.get(`${api}/api/payments/my-history`, { withCredentials: true }),
            axios.get(`${api}/api/payment-confirmations/mine`, { withCredentials: true }),
          ]);
          setPayments(historyResponse.data);
          setConfirmationRequests(requestResponse.data);
        } catch (refreshError) {
          console.error('Unable to refresh fee details after payment request conflict:', refreshError);
        }
        return;
      }
      console.error('Unable to notify administrator about offline payment:', requestError);
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
      } else {
        setError(responseMessage || 'Unable to send your payment request.');
      }
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#0f172a' }}>
        Loading fee status...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: 950, margin: '80px auto', padding: '32px 20px 80px' }}>
        <section style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)', padding: 28 }}>
          <h1 style={{ marginTop: 0 }}>My hostel fee status</h1>
          <p style={{ color: '#64748b' }}>
            Payments are collected offline. Please pay the administrator in cash; the administrator will record
            the payment and update your status here. After handing over cash, use the button below to notify the
            administrator. Your fee is not marked paid until they confirm receipt.
          </p>
          {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
          {message && <p role="status" style={{ color: '#065f46' }}>{message}</p>}
          {!student && !error ? (
            <p>Your student profile is not available yet.</p>
          ) : student && (
            <>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
                <InfoRow label="Student" value={student.studentName} />
                <InfoRow label="Room" value={student.roomNumber || 'Not assigned'} />
                <InfoRow label="Fee month" value={`${monthNames[today.getMonth()]} ${today.getFullYear()}`} />
                <InfoRow label="Monthly amount due" value={`₹${student.amountPerMonth ?? 0}`} />
                <InfoRow label="Payment status" value={status} highlight={status === 'Paid'} />
                <InfoRow label="Payment date" value={currentPayment?.status === 'Paid' ? currentPayment.date : 'Not paid yet'} />
              </div>
              <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong>Offline payment confirmation</strong>
                <p style={{ margin: '6px 0 12px', color: '#64748b' }}>
                  {currentRequest?.status === 'PENDING'
                    ? 'Your request is pending. The administrator will verify the cash and update the payment status.'
                    : currentRequest?.status === 'REJECTED'
                      ? 'The administrator could not confirm this payment request. Please contact them or submit a new request after paying.'
                      : currentRequest?.status === 'COMPLETED'
                        ? 'The administrator confirmed your payment.'
                        : student.status !== 'ACTIVE'
                          ? 'Your student account is not active yet. Contact the administrator to activate your account before requesting payment confirmation.'
                        : 'Have you handed the fee to the administrator in cash? Notify them to request confirmation.'}
                </p>
                {student.status === 'ACTIVE' && status !== 'Paid' && currentRequest?.status !== 'PENDING' && (
                  <button
                    type="button"
                    disabled={requesting}
                    onClick={notifyAdminPaymentReceived}
                    style={{
                      border: 0,
                      borderRadius: 9,
                      padding: '11px 16px',
                      background: '#4f46e5',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: requesting ? 'wait' : 'pointer',
                    }}
                  >
                    {requesting ? 'Sending request...' : 'I paid offline — notify admin'}
                  </button>
                )}
              </div>

              <h2 style={{ margin: '32px 0 12px' }}>Payment history</h2>
              {payments.length === 0 ? (
                <p style={{ color: '#64748b' }}>No payment records are available yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={cellStyle}>Fee period</th>
                        <th style={cellStyle}>Amount</th>
                        <th style={cellStyle}>Date</th>
                        <th style={cellStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td style={cellStyle}>{payment.month} {payment.year}</td>
                          <td style={cellStyle}>₹{payment.amount}</td>
                          <td style={cellStyle}>{payment.status === 'Paid' ? payment.date : '—'}</td>
                          <td style={{ ...cellStyle, color: payment.status === 'Paid' ? '#15803d' : '#b45309', fontWeight: 700 }}>
                            {payment.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

const cellStyle = {
  padding: '12px 10px',
  borderBottom: '1px solid #e2e8f0',
};

const InfoRow = ({ label, value, highlight = false }) => (
  <div style={{
    background: highlight ? '#ecfdf5' : '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '16px 18px',
  }}>
    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{value}</div>
  </div>
);

export default StudentFeeManagement;
