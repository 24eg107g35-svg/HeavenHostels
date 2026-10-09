import React, { useState, useEffect } from 'react';
import { Edit2, Search, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import Navbar from '../components/Navbar';
import AddStudent from '../components/AddStudent';
import FeeStatus from './FeeStatus.jsx';
import PaidList from '../components/PaidList.jsx';
import api from '../api.js';

const AdminDashboard = () => {
    const navigate = useNavigate();
    // const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [students, setStudents] = useState([]);
    const [error, setError] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [searchresult, setSearchresult] = useState(false);
    const [SearchQuery, setSearchQuery] = useState('');
    const [unpaidlist, setUnpaidlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(5);
    const[settrue,setTrue]=useState(true);
     const[isadding,setIsadding]=useState(false);
        const [paidlist, setPaidlist] = useState([]);
    const Api = api;

    useEffect(() => {
        // Fetch students from backend - only on mount
        const fetchStudents = async () => {
            try {
                const response = await axios.get(`${Api}/api/students/allstudents`);
                if (response.status == 200 ) {
                    setStudents(response.data.data);
                }
                else{
                    setStudents([]);
                }
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };
        fetchStudents();
    }, [Api]);


    const Getbyroom = async () => {
        const roomnumber = SearchQuery;
        if (roomnumber) {
            try {
                const res = await axios.get(`${Api}/api/students/getbyroomnumber/${roomnumber}`);
                if (res.status == 200) {
                    setStudents(res.data.data);
                     setSearchresult(true);
                    setTimeout(() => setSearchresult(false), 2000);
                }

            } catch (error) {
                if (error.response && error.response.status === 404 && error.response.data.message === 'Room not found') {
                    setError('Room not found');
                    setTimeout(() => setError(''), 2000);
                }
            }
        }

    }
    //login 
    useEffect(() => {
        const checkLogin = async() => {

              try {
                const response = await axios.get(`${Api}/api/auth/me`);
                if (response.data.role !== 'ADMIN') {
                    alert("Unauthorized access. Admins only.");
                    navigate("/auth/login");
                    return;
                }
                setLoading(false);
            } catch (error) {
                console.error(error);
                localStorage.removeItem('Token');
                navigate("/auth/login");
            }
        }

        const timer = setTimeout(checkLogin, 800);
        return () => clearTimeout(timer);
    }, [Api, navigate]);

        //delete student
    const handleDelete = async (student) => {
        if (window.confirm(`Are you sure you want to delete student ${student.StudentName.toUpperCase()}?`)) {
            try {
                await axios.delete(`${Api}/api/students/deletestudent/${student._id}`, { withCredentials: true });
                setDeleted(true);
                setTimeout(() => setDeleted(false), 3000);
                //refresh the after deletion
                window.location.reload();
            } catch (error) {
                setError('Failed to delete student. Please try again.',error);
            }
        }
    };
        //edit student
    const handleEdit = (student) => {
        setCurrentStudent({ ...student });
        setEditModalOpen(true);
    };
        //edit all student details
    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        try {
            await axios.put(`${Api}/api/students/updatestudent/${currentStudent._id}`, currentStudent, { withCredentials: true });
            setEditModalOpen(false);
            // Refresh student list
            const response = await axios.get(`${Api}/api/students/allstudents`, { withCredentials: true });
            if (response.status === 200) {
                setStudents(response.data.data);
            }
            alert('Student updated successfully!');
        } catch (error) {
            console.error('Error updating student:', error);
            confirm('Failed to update student.');
        } finally {
            setUpdateLoading(false);
        }
    };
    //unpaid list 
    useEffect(() => {
        const fetchunpaidlist = async () => {

            try {
                const response = await axios.get(`${Api}/api/students/unpaidlist`, { withCredentials: true });
                if (response.status != 200 ) {
                    setUnpaidlist([]);
                    return;
                }
                setUnpaidlist(response.data.data);
            } catch (error) {
                if(error.response && error.response.status === 404){
                    setUnpaidlist([]);
                    return;
                }
                confirm('Failed to fetch unpaid list! please try again later.');
                return;
            }
        }

        // Call the function to fetch unpaid list
        fetchunpaidlist();
    }, [Api]);

//paidlist
        useEffect(() => {
        const fetchpaidlist = async () => {

            try {
                const response = await axios.get(`${Api}/api/students/paidlist`, { withCredentials: true });
                if (response.status != 200 ) {
                    setPaidlist([]);
                    return;
                }
                 setPaidlist(response.data.data);
            }
             catch (error) {
                if(error.response && error.response.status === 404){
                    setPaidlist([]);
                    return;
                }
                confirm('Failed to fetch paid list! please try again later.');
                return;
                    
                }
                 
            }  

        // Call the function to fetch unpaid list
        fetchpaidlist();
    }, [Api]);

    const showmore = ()=>{
        setDisplayCount(displayCount+5);
        setTrue(false);
    }
     const showless = ()=>{
        setDisplayCount(5);
        setTrue(true);
    }

    const showaddform=()=>{
        setIsadding(true);
    }
    
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading Admin Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <title>Admin Dashboard - Heaven Hostels</title>
            {/* Navigation */}
            <br />
            <Navbar />

            {/* Header */}
            <header className="dashboard-header container">
                <div>
                    <h1 className="dashboard-title">Hostel Management Dashboard</h1>
                    <p className="dashboard-subtitle">Manage students, rooms, and payments easily</p>
                  </div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-value">{students.length}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                    <div className="dashboard-tools">
                        <div className="stat-card">
                            <span className="stat-value">12</span>
                            <span className="stat-label">Rooms Occupied</span>
                        </div>
                        {isadding
                            ? <button className="update-payment-btn" onClick={() => setIsadding(false)}>Close Add Form</button>
                            : <button className="update-payment-btn" onClick={showaddform}>Add Student</button>}
                        <Link className="update-payment-btn" to="/admin/payment-collection">Record Offline Payment</Link>
                        <Link className="update-payment-btn" to="/admin/students-fee-status">Payment History</Link>
                        <Link className="update-payment-btn" to="/admin/complaints">Student Complaints</Link>
                        <Link className="update-payment-btn" to="/admin/notifications">Send Student Update</Link>
                    </div>

                </div>
            </header>
            {/* Add Student Form */}
            {isadding && <AddStudent />}

                 <PaidList  paidlist={paidlist} />
            {/* Unpaid Students Section */}
            <section className="dashboard-section unpaid-section container">
                <h2 className="section-header">Unpaid Students (This Month)</h2>
                <div className="table-container">
                    <table className="data-table unpaid-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Student Name</th>
                                <th>Room No</th>
                                <th>Amount Due</th>
                                <th>Contact</th>
                                <th>Ispaid?</th>
                            </tr>
                        </thead>
                         {unpaidlist.length > 0 ?
                            unpaidlist.map((student, index) => (
                                <tbody key={student._id}>
                                    <tr>
                                        <td>{index + 1}</td>
                                        <td>{student.StudentName}</td>
                                        <td>{student.RoomNumber}</td>
                                        <td>₹{student.AmountPerMonth}</td>
                                        <td>{student.Mobilenumber}</td>
                                        <td><Link to="/admin/payment-collection" state={{ student }} className="btn-hero-secondary">Record cash</Link></td>
                                    </tr>
                                </tbody>
                            )) :
                            <tbody>
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>No unpaid students for this month.</td>
                                </tr>
                            </tbody>}
                    </table>
                </div>
            </section>

            {/* Student Details Table */}
            <section className="dashboard-section container">
                <h2 className="section-header">Student Details</h2>
                {searchresult && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded shadow-sm">
                        <p className="text-green-700 font-medium flex items-center gap-2">
                            <span>✓</span> Room found!
                        </p>
                    </div>
                )}
                {deleted && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded shadow-sm">
                        <p className="text-green-700 font-medium flex items-center gap-2">
                            <span>✓</span> Student deleted successfully!
                        </p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded shadow-sm">
                        <p className="text-red-700 font-medium flex items-center gap-2">
                            <span>⚠</span> {error}
                        </p>
                    </div>
                )}
                <div className="search-container">
                    <div className="search-wrapper">
                        <div className="search-icon-wrapper">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter room number to search..."
                            name="roomnumber"
                            value={SearchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <button
                            onClick={Getbyroom}
                            className="search-button"
                        >
                            <Search size={18} />
                            <span>Search</span>
                        </button>
                    </div>
                    {SearchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                 window.location.reload();
                            }}
                            className="clear-search-btn"
                        >
                            ✕ <span>Clear Results</span>
                        </button>
                    )}
                </div>
                {/* Student Table */}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Room</th>
                                <th>Name</th>
                                <th>Start Date</th>
                                <th>Amount</th>
                                <th>Sharing</th>
                                <th>Mobile</th>
                                <th>College</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {students.length != 0 ? students.slice(0, displayCount).map((student, index) => (
                                <tr key={student._id}>
                                    <td>{index + 1}</td>
                                    <td>{student.RoomNumber}</td>
                                    <td>{student.StudentName}</td>
                                    <td>{new Date(student.StartingDate).toISOString().split('T')[0]}</td>
                                    <td>₹{student.AmountPerMonth}</td>
                                    <td>{student.Sharing}-Sharing</td>
                                    <td>{student.Mobilenumber}</td>
                                    <td>{student.CollegeName}</td>
                                    <td>
                                        <button className="action-btn edit" onClick={() => handleEdit(student)} title="Edit"><Edit2 size={18} /></button>
                                        <button className="action-btn delete" onClick={() => handleDelete(student)} title="Delete"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="9" style={{ textAlign: 'center' }}>No students found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            {
                settrue ? (
                        students.length > 5 && displayCount < students.length && (
                    <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                        <button 
                            onClick={() => showmore()}
                            className="btn-hero-secondary"
                            style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                        >
                            Show More ({displayCount} of {students.length-1})
                        </button>
                    </div>
                ) 
                )  :      !settrue && (
                              
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <button 
                            onClick={() => showless()}
                            className="btn-hero-secondary"
                            style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                        >
                            Show Less  
                        </button>
                    </div>
                )
                    
            }

            {/* show less */}
                {
               
                }
            </section>

            {/* Footer */}
            <footer className="container" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>© 2025 Heaven Hostels | All Rights Reserved</p>
            </footer>

            {/* Edit Student Modal */}
            {editModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit Student Details</h3>
                            <button className="close-btn" onClick={() => setEditModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleUpdate} className="edit-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Student Name</label>
                                    <input
                                        type="text"
                                        value={currentStudent.StudentName}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, StudentName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Room Number</label>
                                    <input
                                        type="text"
                                        value={currentStudent.RoomNumber}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, RoomNumber: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Sharing</label>
                                    <select
                                        value={currentStudent.Sharing}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, Sharing: e.target.value })}
                                    >
                                        <option value="1">1-sharing</option>
                                        <option value="2">2-sharing</option>
                                        <option value="3">3-sharing</option>
                                        <option value="4">4-sharing</option>
                                        <option value="5">5-sharing</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount Per Month</label>
                                    <input
                                        type="text"
                                        value={currentStudent.AmountPerMonth}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, AmountPerMonth: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input
                                        type="text"
                                        value={currentStudent.Mobilenumber}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, Mobilenumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>College Name</label>
                                    <input
                                        type="text"
                                        value={currentStudent.CollegeName}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, CollegeName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Course & Year</label>
                                    <input
                                        type="text"
                                        value={currentStudent.CourseNameandYear}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, CourseNameandYear: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={currentStudent.Email}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, Email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Parent's Mobile</label>
                                    <input
                                        type="text"
                                        value={currentStudent.PMobilenumber}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, PMobilenumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Address</label>
                                    <textarea
                                        value={currentStudent.Address}
                                        onChange={(e) => setCurrentStudent({ ...currentStudent, Address: e.target.value })}
                                        required
                                        rows="2"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gray-200)' }}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={updateLoading}>
                                    {updateLoading ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
