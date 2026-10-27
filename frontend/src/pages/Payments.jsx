import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Payments = () => {
  const { isStaffOrAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [unpaidBookings, setUnpaidBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Record Payment Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View Receipt Modal
  const [receiptPayment, setReceiptPayment] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      if (res.success) {
        setPayments(res.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaidBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.success) {
        const filtered = res.data.filter(
          (b) => b.paymentStatus === 'unpaid' || b.paymentStatus === 'partial'
        );
        setUnpaidBookings(filtered);
        if (filtered.length > 0 && !selectedBookingId) {
          setSelectedBookingId(filtered[0]._id);
          setAmount(filtered[0].totalAmount);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    if (isStaffOrAdmin) {
      fetchUnpaidBookings();
    }
  }, []);

  const handleBookingSelect = (bId) => {
    setSelectedBookingId(bId);
    const b = unpaidBookings.find((item) => item._id === bId);
    if (b) {
      setAmount(b.totalAmount);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const res = await api.post('/payments', {
        bookingId: selectedBookingId,
        amount: Number(amount),
        paymentMethod,
        notes,
      });

      if (res.success) {
        setShowModal(false);
        fetchPayments();
        fetchUnpaidBookings();
        alert('Payment recorded successfully!');
      }
    } catch (err) {
      setModalError(err.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-credit-card-fill text-primary me-2"></i> Billing & Payments
          </h2>
          <p className="text-muted mb-0">Track transactions, process booking payments, and issue receipts</p>
        </div>
        {isStaffOrAdmin && (
          <button
            className="btn btn-primary d-flex align-items-center mt-3 mt-md-0"
            onClick={() => {
              setModalError('');
              fetchUnpaidBookings();
              setShowModal(true);
            }}
          >
            <i className="bi bi-cash-coin me-2"></i> Record Payment
          </button>
        )}
      </div>

      {/* Revenue Summary Banner */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-4">
          <div className="card stat-widget success p-3 shadow-sm">
            <div className="text-muted small text-uppercase fw-semibold">Total Revenue Collected</div>
            <div className="fs-3 fw-bold text-success mt-1">${totalRevenue.toLocaleString()}</div>
            <div className="small text-muted mt-1">{payments.length} transactions processed</div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading payments...</span>
              </div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-wallet2 display-4 mb-2"></i>
              <h5>No payment records found</h5>
              <p>Process a booking payment to generate ledger entries.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Booking #</th>
                    <th>Guest</th>
                    <th>Payment Method</th>
                    <th>Transaction ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-end">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td className="fw-bold text-primary font-monospace">{p.paymentNumber}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {p.booking?.bookingNumber || 'N/A'}
                        </span>
                      </td>
                      <td>{p.guest?.fullName || 'Guest'}</td>
                      <td>
                        <i className="bi bi-credit-card me-1 text-secondary"></i> {p.paymentMethod}
                      </td>
                      <td className="small font-monospace text-muted">{p.transactionId}</td>
                      <td className="small text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="fw-bold text-dark">${p.amount}</td>
                      <td>
                        <span className="badge bg-success text-uppercase">{p.paymentStatus}</span>
                      </td>
                      <td className="text-end">
                        <button
                          onClick={() => setReceiptPayment(p)}
                          className="btn btn-sm btn-outline-secondary"
                        >
                          <i className="bi bi-file-earmark-text me-1"></i> Receipt
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

      {/* Record Payment Modal */}
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
                <h5 className="modal-title fw-bold">Record Payment</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleRecordPayment}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {modalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Pending Booking</label>
                    {unpaidBookings.length > 0 ? (
                      <select
                        className="form-select"
                        required
                        value={selectedBookingId}
                        onChange={(e) => handleBookingSelect(e.target.value)}
                      >
                        {unpaidBookings.map((b) => (
                          <option key={b._id} value={b._id}>
                            #{b.bookingNumber} - {b.guest?.fullName} (${b.totalAmount} - {b.paymentStatus})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="alert alert-info py-2 small mb-0">
                        No unpaid bookings currently found.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Amount to Pay ($)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Online Transfer">Online Transfer</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Notes / Transaction Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Front desk POS terminal slip #891"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
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
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || unpaidBookings.length === 0}
                  >
                    {submitting ? 'Processing...' : 'Complete Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptPayment && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Official Payment Receipt</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setReceiptPayment(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <h4 className="fw-bold text-primary mb-0">HotelPro Hospitality</h4>
                  <p className="text-muted small">Official Transaction Voucher</p>
                  <span className="badge bg-success text-uppercase">PAID IN FULL</span>
                </div>

                <div className="border rounded p-3 bg-light mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Receipt No:</span>
                    <span className="fw-bold font-monospace">{receiptPayment.paymentNumber}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Booking Reference:</span>
                    <span className="fw-semibold">{receiptPayment.booking?.bookingNumber}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Guest Name:</span>
                    <span className="fw-semibold">{receiptPayment.guest?.fullName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Date & Time:</span>
                    <span>{new Date(receiptPayment.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Method:</span>
                    <span>{receiptPayment.paymentMethod}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Transaction Ref:</span>
                    <span className="font-monospace">{receiptPayment.transactionId}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top mt-2">
                    <span className="fw-bold">Total Paid:</span>
                    <span className="fs-5 fw-bold text-success">${receiptPayment.amount}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReceiptPayment(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer me-1"></i> Print Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
