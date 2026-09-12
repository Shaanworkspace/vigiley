const mongoose = require('mongoose');

const detectionLogSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['normal', 'yawning', 'eyes_closed', 'drowsy', 'distracted', 'awake', 'heavy_eyelids', 'mouth_open', 'microsleep', 'high_risk', 'critical', 'no_face'],
      required: true,
    },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    eyeAspectRatio: { type: Number, default: 0 },
    mouthAspectRatio: { type: Number, default: 0 },
    headPitch: { type: Number, default: 0 },
    headYaw: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

detectionLogSchema.index({ driver: 1, timestamp: -1 });
detectionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('DetectionLog', detectionLogSchema);
