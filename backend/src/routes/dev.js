const express = require('express');
const router = express.Router();

// GET /api/dev/status - return counts for main collections
router.get('/status', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const models = ['Product', 'User', 'Order', 'Notification', 'OrderTracking'];
    const counts = {};
    for (const m of models) {
      let model;
      try { model = mongoose.model(m); } catch (e) { model = null; }
      counts[m] = model ? await model.countDocuments() : 0;
    }
    res.json({ ok: true, counts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;