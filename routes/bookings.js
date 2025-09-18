const express = require('express');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { calculateRideDuration, calculateBookingEndTime, isValidBookingTime } = require('../utils/rideUtils');
const router = express.Router();
router.post('/', async (req, res) => {
  try {
    const { vehicleId, fromPincode, toPincode, startTime, customerId } = req.body;
    if (!vehicleId || !fromPincode || !toPincode || !startTime || !customerId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'vehicleId, fromPincode, toPincode, startTime, and customerId are required'
      });
    }
    const bookingStartTime = new Date(startTime);
    if (isNaN(bookingStartTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid start time',
        message: 'Start time must be a valid ISO date string'
      });
    }
    if (!isValidBookingTime(bookingStartTime)) {
      return res.status(400).json({
        error: 'Invalid booking time',
        message: 'Booking start time must be in the future'
      });
    }
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: 'The specified vehicle does not exist'
      });
    }
    if (!vehicle.isActive) {
      return res.status(400).json({
        error: 'Vehicle unavailable',
        message: 'The specified vehicle is not active'
      });
    }
    const estimatedRideDurationHours = calculateRideDuration(fromPincode, toPincode);
    const bookingEndTime = calculateBookingEndTime(bookingStartTime, estimatedRideDurationHours);
    const conflictingBookings = await Booking.find({
      vehicleId: vehicleId,
      status: 'confirmed',
      $or: [
        {
          startTime: { $lt: bookingEndTime },
          endTime: { $gt: bookingStartTime }
        }
      ]
    });
    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        error: 'Booking conflict',
        message: 'Vehicle is no longer available for the requested time slot',
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking._id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status
        }))
      });
    }
    const booking = new Booking({
      vehicleId,
      fromPincode,
      toPincode,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      customerId,
      estimatedRideDurationHours
    });
    const savedBooking = await booking.save();
    await savedBooking.populate('vehicleId', 'name capacityKg tyres');
    res.status(201).json({
      message: 'Booking created successfully',
      booking: savedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Failed to create booking',
      message: error.message
    });
  }
});
router.get('/', async (req, res) => {
  try {
    const { vehicleId, customerId, status } = req.query;
    let query = {};
    if (vehicleId) query.vehicleId = vehicleId;
    if (customerId) query.customerId = customerId;
    if (status) query.status = status;
    const bookings = await Booking.find(query)
      .populate('vehicleId', 'name capacityKg tyres')
      .sort({ startTime: -1 });
    res.json({
      bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicleId', 'name capacityKg tyres');
    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      });
    }
    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        error: 'Booking already cancelled',
        message: 'This booking has already been cancelled'
      });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot cancel completed booking',
        message: 'Cannot cancel a booking that has already been completed'
      });
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});
module.exports = router;