import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Bookings = () => {
  const { user, isStaffOrAdmin, isGuest } = useAuth();
  const [searchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Booking Creation Modal
  const [showModal, setShowModal] = useState(false);
  const [formRoomId, setFormRoomId] = useState(searchParams.get('roomId') || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [paymentOption, setPaymentOption] = useState('Credit Card');
  const [modalError, setModalError] = useState('');
  const [creating, setCreating] = useState(false);

  // Availability Search Bar state
  const [availCheckIn, setAvailCheckIn] = useState('');
  const [availCheckOut, setAvailCheckOut] = useState('');
  const [availType, setAvailType] = useState('all');
  const [availableRooms, setAvailableRooms] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  // Selected Booking Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterStatus !== 'all') queryParams.append('status', filterStatus);
      if (search) queryParams.append('search', search);

      const res = await api.get(`/bookings?${queryParams.toString()}`);
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRooms = async () => {
    try {
      const res = await api.get('/rooms');
      if (res.success) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchAllRooms();

    // Default dates for creation (today & 2 days later)
    const today = new Date();
    const d1 = today.toISOString().split('T')[0];
    const twoDaysLater = new Date();
    twoDaysLater.setDate(today.getDate() + 2);
    const d2 = twoDaysLater.toISOString().split('T')[0];
    setCheckIn(d1);
    setCheckOut(d2);
    setAvailCheckIn(d1);
    setAvailCheckOut(d2);

    if (searchParams.get('roomId')) {
      setShowModal(true);
    }
  }, [filterStatus, search]);

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (!availCheckIn || !availCheckOut) return;

    try {
      setCheckingAvail(true);
      const res = await api.get(
        `/bookings/check-availability?checkInDate=${availCheckIn}&checkOutDate=${availCheckOut}&type=${availType}`
      );
      if (res.success) {
        setAvailableRooms(res.data);
      }
    } catch (err) {
      alert(err.message || 'Availability search failed');
    } finally {
      setCheckingAvail(false);
    }
  };

  const calculateTotal = () => {
    const selectedRoom = rooms.find((r) => r._id === formRoomId);
    if (!selectedRoom || !checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
    return nights * selectedRoom.pricePerNight;
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setModalError('');
    setCreating(true);

    try {
      const payload = {
        roomId: formRoomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestsCount: Number(guestsCount),
        specialRequests,
        guestInfo: {
          fullName: guestName,
          email: guestEmail,
          phone: guestPhone,
        },
        paymentMethod: paymentOption !== 'pay_later' ? paymentOption : undefined,
      };

      const res = await api.post('/bookings', payload);
      if (res.success) {
        setShowModal(false);
        fetchBookings();
        alert('Reservation confirmed successfully!');
      }
    } catch (err) {
      setModalError(err.message || 'Booking creation failed');
    } finally {
      setCreating(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

    try {
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to update booking status');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge bg-primary">CONFIRMED</span>;
      case 'checked_in':
        return <span className="badge bg-success">CHECKED IN</span>;
      case 'checked_out':
        return <span className="badge bg-secondary">CHECKED OUT</span>;
      case 'cancelled':
        return <span className="badge bg-danger">CANCELLED</span>;
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
            <i className="bi bi-calendar-check-fill text-primary me-2"></i> Reservations & Bookings
          </h2>
          <p className="text-muted mb-0">Search availability, manage guest stays, and process check-ins</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center mt-3 mt-md-0"
          onClick={() => {
            setFormRoomId(rooms[0]?._id || '');
            setModalError('');
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-circle me-2"></i> New Reservation
        </button>
      </div>

      {/* Real-time Availability Search Tool */}
      <div className="card shadow-sm p-4 mb-4 border-primary border-opacity-25 bg-white">
        <h5 className="fw-bold text-dark mb-3">
          <i className="bi bi-search text-primary me-2"></i> Check Real-Time Availability
        </h5>
        <form onSubmit={handleCheckAvailability}>
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-secondary">Check-In Date</label>
              <input
                type="date"
                className="form-control"
                value={availCheckIn}
                onChange={(e) => setAvailCheckIn(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-secondary">Check-Out Date</label>
              <input
                type="date"
                className="form-control"
                value={availCheckOut}
                onChange={(e) => setAvailCheckOut(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-secondary">Room Category</label>
              <select
                className="form-select"
                value={availType}
                onChange={(e) => setAvailType(e.target.value)}
              >
                <option value="all">All Room Types</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div className="col-md-3">
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center"
                disabled={checkingAvail}
              >
                {checkingAvail ? (
                  'Checking...'
                ) : (
                  <>
                    <i className="bi bi-calendar-range me-2"></i> Check Availability
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Search Results Display */}
        {availableRooms && (
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-success">
                <i className="bi bi-check-circle-fill me-1"></i> {availableRooms.length} Available Rooms Found ({availCheckIn} to {availCheckOut})
              </span>
              <button
                className="btn btn-sm btn-link text-muted"
                onClick={() => setAvailableRooms(null)}
              >
                Dismiss
              </button>
            </div>
            {availableRooms.length > 0 ? (
              <div className="row g-2">
                {availableRooms.slice(0, 4).map((r) => (
                  <div key={r._id} className="col-md-3">
                    <div className="p-3 border rounded bg-light d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">Room #{r.roomNumber}</div>
                        <div className="small text-muted">{r.type} • ${r.pricePerNight}/night</div>
                      </div>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          setFormRoomId(r._id);
                          setCheckIn(availCheckIn);
                          setCheckOut(availCheckOut);
                          setShowModal(true);
                        }}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-warning py-2 small mb-0">
                No rooms available for the selected dates. Please adjust dates or category.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar for Bookings List */}
      <div className="card shadow-sm p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search booking number (e.g. BK-XXXXXX)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Reservation Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading bookings...</span>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-journal-x display-4 mb-2"></i>
              <h5>No reservations found</h5>
              <p>Create a new reservation to see bookings here.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Booking #</th>
                    <th>Guest</th>
                    <th>Room</th>
                    <th>Stay Dates</th>
                    <th>Nights</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <span className="fw-bold text-primary font-monospace">{b.bookingNumber}</span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{b.guest?.fullName || 'Guest'}</div>
                        <div className="small text-muted">{b.guest?.phone || b.guest?.email || ''}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          #{b.room?.roomNumber} ({b.room?.type})
                        </span>
                      </td>
                      <td className="small text-muted">
                        <div>{new Date(b.checkInDate).toLocaleDateString()}</div>
                        <div className="text-secondary">&rarr; {new Date(b.checkOutDate).toLocaleDateString()}</div>
                      </td>
                      <td>{b.totalNights}</td>
                      <td className="fw-bold text-dark">${b.totalAmount}</td>
                      <td>
                        <span
                          className={`badge ${
                            b.paymentStatus === 'paid'
                              ? 'bg-success'
                              : b.paymentStatus === 'partial'
                              ? 'bg-warning text-dark'
                              : 'bg-danger'
                          }`}
                        >
                          {b.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td>{getStatusBadge(b.status)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {isStaffOrAdmin && b.status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(b._id, 'checked_in')}
                              className="btn btn-outline-success"
                              title="Check In Guest"
                            >
                              Check In
                            </button>
                          )}
                          {isStaffOrAdmin && b.status === 'checked_in' && (
                            <button
                              onClick={() => updateBookingStatus(b._id, 'checked_out')}
                              className="btn btn-outline-primary"
                              title="Check Out Guest"
                            >
                              Check Out
                            </button>
                          )}
                          {b.status !== 'cancelled' && b.status !== 'checked_out' && (
                            <button
                              onClick={() => handleCancelBooking(b._id)}
                              className="btn btn-outline-danger"
                              title="Cancel Reservation"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="btn btn-outline-secondary"
                            title="View Booking Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Reservation Modal */}
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
                  <i className="bi bi-journal-plus me-2"></i> Create Reservation
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateBooking}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i> {modalError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Select Room</label>
                      <select
                        className="form-select"
                        required
                        value={formRoomId}
                        onChange={(e) => setFormRoomId(e.target.value)}
                      >
                        <option value="">-- Choose a room --</option>
                        {rooms.map((r) => (
                          <option key={r._id} value={r._id}>
                            Room #{r.roomNumber} - {r.type} (${r.pricePerNight}/night) [Status: {r.status}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Check-In Date</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Check-Out Date</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Number of Guests</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="form-control"
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Payment Option</label>
                      <select
                        className="form-select"
                        value={paymentOption}
                        onChange={(e) => setPaymentOption(e.target.value)}
                      >
                        <option value="Credit Card">Pay Now (Credit Card)</option>
                        <option value="Debit Card">Pay Now (Debit Card)</option>
                        <option value="UPI">Pay Now (UPI / Digital)</option>
                        <option value="Cash">Cash on Arrival</option>
                        <option value="pay_later">Pay Later at Front Desk</option>
                      </select>
                    </div>

                    <div className="col-12 border-top pt-3 mt-3">
                      <h6 className="fw-bold text-dark mb-2">Guest Contact Details</h6>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Special Requests (Optional)</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Late check-in, dietary preferences, room floor..."
                      ></textarea>
                    </div>

                    {/* Calculated Summary Box */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                        <span className="text-secondary fw-semibold">Estimated Total Amount:</span>
                        <span className="fs-4 fw-bold text-primary">${calculateTotal()}</span>
                      </div>
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
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Confirming...' : 'Confirm Reservation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Booking Details Modal */}
      {selectedBooking && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  Reservation #{selectedBooking.bookingNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedBooking(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3 text-center">
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <ul className="list-group list-group-flush mb-3">
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Guest Name:</span>
                    <span className="fw-semibold">{selectedBooking.guest?.fullName}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Room:</span>
                    <span className="fw-semibold">
                      Room #{selectedBooking.room?.roomNumber} ({selectedBooking.room?.type})
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Check-In:</span>
                    <span>{new Date(selectedBooking.checkInDate).toLocaleDateString()}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Check-Out:</span>
                    <span>{new Date(selectedBooking.checkOutDate).toLocaleDateString()}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Total Nights:</span>
                    <span>{selectedBooking.totalNights}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Total Amount:</span>
                    <span className="fw-bold text-primary">${selectedBooking.totalAmount}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Payment Status:</span>
                    <span className="fw-semibold text-uppercase">{selectedBooking.paymentStatus}</span>
                  </li>
                  {selectedBooking.specialRequests && (
                    <li className="list-group-item px-0">
                      <span className="text-muted d-block small mb-1">Special Requests:</span>
                      <span className="fst-italic">{selectedBooking.specialRequests}</span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
