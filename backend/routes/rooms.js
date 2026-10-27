const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/rooms
// @desc    Get all rooms with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, status, minCapacity, maxPrice, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (type && type !== 'all') {
      query.type = type;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (minCapacity) {
      query.capacity = { $gte: Number(minCapacity) };
    }
    if (maxPrice) {
      query.pricePerNight = { ...(query.pricePerNight || {}), $lte: Number(maxPrice) };
    }
    if (search) {
      query.roomNumber = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Room.countDocuments(query);
    const rooms = await Room.find(query)
      .sort({ roomNumber: 1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: rooms.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get single room by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private (Admin only)
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const {
      roomNumber,
      type,
      pricePerNight,
      capacity,
      amenities,
      status,
      description,
      imageUrl,
      floor,
    } = req.body;

    if (!roomNumber || !pricePerNight) {
      return res.status(400).json({
        success: false,
        message: 'Please provide room number and price per night',
      });
    }

    const existingRoom = await Room.findOne({ roomNumber: roomNumber.trim() });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Room #${roomNumber} already exists`,
      });
    }

    const room = await Room.create({
      roomNumber: roomNumber.trim(),
      type: type || 'Single',
      pricePerNight: Number(pricePerNight),
      capacity: Number(capacity) || 2,
      amenities: Array.isArray(amenities)
        ? amenities
        : amenities
        ? amenities.split(',').map((a) => a.trim())
        : ['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen TV'],
      status: status || 'available',
      description: description || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      floor: Number(floor) || 1,
    });

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room details or status
// @access  Private (Admin & Staff)
router.put('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const {
      roomNumber,
      type,
      pricePerNight,
      capacity,
      amenities,
      status,
      description,
      imageUrl,
      floor,
    } = req.body;

    let room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if new roomNumber conflicts with another room
    if (roomNumber && roomNumber !== room.roomNumber) {
      const duplicate = await Room.findOne({ roomNumber: roomNumber.trim() });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Room #${roomNumber} already exists`,
        });
      }
      room.roomNumber = roomNumber.trim();
    }

    if (type) room.type = type;
    if (pricePerNight !== undefined) room.pricePerNight = Number(pricePerNight);
    if (capacity !== undefined) room.capacity = Number(capacity);
    if (amenities !== undefined) {
      room.amenities = Array.isArray(amenities)
        ? amenities
        : amenities.split(',').map((a) => a.trim());
    }
    if (status) room.status = status;
    if (description !== undefined) room.description = description;
    if (imageUrl) room.imageUrl = imageUrl;
    if (floor !== undefined) room.floor = Number(floor);

    await room.save();

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete a room
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check active bookings
    const activeBooking = await Booking.findOne({
      room: room._id,
      status: { $in: ['confirmed', 'checked_in'] },
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with active or upcoming reservations',
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
