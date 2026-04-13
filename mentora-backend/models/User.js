const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    notifications: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true },
    dataSync: { type: Boolean, default: true },
    privacyMode: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    sex: { type: String, default: '' },
    height: { type: Number, default: 165 },
    weight: { type: Number, default: 65 },
    stepsGoal: { type: Number, default: 8000 },
    lastPeriodDay: { type: String, default: null },
    periodDuration: { type: Number, default: 5 },
    cycleLength: { type: Number, default: 28 },
    onboardingCompleted: { type: Boolean, default: false },
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
