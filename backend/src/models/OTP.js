const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: String,
    phone: String,
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // 10 minutes expiry
}, { timestamps: true });

module.exports = mongoose.model('OTP', OTPSchema);
