const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide payment amount'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'Debit Card', 'Cash', 'Online Transfer', 'UPI'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
      index: true,
    },
    transactionId: {
      type: String,
      default: () => 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
