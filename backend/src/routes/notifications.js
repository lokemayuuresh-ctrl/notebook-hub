const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// GET /api/notifications - Get current user's notifications
router.get('/', auth(true), async (req, res) => {
  try {
    const { read, limit = 50 } = req.query;
    const query = { user: req.user.id };
    
    if (read !== undefined) {
      query.read = read === 'true';
    }

    const notifs = await Notification.find(query)
      .populate('order', 'status total')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(notifs);
  } catch (err) {
    console.error('Get notifications error', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notifications/unread - Get unread notifications count
router.get('/unread', auth(true), async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });
    res.json({ count });
  } catch (err) {
    console.error('Get unread count error', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications (create - admin/seller only, or system)
router.post('/', auth(false), async (req, res) => {
  try {
    // Allow creation if authenticated as admin/seller, or if it's a system notification
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only admins and sellers can create notifications' });
    }

    const { user, message, type = 'general', order } = req.body;

    if (!user || !message) {
      return res.status(400).json({ message: 'User and message are required' });
    }

    const notification = new Notification({
      user,
      message,
      type,
      order: order || null,
      read: false
    });

    const saved = await notification.save();

    // Realtime emit to user if connected
    try {
      const { getIo } = require('../lib/realtime');
      const io = getIo();
      if (io && saved.user) {
        io.to(String(saved.user)).emit('notification', saved);
      }
    } catch (e) {
      console.error('Realtime emit failed', e.message);
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error('Create notification error', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/notifications/:id/read (mark read)
router.put('/:id/read', auth(true), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    // Ensure user can only mark their own notifications as read
    if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }

    const updated = await Notification.findByIdAndUpdate(
      req.params.id, 
      { read: true }, 
      { new: true }
    ).populate('order', 'status total');

    res.json(updated);
  } catch (err) {
    console.error('Mark notification read error', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all user's notifications as read
router.put('/read-all', auth(true), async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read', updated: result.modifiedCount });
  } catch (err) {
    console.error('Mark all read error', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', auth(true), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    // Ensure user can only delete their own notifications
    if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
