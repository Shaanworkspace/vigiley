const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const DetectionLog = require('../models/DetectionLog');
const Alert = require('../models/Alert');
const DriverSession = require('../models/DriverSession');
const User = require('../models/User');

const router = express.Router();

router.get('/summary', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, driverId } = req.query;
    const matchFilter = {};

    if (startDate || endDate) {
      matchFilter.timestamp = {};
      if (startDate) matchFilter.timestamp.$gte = new Date(startDate);
      if (endDate) matchFilter.timestamp.$lte = new Date(endDate);
    }
    if (driverId) matchFilter.driver = driverId;

    const statusDistribution = await DetectionLog.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const hourlyTrend = await DetectionLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          total: { $sum: 1 },
          drowsy: {
            $sum: { $cond: [{ $in: ['$status', ['drowsy', 'eyes_closed']] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const alertsBySeverity = await Alert.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const topDrivers = await DetectionLog.aggregate([
      { $match: { ...matchFilter, status: { $in: ['drowsy', 'eyes_closed'] } } },
      { $group: { _id: '$driver', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driverInfo',
        },
      },
      { $unwind: '$driverInfo' },
      {
        $project: {
          name: '$driverInfo.name',
          email: '$driverInfo.email',
          drowsyEvents: '$count',
        },
      },
    ]);

    res.json({ statusDistribution, hourlyTrend, alertsBySeverity, topDrivers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/driver/:id', protect, async (req, res) => {
  try {
    if (req.user.role === 'driver' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const sessions = await DriverSession.find({ driver: req.params.id })
      .sort({ startTime: -1 })
      .limit(30);

    const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalAlerts = sessions.reduce((acc, s) => acc + (s.totalAlerts || 0), 0);
    const avgDrowsinessScore =
      sessions.length > 0
        ? sessions.reduce((acc, s) => acc + (s.drowsinessScore || 0), 0) / sessions.length
        : 0;

    res.json({ sessions, totalDuration, totalAlerts, avgDrowsinessScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
