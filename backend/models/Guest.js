const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fullName: {
      type: String,
      required: [true, 'Please provide guest full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    idType: {
      type: String,
      enum: ['Passport', 'Driving License', 'National ID'],
      default: 'Passport',
    },
    idNumber: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

guestSchema.index({ fullName: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Guest', guestSchema);
