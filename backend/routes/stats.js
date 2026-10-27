const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Guest = require('../models/Guest');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/stats/dashboard
// @desc    Get dashboard metrics & occupancy stats
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const isGuest = req.user.role === 'Guest';

    if (isGuest) {
      // Return guest-specific dashboard summary
      const myBookingsCount = await Booking.countDocuments({ user: req.user._id });
      const activeBookings = await Booking.find({
        user: req.user._id,
        status: { $in: ['confirmed', 'checked_in'] },
      })
        .populate('room')
        .sort({ checkInDate: 1 });

      return res.json({
        success: true,
        data: {
          role: 'Guest',
          myBookingsCount,
          activeBookings,
        },
      });
    }

    // Admin & Staff Dashboard Metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalRooms,
      availableRooms,
      bookedRooms,
      maintenanceRooms,
      totalGuests,
      totalBookings,
      activeBookingsCount,
      todayCheckIns,
      todayCheckOuts,
      pendingTasks,
      recentBookings,
      completedPayments,
    ] = await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Room.countDocuments({ status: 'booked' }),
      Room.countDocuments({ status: 'maintenance' }),
      Guest.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['confirmed', 'checked_in'] } }),
      Booking.countDocuments({
        checkInDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'checked_in'] },
      }),
      Booking.countDocuments({
        checkOutDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'checked_in'] },
      }),
      Task.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
      Booking.find()
        .populate('room', 'roomNumber type')
        .populate('guest', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(6),
      Payment.find({ paymentStatus: 'completed' }),
    ]);

    const totalRevenue = completedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const occupancyRate = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;

    res.json({
      success: true,
      data: {
        role: req.user.role,
        rooms: {
          total: totalRooms,
          available: availableRooms,
          booked: bookedRooms,
          maintenance: maintenanceRooms,
          occupancyRate,
        },
        bookings: {
          total: totalBookings,
          active: activeBookingsCount,
          todayCheckIns,
          todayCheckOuts,
        },
        finance: {
          totalRevenue,
          paymentsCount: completedPayments.length,
        },
        operations: {
          totalGuests,
          pendingTasks,
        },
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
