const mongoose = require('mongoose');

const appStateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    profile: { type: mongoose.Schema.Types.Mixed, default: {} },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    doctors: { type: mongoose.Schema.Types.Mixed, default: {} },
    reminders: { type: mongoose.Schema.Types.Mixed, default: {} },
    journal: { type: mongoose.Schema.Types.Mixed, default: {} },
    health: { type: mongoose.Schema.Types.Mixed, default: {} },
    chat: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AppState || mongoose.model('AppState', appStateSchema);
