const express = require('express');
const { protect } = require('../middleware/auth');
const DetectionLog = require('../models/DetectionLog');
const Alert = require('../models/Alert');
const DriverSession = require('../models/DriverSession');
const {
  computeSDS,
  computeAttentionWeights,
  computeSeverity,
  computeRiskLevel,
} = require('../utils/scoring');

const router = express.Router();

router.get('/dashboard', protect, async (req, res) => {
  try {
    const driverId = req.user._id;

    const activeSession = await DriverSession.findOne({
      driver: driverId,
      status: 'active',
    }).sort({ startTime: -1 });

    const recentAlerts = await Alert.find({ driver: driverId })
      .sort({ timestamp: -1 })
      .limit(10);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayLogs = await DetectionLog.countDocuments({
      driver: driverId,
      timestamp: { $gte: todayStart },
    });

    const todayDrowsyEvents = await DetectionLog.countDocuments({
      driver: driverId,
      status: { $in: ['drowsy', 'eyes_closed'] },
      timestamp: { $gte: todayStart },
    });

    const hourlyBreakdown = await DetectionLog.aggregate([
      { $match: { driver: driverId, timestamp: { $gte: todayStart } } },
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

    res.json({
      activeSession,
      recentAlerts,
      todayLogs,
      todayDrowsyEvents,
      hourlyBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/detection', protect, async (req, res) => {
  try {
    const {
      status,
      confidence,
      eyeAspectRatio = 0.3,
      mouthAspectRatio = 0.1,
      headPitch = 0,
      headYaw = 0,
      imageUrl,
    } = req.body;

    const log = await DetectionLog.create({
      driver: req.user._id,
      status,
      confidence,
      eyeAspectRatio,
      mouthAspectRatio,
      headPitch,
      headYaw,
      imageUrl,
    });

    const activeSession = await DriverSession.findOne({
      driver: req.user._id,
      status: 'active',
    });

    if (activeSession) {
      const prevSDS = activeSession.drowsinessScore || 0;
      const prevWeights = activeSession._attentionWeights || null;
      const attentionWeights = computeAttentionWeights(
        { eyeAspectRatio, mouthAspectRatio, headPitch, headYaw },
        prevWeights
      );

      const sds = computeSDS(prevSDS, { eyeAspectRatio, mouthAspectRatio, headPitch, headYaw }, attentionWeights, new Date());

      const severity = computeSeverity(sds, confidence);
      const riskLevel = computeRiskLevel(sds, []);

      const updateFields = {
        $inc: {
          detectionCount: 1,
          [`${status}Count`]: 1,
        },
        $set: {
          drowsinessScore: Math.round(sds * 10) / 10,
          riskLevel,
          lastSDSUpdate: new Date(),
          _attentionWeights: attentionWeights,
        },
        $push: {
          sdsHistory: {
            $each: [{ score: Math.round(sds * 10) / 10, timestamp: new Date() }],
            $slice: -100,
          },
        },
      };

      if (sds > (activeSession.peakDrowsinessScore || 0)) {
        updateFields.$set.peakDrowsinessScore = Math.round(sds * 10) / 10;
      }

      const alertStatuses = ['drowsy', 'eyes_closed', 'yawning', 'microsleep', 'high_risk', 'critical'];
      const confPct = (confidence || 0) * 100;
      const nonDrowsyThreshold = 30;
      if (alertStatuses.includes(status) || sds > nonDrowsyThreshold) {
        const alertSeverity =
          status === 'critical' || sds > 85
            ? 'critical'
            : sds > 70 || confPct > 80
              ? 'high'
              : sds > 50 || confPct > 60
                ? 'medium'
                : 'low';

        if (alertStatuses.includes(status) || alertSeverity !== 'low') {
          const typeMap = { yawning: 'yawning', eyes_closed: 'eyes_closed', drowsy: 'drowsiness', microsleep: 'drowsiness', high_risk: 'drowsiness', critical: 'critical' };
          const alertData = {
            driver: req.user._id,
            type: typeMap[status] || 'distraction',
            severity: alertSeverity,
            message:
              sds > nonDrowsyThreshold
                ? `SDS threshold exceeded: ${Math.round(sds)}% — possible drowsiness`
                : `${status.replace('_', ' ')} detected with ${confPct.toFixed(0)}% confidence`,
          };

          const alert = await Alert.create(alertData);

          updateFields.$inc.totalAlerts = 1;
          updateFields.$inc[`${alertSeverity}Alerts`] = 1;

          if (req.io) {
            req.io.to('admin-room').emit('alert', {
              ...alert.toObject(),
              driver: req.user,
              sds: Math.round(sds * 10) / 10,
              riskLevel,
            });
            req.io.to(`driver-${req.user._id}`).emit('warning', {
              ...alert.toObject(),
              sds: Math.round(sds * 10) / 10,
            });
          }
        }
      }

      const incFields = {};
      if (updateFields.$inc.totalAlerts) incFields.totalAlerts = updateFields.$inc.totalAlerts;
      if (updateFields.$inc[`${updateFields.$set?.riskLevel || 'low'}Alerts`]) {
        const severityKey = `${updateFields.$set?.riskLevel || 'low'}Alerts`;
        incFields[severityKey] = updateFields.$inc[severityKey];
      }
      incFields.detectionCount = 1;
      incFields[`${status}Count`] = 1;

      const sessionUpdate = {
        $set: {
          drowsinessScore: updateFields.$set.drowsinessScore,
          riskLevel: updateFields.$set.riskLevel,
          lastSDSUpdate: updateFields.$set.lastSDSUpdate,
          peakDrowsinessScore: updateFields.$set.peakDrowsinessScore || activeSession.peakDrowsinessScore,
        },
        $inc: incFields,
        $push: updateFields.$push,
      };

      await DriverSession.findByIdAndUpdate(activeSession._id, sessionUpdate);
    }

    res.status(201).json({ log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/session/start', protect, async (req, res) => {
  try {
    const existingSession = await DriverSession.findOne({
      driver: req.user._id,
      status: 'active',
    });

    if (existingSession) {
      return res.json({ session: existingSession });
    }

    const session = await DriverSession.create({
      driver: req.user._id,
    });

    if (req.io) {
      req.io.to('admin-room').emit('session-start', {
        driver: req.user,
        sessionId: session._id,
        startTime: session.startTime,
      });
    }

    res.status(201).json({ session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/session/end', protect, async (req, res) => {
  try {
    const session = await DriverSession.findOneAndUpdate(
      { driver: req.user._id, status: 'active' },
      { status: 'completed', endTime: new Date() },
      { new: true }
    );

    if (session) {
      const diffMs = session.endTime - session.startTime;
      session.duration = Math.floor(diffMs / 1000);
      await session.save();

      if (req.io) {
        req.io.to('admin-room').emit('session-end', {
          driver: req.user,
          sessionId: session._id,
          duration: session.duration,
          avgSDS: session.drowsinessScore,
          totalAlerts: session.totalAlerts,
          riskLevel: session.riskLevel,
        });
      }
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await DriverSession.find({ driver: req.user._id })
      .sort({ startTime: -1 })
      .limit(20);

    const stats = sessions.reduce(
      (acc, s) => {
        acc.totalDuration += s.duration || 0;
        acc.totalAlerts += s.totalAlerts || 0;
        acc.criticalSessions += s.riskLevel === 'critical' ? 1 : 0;
        acc.avgSDS += s.drowsinessScore || 0;
        return acc;
      },
      { totalDuration: 0, totalAlerts: 0, criticalSessions: 0, avgSDS: 0 }
    );

    if (sessions.length > 0) {
      stats.avgSDS = Math.round((stats.avgSDS / sessions.length) * 10) / 10;
    }

    res.json({ sessions, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sds-trend', protect, async (req, res) => {
  try {
    const session = await DriverSession.findOne({
      driver: req.user._id,
      status: 'active',
    }).sort({ startTime: -1 });

    if (!session || !session.sdsHistory || session.sdsHistory.length === 0) {
      return res.json({ sdsHistory: [], currentSDS: 0, riskLevel: 'low' });
    }

    res.json({
      sdsHistory: session.sdsHistory,
      currentSDS: session.drowsinessScore,
      peakSDS: session.peakDrowsinessScore,
      riskLevel: session.riskLevel,
      totalAlerts: session.totalAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
