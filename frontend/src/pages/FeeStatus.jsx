import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, X, Calendar, Minus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import {Link} from 'react-router-dom'
import './FeeStatus.css';

const FeeStatus = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [months, setMonths] = useState([]);

    // Helper function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Helper function to extract month from date and convert to format like "jan-1"
    const getMonthNumberFormat = (dateString) => {
        const date = new Date(dateString);
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
        const year = date.getFullYear();
        
        const monthOrder = {
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        };
        
        return { format: `${month}-${monthOrder[month]}`, year, monthNum: monthOrder[month] };
    };

    // Helper function to sort months chronologically
    const sortMonthsChronologically = (monthsArray) => {
        return monthsArray.sort((a, b) => {
            const [, , yearA, monthNumA] = a.match(/(\w+)-(\d+)-(\d+)-(\d+)/) || [];
            const [, , yearB, monthNumB] = b.match(/(\w+)-(\d+)-(\d+)-(\d+)/) || [];
            
            const yearDiff = parseInt(yearA) - parseInt(yearB);
            if (yearDiff !== 0) return yearDiff;
            
            return parseInt(monthNumA) - parseInt(monthNumB);
        });
    };

    useEffect(() => {
        let active = true;
        const fetchStudents = async () => {
            if (!localStorage.getItem('Token')) {
                navigate('/auth/login');
                return;
            }
            try {
                const account = await axios.get(`${api}/api/auth/me`, { withCredentials: true });
                if (account.data.role !== 'ADMIN') {
                    navigate(account.data.role === 'STUDENT' ? '/student/student-dashboard' : '/auth/login');
                    return;
                }
                const response = await axios.get(`${api}/api/students/paymenthistroy`);
                 if (active && response.status === 200) {
                    const studentsData = response.data.responses;
                    setStudents(studentsData);
                    
                    // Extract unique months from payment dates
                    const monthsSet = new Set();
                    studentsData.forEach(student => {
                        if (student.payments && Array.isArray(student.payments)) {
                            student.payments.forEach(payment => {
                                if (payment.date) {
                                    const { format, year, monthNum } = getMonthNumberFormat(payment.date);
                                    monthsSet.add(`${format}-${year}-${monthNum}`);
                                }
                            });
                        }
                    });
                    
                    // Convert set to sorted array - sort chronologically
                    const monthsArray = sortMonthsChronologically(Array.from(monthsSet));
                    // Clean up format for display
                    const cleanedMonths = monthsArray.map(item => {
                        const parts = item.split('-');
                        return `${parts[0]}-${parts[1]}`;
                    });
                    setMonths(cleanedMonths);
                 } else if (active) {
                    setError('Failed to fetch students');
                }
            } catch (err) {
                console.error('Error:', err);
                if (active && (err.response?.status === 401 || err.response?.status === 403)) {
                    localStorage.removeItem('Token');
                    navigate('/auth/login');
                } else if (active) {
                    setError(err.response?.data?.message || 'Something went wrong while fetching data');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchStudents();
        return () => {
            active = false;
        };
    }, [navigate]);

    if (loading) {
        return (
            <div className="fee-status-page">
                <Navbar />
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading Fee Status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fee-status-page">
            <Navbar />

            <main className="fee-status-container">
                <div className="page-header">
                    <h1 className="page-title">Student Fee Status</h1>
                    <p className="page-subtitle">Academic Year 2025-2026</p>
                </div>
                <Link to='/admin/admin-dashboard'>
                <button className="back-button">Back</button>
                </Link>

                {error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <div className="table-card">
                        <div className="table-responsive">
                            <table className="fee-table">
                                <thead>
                                    <tr>
                                        <th className="sticky-col col-sno">S.No</th>
                                        <th className="sticky-col col-name" style={{ left: '50px' }}>Student Name</th>
                                        <th className="col-room">Room</th>
                                        {months.map(monthYear => (
                                            <th key={monthYear} className="col-month">{monthYear}</th>
                                        ))}
                                     {/* <th className="col-room">Month</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student._id}>
                                            <td className="sticky-col col-sno">{index + 1}</td>
                                            <td className="sticky-col col-name" style={{ left: '50px', fontWeight: '500' }}>
                                                {student.studentName}
                                            </td>
                                            <td className="col-room">{student.roomNumber}</td>
                                            {months.map((monthYear) => {
                                                 const payments = student.payments && student.payments.filter(payment => {
                                                    if (!payment.date) return false;
                                                    const { format } = getMonthNumberFormat(payment.date);
                                                    return format === monthYear;
                                                });
                                                
                                                return (
                                                    <td key={`${student._id}-${monthYear}`} className="col-month">
                                                        {payments && payments.length > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                {payments.map((payment) => {
                                                                    const displayDate = payment.status === 'Paid' 
                                                                        ? formatDate(payment.date) 
                                                                        : 'Unpaid';
                                                                    const paymentBorderColor = payment.status === 'Paid' ? '#10b981' : '#ef4444';
                                                                    
                                                                    return (
                                                                        <button
                                                                            key={payment._id}
                                                                            style={{
                                                                                border: `2px solid ${paymentBorderColor}`,
                                                                                backgroundColor: payment.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                                color: paymentBorderColor,
                                                                                padding: '6px 15px',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontWeight: '500',
                                                                                fontSize: '12px',
                                                                                transition: 'all 0.3s ease',
                                                                                width: '100%',
                                                                                minHeight: '32px'
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.target.style.backgroundColor = paymentBorderColor;
                                                                                e.target.style.color = 'white';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.target.style.backgroundColor = payment.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                                                                                e.target.style.color = paymentBorderColor;
                                                                            }}
                                                                        >
                                                                            {displayDate}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <button
                                                                style={{
                                                                    border: `2px solid #ef4444`,
                                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                    color: '#ef4444',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: '500',
                                                                    fontSize: '14px',
                                                                    transition: 'all 0.3s ease',
                                                                    width: '100%',
                                                                    minHeight: '40px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.backgroundColor = '#ef4444';
                                                                    e.target.style.color = 'white';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                                                    e.target.style.color = '#ef4444';
                                                                }}
                                                            >
                                                                Unpaid
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={3 + months.length} className="no-data">No students found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default FeeStatus;
