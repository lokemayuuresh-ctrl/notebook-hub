const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  image: String,
  category: { type: String, index: true },
  stock: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
  sellerName: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

ProductSchema.index({ category: 1, active: 1 });
ProductSchema.index({ sellerId: 1, active: 1 });

module.exports = mongoose.model('Product', ProductSchema);
