const mongoose = require('mongoose');
const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vehicle name is required'],
    trim: true,
    maxlength: [100, 'Vehicle name cannot exceed 100 characters']
  },
  capacityKg: {
    type: Number,
    required: [true, 'Vehicle capacity is required'],
    min: [1, 'Capacity must be at least 1 kg'],
    max: [50000, 'Capacity cannot exceed 50,000 kg']
  },
  tyres: {
    type: Number,
    required: [true, 'Number of tyres is required'],
    min: [2, 'Vehicle must have at least 2 tyres'],
    max: [22, 'Vehicle cannot have more than 22 tyres']
  },
  isActive: {
    type: Boolean,
    default: true
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
vehicleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
module.exports = mongoose.model('Vehicle', vehicleSchema);