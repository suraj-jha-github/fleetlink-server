const express = require('express');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { calculateRideDuration, calculateBookingEndTime, timeRangesOverlap } = require('../utils/rideUtils');
const router = express.Router();
router.post('/', async (req, res) => {
  try {
    const { name, capacityKg, tyres } = req.body;
    if (!name || !capacityKg || !tyres) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, capacityKg, and tyres are required'
      });
    }
    if (typeof capacityKg !== 'number' || capacityKg <= 0) {
      return res.status(400).json({
        error: 'Invalid capacity',
        message: 'Capacity must be a positive number'
      });
    }
    if (typeof tyres !== 'number' || tyres < 2) {
      return res.status(400).json({
        error: 'Invalid tyres count',
        message: 'Tyres must be a number greater than or equal to 2'
      });
    }
    const vehicle = new Vehicle({
      name: name.trim(),
      capacityKg,
      tyres
    });
    const savedVehicle = await vehicle.save();
    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle: savedVehicle
    });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({
      error: 'Failed to add vehicle',
      message: error.message
    });
  }
});
router.get('/available', async (req, res) => {
  try {
    const { capacityRequired, fromPincode, toPincode, startTime } = req.query;
    if (!capacityRequired || !fromPincode || !toPincode || !startTime) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'capacityRequired, fromPincode, toPincode, and startTime are required'
      });
    }
    const capacity = parseFloat(capacityRequired);
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({
        error: 'Invalid capacity',
        message: 'Capacity must be a positive number'
      });
    }
    const bookingStartTime = new Date(startTime);
    if (isNaN(bookingStartTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid start time',
        message: 'Start time must be a valid ISO date string'
      });
    }
    const estimatedRideDurationHours = calculateRideDuration(fromPincode, toPincode);
    const bookingEndTime = calculateBookingEndTime(bookingStartTime, estimatedRideDurationHours);
    const vehiclesWithCapacity = await Vehicle.find({
      capacityKg: { $gte: capacity },
      isActive: true
    });
    const availableVehicles = [];
    for (const vehicle of vehiclesWithCapacity) {
      const conflictingBookings = await Booking.find({
        vehicleId: vehicle._id,
        status: 'confirmed',
        $or: [
          {
            startTime: { $lt: bookingEndTime },
            endTime: { $gt: bookingStartTime }
          }
        ]
      });
      if (conflictingBookings.length === 0) {
        availableVehicles.push({
          _id: vehicle._id,
          name: vehicle.name,
          capacityKg: vehicle.capacityKg,
          tyres: vehicle.tyres,
          estimatedRideDurationHours
        });
      }
    }
    res.json({
      availableVehicles,
      searchCriteria: {
        capacityRequired: capacity,
        fromPincode,
        toPincode,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        estimatedRideDurationHours
      }
    });
  } catch (error) {
    console.error('Error finding available vehicles:', error);
    res.status(500).json({
      error: 'Failed to find available vehicles',
      message: error.message
    });
  }
});
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json({
      vehicles,
      count: vehicles.length
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicles',
      message: error.message
    });
  }
});
module.exports = router;