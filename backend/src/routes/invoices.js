const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/invoices/:orderId - Generate and return invoice data
router.get('/:orderId', auth(true), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email phone address pinCode')
      .populate('items.product', 'name price description category')
      .populate('sellerId', 'name email companyName shopName gstNumber companyAddress address pinCode phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions - only buyer or admin can download invoice
    // Handle both populated and non-populated user objects
    const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
    if (req.user.role !== 'admin' && orderUserId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    // Only allow invoice download for delivered orders with paid status
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Invoice is only available for delivered orders' });
    }

    // Check if payment is completed (recommended but not required)
    if (order.paymentStatus !== 'paid') {
      // Allow invoice generation but show warning
      console.warn(`Invoice requested for order ${order._id} with payment status: ${order.paymentStatus}`);
    }

    // Calculate invoice details using stored values from order
    const subtotal = order.subtotal || order.total; // Fallback to total if subtotal not available
    const tax = order.gst || 0; // Use stored GST
    const shipping = order.deliveryCharge || 0; // Use stored delivery charge
    const total = order.total; // Use stored total

    const invoiceData = {
      invoiceNumber: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
      orderId: order._id,
      orderDate: order.createdAt,
      deliveryDate: order.deliveryDate,
      buyer: {
        name: order.user?.name || 'N/A',
        email: order.user?.email || 'N/A',
        phone: order.user?.phone || 'N/A',
        address: order.user?.address || order.shippingAddress || 'N/A',
        pinCode: order.user?.pinCode || 'N/A'
      },
      seller: order.sellerId ? {
        name: order.sellerId.name,
        email: order.sellerId.email,
        companyName: order.sellerId.companyName || order.sellerId.shopName || order.sellerId.name,
        shopName: order.sellerId.shopName || order.sellerId.companyName || order.sellerId.name,
        gstNumber: order.sellerId.gstNumber || 'N/A',
        address: order.sellerId.companyAddress || order.sellerId.address || 'N/A',
        phone: order.sellerId.phone || 'N/A',
        pinCode: order.sellerId.pinCode || 'N/A'
      } : null,
      items: order.items.map(item => {
        // Handle cases where product might be null, deleted, or not populated
        const product = item.product || {};
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        return {
          name: product.name || 'Product',
          description: product.description || '',
          category: product.category || '',
          quantity: quantity,
          price: price,
          total: price * quantity
        };
      }),
      payment: {
        method: order.paymentMethod,
        methodDisplay: order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' : order.paymentMethod,
        status: order.paymentStatus,
        statusDisplay: order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'pending' ? 'Pending' : order.paymentStatus,
        subtotal,
        tax,
        shipping,
        total
      }
    };

    res.json(invoiceData);
  } catch (err) {
    console.error('Get invoice error', err);
    res.status(500).json({ message: err.message || 'Failed to generate invoice' });
  }
});

module.exports = router;
