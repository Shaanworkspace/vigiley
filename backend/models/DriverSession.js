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
    drowsinessScore: { type: Number, default: 0, min: 0, max: 100 },
    peakDrowsinessScore: { type: Number, default: 0, min: 0, max: 100 },
    sdsHistory: [{ score: Number, timestamp: Date }],
    lastSDSUpdate: { type: Date },
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

driverSessionSchema.index({ driver: 1, startTime: -1 });
driverSessionSchema.index({ status: 1 });
driverSessionSchema.index({ startTime: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('DriverSession', driverSessionSchema);
