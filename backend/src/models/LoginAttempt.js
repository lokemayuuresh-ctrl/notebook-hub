const mongoose = require('mongoose');

const LoginAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  email: { type: String, required: false },
  ip: { type: String, required: false },
  userAgent: { type: String, required: false },
  success: { type: Boolean, required: true },
  reason: { type: String, required: false }
}, { timestamps: true });

LoginAttemptSchema.index({ email: 1 });
LoginAttemptSchema.index({ user: 1 });

module.exports = mongoose.model('LoginAttempt', LoginAttemptSchema);
