import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Rooms = () => {
  const { isAdmin, isStaffOrAdmin } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalForm, setModalForm] = useState({
    roomNumber: '',
    type: 'Single',
    pricePerNight: '',
    capacity: 2,
    floor: 1,
    status: 'available',
    amenities: 'Free High-Speed Wi-Fi, Air Conditioning, Flat-screen TV',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterType !== 'all') queryParams.append('type', filterType);
      if (filterStatus !== 'all') queryParams.append('status', filterStatus);
      if (search) queryParams.append('search', search);

      const res = await api.get(`/rooms?${queryParams.toString()}`);
      if (res.success) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filterType, filterStatus, search]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setModalForm({
      roomNumber: '',
      type: 'Single',
      pricePerNight: '',
      capacity: 2,
      floor: 1,
      status: 'available',
      amenities: 'Free High-Speed Wi-Fi, Air Conditioning, Flat-screen TV',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    });
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setIsEditing(true);
    setEditId(room._id);
    setModalForm({
      roomNumber: room.roomNumber,
      type: room.type,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
      floor: room.floor || 1,
      status: room.status,
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : room.amenities,
      description: room.description || '',
      imageUrl: room.imageUrl || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const payload = {
        ...modalForm,
        amenities: modalForm.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        pricePerNight: Number(modalForm.pricePerNight),
        capacity: Number(modalForm.capacity),
        floor: Number(modalForm.floor),
      };

      if (isEditing) {
        await api.put(`/rooms/${editId}`, payload);
      } else {
        await api.post('/rooms', payload);
      }

      setShowModal(false);
      fetchRooms();
    } catch (err) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete Room #${roomNumber}?`)) return;

    try {
      await api.delete(`/rooms/${id}`);
      fetchRooms();
    } catch (err) {
      alert(err.message || 'Failed to delete room');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="badge bg-success">AVAILABLE</span>;
      case 'booked':
        return <span className="badge bg-primary">OCCUPIED</span>;
      case 'maintenance':
        return <span className="badge bg-warning text-dark">MAINTENANCE</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-door-open-fill text-primary me-2"></i> Room Inventory
          </h2>
          <p className="text-muted mb-0">Browse and manage boutique hotel accommodations and availability</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary d-flex align-items-center mt-3 mt-md-0" onClick={openCreateModal}>
            <i className="bi bi-plus-circle me-2"></i> Add New Room
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search room number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Room Types</option>
              <option value="Single">Single Room</option>
              <option value="Double">Double Room</option>
              <option value="Deluxe">Deluxe Room</option>
              <option value="Suite">Presidential Suite</option>
            </select>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="booked">Occupied / Booked</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading rooms...</span>
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="card text-center py-5 shadow-sm text-muted">
          <i className="bi bi-door-closed display-4 mb-2"></i>
          <h5>No rooms match the criteria</h5>
          <p>Try clearing filters or search keywords.</p>
        </div>
      ) : (
        <div className="row g-4">
          {rooms.map((room) => (
            <div key={room._id} className="col-md-6 col-lg-4">
              <div className="card card-hover h-100 shadow-sm border overflow-hidden">
                <div className="position-relative">
                  <img
                    src={room.imageUrl || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'}
                    alt={`Room ${room.roomNumber}`}
                    className="room-thumb"
                  />
                  <div className="position-absolute top-0 end-0 m-2">
                    {getStatusBadge(room.status)}
                  </div>
                  <div className="position-absolute bottom-0 start-0 m-2">
                    <span className="badge bg-dark bg-opacity-75 text-white">
                      Floor {room.floor || 1}
                    </span>
                  </div>
                </div>

                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold mb-0">Room #{room.roomNumber}</h5>
                      <span className="text-secondary small fw-semibold">{room.type} Class</span>
                    </div>
                    <div className="text-end">
                      <span className="fs-5 fw-bold text-primary">${room.pricePerNight}</span>
                      <span className="text-muted small"> / night</span>
                    </div>
                  </div>

                  <p className="card-text text-muted small mb-3 flex-grow-1">
                    {room.description || 'Modern room equipped with state-of-the-art hospitality conveniences.'}
                  </p>

                  <div className="small text-muted mb-3">
                    <i className="bi bi-people-fill me-1"></i> Max Guests: {room.capacity}
                  </div>

                  {/* Amenities Pills */}
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {room.amenities &&
                      room.amenities.slice(0, 3).map((amenity, i) => (
                        <span key={i} className="badge bg-light text-secondary border small">
                          {amenity}
                        </span>
                      ))}
                    {room.amenities && room.amenities.length > 3 && (
                      <span className="badge bg-light text-secondary border small">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto pt-2 border-top d-flex gap-2 justify-content-between">
                    {room.status === 'available' ? (
                      <button
                        onClick={() => navigate(`/bookings?roomId=${room._id}`)}
                        className="btn btn-sm btn-primary flex-grow-1"
                      >
                        <i className="bi bi-calendar-plus me-1"></i> Book Room
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-secondary flex-grow-1" disabled>
                        Not Available
                      </button>
                    )}

                    {isStaffOrAdmin && (
                      <button
                        onClick={() => openEditModal(room)}
                        className="btn btn-sm btn-outline-secondary"
                        title="Edit Room"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRoom(room._id, room.roomNumber)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete Room"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {isEditing ? `Edit Room #${modalForm.roomNumber}` : 'Add New Room'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleModalSubmit}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {modalError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Room Number</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={modalForm.roomNumber}
                        onChange={(e) => setModalForm({ ...modalForm, roomNumber: e.target.value })}
                        placeholder="e.g. 101"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Room Type</label>
                      <select
                        className="form-select"
                        value={modalForm.type}
                        onChange={(e) => setModalForm({ ...modalForm, type: e.target.value })}
                      >
                        <option value="Single">Single</option>
                        <option value="Double">Double</option>
                        <option value="Deluxe">Deluxe</option>
                        <option value="Suite">Suite</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Price Per Night ($)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        required
                        value={modalForm.pricePerNight}
                        onChange={(e) =>
                          setModalForm({ ...modalForm, pricePerNight: e.target.value })
                        }
                        placeholder="e.g. 120"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Guest Capacity</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="form-control"
                        required
                        value={modalForm.capacity}
                        onChange={(e) => setModalForm({ ...modalForm, capacity: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Floor Number</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={modalForm.floor}
                        onChange={(e) => setModalForm({ ...modalForm, floor: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Initial Status</label>
                      <select
                        className="form-select"
                        value={modalForm.status}
                        onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                      >
                        <option value="available">Available</option>
                        <option value="booked">Booked / Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        value={modalForm.imageUrl}
                        onChange={(e) => setModalForm({ ...modalForm, imageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Amenities (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={modalForm.amenities}
                        onChange={(e) => setModalForm({ ...modalForm, amenities: e.target.value })}
                        placeholder="Free Wi-Fi, Air Conditioning, TV, Mini Bar"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={modalForm.description}
                        onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                        placeholder="Room features, views, and perks..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : isEditing ? 'Update Room' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
