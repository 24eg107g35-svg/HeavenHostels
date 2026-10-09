import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Download,
  Calendar,
  Send,
  ShieldCheck,
  Bed,
  ArrowRight,
  Info
} from 'lucide-react';
import './StudentFeeManagement.css';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const sharingPriceMatrix = [
  { sharing: '1', label: '1 Sharing', price: 7500, desc: 'Single Private Room' },
  { sharing: '2', label: '2 Sharing', price: 7000, desc: 'Twin Sharing Room' },
  { sharing: '3', label: '3 Sharing', price: 6500, desc: 'Triple Sharing Room' },
  { sharing: '4', label: '4 Sharing', price: 6000, desc: 'Quad Economy Room' },
  { sharing: '5', label: '5 Sharing', price: 5500, desc: 'Community Shared Room' },
];

const StudentFeeManagement = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [confirmationRequests, setConfirmationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refreshHistory = async () => {
    try {
      const [historyResponse, requestResponse] = await Promise.all([
        axios.get(`${api}/api/payments/my-history`, { withCredentials: true }),
        axios.get(`${api}/api/payment-confirmations/mine`, { withCredentials: true }),
      ]);
      setPayments(historyResponse.data || []);
      setConfirmationRequests(requestResponse.data || []);
    } catch (err) {
      console.error('Unable to refresh payment status:', err);
    }
  };

  const loadFeeStatus = async () => {
    if (!localStorage.getItem('Token')) {
      navigate('/auth/login');
      return;
    }
    try {
      const accountResponse = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
      if (accountResponse.data.role === 'ADMIN') {
        navigate('/admin/students-fee-status');
        return;
      }
      const profileResponse = await axios.get(`${api}/api/students/me`, { withCredentials: true });
      setStudent(profileResponse.data);

      const [historyResponse, requestResponse] = await Promise.all([
        axios.get(`${api}/api/payments/my-history`, { withCredentials: true }),
        axios.get(`${api}/api/payment-confirmations/mine`, { withCredentials: true }),
      ]);
      setPayments(historyResponse.data || []);
      setConfirmationRequests(requestResponse.data || []);
    } catch (err) {
      console.error('Error loading fee status:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
      } else {
        setError(err.response?.data?.message || 'Unable to load your fee status.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeStatus();
    const interval = setInterval(refreshHistory, 25000);
    return () => clearInterval(interval);
  }, [navigate]);

  const today = new Date();
  const currentMonthNum = today.getMonth() + 1;
  const currentMonthName = monthNames[today.getMonth()];
  const currentMonthShort = currentMonthName.slice(0, 3).toLowerCase();
  const currentYear = today.getFullYear();

  // Find if current month is paid
  const currentPayment = payments.find(p => (
    p.year === currentYear &&
    (p.month?.toLowerCase() === currentMonthShort || p.month?.toLowerCase() === currentMonthName.toLowerCase())
  ));

  const isCurrentPaid = currentPayment?.status === 'Paid' || student?.paymentstatus === 'Paid';

  // Check if Admin sent a payment request
  const pendingAdminRequest = confirmationRequests.find(req => (
    req.status === 'PENDING' && req.year === currentYear
  ));

  // Student accepts admin request and pays
  const handleAcceptAndPay = async (requestId) => {
    setPaying(true);
    setError('');
    setMessage('');
    try {
      if (requestId) {
        try {
          await axios.post(`${api}/api/payment-confirmations/accept/${requestId}`, {}, { withCredentials: true });
        } catch (acceptErr) {
          // Fallback to /api/payments/pay-current
          await axios.post(`${api}/api/payments/pay-current`, {}, { withCredentials: true });
        }
      } else {
        await axios.post(`${api}/api/payments/pay-current`, {}, { withCredentials: true });
      }

      setMessage('✓ Payment accepted & completed successfully! Your fee status is now PAID.');
      await refreshHistory();
      // Reload profile
      const profRes = await axios.get(`${api}/api/students/me`, { withCredentials: true });
      setStudent(profRes.data);
    } catch (err) {
      console.error('Payment processing failed:', err);
      setError(err.response?.data?.message || 'Payment could not be completed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  // Student notifies offline cash payment to admin
  const handleNotifyCashHandover = async () => {
    setRequesting(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.post(`${api}/api/payment-confirmations/mine`, {}, { withCredentials: true });
      setConfirmationRequests(current => [
        response.data,
        ...current.filter(r => r.id !== response.data.id),
      ]);
      setMessage('✓ Cash payment notification sent to Admin! Admin will verify and mark your payment status.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit payment request.');
    } finally {
      setRequesting(false);
    }
  };

  // Determine student's sharing number
  const studentSharingClean = student?.sharing ? student.sharing.toString().replace(/[^0-9]/g, '') : '3';
  const currentTierPrice = sharingPriceMatrix.find(t => t.sharing === studentSharingClean)?.price || (student?.amountPerMonth || 6500);

  // Generate monthly status items for the academic calendar (Jan through Dec of current year)
  const monthsList = monthNames.map((mName, idx) => {
    const mNum = idx + 1;
    const mShort = mName.slice(0, 3).toLowerCase();
    const paidRecord = payments.find(p => (
      p.year === currentYear &&
      (p.month?.toLowerCase() === mShort || p.month?.toLowerCase() === mName.toLowerCase()) &&
      p.status === 'Paid'
    ));

    const isMonthInFuture = (currentYear === today.getFullYear() && mNum > currentMonthNum);

    return {
      monthName: mName,
      monthNum: mNum,
      year: currentYear,
      isPaid: !!paidRecord,
      paidRecord,
      isFuture: isMonthInFuture,
      isCurrent: mNum === currentMonthNum
    };
  });

  if (loading) {
    return (
      <div className="fee-page-container">
        <Navbar />
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
          <div>Loading Fee Management...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="fee-page-container">
      <Navbar />

      <main className="fee-main">
        {/* HEADER HERO */}
        <section className="fee-header-card">
          <div className="fee-badge">
            <CreditCard size={15} />
            <span>Hostel Fee Management</span>
          </div>
          <h1 className="fee-title">Student Fee & Payment Status</h1>
          <p className="fee-subtitle">
            Admin reviews and decides student payment status. View the official sharing pricing tiers, accept payment requests sent by the administrator, and check your monthly payment history.
          </p>
        </section>

        {/* ALERTS */}
        {message && (
          <div className="fee-alert-success">
            <CheckCircle2 size={20} />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="fee-alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. SHARING PRICING TIERS SECTION (1, 2, 3, 4, 5 sharing) */}
        <section className="sharing-pricing-section">
          <div className="section-head">
            <div>
              <h2>
                <Bed size={22} className="text-primary" />
                Hostel Sharing Fee Structure
              </h2>
              <p>Official monthly rates decided by administration for 1, 2, 3, 4, and 5 sharing accommodations.</p>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>
              Academic Year {currentYear}-{currentYear + 1}
            </div>
          </div>

          <div className="sharing-grid">
            {sharingPriceMatrix.map((tier) => {
              const isStudentTier = studentSharingClean === tier.sharing;
              return (
                <div key={tier.sharing} className={`sharing-card ${isStudentTier ? 'active-tier' : ''}`}>
                  {isStudentTier && <span className="your-tier-badge">Your Room Tier</span>}
                  <div className="sharing-title">{tier.label}</div>
                  <div className="sharing-price">₹{tier.price.toLocaleString()}</div>
                  <div className="sharing-cycle">per student / month</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 6 }}>{tier.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. STUDENT CURRENT STATUS OVERVIEW */}
        {student && (
          <section className="status-overview-grid">
            <div className="status-card">
              <div className="status-label">Student Name</div>
              <div className="status-value">{student.studentName}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Allocated Room</div>
              <div className="status-value">{student.roomNumber || 'Not assigned'} ({student.sharing || '3 Sharing'})</div>
            </div>
            <div className="status-card">
              <div className="status-label">Current Month Fee</div>
              <div className="status-value">₹{(student.amountPerMonth || currentTierPrice).toLocaleString()}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Payment Status</div>
              <div className={`status-value ${isCurrentPaid ? 'paid' : 'due'}`}>
                {isCurrentPaid ? 'PAID ✓' : 'DUE FEE ⚠'}
              </div>
            </div>
          </section>
        )}

        {/* 3. ADMIN PAYMENT REQUEST / DUE ACTION CALLOUT */}
        <section className={`payment-request-callout ${pendingAdminRequest ? 'has-request' : isCurrentPaid ? '' : 'due-notice'}`}>
          <div className="callout-content">
            <div className="callout-info">
              {pendingAdminRequest ? (
                <>
                  <h3>🔔 Payment Request Sent by Admin</h3>
                  <p>
                    The administrator has requested fee payment for <strong>{monthNames[pendingAdminRequest.month - 1]} {pendingAdminRequest.year}</strong> (₹{(student?.amountPerMonth || currentTierPrice).toLocaleString()}). Please accept and pay below.
                  </p>
                </>
              ) : isCurrentPaid ? (
                <>
                  <h3 style={{ color: '#059669' }}>✓ Current Month Fee is Paid</h3>
                  <p>
                    Your hostel fee for {currentMonthName} {currentYear} is fully settled and verified by administration.
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ color: '#dc2626' }}>⚠ Fee Due for {currentMonthName} {currentYear}</h3>
                  <p>
                    Your monthly fee of ₹{(student?.amountPerMonth || currentTierPrice).toLocaleString()} is pending. You can pay online or notify the admin if paying cash offline.
                  </p>
                </>
              )}
            </div>

            <div className="callout-actions">
              {pendingAdminRequest && (
                <button
                  className="btn-accept-pay"
                  disabled={paying}
                  onClick={() => handleAcceptAndPay(pendingAdminRequest.id)}
                >
                  <CheckCircle2 size={18} />
                  {paying ? 'Processing...' : 'Accept Request & Pay Now'}
                </button>
              )}

              {!isCurrentPaid && !pendingAdminRequest && (
                <>
                  <button
                    className="btn-accept-pay"
                    disabled={paying}
                    onClick={() => handleAcceptAndPay(null)}
                  >
                    <CreditCard size={18} />
                    {paying ? 'Processing...' : 'Pay Fee (₹' + (student?.amountPerMonth || currentTierPrice).toLocaleString() + ')'}
                  </button>
                  <button
                    className="btn-notify-cash"
                    disabled={requesting}
                    onClick={handleNotifyCashHandover}
                  >
                    <Send size={16} />
                    {requesting ? 'Notifying...' : 'Notify Admin (Cash Paid)'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 4. MONTHLY PAYMENT HISTORY: GREEN FOR PAID, RED FOR DUE FEE */}
        <section className="payment-history-section">
          <div className="section-head">
            <div>
              <h2>
                <Calendar size={22} className="text-primary" />
                Monthly Payment History ({currentYear})
              </h2>
              <p>Green indicates verified Paid fees; Red indicates Due/Pending fees.</p>
            </div>
          </div>

          <div className="monthly-cards-grid">
            {monthsList.map((m) => {
              const statusClass = m.isPaid ? 'paid' : 'due';
              return (
                <div key={m.monthNum} className={`month-status-card ${statusClass}`}>
                  <div className="month-card-header">
                    <span className="month-name">{m.monthName} {m.year}</span>
                    <span className={`badge-status ${statusClass}`}>
                      {m.isPaid ? (
                        <>
                          <CheckCircle2 size={13} /> PAID
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} /> DUE FEE
                        </>
                      )}
                    </span>
                  </div>

                  <div className="month-card-body">
                    <div className="fee-amount-block">
                      <div className="fee-lbl">{m.isPaid ? 'Amount Paid' : 'Fee Due'}</div>
                      <div className="fee-val">
                        ₹{(m.paidRecord?.amount || student?.amountPerMonth || currentTierPrice).toLocaleString()}
                      </div>
                    </div>

                    <div className="fee-date-block">
                      {m.isPaid ? (
                        <div>
                          <div>Paid On</div>
                          <strong>{m.paidRecord?.date || 'Confirmed'}</strong>
                        </div>
                      ) : (
                        <div>
                          <div>Status</div>
                          <strong style={{ color: '#dc2626' }}>Payment Pending</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="month-card-actions">
                    {m.isPaid && m.paidRecord ? (
                      <a
                        href={`${api}/api/payments/${m.paidRecord.id}/receipt`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-download-receipt"
                      >
                        <Download size={14} /> Download Receipt (PDF)
                      </a>
                    ) : (
                      <button
                        className="btn-pay-card"
                        disabled={paying}
                        onClick={() => handleAcceptAndPay(pendingAdminRequest?.id || null)}
                      >
                        <CreditCard size={14} /> Pay ₹{(student?.amountPerMonth || currentTierPrice).toLocaleString()}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StudentFeeManagement;
