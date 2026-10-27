const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/guests
// @desc    Get all guests with search and pagination
// @access  Private (Admin & Staff)
router.get('/', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Guest.countDocuments(query);
    const guests = await Guest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: guests.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: guests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/guests/:id
// @desc    Get guest details and booking history
// @access  Private (Admin & Staff)
router.get('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    const bookings = await Booking.find({ guest: guest._id })
      .populate('room', 'roomNumber type pricePerNight')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...guest.toObject(),
        bookings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/guests
// @desc    Create a guest record
// @access  Private (Admin & Staff)
router.post('/', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const { fullName, email, phone, idType, idNumber, address } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and phone',
      });
    }

    let guest = await Guest.findOne({ email: email.toLowerCase() });
    if (guest) {
      return res.status(400).json({
        success: false,
        message: 'A guest with this email already exists',
      });
    }

    guest = await Guest.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      idType: idType || 'Passport',
      idNumber: idNumber || '',
      address: address || '',
    });

    res.status(201).json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/guests/:id
// @desc    Update guest information
// @access  Private (Admin & Staff)
router.put('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    res.json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
