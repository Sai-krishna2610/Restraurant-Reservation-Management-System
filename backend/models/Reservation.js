const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  date: {
    type: String, // Stored as YYYY-MM-DD to avoid time zone issues
    required: true
  },
  startTime: {
    type: String, // format: HH:MM
    required: true
  },
  endTime: {
    type: String, // format: HH:MM
    required: true
  },
  guests: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked'
  }
}, {
  timestamps: true
});

// Index for performance and checking overlaps quickly
ReservationSchema.index({ date: 1, startTime: 1, endTime: 1, table: 1, status: 1 });

module.exports = mongoose.model('Reservation', ReservationSchema);
