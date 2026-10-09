import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    CreditCard,
    Home,
    Phone,
    BookOpen,
    Bell,
    ChevronRight,
    MessageSquare,
    Utensils,
    Calendar,
    MapPin,
    ShieldCheck,
    ArrowRight,
    Menu,
    LogOut,
    Bed
} from 'lucide-react';

 import Footer from '../components/Footer';
import './StudentDashboard.css';
import Navbar from '../components/Navbar';
import LocationMap from '../components/LocationMap';
import AddStudent from '../components/AddStudent';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import axios from 'axios';
import api from '../api';
import AIAssistant from '../components/ai/AIAssistant';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState(null);
    const [studentemail, setStudentEmail] = useState('');
    const [accountId, setAccountId] = useState(null);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const Api=api;
//login
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const token = localStorage.getItem('Token');
                 
                if (!token) {
                    alert("Please login to access your details");
                    navigate("/auth/login");
                    return;
                }

                // Verify token with backend
                const responseemail = await axios.get(`${api}/api/students/protected`, 
                    { 
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true 
                    }
                );
                  setStudentEmail(responseemail.data.user.email);
                  setAccountId(responseemail.data.user.id);
                  setLoading(false);
            } catch (error) {
                console.error('Token verification error:', error);
                
                if (error.response?.status === 401) {
                    alert('Session expired or invalid token. Please login again.');
                    localStorage.removeItem('Token');
                    navigate("/auth/login");
                } else {
                    alert('Error verifying session. Please login again.');
                    navigate("/auth/login");
                }
            }
        };

        const timer = setTimeout(checkLogin, 800);
        return () => clearTimeout(timer);
    }, [navigate]);

    useEffect(() => {
        if (!accountId) return undefined;

        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get(`${api}/api/notifications/mine/unread-count`, {
                    withCredentials: true,
                });
                setUnreadNotificationCount(response.data.unreadCount);
            } catch (error) {
                console.error('Unable to load unread notification count:', error);
            }
        };

        fetchUnreadCount();
        const intervalId = window.setInterval(fetchUnreadCount, 30000);
        return () => window.clearInterval(intervalId);
    }, [accountId]);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                 if (studentemail) {
                    const response = await axios.get(`${Api}/api/students/getstudentbymail/${studentemail}`,{ withCredentials: true });
                        if (response.status === 200 && response.data.data===null) {
                        alert("Please Add Your Details..");
                    }
                    else{
                         setStudentData ({
                                        roomNo: response.data.data.RoomNumber || "Loading...",
                                        name: response.data.data.StudentName || "Loading...",
                                        email: response.data.data.Email|| "Loading...",
                                        courseYear: response.data.data.CourseNameandYear || "Loading..",
                                        mobile: response.data.data.Mobilenumber || "Loading..",
                                        parentMobile: response.data.data.PMobilenumber || "Loading..",
                                        paymentStatus: response.data.data.paymentstatus || "Loading..",
                                        hostelName: "Heaven Boys Hostel",
                                        joinDate: response.data.data.StartingDate || "Loading...",
                                        address: response.data.data.Address || "Loading...",
                                        college: response.data.data.CollegeName || "Loading..",
                                        sharing: response.data.data.Sharing || "Loading..",
                                        monthlyAmount: response.data.data.AmountPerMonth || "Loading..",
                                        isActive: response.data.data.isActive || false,
                                        id: response.data.data._id || null
                                    });
                                                    }
                }
            } catch (error) {
                console.error('Error fetching student details:', error);
                alert('Error loading student details. Please refresh the page.');
                setStudentData({
                    roomNo: "N/A",
                    name: "Student",
                    email: studentemail,
                    courseYear: "N/A",
                    mobile: "N/A",
                    parentMobile: "N/A",
                    paymentStatus: "N/A",
                    hostelName: "Heaven Boys Hostel",
                    joinDate: new Date().toISOString(),
                    address: "N/A",
                    college: "N/A",
                    sharing: "N/A",
                    monthlyAmount: "N/A",
                    isActive: false,
                    id: null
                });
            }

        }
        fetchStudentDetails();
    }, [ studentemail, Api]);

    // Mock Data with dynamic values for those we have


 if (loading || !studentData) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading Student Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="student-dashboard">

            {/* 1. CUSTOM STICKY NAVBAR - Overriding any global fixed styles to ensure it takes up space */}
            <Navbar />



            {/* 2. MAIN CONTENT - Boxed sections with balanced margins */}
            <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 md:py-16 space-y-12 md:space-y-24 main-cont">

                {/* HEADER SECTION - Sharp, High Contrast */}
                <header className="sd-header">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center  w-full">
                            <div className="sd-hero w-full ">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck size={14} />
                                Verified Account
                            </div>
                            <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                Welcome, <br />
                                <span className="text-indigo-600">{studentData.name}</span>
                            </h1>
                            <p className="text-slate-500 font-black text-xl uppercase tracking-tight border-l-8 border-slate-100 pl-6">
                                Managing your stay at <span className="text-slate-900">{studentData.hostelName}</span>
                            </p>
                            <Link to={'/student/fee-history'}><button className="update-payment-btn">Payments History</button> </Link>

                        </div>
                        <div className="sd-stats">
                            <Link to="/student/room-details" className="sd-card" style={{ textDecoration: 'none', color: 'inherit' }} title="Click to view Room Details">
                                <div className="value">{studentData.roomNo}</div>
                                <div className="label">Room No ↗</div>
                            </Link>
                            <div className="sd-card">
                                <div>
                                    <span className={`text-sm font-black px-3 py-1 inline-block ${studentData.paymentStatus === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} uppercase tracking-widest rounded-full`}>
                                        {studentData.paymentStatus}
                                    </span>
                                </div>
                                <div className="label">Status</div>
                            </div>
                        </div>
                    </div>
                </header>

 
                             
                 {/* gDETAILS SECTION - Sharp Table with alternating colors */}
                <section className="sd-section">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-4">
                        <span className="bg-slate-900 text-white px-4 py-1">01</span>
                        Student Details
                    </h2>
                    <div className="sd-table">
                        <table>
                            <tbody>
                                {[
                                    { label: "Full Name", value: studentData.name },
                                    { label: "Email", value: studentData.email },
                                    { label: "Course & Year", value: studentData.courseYear },
                                    { label: "Mobile Number", value: studentData.mobile },
                                    { label: "Parent Mobile", value: studentData.parentMobile },
                                    { label: "College Name", value: studentData.college },
                                    { label: "Hostel Name", value: studentData.hostelName },
                                    { label: "Join Date", value: studentData.joinDate.slice(0,10) },
                                    { label: "Room Allotment", value: `${studentData.roomNo}` },
                                    { label: "Sharing", value: `${studentData.sharing} Sharing` },
                                    { label: "Monthly Amount", value: `₹${studentData.monthlyAmount}` },
                                    { label: "Address", value: studentData.address },
                                    { label: "Payment Status", value: `${studentData.paymentStatus}-Present Month` },
                                    { label: "Status", value: studentData.isActive ? "Active" : "Inactive"},
                                    { label: "Student ID", value: studentData.id }
                                
                                ].map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="key">{row.label}</td>
                                        <td className="val">{row.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* QUICK ACTIONS - Sharp Grid with hover effects */}
                <section className="space-y-6 sd-section">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-4 ml-4">
                        <span className="bg-slate-900 text-white px-4 py-1">02</span>
                        Quick Actions
                    </h2>

                    <div className="sd-quick-actions">
                        {[
                            { title: "Room Access", desc: "View room allotment & roommates", icon: <Bed />, color: "bg-emerald-400", link: "/student/room-details" },
                            { title: "Fee Management", desc: "Current month dues and payment", icon: <CreditCard />, color: "bg-purple-400", link: "/student/fee-management" },
                            { title: "Raise Complaint", desc: "Maintenance & room issues", icon: <MessageSquare />, color: "bg-amber-400", link: "/student/raise-complaint" },
                            { title: "Mess Menu", desc: "Weekly food schedule", icon: <Utensils />, color: "bg-blue-400", link: "/student/mess-menu" },
                            { title: "Notifications", desc: "Hostel updates and alerts", icon: <Bell />, color: "bg-amber-400", link: "/student/notifications", unreadCount: unreadNotificationCount },
                            { title: "Payment History", desc: "Receipts & transactions", icon: <CreditCard />, color: "bg-purple-400", link: "/student/fee-history" }
                        ].map((action, idx) => (

                            <Link key={idx} to={action.link} className="action-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className={`icon ${action.color} p-3`} style={{ position: 'relative' }}>
                                    {action.icon}
                                    {action.unreadCount > 0 && (
                                        <span aria-label={`${action.unreadCount} unread notifications`} style={{
                                            position: 'absolute',
                                            top: -7,
                                            right: -7,
                                            minWidth: 20,
                                            height: 20,
                                            padding: '0 5px',
                                            borderRadius: 999,
                                            background: '#dc2626',
                                            color: '#fff',
                                            display: 'grid',
                                            placeItems: 'center',
                                            fontSize: 11,
                                            fontWeight: 800,
                                        }}>
                                            {action.unreadCount > 99 ? '99+' : action.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4>{action.title}</h4>
                                    <p>{action.desc}</p>
                                </div>
                                <div className="mt-auto flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                                    Open <ArrowRight size={16} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* CONTACT & SUPPORT - Sharp Blocks */}

            </main>
                            <Features/>
            <HowItWorks/>

            <LocationMap />

            <Footer />
            <AIAssistant userId={accountId} userName={studentData.name} />
        </div>
    );
};

export default StudentDashboard;