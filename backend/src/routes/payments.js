const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// POST /api/payments/process - Process payment for an order
router.post('/process', auth(true), async (req, res) => {
  try {
    const { orderId, paymentMethod, amount } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ message: 'Order ID and payment method are required' });
    }

    console.log('Processing payment for order:', orderId, 'method:', paymentMethod);
    const order = await Order.findById(orderId)
      .populate('user', '_id name email')
      .populate('items.product');

    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized (buyer or admin)
    // Handle both populated and non-populated user objects
    const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
    const isBuyer = orderUserId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isAdmin) {
      console.error('Payment authorization failed:', {
        orderUserId,
        reqUserId: req.user.id,
        userRole: req.user.role,
        orderUser: order.user
      });
      return res.status(403).json({ message: 'Not authorized to process payment for this order' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Payment can only be processed for delivered orders' });
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    // Verify amount matches order total
    if (amount && Math.abs(amount - order.total) > 0.01) {
      return res.status(400).json({ message: 'Payment amount does not match order total' });
    }

    // Get buyer ID (handle both populated and non-populated user)
    const buyerId = order.user._id ? order.user._id : order.user;

    // Process payment based on method
    if (paymentMethod === 'razorpay' || paymentMethod === 'online') {
      // Dummy online payment processing
      // In real implementation, this would integrate with Razorpay/PayPal/etc.
      const paymentResult = await processDummyOnlinePayment(order, amount || order.total);

      if (paymentResult.success) {
        // Update order payment status
        order.paymentStatus = 'paid';
        await order.save();

        // Notify buyer
        await Notification.create({
          user: buyerId,
          message: `✅ Payment of ₹${order.total.toLocaleString('en-IN')} for order #${order._id} has been processed successfully!`,
          type: 'payment',
          order: order._id
        });

        // Notify seller
        const sellerIds = new Set();
        for (const item of order.items) {
          const product = item.product;
          if (product && product.sellerId) {
            sellerIds.add(product.sellerId.toString());
          }
        }
        for (const sellerId of sellerIds) {
          await Notification.create({
            user: sellerId,
            message: `💰 Payment received for order #${order._id} - ₹${order.total.toLocaleString('en-IN')}`,
            type: 'payment',
            order: order._id
          });
        }

        // Realtime notifications
        try {
          const { getIo } = require('../lib/realtime');
          const io = getIo();
          if (io) {
            io.to(String(buyerId)).emit('notification', {
              user: buyerId,
              message: `✅ Payment processed successfully for order #${order._id}`,
              order: order._id
            });

            for (const sellerId of sellerIds) {
              io.to(sellerId).emit('notification', {
                user: sellerId,
                message: `💰 Payment received for order #${order._id}`,
                order: order._id
              });
            }
          }
        } catch (e) {
          console.error('Realtime notification failed', e.message);
        }

        res.json({
          success: true,
          message: 'Payment processed successfully',
          paymentId: paymentResult.paymentId,
          order: order
        });
      } else {
        res.status(400).json({ message: paymentResult.message || 'Payment processing failed' });
      }
    } else if (paymentMethod === 'cod' || paymentMethod === 'cash') {
      // Cash on Delivery - mark as paid
      order.paymentStatus = 'paid';
      await order.save();

      // Notify buyer
      await Notification.create({
        user: buyerId,
        message: `✅ Cash payment of ₹${order.total.toLocaleString('en-IN')} for order #${order._id} has been confirmed!`,
        type: 'payment',
        order: order._id
      });

      // Notify seller
      const sellerIds = new Set();
      for (const item of order.items) {
        const product = item.product;
        if (product && product.sellerId) {
          sellerIds.add(product.sellerId.toString());
        }
      }
      for (const sellerId of sellerIds) {
        await Notification.create({
          user: sellerId,
          message: `💰 Cash payment received for order #${order._id} - ₹${order.total.toLocaleString('en-IN')}`,
          type: 'payment',
          order: order._id
        });
      }

      // Realtime notifications
      try {
        const { getIo } = require('../lib/realtime');
        const io = getIo();
        if (io) {
          io.to(String(buyerId)).emit('notification', {
            user: buyerId,
            message: `✅ Cash payment confirmed for order #${order._id}`,
            order: order._id
          });

          for (const sellerId of sellerIds) {
            io.to(sellerId).emit('notification', {
              user: sellerId,
              message: `💰 Cash payment received for order #${order._id}`,
              order: order._id
            });
          }
        }
      } catch (e) {
        console.error('Realtime notification failed', e.message);
      }

      res.json({
        success: true,
        message: 'Cash payment confirmed',
        order: order
      });
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
  } catch (err) {
    console.error('Process payment error', err);
    res.status(500).json({ message: err.message || 'Failed to process payment' });
  }
});

// Dummy online payment processing function
async function processDummyOnlinePayment(order, amount) {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate 95% success rate (for testing)
  const success = Math.random() > 0.05;

  if (success) {
    return {
      success: true,
      paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      amount: amount,
      timestamp: new Date()
    };
  } else {
    return {
      success: false,
      message: 'Payment processing failed. Please try again.'
    };
  }
}

// GET /api/payments/order/:orderId - Get payment status for an order
router.get('/order/:orderId', auth(true), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email')
      .populate('items.product', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization - handle both populated and non-populated user
    const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
    if (req.user.role !== 'admin' && orderUserId !== req.user.id) {
      // Check if seller
      if (req.user.role === 'seller') {
        const hasProduct = order.items.some(item => {
          const product = item.product;
          return product && product.sellerId && product.sellerId.toString() === req.user.id;
        });
        if (!hasProduct) {
          return res.status(403).json({ message: 'Not authorized' });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      amount: order.total,
      status: order.status,
      canPay: order.status === 'delivered' && order.paymentStatus === 'pending'
    });
  } catch (err) {
    console.error('Get payment status error', err);
    res.status(500).json({ message: err.message || 'Failed to get payment status' });
  }
});

module.exports = router;
