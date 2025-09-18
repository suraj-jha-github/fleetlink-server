const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const vehicleRoutes = require('./routes/vehicles');
const bookingRoutes = require('./routes/bookings');
const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'FleetLink API is running' });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`FleetLink API server running on port ${PORT}`);
});
module.exports = app;