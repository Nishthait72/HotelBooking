const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

// Helper to generate unique booking number
const generateBookingNumber = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${code}`;
};

// @route   GET /api/bookings/check-availability
// @desc    Find available rooms for date range and criteria
// @access  Public
router.get('/check-availability', async (req, res) => {
  try {
    const { checkInDate, checkOutDate, type, minCapacity } = req.query;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both checkInDate and checkOutDate',
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid dates provided' });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date',
      });
    }

    // Find conflicting bookings: (checkInDate < reqCheckOut AND checkOutDate > reqCheckIn)
    const conflictingBookings = await Booking.find({
      status: { $in: ['confirmed', 'checked_in'] },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    }).select('room');

    const bookedRoomIds = conflictingBookings.map((b) => b.room);

    // Build room query
    const roomQuery = {
      _id: { $nin: bookedRoomIds },
      status: { $ne: 'maintenance' },
    };

    if (type && type !== 'all') {
      roomQuery.type = type;
    }
    if (minCapacity) {
      roomQuery.capacity = { $gte: Number(minCapacity) };
    }

    const availableRooms = await Room.find(roomQuery).sort({ pricePerNight: 1 });

    const diffDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      count: availableRooms.length,
      totalNights: diffDays,
      data: availableRooms,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings (Admin/Staff) or my bookings (Guest)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = {};

    // If user is Guest, restrict to their own bookings
    if (req.user.role === 'Guest') {
      query.user = req.user._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.bookingNumber = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber type pricePerNight imageUrl floor')
      .populate('guest', 'fullName email phone idType idNumber')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking details with payments
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('guest')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Role check: Guest can only view their own booking
    if (req.user.role === 'Guest' && booking.user && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this booking' });
    }

    const payments = await Payment.find({ booking: booking._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...booking.toObject(),
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/bookings
// @desc    Create a new reservation (with strict double-booking check)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      roomId,
      checkInDate,
      checkOutDate,
      guestsCount,
      specialRequests,
      guestInfo, // { fullName, email, phone, idType, idNumber, address }
      paymentMethod, // Optional: instant payment simulation
    } = req.body;

    if (!roomId || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roomId, checkInDate, and checkOutDate',
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date',
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'This room is currently under maintenance and cannot be booked',
      });
    }

    // Strict Double-Booking Check
    const overlapping = await Booking.findOne({
      room: room._id,
      status: { $in: ['confirmed', 'checked_in'] },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    });

    if (overlapping) {
      return res.status(409).json({
        success: false,
        message: `Double-booking conflict: Room ${room.roomNumber} is already booked from ${new Date(
          overlapping.checkInDate
        ).toLocaleDateString()} to ${new Date(overlapping.checkOutDate).toLocaleDateString()}`,
      });
    }

    // Handle Guest Record
    let guest;
    const guestEmail = (guestInfo && guestInfo.email) || req.user.email;
    const guestName = (guestInfo && guestInfo.fullName) || req.user.name;
    const guestPhone = (guestInfo && guestInfo.phone) || req.user.phone || 'N/A';

    guest = await Guest.findOne({ email: guestEmail.toLowerCase() });
    if (!guest) {
      guest = await Guest.create({
        user: req.user.role === 'Guest' ? req.user._id : null,
        fullName: guestName,
        email: guestEmail.toLowerCase(),
        phone: guestPhone,
        idType: (guestInfo && guestInfo.idType) || 'Passport',
        idNumber: (guestInfo && guestInfo.idNumber) || '',
        address: (guestInfo && guestInfo.address) || '',
      });
    } else if (guestInfo) {
      // Update phone or address if provided
      if (guestInfo.phone) guest.phone = guestInfo.phone;
      if (guestInfo.address) guest.address = guestInfo.address;
      if (guestInfo.idNumber) guest.idNumber = guestInfo.idNumber;
      await guest.save();
    }

    // Calculate nights & amount
    const totalNights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const totalAmount = totalNights * room.pricePerNight;

    // Create unique booking number
    let bookingNumber = generateBookingNumber();
    let exists = await Booking.findOne({ bookingNumber });
    while (exists) {
      bookingNumber = generateBookingNumber();
      exists = await Booking.findOne({ bookingNumber });
    }

    const booking = await Booking.create({
      bookingNumber,
      guest: guest._id,
      room: room._id,
      user: req.user._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestsCount: guestsCount || 1,
      totalNights,
      pricePerNight: room.pricePerNight,
      totalAmount,
      status: 'confirmed',
      paymentStatus: paymentMethod ? 'paid' : 'unpaid',
      specialRequests: specialRequests || '',
    });

    // If instant payment method provided, record payment
    if (paymentMethod) {
      await Payment.create({
        paymentNumber: `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        booking: booking._id,
        guest: guest._id,
        amount: totalAmount,
        paymentMethod,
        paymentStatus: 'completed',
        notes: 'Paid during booking reservation',
      });
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('room')
      .populate('guest');

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (check-in, check-out, cancel)
// @access  Private (Admin & Staff)
router.put('/:id/status', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    // Update Room status
    const room = await Room.findById(booking.room);
    if (room) {
      if (status === 'checked_in') {
        room.status = 'booked';
        await room.save();
      } else if (status === 'checked_out' || status === 'cancelled') {
        // Check if there are any other checked_in bookings right now
        const activeCurrent = await Booking.findOne({
          room: room._id,
          status: 'checked_in',
          _id: { $ne: booking._id },
        });
        if (!activeCurrent && room.status === 'booked') {
          room.status = 'available';
          await room.save();
        }
      }
    }

    res.json({
      success: true,
      message: `Booking status changed to ${status}`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel reservation (Guest can cancel own, Admin/Staff can cancel any)
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Role check: Guest can only cancel their own booking
    if (req.user.role === 'Guest' && booking.user && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an already checked-in booking. Please check-out instead.',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Free up room if it was marked booked
    const room = await Room.findById(booking.room);
    if (room && room.status === 'booked') {
      room.status = 'available';
      await room.save();
    }

    res.json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
