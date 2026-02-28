const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order_update', 'new_order', 'general'], default: 'general' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
