import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Check, X, Calendar, Send, DollarSign, AlertCircle, Edit2, 
  Download, Search, Users, CheckCircle2, Clock, ArrowLeft, RefreshCw, Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import './FeeStatus.css';

// Approved 1-5 Sharing Pricing Tier
const SHARING_PRICING = [
  { sharing: 1, name: '1 Sharing', price: 7500, desc: 'Single Private Room • Dedicated Study Desk • Attached Bath' },
  { sharing: 2, name: '2 Sharing', price: 7000, desc: 'Double Sharing • High-Speed Wi-Fi • Wardrobe Storage' },
  { sharing: 3, name: '3 Sharing', price: 6500, desc: 'Triple Sharing • Standard Sharing • Ergonomic Bed & Desk' },
  { sharing: 4, name: '4 Sharing', price: 6000, desc: '4 Sharing • Economy Quad • Air Cooled & Storage' },
  { sharing: 5, name: '5 Sharing', price: 5500, desc: '5 Sharing • Budget Dormitory • Full Hostel Amenities' },
];

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FeeStatus = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PAID, DUE

  // Modal states
  const [selectedCell, setSelectedCell] = useState(null); // { student, month, year, payment, isPaid }
  const [cellPaymentDate, setCellPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editFeeStudent, setEditFeeStudent] = useState(null); // student being edited
  const [customAmount, setCustomAmount] = useState('');
  const [selectedSharing, setSelectedSharing] = useState('3 Sharing');
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  // Generate recent 6 months list including current month
  const displayMonths = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      list.push({
        month: m,
        year: y,
        monthName: monthNames[m - 1],
        shortCode: `${monthNames[m - 1].toLowerCase()}-${m}`,
        label: `${monthNames[m - 1]} ${y}`
      });
    }
    return list;
  }, []);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const fetchStudents = async () => {
    if (!localStorage.getItem('Token')) {
      navigate('/auth/login');
      return;
    }
    try {
      setError('');
      const account = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
      if (account.data.role !== 'ADMIN') {
        navigate(account.data.role === 'STUDENT' ? '/student/student-dashboard' : '/auth/login');
        return;
      }
      const response = await axios.get(`${api}/api/students/paymenthistroy`, { withCredentials: true });
      if (response.status === 200) {
        setStudents(response.data.responses || []);
      }
    } catch (err) {
      console.error('Error fetching student fee data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch student fee details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Helper to find payment for a student in a specific month and year
  const getPaymentForMonth = (student, monthNum, yearNum) => {
    if (!student.payments || !Array.isArray(student.payments)) return null;
    const targetMonthName = monthNames[monthNum - 1]?.toLowerCase();
    
    return student.payments.find(p => {
      if (!p) return false;
      const pYear = p.year || (p.date ? new Date(p.date).getFullYear() : null);
      if (pYear !== yearNum) return false;
      
      if (typeof p.month === 'number') {
        return p.month === monthNum;
      }
      if (typeof p.month === 'string') {
        const pMonthLower = p.month.toLowerCase();
        if (pMonthLower === targetMonthName) return true;
        const pNum = parseInt(p.month.replace(/\D/g, ''), 10);
        if (pNum === monthNum) return true;
      }
      if (p.date) {
        const pDate = new Date(p.date);
        return pDate.getMonth() + 1 === monthNum;
      }
      return false;
    });
  };

  // Helper to determine if a student is paid for current month
  const isStudentPaidCurrent = (student) => {
    const currentPayment = getPaymentForMonth(student, currentMonth, currentYear);
    return currentPayment?.status === 'Paid' || currentPayment?.status === 'PAID';
  };

  // Statistics
  const totalStudents = students.length;
  const paidThisMonthCount = students.filter(s => isStudentPaidCurrent(s)).length;
  const dueThisMonthCount = totalStudents - paidThisMonthCount;
  const totalRevenueThisMonth = students.reduce((acc, s) => {
    if (isStudentPaidCurrent(s)) {
      const p = getPaymentForMonth(s, currentMonth, currentYear);
      return acc + Number(p?.amount || s.amountPerMonth || 6500);
    }
    return acc;
  }, 0);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const name = (student.studentName || '').toLowerCase();
      const room = (student.roomNumber || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || name.includes(query) || room.includes(query);

      const isPaid = isStudentPaidCurrent(student);
      if (statusFilter === 'PAID') return matchesSearch && isPaid;
      if (statusFilter === 'DUE') return matchesSearch && !isPaid;
      return matchesSearch;
    });
  }, [students, searchQuery, statusFilter]);

  // Admin action: Send payment request to an individual student
  const handleSendPaymentRequest = async (studentId, monthNum, yearNum, studentName) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${api}/api/payment-confirmations/admin/send`, {
        studentId,
        month: monthNum,
        year: yearNum
      }, { withCredentials: true });
      setSuccess(`✓ Payment request for ${monthNames[monthNum - 1]} ${yearNum} sent to ${studentName}! The student can now accept and pay.`);
      setSelectedCell(null);
    } catch (err) {
      console.error('Failed to send payment request:', err);
      setError(err.response?.data?.message || 'Failed to send payment request to student');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin action: Send payment request to ALL unpaid students for current month
  const handleSendRequestToAllUnpaid = async () => {
    if (!window.confirm(`Send payment requests to all ${dueThisMonthCount} students with Due Fee for ${monthNames[currentMonth - 1]} ${currentYear}?`)) {
      return;
    }
    setSendingAll(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${api}/api/payment-confirmations/admin/send-all-unpaid`, {}, { withCredentials: true });
      const count = Array.isArray(res.data) ? res.data.length : dueThisMonthCount;
      setSuccess(`✓ Successfully sent fee payment requests to ${count} unpaid student(s)! They can now accept & pay in their dashboard.`);
    } catch (err) {
      console.error('Failed to send bulk payment requests:', err);
      setError(err.response?.data?.message || 'Could not send payment requests to all unpaid students');
    } finally {
      setSendingAll(false);
    }
  };

  // Admin action: Mark student status as PAID for specific month
  const handleMarkPaid = async (studentId, monthNum, yearNum) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(`${api}/api/students/updatepaymentstatus/${studentId}`, {
        paymentDate: cellPaymentDate,
        month: monthNum,
        year: yearNum
      }, { withCredentials: true });
      setSuccess(`✓ Marked ${monthNames[monthNum - 1]} ${yearNum} as PAID!`);
      setSelectedCell(null);
      await fetchStudents();
    } catch (err) {
      console.error('Failed to mark paid:', err);
      setError(err.response?.data?.message || 'Failed to update payment status to Paid');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin action: Mark student status as UNPAID for specific month
  const handleMarkUnpaid = async (studentId, monthNum, yearNum) => {
    if (!window.confirm(`Are you sure you want to revert fee status to DUE / UNPAID for ${monthNames[monthNum - 1]} ${yearNum}?`)) {
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${api}/api/students/updatepaymentstatustoUnpaid/${studentId}`, {
        month: monthNum,
        year: yearNum
      }, { withCredentials: true });
      setSuccess(`✓ Fee status updated to DUE / UNPAID for ${monthNames[monthNum - 1]} ${yearNum}.`);
      setSelectedCell(null);
      await fetchStudents();
    } catch (err) {
      console.error('Failed to mark unpaid:', err);
      setError(err.response?.data?.message || 'Failed to update payment status to Unpaid');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin action: Update student fee & sharing tier
  const handleSaveStudentFee = async () => {
    if (!editFeeStudent) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const amt = customAmount ? parseFloat(customAmount) : null;
      await axios.put(`${api}/api/students/${editFeeStudent._id || editFeeStudent.id}/fee`, {
        amount: amt,
        sharing: selectedSharing
      }, { withCredentials: true });
      setSuccess(`✓ Fee updated successfully for ${editFeeStudent.studentName}! Sharing: ${selectedSharing}, Rate: ₹${amt || 'Default'}`);
      setEditFeeStudent(null);
      await fetchStudents();
    } catch (err) {
      console.error('Failed to update student fee:', err);
      setError(err.response?.data?.message || 'Failed to update student fee and sharing tier');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit fee modal
  const openEditFeeModal = (student) => {
    setEditFeeStudent(student);
    setCustomAmount(student.amountPerMonth ? String(student.amountPerMonth) : '6500');
    setSelectedSharing(student.sharing || '3 Sharing');
  };

  // Handle cell click
  const handleCellClick = (student, mObj) => {
    const payment = getPaymentForMonth(student, mObj.month, mObj.year);
    const isPaid = payment?.status === 'Paid' || payment?.status === 'PAID';
    setCellPaymentDate(today.toISOString().slice(0, 10));
    setSelectedCell({
      student,
      month: mObj.month,
      year: mObj.year,
      monthName: mObj.monthName,
      payment,
      isPaid
    });
  };

  // Download receipt
  const downloadReceipt = async (paymentId) => {
    try {
      const response = await axios.get(`${api}/api/payments/${paymentId}/receipt`, {
        responseType: 'blob',
        withCredentials: true,
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HeavenHostels-Receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Receipt download failed:', err);
      alert('Could not download payment receipt.');
    }
  };

  if (loading) {
    return (
      <div className="fee-status-page">
        <Navbar />
        <div className="fee-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Hostel Fee Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fee-status-page">
      <Navbar />

      <main className="fee-status-container">
        {/* Top Breadcrumb & Navigation */}
        <div className="fee-top-bar">
          <Link to="/admin/admin-dashboard" className="fee-back-btn">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
          <div className="fee-top-actions">
            <button 
              className="fee-refresh-btn" 
              onClick={() => { setRefreshing(true); fetchStudents(); }}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button 
              className="fee-send-all-btn" 
              onClick={handleSendRequestToAllUnpaid}
              disabled={sendingAll || dueThisMonthCount === 0}
            >
              <Send size={16} />
              <span>{sendingAll ? 'Sending Requests...' : `Send Payment Request to All Unpaid (${dueThisMonthCount})`}</span>
            </button>
          </div>
        </div>

        {/* Page Title */}
        <div className="fee-header-section">
          <h1 className="fee-main-title">Hostel Fee Management & Payment Control</h1>
          <p className="fee-main-subtitle">
            Administer monthly fee decisions, 1-5 sharing room pricing, send payment requests to students, and track payment history.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="fee-alert fee-alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="alert-close"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="fee-alert fee-alert-success">
            <CheckCircle2 size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="alert-close"><X size={16} /></button>
          </div>
        )}

        {/* 1, 2, 3, 4, 5 Sharing Pricing Tier Banner */}
        <section className="fee-pricing-section">
          <div className="pricing-section-header">
            <div>
              <h2 className="pricing-title">Official Room Sharing Fee Matrix</h2>
              <p className="pricing-subtitle">Approved monthly tariffs across 1, 2, 3, 4, and 5 sharing accommodations</p>
            </div>
            <span className="pricing-badge">
              <Layers size={14} /> Approved Pricing
            </span>
          </div>

          <div className="pricing-grid">
            {SHARING_PRICING.map((tier) => (
              <div key={tier.sharing} className="pricing-card">
                <div className="tier-tag">{tier.sharing} Bed Room</div>
                <h3 className="tier-name">{tier.name}</h3>
                <div className="tier-price">
                  <span className="currency">₹</span>
                  <span className="amount">{tier.price.toLocaleString('en-IN')}</span>
                  <span className="period">/month</span>
                </div>
                <p className="tier-desc">{tier.desc}</p>
                <div className="tier-footer">
                  <span className="tier-rate-chip">Fixed Rate</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Statistics Overview */}
        <div className="fee-stats-row">
          <div className="fee-stat-box">
            <div className="stat-icon-wrap icon-blue">
              <Users size={22} />
            </div>
            <div>
              <div className="stat-num">{totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>

          <div className="fee-stat-box stat-paid">
            <div className="stat-icon-wrap icon-green">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="stat-num text-green">{paidThisMonthCount}</div>
              <div className="stat-label">Paid This Month ({monthNames[currentMonth - 1]})</div>
            </div>
          </div>

          <div className="fee-stat-box stat-due">
            <div className="stat-icon-wrap icon-red">
              <Clock size={22} />
            </div>
            <div>
              <div className="stat-num text-red">{dueThisMonthCount}</div>
              <div className="stat-label">Due Fee (Unpaid)</div>
            </div>
          </div>

          <div className="fee-stat-box">
            <div className="stat-icon-wrap icon-purple">
              <DollarSign size={22} />
            </div>
            <div>
              <div className="stat-num">₹{totalRevenueThisMonth.toLocaleString('en-IN')}</div>
              <div className="stat-label">Revenue Collected This Month</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="fee-filter-bar">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by student name or room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="fee-search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-pill-group">
            <button 
              className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Students ({students.length})
            </button>
            <button 
              className={`filter-pill filter-paid ${statusFilter === 'PAID' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PAID')}
            >
              Paid ({paidThisMonthCount})
            </button>
            <button 
              className={`filter-pill filter-due ${statusFilter === 'DUE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('DUE')}
            >
              Due Fee ({dueThisMonthCount})
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="fee-legend-bar">
          <div className="legend-item">
            <span className="legend-dot dot-green"></span>
            <span><strong>PAID (Green)</strong>: Fee paid & receipt generated</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-red"></span>
            <span><strong>DUE FEE (Red)</strong>: Outstanding payment / Pending request</span>
          </div>
          <span className="legend-tip">💡 Tip: Click on any monthly cell to mark Paid, revert to Unpaid, or send a payment request.</span>
        </div>

        {/* Students Table */}
        <div className="fee-table-card">
          <div className="table-responsive">
            <table className="fee-table">
              <thead>
                <tr>
                  <th className="sticky-col col-sno">S.No</th>
                  <th className="sticky-col col-name" style={{ left: '50px' }}>Student Details</th>
                  <th className="col-room">Room</th>
                  <th className="col-sharing">Sharing Tier</th>
                  <th className="col-fee">Fee / Month</th>
                  <th className="col-actions">Fee Control</th>
                  {displayMonths.map((m) => (
                    <th key={`${m.year}-${m.month}`} className="col-month-header">
                      {m.label}
                      {m.month === currentMonth && m.year === currentYear && (
                        <span className="current-badge">Current</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => {
                    const studentId = student._id || student.id;
                    const feeAmt = student.amountPerMonth || 6500;
                    return (
                      <tr key={studentId}>
                        <td className="sticky-col col-sno">{idx + 1}</td>
                        <td className="sticky-col col-name" style={{ left: '50px' }}>
                          <div className="student-profile-cell">
                            <span className="student-name">{student.studentName}</span>
                            <span className="student-id-sub">ID: #{studentId}</span>
                          </div>
                        </td>
                        <td className="col-room">
                          <span className="room-tag">Room {student.roomNumber || 'N/A'}</span>
                        </td>
                        <td className="col-sharing">
                          <span className="sharing-pill">{student.sharing || '3 Sharing'}</span>
                        </td>
                        <td className="col-fee">
                          <span className="fee-amount-text">₹{Number(feeAmt).toLocaleString('en-IN')}</span>
                        </td>
                        <td className="col-actions">
                          <div className="admin-row-actions">
                            <button 
                              className="action-btn-edit-fee"
                              onClick={() => openEditFeeModal(student)}
                              title="Decide Student Monthly Fee & Sharing"
                            >
                              <Edit2 size={13} />
                              <span>Decide Fee</span>
                            </button>
                            <button 
                              className="action-btn-send-req"
                              onClick={() => handleSendPaymentRequest(studentId, currentMonth, currentYear, student.studentName)}
                              title="Send Current Month Payment Request"
                            >
                              <Send size={13} />
                              <span>Send Req</span>
                            </button>
                          </div>
                        </td>

                        {/* Monthly Status Cells */}
                        {displayMonths.map((mObj) => {
                          const payment = getPaymentForMonth(student, mObj.month, mObj.year);
                          const isPaid = payment?.status === 'Paid' || payment?.status === 'PAID';

                          return (
                            <td key={`${studentId}-${mObj.year}-${mObj.month}`} className="col-month-cell">
                              <button
                                className={`monthly-status-btn ${isPaid ? 'status-paid-btn' : 'status-due-btn'}`}
                                onClick={() => handleCellClick(student, mObj)}
                                title={`Click to manage ${student.studentName}'s fee for ${mObj.label}`}
                              >
                                {isPaid ? (
                                  <div className="btn-inner-paid">
                                    <Check size={14} className="paid-icon" />
                                    <span>PAID</span>
                                    {payment?.date && (
                                      <span className="paid-date-micro">{payment.date}</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="btn-inner-due">
                                    <Clock size={14} className="due-icon" />
                                    <span>DUE FEE</span>
                                    <span className="due-amount-micro">₹{Number(feeAmt).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6 + displayMonths.length} className="no-students-cell">
                      <div className="empty-state-wrap">
                        <Users size={36} className="empty-icon" />
                        <p className="empty-title">No student records found</p>
                        <p className="empty-sub">Try adjusting your search criteria or filter options.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: Payment Status & Management Modal */}
      {selectedCell && (
        <div className="fee-modal-overlay" onClick={() => !actionLoading && setSelectedCell(null)}>
          <div className="fee-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fee-modal-header">
              <div>
                <h3 className="modal-title">Manage Student Fee Status</h3>
                <p className="modal-sub">
                  {selectedCell.student.studentName} • Room {selectedCell.student.roomNumber} • {selectedCell.monthName} {selectedCell.year}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCell(null)} disabled={actionLoading}>
                <X size={20} />
              </button>
            </div>

            <div className="fee-modal-body">
              {/* Current Status Badge */}
              <div className="status-indicator-box">
                <span className="box-label">Current Status:</span>
                {selectedCell.isPaid ? (
                  <span className="badge-paid-large">
                    <CheckCircle2 size={18} /> PAID (Green)
                  </span>
                ) : (
                  <span className="badge-due-large">
                    <AlertCircle size={18} /> DUE FEE (Red)
                  </span>
                )}
              </div>

              {selectedCell.isPaid ? (
                /* Details when PAID */
                <div className="paid-details-card">
                  <div className="info-row">
                    <span className="info-label">Payment Date:</span>
                    <span className="info-val">{selectedCell.payment?.date || 'Recorded'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Amount Paid:</span>
                    <span className="info-val">₹{Number(selectedCell.payment?.amount || selectedCell.student.amountPerMonth || 6500).toLocaleString('en-IN')}</span>
                  </div>
                  {selectedCell.payment?.receiptNumber && (
                    <div className="info-row">
                      <span className="info-label">Receipt Number:</span>
                      <span className="info-val receipt-code">{selectedCell.payment.receiptNumber}</span>
                    </div>
                  )}

                  <div className="modal-actions-grid">
                    {selectedCell.payment?._id || selectedCell.payment?.id ? (
                      <button 
                        className="btn-download-receipt"
                        onClick={() => downloadReceipt(selectedCell.payment._id || selectedCell.payment.id)}
                      >
                        <Download size={16} />
                        <span>Download Receipt PDF</span>
                      </button>
                    ) : null}
                    <button 
                      className="btn-mark-unpaid"
                      onClick={() => handleMarkUnpaid(selectedCell.student._id || selectedCell.student.id, selectedCell.month, selectedCell.year)}
                      disabled={actionLoading}
                    >
                      <X size={16} />
                      <span>{actionLoading ? 'Updating...' : 'Mark as Unpaid (Due)'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Actions when DUE / UNPAID */
                <div className="due-actions-card">
                  <div className="due-info-box">
                    <p className="due-amount-display">
                      Outstanding Fee: <strong>₹{Number(selectedCell.student.amountPerMonth || 6500).toLocaleString('en-IN')}</strong>
                    </p>
                    <p className="due-help-text">
                      You can send a payment request to the student so they can accept and pay online/offline, or record it as Paid directly.
                    </p>
                  </div>

                  <div className="mark-paid-form">
                    <label className="form-label">Select Payment Date (if marking Paid):</label>
                    <input 
                      type="date"
                      value={cellPaymentDate}
                      onChange={(e) => setCellPaymentDate(e.target.value)}
                      max={today.toISOString().slice(0, 10)}
                      className="date-input"
                    />
                  </div>

                  <div className="modal-actions-grid">
                    <button 
                      className="btn-send-request-direct"
                      onClick={() => handleSendPaymentRequest(
                        selectedCell.student._id || selectedCell.student.id, 
                        selectedCell.month, 
                        selectedCell.year,
                        selectedCell.student.studentName
                      )}
                      disabled={actionLoading}
                    >
                      <Send size={16} />
                      <span>{actionLoading ? 'Sending...' : 'Send Payment Request to Student'}</span>
                    </button>

                    <button 
                      className="btn-mark-paid-direct"
                      onClick={() => handleMarkPaid(
                        selectedCell.student._id || selectedCell.student.id, 
                        selectedCell.month, 
                        selectedCell.year
                      )}
                      disabled={actionLoading}
                    >
                      <Check size={16} />
                      <span>{actionLoading ? 'Recording...' : 'Mark as Paid Now'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Decide Student Monthly Fee & Sharing Tier */}
      {editFeeStudent && (
        <div className="fee-modal-overlay" onClick={() => !actionLoading && setEditFeeStudent(null)}>
          <div className="fee-modal-card fee-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fee-modal-header">
              <div>
                <h3 className="modal-title">Decide Student Fee & Room Sharing</h3>
                <p className="modal-sub">
                  Adjust monthly fee tariffs and room sharing tier for {editFeeStudent.studentName} (Room {editFeeStudent.roomNumber})
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setEditFeeStudent(null)} disabled={actionLoading}>
                <X size={20} />
              </button>
            </div>

            <div className="fee-modal-body">
              <label className="form-label">Select Sharing Tier (Auto-sets approved price):</label>
              <div className="sharing-preset-grid">
                {SHARING_PRICING.map((tier) => (
                  <button
                    key={tier.sharing}
                    type="button"
                    className={`sharing-preset-btn ${selectedSharing === `${tier.sharing} Sharing` ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSharing(`${tier.sharing} Sharing`);
                      setCustomAmount(String(tier.price));
                    }}
                  >
                    <span className="preset-name">{tier.name}</span>
                    <span className="preset-price">₹{tier.price.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>

              <div className="custom-amount-field">
                <label className="form-label">Monthly Payment Amount (₹):</label>
                <div className="input-with-currency">
                  <span className="input-currency">₹</span>
                  <input 
                    type="number"
                    min="1000"
                    step="100"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter monthly fee"
                    className="amount-input"
                  />
                </div>
                <span className="field-hint">
                  The student will be charged this exact monthly amount when paying their fees.
                </span>
              </div>

              <div className="modal-footer-btns">
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditFeeStudent(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-save-fee"
                  onClick={handleSaveStudentFee}
                  disabled={actionLoading || !customAmount}
                >
                  <Check size={16} />
                  <span>{actionLoading ? 'Saving Changes...' : 'Save & Update Student Fee'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default FeeStatus;
