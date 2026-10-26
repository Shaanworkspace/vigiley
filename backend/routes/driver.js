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

    const since = activeSession ? activeSession.startTime : new Date(Date.now() - 5 * 60 * 1000);
    const recentAlerts = await Alert.find({
      driver: driverId,
      timestamp: { $gte: since },
    })
      .sort({ timestamp: -1 })
      .limit(5);

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

// Per-driver calibration profile (Flaw 2A fix).
// Saved once after the 8-second frontend calibration, reused across sessions.
router.get('/calibration', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('calibration');
    res.json({ calibration: user?.calibration || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/calibration', protect, async (req, res) => {
  try {
    const { earClosed, earLow, marYawn, marHalf, avgEar, avgMar,
      eyesMode, mouthEnabled, leftAvgEar, rightAvgEar, quality } = req.body;

    const num = (v, low, high) =>
      typeof v === 'number' && Number.isFinite(v) && v >= low && v <= high ? v : null;
    const calibration = {
      earClosed: num(earClosed, 0.1, 0.4),
      earLow: num(earLow, 0.1, 0.5),
      marYawn: num(marYawn, 0.2, 1.0),
      marHalf: num(marHalf, 0.1, 0.9),
      avgEar: typeof avgEar === 'number' && Number.isFinite(avgEar) ? avgEar : undefined,
      avgMar: typeof avgMar === 'number' && Number.isFinite(avgMar) ? avgMar : undefined,
      eyesMode: ['both', 'left', 'right', 'none'].includes(eyesMode) ? eyesMode : 'both',
      mouthEnabled: mouthEnabled === false ? false : true,
      leftAvgEar: typeof leftAvgEar === 'number' && Number.isFinite(leftAvgEar) ? leftAvgEar : undefined,
      rightAvgEar: typeof rightAvgEar === 'number' && Number.isFinite(rightAvgEar) ? rightAvgEar : undefined,
      calibratedAt: new Date(),
    };
    if (quality && typeof quality === 'object') {
      const samples = Number.isFinite(quality.samples) ? Math.round(quality.samples) : undefined;
      const faceRatio = typeof quality.faceRatio === 'number' && quality.faceRatio >= 0 && quality.faceRatio <= 1
        ? quality.faceRatio : undefined;
      if (samples !== undefined || faceRatio !== undefined) {
        calibration.quality = {};
        if (samples !== undefined) calibration.quality.samples = samples;
        if (faceRatio !== undefined) calibration.quality.faceRatio = faceRatio;
      }
    }
    if (!calibration.earClosed || !calibration.earLow || !calibration.marYawn || !calibration.marHalf) {
      return res.status(400).json({ message: 'Invalid calibration thresholds' });
    }
    if (calibration.earLow <= calibration.earClosed || calibration.marYawn <= calibration.marHalf) {
      return res.status(400).json({ message: 'Invalid calibration band ordering' });
    }

    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { calibration } },
      { new: true, runValidators: true }
    ).select('calibration');
    res.json({ calibration: user.calibration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/detection', protect, async (req, res) => {  try {
    const {
      status,
      confidence,
      eyeAspectRatio = 0.3,
      mouthAspectRatio = 0.1,
      headPitch = 0,
      headYaw = 0,
      perclos = 0,
    } = req.body;

    const log = await DetectionLog.create({
      driver: req.user._id,
      status,
      confidence,
      eyeAspectRatio,
      mouthAspectRatio,
      headPitch,
      headYaw,
    });

    const activeSession = await DriverSession.findOne({
      driver: req.user._id,
      status: 'active',
    });

    if (activeSession) {
      const prevSDS = activeSession.drowsinessScore || 0;
      const attentionWeights = computeAttentionWeights(
        { eyeAspectRatio, mouthAspectRatio, headPitch, headYaw },
        null
      );

      const sds = computeSDS(prevSDS, { eyeAspectRatio, mouthAspectRatio, headPitch, headYaw }, attentionWeights, new Date());

      const severity = computeSeverity(sds, confidence * 100);
      const recentAlertsForRisk = await Alert.find({
        driver: req.user._id,
        timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      })
        .sort({ timestamp: -1 })
        .limit(10);
      let riskLevel = computeRiskLevel(sds, recentAlertsForRisk);
      const prevRisk = activeSession.riskLevel;
      if (prevRisk === 'critical' && sds > 65) riskLevel = 'critical';
      else if (prevRisk === 'high' && sds > 50) riskLevel = sds > 65 ? 'high' : riskLevel;
      else if (prevRisk === 'medium' && sds > 25) riskLevel = sds > 35 ? riskLevel : 'medium';

      const updateFields = {
        $inc: {
          detectionCount: 1,
          [`${status}Count`]: 1,
        },
        $set: {
          drowsinessScore: Math.round(sds * 10) / 10,
          riskLevel,
          lastSDSUpdate: new Date(),
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

      const confPct = (confidence || 0) * 100;
      const alertThreshold = 8;
      const alertCount = activeSession.totalAlerts || 0;
      const needsCountdown = true;
      const alertStatuses = ['eyes_closed', 'yawning', 'drowsy', 'microsleep', 'high_risk', 'critical'];
      // Only eye close and yawning - distraction removed as per user
      if (alertStatuses.includes(status) && (confPct > alertThreshold || sds > 30)) {
        const alertSeverity =
          confPct > 80 || sds > 85
            ? 'critical'
            : confPct > 60 || sds > 70
              ? 'high'
              : confPct > 40 || sds > 50
                ? 'medium'
                : 'low';
        // Only low with 18-40 won't be suppressed now - user wants >18 alert
        if (true) {
          const typeMap = { yawning: 'yawning', eyes_closed: 'eyes_closed', drowsy: 'drowsiness', microsleep: 'drowsiness', high_risk: 'drowsiness', critical: 'critical' };
          const alertData = {
            driver: req.user._id,
            type: typeMap[status] || 'distraction',
            severity: alertSeverity,
            message:
              sds > alertThreshold
                ? `SDS threshold exceeded: ${Math.round(sds)}% — possible drowsiness`
                : `${status.replace('_', ' ')} detected with ${confPct.toFixed(0)}% confidence`,
          };

          const dedupWindow = status === 'yawning' ? 5000 : alertSeverity === 'critical' ? 3000 : 10000;
          const recentPending = await Alert.findOne({
            driver: req.user._id,
            isAcknowledged: false,
            isEscalated: false,
            timestamp: { $gte: new Date(Date.now() - dedupWindow) },
          });

          if (!recentPending) {
            const alert = await Alert.create(alertData);

            updateFields.$inc.totalAlerts = 1;
            updateFields.$inc[`${alertSeverity}Alerts`] = 1;

            if (req.io) {
              req.io.to(`driver-${req.user._id}`).emit('warning', {
                ...alert.toObject(),
                sds: Math.round(sds * 10) / 10,
                needsCountdown,
                alertCount: alertCount + 1,
              });
            }
          }
        }
      }

      const sessionUpdate = {
        $set: {
          drowsinessScore: updateFields.$set.drowsinessScore,
          riskLevel: updateFields.$set.riskLevel,
          lastSDSUpdate: updateFields.$set.lastSDSUpdate,
          peakDrowsinessScore: updateFields.$set.peakDrowsinessScore || activeSession.peakDrowsinessScore,
        },
        $inc: updateFields.$inc,
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
