import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isStaffOrAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-danger text-white';
      case 'Staff':
        return 'bg-primary text-white';
      case 'Guest':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-2 shadow-sm">
      <div className="container-fluid px-4">
        <Link className="navbar-brand text-primary d-flex align-items-center" to="/dashboard">
          <i className="bi bi-buildings-fill fs-4 me-2"></i>
          <span>Hotel<span className="text-warning">Pro</span></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#hotelNavbar"
          aria-controls="hotelNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="hotelNavbar">
          {user ? (
            <>
              <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/rooms">
                    <i className="bi bi-door-open me-1"></i> Rooms
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/bookings">
                    <i className="bi bi-calendar-check me-1"></i> Bookings
                  </NavLink>
                </li>
                {isStaffOrAdmin && (
                  <li className="nav-item">
                    <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/guests">
                      <i className="bi bi-people me-1"></i> Guests
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/payments">
                    <i className="bi bi-credit-card me-1"></i> Payments
                  </NavLink>
                </li>
                {isStaffOrAdmin && (
                  <li className="nav-item">
                    <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/tasks">
                      <i className="bi bi-check2-square me-1"></i> Staff Tasks
                    </NavLink>
                  </li>
                )}
              </ul>

              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center text-end">
                  <div className="me-2">
                    <div className="fw-semibold text-dark small">{user.name}</div>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ fontSize: '0.68rem' }}>
                      {user.role}
                    </span>
                  </div>
                  <div
                    className="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: '38px', height: '38px' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-outline-danger d-flex align-items-center"
                  title="Logout"
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </div>
            </>
          ) : (
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/login">
                  Login
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/register">
                  Register
                </NavLink>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
