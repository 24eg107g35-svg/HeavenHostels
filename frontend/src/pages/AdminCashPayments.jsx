import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Navbar from '../components/Navbar';

const localDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const localMonthStart = () => `${localDate().slice(0, 7)}-01`;

const AdminCashPayments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [requestDates, setRequestDates] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(location.state?.student || null);
  const [amount, setAmount] = useState(location.state?.student?.AmountPerMonth || '');
  const [paymentDate, setPaymentDate] = useState(localDate());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStudents = useCallback(async () => {
    setError('');
    try {
      const response = await axios.get(`${api}/api/students/unpaidlist`, { withCredentials: true });
      setStudents(response.data.data);
      const pendingResponse = await axios.get(`${api}/api/payment-confirmations/pending`, {
        withCredentials: true,
      });
      setPaymentRequests(pendingResponse.data);
    } catch (requestError) {
      console.error('Unable to load students with unpaid fees:', requestError);
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
        return;
      }
      setError(requestError.response?.data?.message || 'Unable to load the unpaid student list.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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
        await loadStudents();
      } catch (requestError) {
        console.error('Unable to verify admin payment access:', requestError);
        localStorage.removeItem('Token');
        navigate('/auth/login');
      }
    };
    verifyAdmin();
  }, [loadStudents, navigate]);

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setAmount(student.AmountPerMonth || '');
    setPaymentDate(localDate());
    setSuccess('');
    setError('');
  };

  const recordPayment = async (event) => {
    event.preventDefault();
    if (!selectedStudent || saving) return;

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid payment amount greater than zero.');
      return;
    }
    if (Number(amount) !== Number(selectedStudent.AmountPerMonth)) {
      setError(`The amount must match the monthly fee of ₹${selectedStudent.AmountPerMonth}.`);
      return;
    }
    if (!paymentDate || paymentDate < localMonthStart() || paymentDate > localDate()) {
      setError('Select a payment date within the current month that is today or earlier.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    const recordedDate = new Date(`${paymentDate}T00:00:00`);
    try {
      const response = await axios.post(`${api}/api/payments`, {
        studentId: selectedStudent._id,
        amount: Number(amount),
        month: recordedDate.getMonth() + 1,
        year: recordedDate.getFullYear(),
        paymentDate,
        transactionId: null,
      }, { withCredentials: true });
      setSuccess(`Recorded ₹${response.data.amount} cash for ${selectedStudent.StudentName}. Fee status is Paid.`);
      setSelectedStudent(null);
      await loadStudents();
    } catch (requestError) {
      console.error('Unable to record offline payment:', requestError);
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
        return;
      }
      setError(requestError.response?.data?.message || 'Unable to record this payment.');
    } finally {
      setSaving(false);
    }
  };

  const completePaymentRequest = async (request) => {
    const paymentDate = requestDates[request.id] || localDate();
    if (!paymentDate || paymentDate > localDate()
      || paymentDate.slice(0, 4) !== String(request.year)
      || Number(paymentDate.slice(5, 7)) !== monthNumber(request.month)) {
      setError(`Choose a valid payment date in ${request.month} ${request.year}.`);
      return;
    }

    setError('');
    setSuccess('');
    try {
      const response = await axios.patch(`${api}/api/payment-confirmations/${request.id}/complete`, {
        paymentDate,
      }, { withCredentials: true });
      setSuccess(`Confirmed cash for ${response.data.studentName}. The fee is completed and the student was notified.`);
      window.dispatchEvent(new Event('payment-confirmation-requests-updated'));
      await loadStudents();
    } catch (requestError) {
      console.error('Unable to complete offline payment request:', requestError);
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
        return;
      }
      setError(requestError.response?.data?.message || 'Unable to complete this payment request.');
    }
  };

  const rejectPaymentRequest = async (request) => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.patch(`${api}/api/payment-confirmations/${request.id}/reject`, {}, {
        withCredentials: true,
      });
      setPaymentRequests((current) => current.filter((item) => item.id !== response.data.id));
      setSuccess(`Payment request from ${response.data.studentName} was declined. Fee status remains pending.`);
      window.dispatchEvent(new Event('payment-confirmation-requests-updated'));
    } catch (requestError) {
      console.error('Unable to decline offline payment request:', requestError);
      setError(requestError.response?.data?.message || 'Unable to decline this payment request.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '80px auto', padding: '32px 20px 80px' }}>
        <Link to="/admin/admin-dashboard">Back to dashboard</Link>
        <header style={{ margin: '20px 0 24px' }}>
          <h1 style={{ margin: 0 }}>Record offline payment</h1>
          <p style={{ color: '#64748b' }}>
            Select a student after receiving cash. The amount must match that student’s monthly fee.
            Recording payment updates the student’s status and sends a notification.
          </p>
        </header>

        {error && <div role="alert" style={noticeStyle('error')}>{error}</div>}
        {success && <div role="status" style={noticeStyle('success')}>{success}</div>}

        <section style={{ ...cardStyle, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Student payment requests ({paymentRequests.length})</h2>
          <p style={{ color: '#64748b' }}>
            Verify that cash was received before completing a request. Completion records the monthly fee and notifies the student.
          </p>
          {loading ? <p>Loading payment requests...</p> : paymentRequests.length === 0 ? (
            <p style={{ color: '#64748b' }}>There are no pending student payment requests.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {paymentRequests.map((request) => (
                <article key={request.id} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                }}>
                  <div>
                    <strong>{request.studentName}</strong>
                    <div style={{ color: '#64748b', fontSize: 13 }}>
                      {request.studentEmail} · Room {request.roomNumber || 'N/A'}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {request.month} {request.year} · ₹{request.amount} · Requested {new Date(request.requestedAt).toLocaleString()}
                    </div>
                  </div>
                  <input
                    type="date"
                    min={`${request.year}-${String(monthNumber(request.month)).padStart(2, '0')}-01`}
                    max={localDate()}
                    value={requestDates[request.id] || localDate()}
                    onChange={(event) => setRequestDates((current) => ({ ...current, [request.id]: event.target.value }))}
                    aria-label={`Payment date for ${request.studentName}`}
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    onClick={() => completePaymentRequest(request)}
                    style={{ ...requestButtonStyle, background: '#15803d' }}
                  >
                    Confirm received
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectPaymentRequest(request)}
                    style={{ ...requestButtonStyle, background: '#b91c1c' }}
                  >
                    Decline
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Pending fees ({students.length})</h2>
            {loading ? <p>Loading students...</p> : students.length === 0 ? (
              <p style={{ color: '#64748b' }}>No students have a pending fee this month.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {students.map((student) => (
                  <button
                    key={student._id}
                    type="button"
                    onClick={() => selectStudent(student)}
                    aria-pressed={selectedStudent?._id === student._id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 8,
                      textAlign: 'left',
                      padding: 14,
                      borderRadius: 12,
                      border: selectedStudent?._id === student._id ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                      background: selectedStudent?._id === student._id ? '#eef2ff' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <span>
                      <strong style={{ display: 'block' }}>{student.StudentName}</strong>
                      <span style={{ color: '#64748b', fontSize: 13 }}>
                        {student.RoomNumber || 'No room'} · {student.Mobilenumber || 'No phone'}
                      </span>
                    </span>
                    <strong>₹{student.AmountPerMonth}</strong>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Confirm cash received</h2>
            {!selectedStudent ? (
              <p style={{ color: '#64748b' }}>Choose a student with a pending fee to continue.</p>
            ) : (
              <form onSubmit={recordPayment} style={{ display: 'grid', gap: 16 }}>
                <div style={{ padding: 14, borderRadius: 12, background: '#f8fafc' }}>
                  <strong>{selectedStudent.StudentName}</strong>
                  <div style={{ color: '#64748b', marginTop: 4 }}>Monthly fee due: ₹{selectedStudent.AmountPerMonth}</div>
                </div>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span>Amount received (₹)</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    style={fieldStyle}
                  />
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span>Date cash received</span>
                  <input
                    type="date"
                    required
                    min={localMonthStart()}
                    max={localDate()}
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    style={fieldStyle}
                  />
                </label>
                <button type="submit" disabled={saving} style={{
                  border: 0,
                  borderRadius: 10,
                  padding: '13px 18px',
                  background: '#15803d',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Saving payment...' : 'Confirm cash received'}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
  padding: 22,
};

const fieldStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '11px 13px',
  fontSize: 15,
  background: '#fff',
  color: '#0f172a',
};

const noticeStyle = (type) => ({
  margin: '14px 0',
  padding: 12,
  borderRadius: 10,
  background: type === 'error' ? '#fef2f2' : '#ecfdf5',
  color: type === 'error' ? '#b91c1c' : '#065f46',
});

const requestButtonStyle = {
  border: 0,
  borderRadius: 9,
  padding: '10px 12px',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const monthNumber = (month) => {
  const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    .indexOf(month.toLowerCase());
  return monthIndex + 1;
};

export default AdminCashPayments;
