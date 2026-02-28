const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: String,
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  phone: { type: String, index: true, sparse: true },
  phoneVerified: { type: Boolean, default: false },
  address: String,
  city: String, // City for delivery charge calculation
  district: String,
  state: String,
  pinCode: String,
  deleted: { type: Boolean, default: false },
  // Seller-specific fields
  companyName: String,
  shopName: String,
  gstNumber: String,
  companyAddress: String,
  // Track user activity
  lastActive: { type: Date, default: Date.now },
  // Google Auth
  googleId: { type: String, unique: true, sparse: true },
  // Verification
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Exclude deleted users by default on find queries
UserSchema.pre(/^find/, function (next) {
  this.where({ deleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('User', UserSchema);
