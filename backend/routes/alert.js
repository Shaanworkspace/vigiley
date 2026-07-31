const express = require('express');
const { protect } = require('../middleware/auth');
const Alert = require('../models/Alert');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'driver') {
      filter.driver = req.user._id;
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

router.put('/:id/acknowledge', protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (req.user.role === 'driver' && alert.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    alert.isAcknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.user._id;
    await alert.save();

    res.json({ alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/escalate', protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('driver', 'name email phone vehicleNumber');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (req.user.role === 'driver' && alert.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!alert.isAcknowledged) {
      alert.isEscalated = true;
      alert.escalatedAt = new Date();
      await alert.save();
    }

    const DriverSession = require('../models/DriverSession');
    const activeSession = await DriverSession.findOne({
      driver: alert.driver._id,
      status: 'active',
    });

    if (req.io) {
      req.io.to('admin-room').emit('alert', {
        ...alert.toObject(),
        driver: alert.driver,
        sds: activeSession?.drowsinessScore || 0,
        riskLevel: activeSession?.riskLevel || 'low',
      });
    }

    res.json({ alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
