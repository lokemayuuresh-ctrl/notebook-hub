const express = require('express');
const router = express.Router();
const OrderTracking = require('../models/OrderTracking');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// GET /api/ordertrackings/:orderId
router.get('/:orderId', auth(true), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check permissions
    if (req.user.role !== 'admin') {
      if (req.user.role === 'buyer' && order.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this tracking' });
      }
      if (req.user.role === 'seller') {
        // Check if seller has products in this order
        const Product = require('../models/Product');
        const sellerProducts = await Product.find({ sellerId: req.user.id }).select('_id');
        const productIds = sellerProducts.map(p => p._id.toString());
        const hasProduct = order.items.some(item => productIds.includes(item.product.toString()));
        if (!hasProduct) {
          return res.status(403).json({ message: 'Not authorized to view this tracking' });
        }
      }
    }

    const tracking = await OrderTracking.findOne({ order: req.params.orderId })
      .populate('order', 'status total user');
    
    if (!tracking) {
      // Return empty tracking if not found
      return res.json({ order: req.params.orderId, history: [] });
    }
    
    res.json(tracking);
  } catch (err) {
    console.error('Get tracking error', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ordertrackings (create or add entry - seller/admin only)
router.post('/', auth(true), async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only sellers and admins can add tracking entries' });
    }

    const { order, status, note } = req.body;

    if (!order || !status) {
      return res.status(400).json({ message: 'Order and status are required' });
    }

    // Verify order exists and seller has permission
    const orderDoc = await Order.findById(order).populate('items.product');
    if (!orderDoc) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role === 'seller') {
      // Check if seller has products in this order
      const Product = require('../models/Product');
      const sellerProducts = await Product.find({ sellerId: req.user.id }).select('_id');
      const productIds = sellerProducts.map(p => p._id.toString());
      const hasProduct = orderDoc.items.some(item => 
        productIds.includes(item.product._id ? item.product._id.toString() : item.product.toString())
      );
      if (!hasProduct) {
        return res.status(403).json({ message: 'Not authorized to track this order' });
      }
    }

    let tracking = await OrderTracking.findOne({ order });
    if (!tracking) {
      tracking = new OrderTracking({ 
        order, 
        history: [{ status, note: note || '', at: new Date() }] 
      });
    } else {
      tracking.history.push({ status, note: note || '', at: new Date() });
    }
    
    const saved = await tracking.save();
    
    // Notify buyer about tracking update
    const Notification = require('../models/Notification');
    await Notification.create({
      user: orderDoc.user,
      message: `Order #${order} tracking updated: ${status}${note ? ' - ' + note : ''}`,
      type: 'order_update',
      order: order
    });

    // Realtime notification
    try {
      const { getIo } = require('../lib/realtime');
      const io = getIo();
      if (io) {
        io.to(String(orderDoc.user)).emit('notification', {
          user: orderDoc.user,
          message: `Order #${order} tracking updated: ${status}`,
          order: order
        });
      }
    } catch (e) {
      console.error('Realtime notify failed', e.message);
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error('Create tracking error', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
