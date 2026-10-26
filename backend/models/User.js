const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['driver', 'admin'], default: 'driver' },
    phone: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String, default: '' },
    // Per-driver personalized face calibration (Flaw 2A fix).
    // Saved once after the 8-second frontend calibration, reused on every login.
    calibration: {
      earClosed: { type: Number, min: 0.1, max: 0.4 },
      earLow: { type: Number, min: 0.1, max: 0.5 },
      marYawn: { type: Number, min: 0.2, max: 1.0 },
      marHalf: { type: Number, min: 0.1, max: 0.9 },
      avgEar: { type: Number },
      avgMar: { type: Number },
      // Impairment-aware gating (medical edge cases).
      // eyesMode: 'both' | 'left' | 'right' | 'none' (single healthy eye or none).
      // mouthEnabled: false = mouth baseline permanently open (medical) —
      // yawning detection disabled so no false yawns.
      eyesMode: { type: String, enum: ['both', 'left', 'right', 'none'], default: 'both' },
      mouthEnabled: { type: Boolean, default: true },
      leftAvgEar: { type: Number },
      rightAvgEar: { type: Number },
      quality: {
        samples: { type: Number },
        faceRatio: { type: Number },
      },
      calibratedAt: { type: Date },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
