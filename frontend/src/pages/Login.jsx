import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle p-3 mb-2 shadow">
              <i className="bi bi-buildings-fill fs-2"></i>
            </div>
            <h2 className="fw-bold text-dark">Welcome to HotelPro</h2>
            <p className="text-muted">Enter credentials to access the management portal</p>
          </div>

          <div className="card shadow-sm border-0 p-4">
            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0"
                    placeholder="name@hotelpro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small text-secondary">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 shadow-sm d-flex align-items-center justify-content-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i> Sign In
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Fill Buttons */}
            <div className="mt-4 pt-3 border-top">
              <div className="text-center small text-muted mb-2 fw-semibold">Quick Demo Login:</div>
              <div className="d-flex gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => fillQuickDemo('admin@hotelpro.com', 'Admin@123')}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => fillQuickDemo('staff@hotelpro.com', 'Staff@123')}
                >
                  Staff
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success"
                  onClick={() => fillQuickDemo('guest@hotelpro.com', 'Guest@123')}
                >
                  Guest
                </button>
              </div>
            </div>

            <div className="text-center mt-3 pt-2 text-muted small">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary fw-semibold text-decoration-none">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
