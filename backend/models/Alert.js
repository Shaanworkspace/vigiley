const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['drowsiness', 'eyes_closed', 'yawning', 'distraction', 'critical'],
      required: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    message: { type: String, required: true },
    isAcknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

alertSchema.index({ driver: 1, timestamp: -1 });
alertSchema.index({ isAcknowledged: 1 });

module.exports = mongoose.model('Alert', alertSchema);
