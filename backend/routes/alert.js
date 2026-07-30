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

module.exports = router;
