const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema(
  {
    temperature: {
      type: Number,
      required: [true, 'Temperature is required'],
      min: [-50, 'Temperature cannot be below -50°C'],
      max: [100, 'Temperature cannot exceed 100°C'],
    },
    smoke: {
      type: Number,
      required: [true, 'Smoke level is required'],
      min: [0, 'Smoke level cannot be negative'],
    },
    flame: {
      type: String,
      required: [true, 'Flame status is required'],
      enum: {
        values: ['YES', 'NO'],
        message: 'Flame must be either YES or NO',
      },
      uppercase: true,
    },
    humidity: {
      type: Number,
      required: [true, 'Humidity is required'],
      min: [0, 'Humidity cannot be below 0%'],
      max: [100, 'Humidity cannot exceed 100%'],
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SensorData', sensorDataSchema);
