import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Bed,
    Users,
    Shield,
    Wifi,
    Droplets,
    BookOpen,
    Lock,
    Sparkles,
    Zap,
    Clock,
    Phone,
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Home,
    CreditCard,
    MessageSquare,
    Utensils,
    LogIn,
    ChevronRight,
    MapPin,
    Calendar,
    Share2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import axios from 'axios';
import './StudentRoomDetails.css';

const StudentRoomDetails = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [roomData, setRoomData] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'roommates' | 'amenities' | 'rules'

    const roomTypes = [
        {
            type: "1 Sharing (Single Room)",
            sharing: "Single",
            capacity: 1,
            price: "₹9,500 / month",
            popular: false,
            desc: "Maximum privacy with personal study lounge and attached private bathroom.",
            amenities: ["Private Washroom", "AC / Cooler", "King Single Bed", "Ergonomic Desk", "Steel Wardrobe", "Balcony View"]
        },
        {
            type: "2 Sharing (Double Room)",
            sharing: "2 Sharing",
            capacity: 2,
            price: "₹7,500 / month",
            popular: true,
            desc: "Ideal balance of comfort and companionship with twin beds and dedicated workspaces.",
            amenities: ["Attached Washroom", "Twin Beds", "2x Study Tables", "2x Wardrobes", "High-Speed Wi-Fi", "Daily Cleaning"]
        },
        {
            type: "3 Sharing (Triple Room)",
            sharing: "3 Sharing",
            capacity: 3,
            price: "₹6,500 / month",
            popular: false,
            desc: "Spacious shared living with ample storage and vibrant hostel camaraderie.",
            amenities: ["Spacious Room", "3x Single Beds", "3x Study Units", "Individual Lockers", "Hot Water Geyser", "Power Backup"]
        },
        {
            type: "4 Sharing (Economy Quad)",
            sharing: "4 Sharing",
            capacity: 4,
            price: "₹5,200 / month",
            popular: false,
            desc: "Budget-friendly accommodation tailored for focused students and groups.",
            amenities: ["Quad Setup", "Personal Lockers", "Shared Desks", "Ceiling Fans", "RO Water Access", "Housekeeping"]
        }
    ];

    const standardAmenities = [
        { icon: <Wifi size={22} />, title: "High-Speed Wi-Fi", desc: "Dual-band 100 Mbps fiber internet across all rooms and common areas." },
        { icon: <Droplets size={22} />, title: "24/7 Water & Geyser", desc: "Continuous running water supply with instant hot water geyser in bathrooms." },
        { icon: <Zap size={22} />, title: "100% Power Backup", desc: "Commercial silent diesel generator & heavy inverter for uninterruptible power." },
        { icon: <BookOpen size={22} />, title: "Personal Study Desk", desc: "Dedicated study table, comfortable chair, and focused LED study lighting." },
        { icon: <Lock size={22} />, title: "Steel Wardrobe & Locker", desc: "Heavy-gauge steel almirah with individual personal lock & key for valuables." },
        { icon: <Sparkles size={22} />, title: "Daily Housekeeping", desc: "Regular room dusting, floor mopping, and dedicated trash disposal service." },
        { icon: <Shield size={22} />, title: "24/7 CCTV & Security", desc: "Round-the-clock security warden and high-definition CCTV surveillance." },
        { icon: <Droplets size={22} />, title: "Chilled RO Drinking Water", desc: "Multi-stage RO + UV water purifiers installed conveniently on every floor." }
    ];

    const hostelRules = [
        { time: "9:30 PM", title: "Hostel Gate Closes", desc: "All students must be inside the premises. Late arrivals require warden permission." },
        { time: "10:00 PM - 6:00 AM", title: "Quiet & Study Hours", desc: "Maintain zero noise to respect roommates and other students studying or resting." },
        { time: "10:00 AM - 6:00 PM", title: "Visitor Hours", desc: "Parents and daytime visitors are welcome in the ground floor visitor lounge." },
        { time: "Always", title: "Electrical Safety", desc: "High-wattage immersion rods and unauthorized cooking heaters are strictly restricted." }
    ];

    useEffect(() => {
        const loadRoomData = async () => {
            const token = localStorage.getItem('Token');
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }

            setIsLoggedIn(true);

            try {
                // 1. First try specialized /api/students/my-room endpoint
                const roomRes = await axios.get(`${api}/api/students/my-room`, { withCredentials: true });
                if (roomRes.data) {
                    setRoomData(roomRes.data);
                }
            } catch (roomErr) {
                console.warn('Could not load /api/students/my-room, falling back to profile:', roomErr);
                
                // Fallback: load student profile from /api/students/me
                try {
                    const meRes = await axios.get(`${api}/api/students/me`, { withCredentials: true });
                    const student = meRes.data;
                    setStudentProfile(student);

                    if (student && (student.roomNumber || student.RoomNumber)) {
                        const roomNum = student.roomNumber || student.RoomNumber;
                        const sharing = student.sharing || student.Sharing || "3 Sharing";
                        const amount = student.amountPerMonth || student.AmountPerMonth || "6500";
                        
                        setRoomData({
                            hasRoom: true,
                            roomNumber: roomNum,
                            capacity: parseInt(sharing) || 3,
                            occupiedBeds: 1,
                            availableBeds: Math.max(0, (parseInt(sharing) || 3) - 1),
                            monthlyRate: amount,
                            active: true,
                            sharing: sharing.includes('Sharing') ? sharing : `${sharing} Sharing`,
                            roommates: [],
                            amenities: [
                                "High-Speed Wi-Fi",
                                "24/7 Water & Hot Geyser",
                                "Study Table & Ergonomic Chair",
                                "Steel Wardrobe & Locker",
                                "Attached Washroom",
                                "Daily Housekeeping"
                            ],
                            hostelName: "Heaven Boys Hostel",
                            floor: roomNum.startsWith('1') ? "1st Floor" : roomNum.startsWith('2') ? "2nd Floor" : roomNum.startsWith('3') ? "3rd Floor" : "Ground Floor",
                            wardenContact: "+91 98765 43210",
                            status: "ACTIVE"
                        });
                    } else {
                        setRoomData({
                            hasRoom: false,
                            roomNumber: "Not Assigned",
                            status: "UNASSIGNED"
                        });
                    }
                } catch (profileErr) {
                    console.error('Failed to load student profile for room details:', profileErr);
                }
            } finally {
                setLoading(false);
            }
        };

        loadRoomData();
    }, []);

    return (
        <div className="room-details-page">
            <Navbar />

            {/* HERO SECTION */}
            <header className="room-hero">
                <div className="container">
                    <div className="room-hero-content">
                        <div className="room-pill">
                            <Bed size={16} />
                            <span>Accommodation & Living Spaces</span>
                        </div>
                        <h1 className="room-hero-title">
                            Hostel <span className="text-gradient">Room Access</span>
                        </h1>
                        <p className="room-hero-subtitle">
                            View comprehensive details about your room allotment, roommates, amenities, rules, and facilities at Heaven Boys Hostel.
                        </p>

                        {!isLoggedIn && (
                            <div className="login-prompt-banner">
                                <div className="login-prompt-text">
                                    <AlertCircle size={20} className="prompt-icon" />
                                    <span>
                                        <strong>Visiting as Guest:</strong> Showing hostel room overview. Log in to access your allocated room, roommates & maintenance actions.
                                    </span>
                                </div>
                                <button className="btn-login-prompt" onClick={() => navigate('/auth/login')}>
                                    <LogIn size={16} /> Log In to View My Room
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="container room-main-content">
                {/* LOGGED IN STUDENT'S ALLOTTED ROOM CARD */}
                {isLoggedIn && !loading && (
                    <section className="my-room-section">
                        {roomData && roomData.hasRoom ? (
                            <div className="allocated-room-card">
                                <div className="card-top-header">
                                    <div className="room-identity">
                                        <div className="room-number-badge">
                                            <span className="badge-label">ROOM</span>
                                            <span className="badge-num">{roomData.roomNumber}</span>
                                        </div>
                                        <div>
                                            <h2 className="allotted-title">Your Allocated Room</h2>
                                            <p className="allotted-subtitle">
                                                {roomData.hostelName} · {roomData.floor || "1st Floor"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="allotted-tags">
                                        <span className="tag-status active">
                                            <CheckCircle2 size={14} /> Active Allotment
                                        </span>
                                        <span className="tag-sharing">
                                            {roomData.sharing}
                                        </span>
                                    </div>
                                </div>

                                <div className="room-metrics-grid">
                                    <div className="metric-box">
                                        <span className="metric-label">Room Number</span>
                                        <span className="metric-val text-primary">{roomData.roomNumber}</span>
                                        <span className="metric-sub">{roomData.floor || "Standard Wing"}</span>
                                    </div>
                                    <div className="metric-box">
                                        <span className="metric-label">Occupancy / Capacity</span>
                                        <span className="metric-val">{roomData.occupiedBeds || 1} / {roomData.capacity || 3} Beds</span>
                                        <span className="metric-sub">
                                            {roomData.availableBeds > 0 ? `${roomData.availableBeds} Vacant Bed(s)` : 'Full Capacity'}
                                        </span>
                                    </div>
                                    <div className="metric-box">
                                        <span className="metric-label">Monthly Rent</span>
                                        <span className="metric-val">₹{roomData.monthlyRate || 6500}</span>
                                        <span className="metric-sub">Per Month</span>
                                    </div>
                                    <div className="metric-box">
                                        <span className="metric-label">Warden Contact</span>
                                        <span className="metric-val text-sm">{roomData.wardenContact || "+91 98765 43210"}</span>
                                        <span className="metric-sub">Office: Room 001</span>
                                    </div>
                                </div>

                                {/* ROOMMATES SUBSECTION */}
                                <div className="roommates-block">
                                    <div className="block-header">
                                        <Users size={20} className="text-primary" />
                                        <h3>Roommates in Room {roomData.roomNumber}</h3>
                                    </div>

                                    {roomData.roommates && roomData.roommates.length > 0 ? (
                                        <div className="roommates-grid">
                                            {roomData.roommates.map((roommate, idx) => (
                                                <div key={idx} className="roommate-card">
                                                    <div className="roommate-avatar">
                                                        {roommate.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="roommate-info">
                                                        <h4>{roommate.name}</h4>
                                                        <p className="roommate-course">{roommate.courseAndYear}</p>
                                                        <p className="roommate-college">{roommate.collegeName}</p>
                                                        {roommate.mobileNumber && roommate.mobileNumber !== 'N/A' && (
                                                            <div className="roommate-contact">
                                                                <Phone size={13} /> {roommate.mobileNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-roommates-notice">
                                            <p>No other roommates currently assigned to Room {roomData.roomNumber}. You have full space in this room!</p>
                                        </div>
                                    )}
                                </div>

                                {/* QUICK ACTIONS FOR ALLOTTED ROOM */}
                                <div className="room-quick-actions">
                                    <Link to="/student/raise-complaint" className="btn-action complaint">
                                        <MessageSquare size={16} /> Raise Room Maintenance Issue
                                    </Link>
                                    <Link to="/student/fee-management" className="btn-action fee">
                                        <CreditCard size={16} /> Pay Room Fee / Dues
                                    </Link>
                                    <Link to="/student/mess-menu" className="btn-action mess">
                                        <Utensils size={16} /> Check Mess Schedule
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="no-room-banner">
                                <AlertCircle size={28} className="text-amber-500" />
                                <div>
                                    <h3>Room Allotment Pending</h3>
                                    <p>You do not have a room assigned yet. Please contact the hostel administrator or warden to complete your room allotment.</p>
                                </div>
                                <button className="btn-contact-warden" onClick={() => alert("Please contact the Hostel Warden desk at +91 98765 43210 or visit the ground floor office.")}>
                                    <Phone size={16} /> Contact Warden
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* TABS NAVIGATION FOR OVERVIEW / AMENITIES / RULES */}
                <div className="room-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <Bed size={18} /> Room Categories & Pricing
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'amenities' ? 'active' : ''}`}
                        onClick={() => setActiveTab('amenities')}
                    >
                        <Sparkles size={18} /> Room Facilities & Amenities
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rules')}
                    >
                        <Clock size={18} /> Hostel Rules & Timings
                    </button>
                </div>

                {/* TAB 1: ROOM CATEGORIES & PRICING */}
                {activeTab === 'overview' && (
                    <section className="tab-pane">
                        <div className="pane-intro">
                            <h2>Standard Room Configurations</h2>
                            <p>Explore the accommodation plans and room types available at Heaven Boys Hostel.</p>
                        </div>

                        <div className="room-cards-grid">
                            {roomTypes.map((room, idx) => (
                                <div key={idx} className={`room-spec-card ${room.popular ? 'featured' : ''}`}>
                                    {room.popular && <span className="featured-ribbon">Most Popular</span>}
                                    <div className="spec-header">
                                        <div className="spec-badge">
                                            <Bed size={20} />
                                        </div>
                                        <div>
                                            <h3 className="spec-title">{room.type}</h3>
                                            <span className="spec-sharing">{room.capacity} Student Capacity</span>
                                        </div>
                                    </div>

                                    <div className="spec-price">
                                        <span className="price-num">{room.price.split(' ')[0]}</span>
                                        <span className="price-period">/ month</span>
                                    </div>

                                    <p className="spec-desc">{room.desc}</p>

                                    <div className="spec-amenities-list">
                                        <h4>Included Features:</h4>
                                        <ul>
                                            {room.amenities.map((item, i) => (
                                                <li key={i}>
                                                    <CheckCircle2 size={15} className="check-icon" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="spec-footer">
                                        {isLoggedIn ? (
                                            <button 
                                                className="btn-select-room"
                                                onClick={() => navigate('/student/student-dashboard')}
                                            >
                                                View In My Dashboard <ChevronRight size={16} />
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn-select-room"
                                                onClick={() => navigate('/auth/login')}
                                            >
                                                Log In to Book <ChevronRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* TAB 2: AMENITIES & FACILITIES */}
                {activeTab === 'amenities' && (
                    <section className="tab-pane">
                        <div className="pane-intro">
                            <h2>Everyday Comfort & Premium Amenities</h2>
                            <p>Everything you need for focused academics and comfortable hostel living.</p>
                        </div>

                        <div className="amenities-features-grid">
                            {standardAmenities.map((amenity, idx) => (
                                <div key={idx} className="amenity-feature-card">
                                    <div className="amenity-icon-wrapper">
                                        {amenity.icon}
                                    </div>
                                    <div>
                                        <h3 className="amenity-title">{amenity.title}</h3>
                                        <p className="amenity-desc">{amenity.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* TAB 3: HOSTEL RULES & TIMINGS */}
                {activeTab === 'rules' && (
                    <section className="tab-pane">
                        <div className="pane-intro">
                            <h2>Hostel Timings & Code of Conduct</h2>
                            <p>Please adhere to the hostel rules to ensure security, mutual respect, and harmony.</p>
                        </div>

                        <div className="rules-cards-grid">
                            {hostelRules.map((rule, idx) => (
                                <div key={idx} className="rule-card">
                                    <div className="rule-time-pill">
                                        <Clock size={15} />
                                        <span>{rule.time}</span>
                                    </div>
                                    <h3 className="rule-title">{rule.title}</h3>
                                    <p className="rule-desc">{rule.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* WARDEN DESK ASSISTANCE */}
                        <div className="warden-desk-card">
                            <div className="warden-desk-info">
                                <Shield size={28} className="text-primary" />
                                <div>
                                    <h3>Need Room Assistance or Maintenance?</h3>
                                    <p>Contact the warden office directly or file a maintenance ticket online.</p>
                                </div>
                            </div>
                            <div className="warden-desk-buttons">
                                <a href="tel:+919876543210" className="btn-call-warden">
                                    <Phone size={16} /> Call Warden: +91 98765 43210
                                </a>
                                <Link to="/student/raise-complaint" className="btn-file-ticket">
                                    <MessageSquare size={16} /> Raise Complaint
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default StudentRoomDetails;
