import React, { useState, useEffect, useMemo } from 'react';
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
    Share2,
    Filter,
    Check
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import axios from 'axios';
import './StudentRoomDetails.css';

const defaultRoomsCatalogue = [
    { id: 1, roomNumber: '101', capacity: 1, occupiedBeds: 1, monthlyRate: 7500, active: true, sharing: '1 Sharing', floor: '1st Floor' },
    { id: 2, roomNumber: '102', capacity: 2, occupiedBeds: 1, monthlyRate: 7000, active: true, sharing: '2 Sharing', floor: '1st Floor' },
    { id: 3, roomNumber: '103', capacity: 3, occupiedBeds: 2, monthlyRate: 6500, active: true, sharing: '3 Sharing', floor: '1st Floor' },
    { id: 4, roomNumber: '104', capacity: 4, occupiedBeds: 3, monthlyRate: 6000, active: true, sharing: '4 Sharing', floor: '1st Floor' },
    { id: 5, roomNumber: '105', capacity: 5, occupiedBeds: 4, monthlyRate: 5500, active: true, sharing: '5 Sharing', floor: '1st Floor' },
    { id: 6, roomNumber: '201', capacity: 1, occupiedBeds: 0, monthlyRate: 7500, active: true, sharing: '1 Sharing', floor: '2nd Floor' },
    { id: 7, roomNumber: '202', capacity: 2, occupiedBeds: 1, monthlyRate: 7000, active: true, sharing: '2 Sharing', floor: '2nd Floor' },
    { id: 8, roomNumber: '203', capacity: 3, occupiedBeds: 2, monthlyRate: 6500, active: true, sharing: '3 Sharing', floor: '2nd Floor' },
    { id: 9, roomNumber: '204', capacity: 4, occupiedBeds: 3, monthlyRate: 6000, active: true, sharing: '4 Sharing', floor: '2nd Floor' },
    { id: 10, roomNumber: '205', capacity: 5, occupiedBeds: 3, monthlyRate: 5500, active: true, sharing: '5 Sharing', floor: '2nd Floor' },
    { id: 11, roomNumber: '301', capacity: 2, occupiedBeds: 1, monthlyRate: 7000, active: true, sharing: '2 Sharing', floor: '3rd Floor' },
    { id: 12, roomNumber: '302', capacity: 3, occupiedBeds: 2, monthlyRate: 6500, active: true, sharing: '3 Sharing', floor: '3rd Floor' },
    { id: 13, roomNumber: '303', capacity: 4, occupiedBeds: 2, monthlyRate: 6000, active: true, sharing: '4 Sharing', floor: '3rd Floor' },
    { id: 14, roomNumber: '304', capacity: 5, occupiedBeds: 3, monthlyRate: 5500, active: true, sharing: '5 Sharing', floor: '3rd Floor' }
];

const StudentRoomDetails = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [roomData, setRoomData] = useState(null);
    const [studentProfile, setStudentProfile] = useState(null);
    const [allRooms, setAllRooms] = useState(defaultRoomsCatalogue);
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'overview' | 'amenities' | 'rules'

    // Filters for directory tab
    const [dirFloor, setDirFloor] = useState('ALL');
    const [dirSharing, setDirSharing] = useState('ALL');
    const [dirVacancy, setDirVacancy] = useState('ALL'); // ALL, VACANT

    const roomTypes = [
        {
            type: "1 Sharing (Single Room)",
            sharing: "1 Sharing",
            capacity: 1,
            price: "₹7,500 / month",
            popular: false,
            desc: "Maximum privacy with personal study desk, steel locker, and attached washroom.",
            amenities: ["Private Room", "Attached Washroom", "King Single Bed", "Study Desk", "Steel Wardrobe", "Daily Cleaning"]
        },
        {
            type: "2 Sharing (Double Room)",
            sharing: "2 Sharing",
            capacity: 2,
            price: "₹7,000 / month",
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
            price: "₹6,000 / month",
            popular: false,
            desc: "Comfortable quad sharing accommodation tailored for focused students.",
            amenities: ["Quad Setup", "Personal Lockers", "Study Desks", "Ceiling Fans", "RO Water Access", "Housekeeping"]
        },
        {
            type: "5 Sharing (Community Room)",
            sharing: "5 Sharing",
            capacity: 5,
            price: "₹5,500 / month",
            popular: false,
            desc: "Most budget-friendly accommodation option with full hostel amenities and community living.",
            amenities: ["5x Beds", "Personal Lockers", "Shared Desks", "Housekeeping", "Wi-Fi & Geyser", "RO Water"]
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
            const hasAuth = Boolean(token);
            setIsLoggedIn(hasAuth);

            // Fetch live room catalogue
            try {
                const catalogueRes = await axios.get(`${api}/api/rooms`, {
                    params: { page: 0, size: 50 },
                    withCredentials: true
                });
                if (catalogueRes.data && Array.isArray(catalogueRes.data.content) && catalogueRes.data.content.length > 0) {
                    setAllRooms(catalogueRes.data.content);
                }
            } catch (catErr) {
                console.warn('Could not load live room directory, using pre-populated catalogue:', catErr);
            }

            if (!hasAuth) {
                setLoading(false);
                return;
            }

            try {
                // 1. Try specialized /api/students/my-room endpoint
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
                            capacity: parseInt(sharing, 10) || 3,
                            occupiedBeds: 1,
                            availableBeds: Math.max(0, (parseInt(sharing, 10) || 3) - 1),
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
                    setRoomData({
                        hasRoom: false,
                        roomNumber: "Not Assigned",
                        status: "UNASSIGNED"
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        loadRoomData();
    }, []);

    // Filtered rooms directory
    const filteredDirectory = useMemo(() => {
        return allRooms.filter(room => {
            const floor = room.roomNumber.startsWith('2') ? '2' : room.roomNumber.startsWith('3') ? '3' : '1';
            const floorMatch = dirFloor === 'ALL' || dirFloor === floor;

            const sharingMatch = dirSharing === 'ALL' || String(room.capacity) === dirSharing;

            const available = Math.max(0, room.capacity - (room.occupiedBeds || 0));
            const vacancyMatch = dirVacancy === 'ALL' || (dirVacancy === 'VACANT' && available > 0);

            return floorMatch && sharingMatch && vacancyMatch;
        });
    }, [allRooms, dirFloor, dirSharing, dirVacancy]);

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
                            View comprehensive details about your room allotment, roommates, available hostel inventory, tariffs, and facilities at Heaven Boys Hostel.
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
                                        <span className="metric-val">₹{Number(roomData.monthlyRate || 6500).toLocaleString('en-IN')}</span>
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
                                                        {(roommate.name || 'S').charAt(0).toUpperCase()}
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
                                    <p>You do not have a room assigned yet. Please explore the available rooms below or contact the hostel warden to complete your allotment.</p>
                                </div>
                                <button className="btn-contact-warden" onClick={() => setActiveTab('directory')}>
                                    <Bed size={16} /> Browse Available Rooms
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* TABS NAVIGATION */}
                <div className="room-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('directory')}
                    >
                        <Home size={18} /> Hostel Rooms Directory ({allRooms.length})
                    </button>
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
                        <Sparkles size={18} /> Facilities & Amenities
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rules')}
                    >
                        <Clock size={18} /> Hostel Rules & Timings
                    </button>
                </div>

                {/* TAB 0: LIVE HOSTEL ROOMS DIRECTORY */}
                {activeTab === 'directory' && (
                    <section className="tab-pane">
                        <div className="pane-intro">
                            <h2>Heaven Boys Hostel - Rooms Directory & Bed Availability</h2>
                            <p>Explore all available rooms across floors, check bed vacancies, and view approved monthly tariffs.</p>
                        </div>

                        {/* Directory Filters */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Filter size={16} style={{ color: '#64748b' }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Filter Rooms:</span>
                            </div>

                            <select 
                                value={dirFloor} 
                                onChange={(e) => setDirFloor(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', color: '#1e293b' }}
                            >
                                <option value="ALL">All Floors</option>
                                <option value="1">1st Floor (101-105)</option>
                                <option value="2">2nd Floor (201-205)</option>
                                <option value="3">3rd Floor (301-304)</option>
                            </select>

                            <select 
                                value={dirSharing} 
                                onChange={(e) => setDirSharing(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', color: '#1e293b' }}
                            >
                                <option value="ALL">All Sharing Tiers</option>
                                <option value="1">1 Sharing (₹7,500)</option>
                                <option value="2">2 Sharing (₹7,000)</option>
                                <option value="3">3 Sharing (₹6,500)</option>
                                <option value="4">4 Sharing (₹6,000)</option>
                                <option value="5">5 Sharing (₹5,500)</option>
                            </select>

                            <select 
                                value={dirVacancy} 
                                onChange={(e) => setDirVacancy(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', color: '#1e293b' }}
                            >
                                <option value="ALL">All Rooms</option>
                                <option value="VACANT">Has Vacant Beds Only</option>
                            </select>
                        </div>

                        {/* Room Directory Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
                            {filteredDirectory.map((room) => {
                                const vacantBeds = Math.max(0, room.capacity - (room.occupiedBeds || 0));
                                const isAllocatedToMe = roomData?.hasRoom && roomData?.roomNumber === room.roomNumber;
                                const isFull = vacantBeds === 0;
                                const floor = room.roomNumber.startsWith('2') ? '2nd Floor' : room.roomNumber.startsWith('3') ? '3rd Floor' : '1st Floor';

                                return (
                                    <div 
                                        key={room.id || room.roomNumber} 
                                        style={{
                                            background: '#fff',
                                            borderRadius: 14,
                                            border: isAllocatedToMe ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                            padding: 20,
                                            boxShadow: isAllocatedToMe ? '0 10px 25px rgba(59, 130, 246, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        {isAllocatedToMe && (
                                            <div style={{
                                                position: 'absolute',
                                                top: -10,
                                                right: 16,
                                                background: '#2563eb',
                                                color: '#fff',
                                                fontSize: 11,
                                                fontWeight: 800,
                                                padding: '3px 10px',
                                                borderRadius: 999
                                            }}>
                                                ★ Your Room
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>ROOM</span>
                                                    <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{room.roomNumber}</span>
                                                </div>
                                                <span style={{ fontSize: 13, color: '#64748b' }}>{floor}</span>
                                            </div>
                                            <span style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                padding: '4px 10px',
                                                borderRadius: 999,
                                                background: isFull ? '#f1f5f9' : '#ecfdf5',
                                                color: isFull ? '#475569' : '#059669',
                                                border: `1px solid ${isFull ? '#cbd5e1' : '#a7f3d0'}`
                                            }}>
                                                {isFull ? 'Full' : `${vacantBeds} Vacant Bed${vacantBeds > 1 ? 's' : ''}`}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
                                            <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>₹{Number(room.monthlyRate).toLocaleString('en-IN')}</span>
                                            <span style={{ fontSize: 13, color: '#64748b' }}>/ month</span>
                                            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>
                                                {room.capacity} Sharing
                                            </span>
                                        </div>

                                        {/* Occupancy bar */}
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                                                <span>Bed Capacity:</span>
                                                <span><strong>{room.occupiedBeds || 0}</strong> / {room.capacity} Occupied</span>
                                            </div>
                                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min(100, ((room.occupiedBeds || 0) / room.capacity) * 100)}%`,
                                                    background: isFull ? '#64748b' : '#10b981',
                                                    borderRadius: 999
                                                }}></div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                                            <button
                                                type="button"
                                                onClick={() => alert(`For room allotment in Room ${room.roomNumber} (${room.capacity} Sharing, ₹${room.monthlyRate}/month), please visit the Warden desk in Room 001 or call +91 98765 43210.`)}
                                                style={{
                                                    width: '100%',
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    border: '1px solid #cbd5e1',
                                                    background: isAllocatedToMe ? '#eff6ff' : '#ffffff',
                                                    color: isAllocatedToMe ? '#2563eb' : '#334155',
                                                    fontWeight: 600,
                                                    fontSize: 13,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {isAllocatedToMe ? '✓ Assigned to You' : 'Inquire / Request Allotment'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* TAB 1: ROOM CATEGORIES & PRICING */}
                {activeTab === 'overview' && (
                    <section className="tab-pane">
                        <div className="pane-intro">
                            <h2>Approved Room Configurations & 1-5 Sharing Tariffs</h2>
                            <p>Explore the official monthly pricing ladder for 1, 2, 3, 4, and 5 sharing accommodations.</p>
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
                                        <button 
                                            className="btn-select-room"
                                            onClick={() => setActiveTab('directory')}
                                        >
                                            View Available Rooms in Directory <ChevronRight size={16} />
                                        </button>
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
