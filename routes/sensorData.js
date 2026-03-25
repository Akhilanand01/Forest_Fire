const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const SensorData = require('../models/SensorData');

// Stricter rate limiter for the POST (write) endpoint
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many write requests, please slow down.' },
});

// POST /api/data — Store sensor data from IoT device
router.post('/', writeLimiter, async (req, res) => {
  try {
    const { temperature, smoke, flame, humidity, latitude, longitude } = req.body;

    // Basic presence check
    if (
      temperature === undefined ||
      smoke === undefined ||
      flame == null ||
      humidity === undefined ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: temperature, smoke, flame, humidity, latitude, longitude',
      });
    }

    const entry = new SensorData({
      temperature,
      smoke,
      flame: String(flame).toUpperCase(),
      humidity,
      latitude,
      longitude,
    });

    const saved = await entry.save();

    return res.status(201).json({
      success: true,
      message: 'Sensor data stored successfully',
      data: saved,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('POST /api/data error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/data — Retrieve latest 20 records (newest first)
router.get('/', async (req, res) => {
  try {
    const records = await SensorData.find().sort({ createdAt: -1 }).limit(20);
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error('GET /api/data error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
