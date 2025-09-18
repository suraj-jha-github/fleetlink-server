const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  fromPincode: {
    type: String,
    required: [true, 'From pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  toPincode: {
    type: String,
    required: [true, 'To pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    trim: true
  },
  estimatedRideDurationHours: {
    type: Number,
    required: [true, 'Estimated ride duration is required'],
    min: [0, 'Duration cannot be negative']
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
bookingSchema.index({ vehicleId: 1, startTime: 1, endTime: 1 });
module.exports = mongoose.model('Booking', bookingSchema);