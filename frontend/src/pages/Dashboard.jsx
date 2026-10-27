import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user, isStaffOrAdmin, isGuest } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stats/dashboard');
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Top Welcome Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">
            Hello, {user?.name} <span className="fs-4">👋</span>
          </h2>
          <p className="text-muted mb-0">
            {isGuest
              ? 'Manage your reservations and explore available luxury rooms.'
              : `Hotel Operations Control Center — Logged in as ${user?.role}`}
          </p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <Link to="/bookings" className="btn btn-primary d-flex align-items-center">
            <i className="bi bi-calendar-plus me-2"></i> Book a Room
          </Link>
          <Link to="/rooms" className="btn btn-outline-secondary d-flex align-items-center">
            <i className="bi bi-door-open me-2"></i> View Inventory
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {/* Guest Dashboard View */}
      {isGuest && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card bg-primary text-white border-0 shadow p-4 mb-2">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h3 className="fw-bold mb-2">Experience Unmatched Hospitality</h3>
                  <p className="lead mb-3 text-white-50">
                    Find and book luxury suites, double rooms, and penthouses with flexible check-in and instant confirmation.
                  </p>
                  <Link to="/rooms" className="btn btn-warning fw-bold text-dark px-4 py-2">
                    Browse All Rooms & Suites
                  </Link>
                </div>
                <div className="col-md-4 text-center d-none d-md-block">
                  <i className="bi bi-building-check display-1 text-white-50"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-clock-history me-2 text-primary"></i> Your Active & Upcoming Reservations
                </h5>
                <Link to="/bookings" className="btn btn-sm btn-outline-primary">
                  View All
                </Link>
              </div>

              {stats?.activeBookings && stats.activeBookings.length > 0 ? (
                <div className="row g-3">
                  {stats.activeBookings.map((b) => (
                    <div key={b._id} className="col-md-6 col-lg-4">
                      <div className="card h-100 border shadow-sm">
                        {b.room?.imageUrl && (
                          <img
                            src={b.room.imageUrl}
                            alt={`Room ${b.room.roomNumber}`}
                            className="card-img-top"
                            style={{ height: '140px', objectFit: 'cover' }}
                          />
                        )}
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="badge bg-primary">#{b.bookingNumber}</span>
                            <span
                              className={`badge ${
                                b.status === 'checked_in'
                                  ? 'bg-success'
                                  : b.status === 'confirmed'
                                  ? 'bg-info text-dark'
                                  : 'bg-secondary'
                              }`}
                            >
                              {b.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <h6 className="fw-bold mb-1">
                            Room {b.room?.roomNumber} - {b.room?.type}
                          </h6>
                          <div className="small text-muted mb-2">
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                            {new Date(b.checkOutDate).toLocaleDateString()} ({b.totalNights} nights)
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                            <span className="fw-bold text-dark">${b.totalAmount}</span>
                            <span
                              className={`badge ${
                                b.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning text-dark'
                              }`}
                            >
                              {b.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-calendar-x fs-1 d-block mb-2 text-secondary"></i>
                  <p className="mb-2">You don't have any active reservations.</p>
                  <Link to="/bookings" className="btn btn-primary btn-sm">
                    Book Your Stay Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin & Staff Dashboard View */}
      {isStaffOrAdmin && stats && (
        <>
          {/* Key Metric KPI Widgets */}
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3">
              <div className="card stat-widget h-100 p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">Available Rooms</div>
                    <div className="fs-3 fw-bold text-primary mt-1">
                      {stats.rooms?.available}{' '}
                      <span className="fs-6 text-muted fw-normal">/ {stats.rooms?.total}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                    <i className="bi bi-door-open fs-3"></i>
                  </div>
                </div>
                <div className="small text-muted mt-2">
                  <span className="fw-semibold text-dark">{stats.rooms?.occupancyRate}%</span> Occupancy Rate
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card stat-widget success h-100 p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">Active Bookings</div>
                    <div className="fs-3 fw-bold text-success mt-1">{stats.bookings?.active}</div>
                  </div>
                  <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                    <i className="bi bi-calendar-check fs-3"></i>
                  </div>
                </div>
                <div className="small text-muted mt-2">
                  <span className="fw-semibold text-dark">{stats.bookings?.todayCheckIns}</span> Check-ins Today
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card stat-widget warning h-100 p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">Total Revenue</div>
                    <div className="fs-3 fw-bold text-warning mt-1">
                      ${stats.finance?.totalRevenue?.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                    <i className="bi bi-currency-dollar fs-3"></i>
                  </div>
                </div>
                <div className="small text-muted mt-2">
                  <span className="fw-semibold text-dark">{stats.finance?.paymentsCount}</span> Processed Payments
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card stat-widget info h-100 p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">Pending Staff Tasks</div>
                    <div className="fs-3 fw-bold text-info mt-1">{stats.operations?.pendingTasks}</div>
                  </div>
                  <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                    <i className="bi bi-list-task fs-3"></i>
                  </div>
                </div>
                <div className="small text-muted mt-2">
                  <Link to="/tasks" className="text-decoration-none fw-semibold">
                    View task assignments &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Operations Row */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-receipt me-2 text-primary"></i> Recent Reservations
                  </h5>
                  <Link to="/bookings" className="btn btn-sm btn-outline-primary">
                    View All
                  </Link>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Booking #</th>
                          <th>Guest</th>
                          <th>Room</th>
                          <th>Dates</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentBookings && stats.recentBookings.length > 0 ? (
                          stats.recentBookings.map((b) => (
                            <tr key={b._id}>
                              <td>
                                <span className="fw-semibold text-primary">{b.bookingNumber}</span>
                              </td>
                              <td>{b.guest?.fullName || 'N/A'}</td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  #{b.room?.roomNumber} ({b.room?.type})
                                </span>
                              </td>
                              <td className="small text-muted">
                                {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                                {new Date(b.checkOutDate).toLocaleDateString()}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    b.status === 'checked_in'
                                      ? 'bg-success'
                                      : b.status === 'confirmed'
                                      ? 'bg-primary'
                                      : b.status === 'checked_out'
                                      ? 'bg-secondary'
                                      : 'bg-danger'
                                  }`}
                                >
                                  {b.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="fw-bold text-dark">${b.totalAmount}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                              No recent bookings found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Breakdown Card */}
            <div className="col-lg-4">
              <div className="card shadow-sm h-100 p-4">
                <h5 className="fw-bold mb-3">
                  <i className="bi bi-pie-chart me-2 text-primary"></i> Room Inventory Status
                </h5>
                <div className="list-group list-group-flush mb-4">
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className="d-flex align-items-center">
                      <span className="badge bg-success rounded-circle p-2 me-2"> </span> Available
                    </span>
                    <span className="fw-bold text-success">{stats.rooms?.available}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className="d-flex align-items-center">
                      <span className="badge bg-primary rounded-circle p-2 me-2"> </span> Occupied / Booked
                    </span>
                    <span className="fw-bold text-primary">{stats.rooms?.booked}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className="d-flex align-items-center">
                      <span className="badge bg-warning rounded-circle p-2 me-2"> </span> In Maintenance
                    </span>
                    <span className="fw-bold text-warning">{stats.rooms?.maintenance}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold border-top">
                    <span>Total Rooms</span>
                    <span>{stats.rooms?.total}</span>
                  </div>
                </div>

                <div className="bg-light p-3 rounded text-center mt-auto">
                  <div className="small text-muted mb-2">Need to adjust rooms or add inventory?</div>
                  <Link to="/rooms" className="btn btn-outline-primary btn-sm w-100">
                    Manage Rooms
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
