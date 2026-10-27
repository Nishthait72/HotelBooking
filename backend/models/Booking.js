const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: true,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    checkInDate: {
      type: Date,
      required: [true, 'Please provide check-in date'],
      index: true,
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Please provide check-out date'],
      index: true,
    },
    guestsCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalNights: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['confirmed', 'checked_in', 'checked_out', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
      index: true,
    },
    specialRequests: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to optimize conflict queries
bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
