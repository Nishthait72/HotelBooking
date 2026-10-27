const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, paymentStatus } = req.query;
    const query = {};

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    // If guest, find payments linked to bookings made by this user
    if (req.user.role === 'Guest') {
      const userBookings = await Booking.find({ user: req.user._id }).select('_id');
      const bookingIds = userBookings.map((b) => b._id);
      query.booking = { $in: bookingIds };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('booking', 'bookingNumber totalAmount paymentStatus checkInDate checkOutDate')
      .populate('guest', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: payments.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/payments
// @desc    Record/process payment for a booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, notes } = req.body;

    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId, amount, and paymentMethod',
      });
    }

    const booking = await Booking.findById(bookingId).populate('guest');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Guest can only pay for their own booking
    if (req.user.role === 'Guest' && booking.user && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const paymentNumber = `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const payment = await Payment.create({
      paymentNumber,
      booking: booking._id,
      guest: booking.guest._id,
      amount: Number(amount),
      paymentMethod,
      paymentStatus: 'completed',
      notes: notes || '',
    });

    // Calculate total paid so far
    const allPayments = await Payment.find({
      booking: booking._id,
      paymentStatus: 'completed',
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= booking.totalAmount) {
      booking.paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      booking.paymentStatus = 'partial';
    }
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
      bookingPaymentStatus: booking.paymentStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment receipt
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking')
      .populate('guest');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
