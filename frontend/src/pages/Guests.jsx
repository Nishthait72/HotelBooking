import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Guest Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    idType: 'Passport',
    idNumber: '',
    address: '',
  });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Guest Details Modal
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);

      const res = await api.get(`/guests?${queryParams.toString()}`);
      if (res.success) {
        setGuests(res.data);
      }
    } catch (err) {
      console.error('Error fetching guests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [search]);

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    try {
      const res = await api.post('/guests', formData);
      if (res.success) {
        setShowModal(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          idType: 'Passport',
          idNumber: '',
          address: '',
        });
        fetchGuests();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create guest record');
    } finally {
      setSaving(false);
    }
  };

  const viewGuestHistory = async (guestId) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/guests/${guestId}`);
      if (res.success) {
        setSelectedGuest(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch guest details');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-people-fill text-primary me-2"></i> Guest Directory
          </h2>
          <p className="text-muted mb-0">Maintain customer records, identity credentials, and stay history</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center mt-3 mt-md-0"
          onClick={() => {
            setModalError('');
            setShowModal(true);
          }}
        >
          <i className="bi bi-person-plus-fill me-2"></i> Register New Guest
        </button>
      </div>

      {/* Search Bar */}
      <div className="card shadow-sm p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light text-muted">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search guest by name, email, or contact number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Guest Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading guests...</span>
              </div>
            </div>
          ) : guests.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-x display-4 mb-2"></i>
              <h5>No guest records found</h5>
              <p>Add a new guest or clear search filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Identification</th>
                    <th>Address</th>
                    <th>Registered</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center me-2"
                            style={{ width: '36px', height: '36px' }}
                          >
                            {g.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{g.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td>{g.email}</td>
                      <td>{g.phone}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {g.idType}: {g.idNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="small text-muted">{g.address || '—'}</td>
                      <td className="small text-muted">{new Date(g.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button
                          onClick={() => viewGuestHistory(g._id)}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-clock-history me-1"></i> Stay History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Guest Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Register Guest</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateGuest}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {modalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. David Miller"
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="david@example.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">ID Type</label>
                      <select
                        className="form-select"
                        value={formData.idType}
                        onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                      >
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                        <option value="National ID">National ID</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">ID Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.idNumber}
                        onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                        placeholder="e.g. PA8912304"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Residential Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street, City, State, Country"
                    ></textarea>
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
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Guest'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Guest Details & Booking History Modal */}
      {selectedGuest && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  Guest Profile: {selectedGuest.fullName}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedGuest(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4 pb-3 border-bottom">
                  <div className="col-md-4">
                    <div className="small text-muted">Email</div>
                    <div className="fw-semibold">{selectedGuest.email}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-muted">Phone</div>
                    <div className="fw-semibold">{selectedGuest.phone}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-muted">ID Document</div>
                    <div className="fw-semibold">
                      {selectedGuest.idType}: {selectedGuest.idNumber || 'None'}
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="small text-muted">Address</div>
                    <div>{selectedGuest.address || 'No address provided'}</div>
                  </div>
                </div>

                <h6 className="fw-bold mb-3">
                  <i className="bi bi-clock-history me-1 text-primary"></i> Reservation History ({selectedGuest.bookings?.length || 0})
                </h6>

                {selectedGuest.bookings && selectedGuest.bookings.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Booking #</th>
                          <th>Room</th>
                          <th>Dates</th>
                          <th>Status</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGuest.bookings.map((b) => (
                          <tr key={b._id}>
                            <td className="fw-bold">{b.bookingNumber}</td>
                            <td>Room #{b.room?.roomNumber} ({b.room?.type})</td>
                            <td>
                              {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                              {new Date(b.checkOutDate).toLocaleDateString()}
                            </td>
                            <td>
                              <span className="badge bg-secondary text-uppercase">{b.status}</span>
                            </td>
                            <td className="fw-bold">${b.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted small">No past reservations found for this guest.</p>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedGuest(null)}
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

export default Guests;
