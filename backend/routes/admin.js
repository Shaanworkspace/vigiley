const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Alert = require('../models/Alert');
const DriverSession = require('../models/DriverSession');
const DetectionLog = require('../models/DetectionLog');

const router = express.Router();

router.get('/drivers', protect, adminOnly, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).sort({ createdAt: -1 });

    const enrichedDrivers = await Promise.all(
      drivers.map(async (driver) => {
        const activeSession = await DriverSession.findOne({
          driver: driver._id,
          status: 'active',
        });

        const recentAlerts = await Alert.countDocuments({
          driver: driver._id,
          isAcknowledged: false,
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        return {
          ...driver.toObject(),
          activeSession: !!activeSession,
          currentSDS: activeSession?.drowsinessScore || 0,
          riskLevel: activeSession?.riskLevel || 'inactive',
          unacknowledgedAlerts: recentAlerts,
        };
      })
    );

    res.json({ drivers: enrichedDrivers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/drivers/:id', protect, adminOnly, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const activeSession = await DriverSession.findOne({
      driver: driver._id,
      status: 'active',
    });

    const recentAlerts = await Alert.find({ driver: driver._id })
      .sort({ timestamp: -1 })
      .limit(20);

    const stats = await DetectionLog.aggregate([
      { $match: { driver: driver._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const sessionHistory = await DriverSession.find({ driver: driver._id })
      .sort({ startTime: -1 })
      .limit(30)
      .select('startTime endTime duration drowsinessScore riskLevel totalAlerts');

    const sdsTrend = activeSession?.sdsHistory?.slice(-50) || [];

    res.json({ driver, activeSession, recentAlerts, stats, sessionHistory, sdsTrend });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/alerts', protect, adminOnly, async (req, res) => {
  try {
    const { status, severity, startDate, endDate } = req.query;
    const filter = {};

    if (status === 'acknowledged') filter.isAcknowledged = true;
    else if (status === 'unacknowledged') filter.isAcknowledged = false;

    if (severity) filter.severity = severity;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const alerts = await Alert.find(filter)
      .populate('driver', 'name email phone vehicleNumber')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/alerts/:id/acknowledge', protect, adminOnly, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user._id,
      },
      { new: true }
    );

    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const activeDrivers = await User.countDocuments({ role: 'driver', isActive: true });
    const totalAlerts = await Alert.countDocuments();
    const unacknowledgedAlerts = await Alert.countDocuments({ isAcknowledged: false });
    const activeSessions = await DriverSession.countDocuments({ status: 'active' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayAlerts = await Alert.countDocuments({
      timestamp: { $gte: todayStart },
    });

    const alertsBySeverity = await Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const riskDistribution = await DriverSession.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
    ]);

    const highRiskDrivers = await DriverSession.find({
      status: 'active',
      riskLevel: { $in: ['high', 'critical'] },
    })
      .populate('driver', 'name email vehicleNumber')
      .sort({ drowsinessScore: -1 })
      .limit(10)
      .select('driver drowsinessScore riskLevel totalAlerts');

    const hourlyAlertTrend = await Alert.aggregate([
      { $match: { timestamp: { $gte: todayStart } } },
      { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const avgSessionSDS = await DriverSession.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgSDS: { $avg: '$drowsinessScore' }, total: { $sum: 1 } } },
    ]);

    res.json({
      totalDrivers,
      activeDrivers,
      totalAlerts,
      unacknowledgedAlerts,
      activeSessions,
      todayAlerts,
      alertsBySeverity,
      riskDistribution,
      highRiskDrivers,
      hourlyAlertTrend,
      avgSessionSDS: avgSessionSDS[0] || { avgSDS: 0, total: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
