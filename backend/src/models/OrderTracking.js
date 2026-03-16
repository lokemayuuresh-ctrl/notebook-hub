const mongoose = require('mongoose');

const StatusEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: String,
  at: { type: Date, default: Date.now }
});

const OrderTrackingSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  history: [StatusEntrySchema]
}, { timestamps: true });

module.exports = mongoose.model('OrderTracking', OrderTrackingSchema);
