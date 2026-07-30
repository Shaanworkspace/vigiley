const mongoose = require('mongoose');

const driverSessionSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'interrupted'],
      default: 'active',
    },
    totalAlerts: { type: Number, default: 0 },
    criticalAlerts: { type: Number, default: 0 },
    highAlerts: { type: Number, default: 0 },
    mediumAlerts: { type: Number, default: 0 },
    lowAlerts: { type: Number, default: 0 },
    avgEyeAspectRatio: { type: Number, default: 0 },
    avgMouthAspectRatio: { type: Number, default: 0 },
    avgHeadPitch: { type: Number, default: 0 },
    avgHeadYaw: { type: Number, default: 0 },
    drowsinessScore: { type: Number, default: 0, min: 0, max: 100 },
    peakDrowsinessScore: { type: Number, default: 0, min: 0, max: 100 },
    sdsHistory: [{ score: Number, timestamp: Date }],
    temporalDecayFactor: { type: Number, default: 0.95 },
    lastSDSUpdate: { type: Date },
    distanceCovered: { type: Number, default: 0 },
    detectionCount: { type: Number, default: 0 },
    normalCount: { type: Number, default: 0 },
    yawningCount: { type: Number, default: 0 },
    eyesClosedCount: { type: Number, default: 0 },
    drowsyCount: { type: Number, default: 0 },
    distractedCount: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DriverSession', driverSessionSchema);
