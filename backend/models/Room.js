const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide a room number'],
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Please provide room type'],
      enum: ['Single', 'Double', 'Suite', 'Deluxe'],
      default: 'Single',
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please provide room price per night'],
      min: [0, 'Price cannot be negative'],
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide capacity'],
      min: [1, 'Capacity must be at least 1'],
      default: 2,
    },
    amenities: {
      type: [String],
      default: ['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen TV'],
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'maintenance'],
      default: 'available',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    },
    floor: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and filtering
roomSchema.index({ type: 1, status: 1 });
roomSchema.index({ pricePerNight: 1 });

module.exports = mongoose.model('Room', roomSchema);
