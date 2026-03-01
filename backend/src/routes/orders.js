const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const OrderTracking = require('../models/OrderTracking');
const Notification = require('../models/Notification');
const { sendEmailOTP, sendInvoiceEmail, sendStatusUpdateEmail } = require('../services/email.service');
const { generateInvoicePDF } = require('../lib/invoiceGenerator');
const { getIo } = require('../lib/realtime');

// GET /api/orders - Get all orders (admin) or user's orders (buyer/seller)
router.get('/', auth(false), async (req, res) => {
  try {
    const { sendInvoiceEmail } = require('../services/email.service');
    let query = {};

    // If user is authenticated, filter by role
    if (req.user) {
      if (req.user.role === 'buyer') {
        // Buyers see only their orders
        query.user = req.user.id;
      } else if (req.user.role === 'seller') {
        // Sellers see orders containing their products
        const sellerProducts = await Product.find({ sellerId: req.user.id }).select('_id');
        const productIds = sellerProducts.map(p => p._id);
        query['items.product'] = { $in: productIds };
      } else if (req.user.role === 'admin') {
        // Admins see all orders
        // No filter needed
      }
    } else {
      // Unauthenticated users see nothing
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product')
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Get orders error', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my-orders - Get current user's orders (buyer)
router.get('/my-orders', auth(true), async (req, res) => {
  try {
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only buyers can view their orders' });
    }

    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Get my orders error', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/seller - Get orders for current seller
router.get('/seller', auth(true), async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only sellers can view seller orders' });
    }

    // Find all products by this seller
    const sellerProducts = await Product.find({ sellerId: req.user.id }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    // Find orders containing these products
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('user', 'name email phone')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Get seller orders error', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', auth(true), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product')
      .populate('sellerId', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check permissions
    if (req.user.role !== 'admin') {
      if (req.user.role === 'buyer' && order.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      if (req.user.role === 'seller') {
        // Check if seller has products in this order
        const sellerProducts = await Product.find({ sellerId: req.user.id }).select('_id');
        const productIds = sellerProducts.map(p => p._id.toString());
        const hasProduct = order.items.some(item => productIds.includes(item.product._id.toString()));
        if (!hasProduct) {
          return res.status(403).json({ message: 'Not authorized to view this order' });
        }
      }
    }

    res.json(order);
  } catch (err) {
    console.error('Get order error', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders - Create new order
router.post('/', auth(true), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only buyers can create orders' });
    }

    const { items, shippingAddress, shippingCity, buyerPhone, paymentMethod = 'cod' } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // Get user details for city comparison
    const user = await User.findById(req.user.id);

    // Validate products and stock availability
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds }, active: { $ne: false } });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products not found or inactive' });
    }

    // Check stock and calculate subtotal (product prices only)
    let subtotal = 0;
    const stockUpdates = [];

    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product.toString());
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      subtotal += product.price * item.quantity;
      stockUpdates.push({
        productId: product._id,
        quantity: item.quantity,
        currentStock: product.stock
      });
    }

    // Calculate GST (18% of subtotal) - round to 2 decimal places
    const gst = Math.round((subtotal * 0.18) * 100) / 100;

    // Calculate delivery charge
    // Check if this is the user's first order
    const existingOrdersCount = await Order.countDocuments({ user: req.user.id });
    const isFirstOrder = existingOrdersCount === 0;

    let deliveryCharge = 0;
    if (!isFirstOrder) {
      // Compare shipping city with user's city (case-insensitive)
      const userCity = (user?.city || '').toLowerCase().trim();
      const orderCity = (shippingCity || '').toLowerCase().trim();

      if (orderCity && userCity && orderCity === userCity) {
        // Within city delivery
        deliveryCharge = 20;
      } else {
        // Out of city delivery
        deliveryCharge = 40;
      }
    }
    // First order is always free (deliveryCharge = 0)

    // Calculate final total = subtotal + GST + deliveryCharge - round to 2 decimal places
    const total = Math.round((subtotal + gst + deliveryCharge) * 100) / 100;

    // Determine primary seller (first product's seller, or group by seller for multi-seller orders)
    const primarySellerId = products[0]?.sellerId || null;

    // Create order
    const orderData = {
      user: req.user.id,
      items: items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: products.find(p => p._id.toString() === item.product.toString()).price
      })),
      subtotal: subtotal,
      gst: gst,
      deliveryCharge: deliveryCharge,
      total: total,
      shippingAddress: shippingAddress.trim(),
      shippingCity: shippingCity || null,
      buyerPhone: buyerPhone || null,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending',
      status: 'pending',
      sellerId: primarySellerId
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    // Reduce stock for all products
    for (const update of stockUpdates) {
      await Product.findByIdAndUpdate(update.productId, {
        $inc: { stock: -update.quantity }
      });
    }

    // Create tracking entry
    await OrderTracking.create({
      order: savedOrder._id,
      history: [{ status: 'pending', note: 'Order created', at: new Date() }]
    });

    // Notify buyer
    await Notification.create({
      user: savedOrder.user,
      message: `Your order #${savedOrder._id} has been placed successfully.`,
      type: 'order_update',
      order: savedOrder._id
    });

    // Notify all sellers involved
    const sellerIds = new Set();
    for (const product of products) {
      if (product.sellerId) {
        sellerIds.add(product.sellerId.toString());
      }
    }

    for (const sellerId of sellerIds) {
      await Notification.create({
        user: sellerId,
        message: `New order #${savedOrder._id} received with your product(s).`,
        type: 'new_order',
        order: savedOrder._id
      });

      // Realtime notification
      try {
        const { getIo } = require('../lib/realtime');
        const io = getIo();
        if (io) {
          io.to(sellerId).emit('notification', {
            user: sellerId,
            message: `New order #${savedOrder._id} received with your product(s).`,
            order: savedOrder._id
          });
        }
      } catch (e) {
        console.error('Realtime notify seller failed', e.message);
      }
    }

    // Realtime notify buyer
    try {
      const { getIo } = require('../lib/realtime');
      const io = getIo();
      if (io) {
        io.to(String(savedOrder.user)).emit('notification', {
          user: savedOrder.user,
          message: `Your order #${savedOrder._id} has been placed successfully.`,
          order: savedOrder._id
        });
      }
    } catch (e) {
      console.error('Realtime notify buyer failed', e.message);
    }

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('user', 'name email phone')
      .populate('items.product')
      .populate('sellerId', 'name email');

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Create order error', err);
    res.status(500).json({ message: err.message || 'Failed to create order' });
  }
});

// PUT /api/orders/:id - Update order (status, etc.)
router.put('/:id', auth(true), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const { status, note, paymentStatus, shippingDate, estimatedDelivery, trackingInfo } = req.body;
    const updates = {};

    // Status update permissions
    if (status) {
      if (req.user.role === 'buyer') {
        // Buyers can only cancel pending orders
        if (status === 'cancelled' && order.status === 'pending') {
          updates.status = 'cancelled';
          // Restore stock when order is cancelled
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product._id, {
              $inc: { stock: item.quantity }
            });
          }
        } else {
          return res.status(403).json({ message: 'Buyers can only cancel pending orders' });
        }
      } else if (req.user.role === 'seller' || req.user.role === 'admin') {
        // Sellers can update status (except cancelled by buyer)
        const validStatuses = ['accepted', 'rejected', 'shipped', 'delivered'];
        if (validStatuses.includes(status)) {
          // Check if seller owns products in this order
          if (req.user.role === 'seller') {
            const sellerProducts = await Product.find({ sellerId: req.user.id }).select('_id');
            const productIds = sellerProducts.map(p => p._id.toString());
            const hasProduct = order.items.some(item =>
              productIds.includes(item.product._id ? item.product._id.toString() : item.product.toString())
            );
            if (!hasProduct) {
              return res.status(403).json({ message: 'Not authorized to update this order' });
            }
          }

          // If rejecting, restore stock and notify buyer
          if (status === 'rejected') {
            for (const item of order.items) {
              await Product.findByIdAndUpdate(item.product._id || item.product, {
                $inc: { stock: item.quantity }
              });
            }
          }

          // If accepting, require shipping date and estimated delivery
          if (status === 'accepted') {
            if (!shippingDate || !estimatedDelivery) {
              return res.status(400).json({
                message: 'Shipping date and estimated delivery are required when accepting an order'
              });
            }
            updates.shippingDate = new Date(shippingDate);
            updates.estimatedDelivery = new Date(estimatedDelivery);
          }

          // If shipped, generate delivery OTP and update shipping date
          if (status === 'shipped') {
            if (shippingDate) {
              // OTP generation removed as per user request
              updates.shippingDate = new Date(shippingDate);
            }
            if (trackingInfo) {
              updates.trackingInfo = trackingInfo;
            }
          }

          // If delivered, bypass OTP verification
          if (status === 'delivered') {
            updates.deliveryDate = new Date();
            updates.deliveryOTP = null;

            // Notify buyer about delivery
            await Notification.create({
              user: order.user,
              message: `🎉 Your order #${order._id} has been delivered successfully! You can now download the invoice.`,
              type: 'order_update',
              order: order._id
            });

            // Notify seller about delivery
            const sellerIds = new Set();
            for (const item of order.items) {
              const p = await Product.findById(item.product._id || item.product);
              if (p && p.sellerId) {
                sellerIds.add(p.sellerId.toString());
              }
            }
            for (const sellerId of sellerIds) {
              await Notification.create({
                user: sellerId,
                message: `✅ Order #${order._id} has been delivered to the customer.`,
                type: 'order_update',
                order: order._id
              });

              // Realtime notification for seller
              try {
                const { getIo } = require('../lib/realtime');
                const io = getIo();
                if (io) {
                  io.to(sellerId).emit('notification', {
                    user: sellerId,
                    message: `✅ Order #${order._id} has been delivered to the customer.`,
                    order: order._id
                  });
                }
              } catch (e) {
                console.error('Realtime notify seller failed', e.message);
              }
            }

            // Realtime notification for buyer
            try {
              const { getIo } = require('../lib/realtime');
              const io = getIo();
              if (io) {
                io.to(String(order.user)).emit('notification', {
                  user: order.user,
                  message: `🎉 Your order #${order._id} has been delivered successfully! You can now download the invoice.`,
                  order: order._id
                });
              }
            } catch (e) {
              console.error('Realtime notify buyer failed', e.message);
            }
          }

          updates.status = status;
        } else {
          return res.status(400).json({ message: 'Invalid status for seller' });
        }
      }
    }

    // Allow updating shipping info separately
    if (shippingDate && (req.user.role === 'seller' || req.user.role === 'admin')) {
      updates.shippingDate = new Date(shippingDate);
    }
    if (estimatedDelivery && (req.user.role === 'seller' || req.user.role === 'admin')) {
      updates.estimatedDelivery = new Date(estimatedDelivery);
    }
    if (trackingInfo && (req.user.role === 'seller' || req.user.role === 'admin')) {
      updates.trackingInfo = trackingInfo;
    }

    if (paymentStatus && (req.user.role === 'admin' || req.user.role === 'seller')) {
      updates.paymentStatus = paymentStatus;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('user', 'name email phone')
      .populate('items.product')
      .populate('sellerId', 'name email');

    // Update tracking
    if (status) {
      const tracking = await OrderTracking.findOne({ order: order._id });
      if (tracking) {
        tracking.history.push({ status, note: note || '', at: new Date() });
        await tracking.save();
      } else {
        await OrderTracking.create({
          order: order._id,
          history: [{ status, note: note || '', at: new Date() }]
        });
      }

      // Notify buyer
      let notificationMessage = `Order #${order._id} status updated to ${status}${note ? ': ' + note : ''}`;

      // Special notification for delivery
      if (status === 'delivered') {
        // Check payment status
        if (order.paymentStatus === 'pending' && order.paymentMethod === 'cod') {
          notificationMessage = `🎉 Your order #${order._id} has been delivered! Please complete your payment (Cash on Delivery).`;
        } else if (order.paymentStatus === 'pending') {
          notificationMessage = `🎉 Your order #${order._id} has been delivered! Please complete your payment to download the invoice.`;
        } else {
          notificationMessage = `🎉 Your order #${order._id} has been delivered successfully! You can now download the invoice.`;
        }
      }

      await Notification.create({
        user: order.user,
        message: notificationMessage,
        type: 'order_update',
        order: order._id
      });

      // If delivered, also notify seller
      if (status === 'delivered') {
        const sellerIds = new Set();
        for (const item of order.items) {
          const p = await Product.findById(item.product._id || item.product);
          if (p && p.sellerId) {
            sellerIds.add(p.sellerId.toString());
          }
        }
        for (const sellerId of sellerIds) {
          await Notification.create({
            user: sellerId,
            message: `✅ Order #${order._id} has been delivered to the customer.`,
            type: 'order_update',
            order: order._id
          });

          // Realtime notification for seller
          try {
            const { getIo } = require('../lib/realtime');
            const io = getIo();
            if (io) {
              io.to(sellerId).emit('notification', {
                user: sellerId,
                message: `✅ Order #${order._id} has been delivered to the customer.`,
                order: order._id
              });
            }
          } catch (e) {
            console.error('Realtime notify seller failed', e.message);
          }
        }
      }

      // Realtime notifications
      try {
        const io = getIo();
        if (io) {
          // Notify buyer
          io.to(String(order.user._id || order.user)).emit('notification', {
            user: order.user._id || order.user,
            message: notificationMessage,
            order: order._id
          });
          // Also emit order_update for auto-refresh
          io.to(String(order.user._id || order.user)).emit('order_update', { orderId: order._id, status });

          // Notify sellers
          const sellerIds = new Set();
          for (const item of order.items) {
            const pid = item.product._id || item.product;
            const p = await Product.findById(pid);
            if (p && p.sellerId) {
              sellerIds.add(p.sellerId.toString());
            }
          }
          for (const sellerId of sellerIds) {
            io.to(sellerId).emit('notification', {
              user: sellerId,
              message: `Order #${order._id} status updated to ${status}`,
              order: order._id
            });
            io.to(sellerId).emit('order_update', { orderId: order._id, status });
          }
        }
      } catch (e) {
        console.error('Realtime notify failed', e.message);
      }

      // Email notifications
      try {
        console.log(`[OTP DEBUG] Looking up buyer for order status update... User ID: ${order.user}`);
        const buyer = await User.findById(order.user);
        if (buyer && buyer.email) {
          const buyerEmail = buyer.email;
          const orderIdStr = order._id.toString();

          console.log(`[OTP DEBUG] Sending status update [${status}] email to buyer: ${buyerEmail} (Order: ${orderIdStr})`);

          if (status === 'shipped' && updated.deliveryOTP) {
            console.log(`[OTP DEBUG] OTP generated and being sent: ${updated.deliveryOTP}`);
          }

          // Trigger email without awaiting to ensure <10s response to seller
          sendStatusUpdateEmail(buyerEmail, orderIdStr, status, note, updated.deliveryOTP)
            .then(() => console.log(`[OTP DEBUG] Email successfully sent to ${buyerEmail}`))
            .catch(err => console.error(`[OTP DEBUG] Background email failure for ${buyerEmail}:`, err.message));

          // If delivered AND paid, send invoice
          if (status === 'delivered' && updated.paymentStatus === 'paid') {
            try {
              const invoiceData = await getInvoiceData(updated);
              const pdfBuffer = await generateInvoicePDF(invoiceData);
              await sendInvoiceEmail(buyerEmail, updated, pdfBuffer);
              console.log(`[OTP DEBUG] Invoice sent to ${buyerEmail}`);
            } catch (invoiceErr) {
              console.error(`[OTP DEBUG] Failed to send invoice to ${buyerEmail}:`, invoiceErr);
            }
          }
        } else {
          console.warn(`[OTP DEBUG] No email found for buyer of order ${order._id}`);
        }
      } catch (e) {
        console.error('[OTP DEBUG] Email notification process failed:', e);
      }
    }

    res.json(updated);
  } catch (err) {
    console.error('Update order error', err);
    res.status(500).json({ message: err.message || 'Failed to update order' });
  }
});

// resend-delivery-otp route removed as per user request (OTP disabled)

// DELETE /api/orders/:id - Cancel order (soft delete or status change)
router.delete('/:id', auth(true), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only buyer or admin can cancel
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: item.quantity }
      });
    }

    // Update order status
    order.status = 'cancelled';
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }
    await order.save();

    // Update tracking
    const tracking = await OrderTracking.findOne({ order: order._id });
    if (tracking) {
      tracking.history.push({ status: 'cancelled', note: 'Order cancelled by buyer', at: new Date() });
      await tracking.save();
    }

    // Notify sellers
    const sellerIds = new Set();
    for (const item of order.items) {
      if (item.product.sellerId) {
        sellerIds.add(item.product.sellerId.toString());
      }
    }

    for (const sellerId of sellerIds) {
      await Notification.create({
        user: sellerId,
        message: `Order #${order._id} has been cancelled by the buyer.`,
        type: 'order_update',
        order: order._id
      });
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    console.error('Cancel order error', err);
    res.status(500).json({ message: err.message || 'Failed to cancel order' });
  }
});

/**
 * Internal helper to format invoice data for backend generation
 */
async function getInvoiceData(order) {
  const populated = await Order.findById(order._id)
    .populate('user', 'name email phone address pinCode')
    .populate('items.product', 'name price description category')
    .populate('sellerId', 'name email companyName shopName gstNumber companyAddress address pinCode phone');

  return {
    invoiceNumber: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
    orderId: order._id,
    orderDate: order.createdAt,
    deliveryDate: order.deliveryDate,
    buyer: {
      name: populated.user?.name || 'N/A',
      email: populated.user?.email || 'N/A',
      phone: populated.user?.phone || 'N/A',
      address: populated.user?.address || order.shippingAddress || 'N/A',
      pinCode: populated.user?.pinCode || 'N/A'
    },
    seller: populated.sellerId ? {
      name: populated.sellerId.name,
      email: populated.sellerId.email,
      companyName: populated.sellerId.companyName || populated.sellerId.shopName || populated.sellerId.name,
      address: populated.sellerId.companyAddress || populated.sellerId.address || 'N/A',
      gstNumber: populated.sellerId.gstNumber || 'N/A',
      phone: populated.sellerId.phone || 'N/A'
    } : null,
    items: populated.items.map(item => ({
      name: item.product?.name || 'Product',
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    })),
    summary: {
      subtotal: order.subtotal,
      tax: order.gst,
      shipping: order.deliveryCharge,
      total: order.total
    }
  };
}

module.exports = router;
