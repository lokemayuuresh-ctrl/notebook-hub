const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  subtotal: { type: Number, required: true, min: 0 },
  gst: { type: Number, default: 0, min: 0 },
  deliveryCharge: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  shippingAddress: { type: String, required: true },
  shippingCity: String, // City from shipping address for delivery charge calculation
  buyerPhone: String,
  paymentMethod: {
    type: String,
    enum: ['cod', 'razorpay'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  // Track which seller this order is for (for multi-seller orders, we'll group by seller)
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  paymentMethod: { type: String, required: true, enum: ['cod', 'razorpay'], default: 'cod' },
  // Shipping and delivery information
  shippingDate: Date, // This field was present in the original and not explicitly removed by the edit, so it remains.
  estimatedDelivery: Date,
  deliveryDate: Date,
  trackingInfo: String,
  deliveryOTP: String
}, { timestamps: true });

OrderSchema.index({ user: 1, status: 1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
