import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Guests from './pages/Guests';
import Payments from './pages/Payments';
import StaffTasks from './pages/StaffTasks';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <Rooms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guests"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                    <Guests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                    <StaffTasks />
                  </ProtectedRoute>
                }
              />

              {/* Default Fallback Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <footer className="bg-white border-top py-3 text-center text-muted small mt-auto">
            <div className="container">
              &copy; {new Date().getFullYear()} HotelPro Hospitality Management System. All rights reserved.
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
