import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Plus, Search, Bed, Users, DollarSign, 
  CheckCircle2, AlertCircle, X, Edit2, Trash2, Shield, 
  Layers, RefreshCw, Home, Check
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api';
import './AdminRooms.css';

const SHARING_PRICING = [
  { sharing: 1, name: '1 Sharing', price: 7500 },
  { sharing: 2, name: '2 Sharing', price: 7000 },
  { sharing: 3, name: '3 Sharing', price: 6500 },
  { sharing: 4, name: '4 Sharing', price: 6000 },
  { sharing: 5, name: '5 Sharing', price: 5500 },
];

const AdminRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [sharingFilter, setSharingFilter] = useState('ALL');
  const [vacancyFilter, setVacancyFilter] = useState('ALL'); // ALL, VACANT, FULL

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    roomNumber: '',
    sharing: '3',
    capacity: 3,
    monthlyRate: '6500',
    active: true
  });

  const fetchRooms = async () => {
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

      const response = await axios.get(`${api}/api/rooms`, {
        params: { page: 0, size: 100 },
        withCredentials: true
      });
      setRooms(response.data.content || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('Token');
        navigate('/auth/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load rooms list.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [navigate]);

  // Handle sharing change in form
  const handleSharingChange = (val) => {
    const cap = parseInt(val, 10) || 3;
    const defaultRates = {
      1: '7500',
      2: '7000',
      3: '6500',
      4: '6000',
      5: '5500'
    };
    setFormData(prev => ({
      ...prev,
      sharing: val,
      capacity: cap,
      monthlyRate: defaultRates[cap] || '6500'
    }));
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      roomNumber: '',
      sharing: '3',
      capacity: 3,
      monthlyRate: '6500',
      active: true
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      sharing: String(room.capacity),
      capacity: room.capacity,
      monthlyRate: String(room.monthlyRate),
      active: room.active
    });
  };

  // Save New Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!formData.roomNumber.trim()) {
      setError('Please provide a valid room number.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${api}/api/rooms`, {
        roomNumber: formData.roomNumber.trim(),
        capacity: Number(formData.capacity),
        monthlyRate: parseFloat(formData.monthlyRate)
      }, { withCredentials: true });

      setSuccess(`✓ Room ${formData.roomNumber.trim()} created successfully!`);
      setIsAddModalOpen(false);
      await fetchRooms();
    } catch (err) {
      console.error('Failed to create room:', err);
      setError(err.response?.data?.message || 'Could not create room.');
    } finally {
      setSaving(false);
    }
  };

  // Update Room
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(`${api}/api/rooms/${editingRoom.id}`, {
        roomNumber: formData.roomNumber.trim(),
        capacity: Number(formData.capacity),
        monthlyRate: parseFloat(formData.monthlyRate),
        active: formData.active
      }, { withCredentials: true });

      setSuccess(`✓ Room ${formData.roomNumber.trim()} updated successfully!`);
      setEditingRoom(null);
      await fetchRooms();
    } catch (err) {
      console.error('Failed to update room:', err);
      setError(err.response?.data?.message || 'Could not update room.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Room
  const handleDeleteRoom = async (roomId, roomNumber, occupied) => {
    if (occupied > 0) {
      alert(`Cannot delete Room ${roomNumber}: There are currently ${occupied} student(s) staying in this room.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete Room ${roomNumber}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.delete(`${api}/api/rooms/${roomId}`, { withCredentials: true });
      setSuccess(`✓ Room ${roomNumber} deleted successfully.`);
      await fetchRooms();
    } catch (err) {
      console.error('Failed to delete room:', err);
      setError(err.response?.data?.message || 'Could not delete room.');
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (room) => {
    setError('');
    setSuccess('');
    try {
      await axios.put(`${api}/api/rooms/${room.id}`, {
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        monthlyRate: room.monthlyRate,
        active: !room.active
      }, { withCredentials: true });
      setSuccess(`✓ Room ${room.roomNumber} is now ${!room.active ? 'ACTIVE' : 'INACTIVE'}.`);
      await fetchRooms();
    } catch (err) {
      console.error('Failed to toggle room active state:', err);
      setError(err.response?.data?.message || 'Could not change room status.');
    }
  };

  // Metrics
  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const totalOccupiedBeds = rooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
  const totalAvailableBeds = Math.max(0, totalBeds - totalOccupiedBeds);
  const occupancyPercentage = totalBeds > 0 ? Math.round((totalOccupiedBeds / totalBeds) * 100) : 0;

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const numMatch = !searchQuery || room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const floor = room.roomNumber.startsWith('2') ? '2' : room.roomNumber.startsWith('3') ? '3' : '1';
      const floorMatch = floorFilter === 'ALL' || floorFilter === floor;

      const sharingMatch = sharingFilter === 'ALL' || String(room.capacity) === sharingFilter;

      const availableCount = Math.max(0, room.capacity - room.occupiedBeds);
      let vacancyMatch = true;
      if (vacancyFilter === 'VACANT') vacancyMatch = availableCount > 0 && room.active;
      if (vacancyFilter === 'FULL') vacancyMatch = availableCount === 0 || !room.active;

      return numMatch && floorMatch && sharingMatch && vacancyMatch;
    });
  }, [rooms, searchQuery, floorFilter, sharingFilter, vacancyFilter]);

  if (loading) {
    return (
      <div className="admin-rooms-page">
        <Navbar />
        <div className="rooms-loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Hostel Room Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-rooms-page">
      <Navbar />

      <main className="admin-rooms-container">
        {/* Top bar */}
        <div className="rooms-top-bar">
          <Link to="/admin/admin-dashboard" className="rooms-back-btn">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
          <div className="rooms-top-actions">
            <button 
              className="rooms-refresh-btn" 
              onClick={() => { setRefreshing(true); fetchRooms(); }}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="rooms-add-btn" onClick={openAddModal}>
              <Plus size={18} />
              <span>Add New Room</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="rooms-header-section">
          <h1 className="rooms-main-title">Hostel Room Management</h1>
          <p className="rooms-main-subtitle">
            Manage hostel room inventory, bed allotments, floor capacities, tariffs, and resident allocations.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rooms-alert rooms-alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="alert-close"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="rooms-alert rooms-alert-success">
            <CheckCircle2 size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="alert-close"><X size={16} /></button>
          </div>
        )}

        {/* Stats Row */}
        <div className="rooms-stats-grid">
          <div className="room-stat-card">
            <div className="stat-icon-wrap icon-blue">
              <Home size={22} />
            </div>
            <div>
              <div className="stat-num">{totalRooms}</div>
              <div className="stat-label">Total Rooms</div>
            </div>
          </div>

          <div className="room-stat-card">
            <div className="stat-icon-wrap icon-purple">
              <Bed size={22} />
            </div>
            <div>
              <div className="stat-num">{totalBeds}</div>
              <div className="stat-label">Total Bed Capacity</div>
            </div>
          </div>

          <div className="room-stat-card">
            <div className="stat-icon-wrap icon-green">
              <Users size={22} />
            </div>
            <div>
              <div className="stat-num text-green">{totalOccupiedBeds}</div>
              <div className="stat-label">Occupied Beds</div>
            </div>
          </div>

          <div className="room-stat-card">
            <div className="stat-icon-wrap icon-amber">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="stat-num text-amber">{totalAvailableBeds}</div>
              <div className="stat-label">Available Vacant Beds</div>
            </div>
          </div>

          <div className="room-stat-card">
            <div className="stat-icon-wrap icon-indigo">
              <Layers size={22} />
            </div>
            <div>
              <div className="stat-num">{occupancyPercentage}%</div>
              <div className="stat-label">Hostel Occupancy Rate</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rooms-filter-bar">
          <div className="search-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by room number (e.g. 101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rooms-search-input"
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filter-dropdowns">
            <select 
              value={floorFilter} 
              onChange={(e) => setFloorFilter(e.target.value)}
              className="rooms-select"
            >
              <option value="ALL">All Floors</option>
              <option value="1">1st Floor (100s)</option>
              <option value="2">2nd Floor (200s)</option>
              <option value="3">3rd Floor (300s)</option>
            </select>

            <select 
              value={sharingFilter} 
              onChange={(e) => setSharingFilter(e.target.value)}
              className="rooms-select"
            >
              <option value="ALL">All Sharing Tiers</option>
              <option value="1">1 Sharing (₹7,500)</option>
              <option value="2">2 Sharing (₹7,000)</option>
              <option value="3">3 Sharing (₹6,500)</option>
              <option value="4">4 Sharing (₹6,000)</option>
              <option value="5">5 Sharing (₹5,500)</option>
            </select>

            <select 
              value={vacancyFilter} 
              onChange={(e) => setVacancyFilter(e.target.value)}
              className="rooms-select"
            >
              <option value="ALL">All Vacancy Status</option>
              <option value="VACANT">Has Vacant Beds</option>
              <option value="FULL">Fully Occupied</option>
            </select>
          </div>
        </div>

        {/* Room Cards Grid */}
        <div className="rooms-grid">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => {
              const availableBeds = Math.max(0, room.capacity - room.occupiedBeds);
              const floor = room.roomNumber.startsWith('2') ? '2nd Floor' : room.roomNumber.startsWith('3') ? '3rd Floor' : '1st Floor';
              const isFull = availableBeds === 0;

              return (
                <div key={room.id} className={`room-admin-card ${!room.active ? 'inactive' : isFull ? 'full' : 'available'}`}>
                  <div className="room-card-head">
                    <div>
                      <div className="room-badge-num">
                        <span className="room-tag-lbl">ROOM</span>
                        <span className="room-num">{room.roomNumber}</span>
                      </div>
                      <span className="room-floor-tag">{floor}</span>
                    </div>

                    <div className="room-card-top-right">
                      <span className={`status-pill ${room.active ? (isFull ? 'pill-full' : 'pill-vacant') : 'pill-inactive'}`}>
                        {room.active ? (isFull ? 'Full' : `${availableBeds} Vacant`) : 'Inactive'}
                      </span>
                      <span className="sharing-badge-pill">{room.capacity} Sharing</span>
                    </div>
                  </div>

                  <div className="room-card-pricing">
                    <span className="price-val">₹{Number(room.monthlyRate).toLocaleString('en-IN')}</span>
                    <span className="price-sub">/ month</span>
                  </div>

                  {/* Bed Occupancy Bar */}
                  <div className="occupancy-progress-wrap">
                    <div className="progress-labels">
                      <span>Occupancy</span>
                      <span><strong>{room.occupiedBeds}</strong> / {room.capacity} Beds</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className={`progress-bar-fill ${isFull ? 'fill-red' : 'fill-green'}`}
                        style={{ width: `${Math.min(100, (room.occupiedBeds / room.capacity) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Residents list */}
                  <div className="room-residents-section">
                    <span className="residents-title">Residents ({room.occupiedBeds}):</span>
                    {room.studentNames && room.studentNames.length > 0 ? (
                      <div className="residents-chip-list">
                        {room.studentNames.map((name, i) => (
                          <span key={i} className="resident-chip">
                            <span className="avatar-dot">{name.charAt(0)}</span>
                            <span>{name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-residents-txt">No students currently assigned</span>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="room-card-actions">
                    <button 
                      className="btn-card-action edit"
                      onClick={() => openEditModal(room)}
                      title="Edit Room Details"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button 
                      className={`btn-card-action toggle ${room.active ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleActive(room)}
                      title={room.active ? 'Deactivate Room' : 'Activate Room'}
                    >
                      <span>{room.active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    <button 
                      className="btn-card-action delete"
                      onClick={() => handleDeleteRoom(room.id, room.roomNumber, room.occupiedBeds)}
                      disabled={room.occupiedBeds > 0}
                      title={room.occupiedBeds > 0 ? 'Cannot delete room with residents' : 'Delete Room'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rooms-empty-state">
              <Home size={40} className="empty-icon" />
              <h3>No rooms match your filter</h3>
              <p>Try clearing your search term or changing the floor / sharing filter.</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Add New Room */}
      {isAddModalOpen && (
        <div className="rooms-modal-overlay" onClick={() => !saving && setIsAddModalOpen(false)}>
          <div className="rooms-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rooms-modal-header">
              <div>
                <h3 className="modal-title">Add New Hostel Room</h3>
                <p className="modal-sub">Create a new room with capacity and approved monthly sharing rate</p>
              </div>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)} disabled={saving}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="rooms-modal-body">
              <div className="form-group">
                <label className="form-lbl">Room Number *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 106, 206, 305"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className="form-input"
                />
                <span className="field-hint">Room numbers starting with 1 = 1st Floor, 2 = 2nd Floor, 3 = 3rd Floor.</span>
              </div>

              <div className="form-group">
                <label className="form-lbl">Sharing Type & Bed Capacity *</label>
                <div className="sharing-btn-grid">
                  {SHARING_PRICING.map(tier => (
                    <button
                      type="button"
                      key={tier.sharing}
                      className={`sharing-choice-btn ${formData.sharing === String(tier.sharing) ? 'active' : ''}`}
                      onClick={() => handleSharingChange(String(tier.sharing))}
                    >
                      <span className="choice-name">{tier.name}</span>
                      <span className="choice-beds">{tier.sharing} Bed{tier.sharing > 1 ? 's' : ''}</span>
                      <span className="choice-price">₹{tier.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-lbl">Monthly Rent Tariff (₹) *</label>
                <input 
                  type="number"
                  required
                  min="1000"
                  step="100"
                  value={formData.monthlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyRate: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? 'Creating Room...' : 'Create Room'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Room */}
      {editingRoom && (
        <div className="rooms-modal-overlay" onClick={() => !saving && setEditingRoom(null)}>
          <div className="rooms-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rooms-modal-header">
              <div>
                <h3 className="modal-title">Edit Room {editingRoom.roomNumber}</h3>
                <p className="modal-sub">Modify room capacity, monthly tariff, or active status</p>
              </div>
              <button className="modal-close" onClick={() => setEditingRoom(null)} disabled={saving}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateRoom} className="rooms-modal-body">
              <div className="form-group">
                <label className="form-lbl">Room Number *</label>
                <input 
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-lbl">Bed Capacity (Current Residents: {editingRoom.occupiedBeds})</label>
                <input 
                  type="number"
                  required
                  min={editingRoom.occupiedBeds}
                  max="10"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  className="form-input"
                />
                <span className="field-hint">Capacity cannot be lower than the current occupancy of {editingRoom.occupiedBeds}.</span>
              </div>

              <div className="form-group">
                <label className="form-lbl">Monthly Rent Tariff (₹) *</label>
                <input 
                  type="number"
                  required
                  min="1000"
                  step="100"
                  value={formData.monthlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyRate: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox-lbl">
                  <input 
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  />
                  <span>Active Room (Available for Student Allotment)</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditingRoom(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminRooms;
