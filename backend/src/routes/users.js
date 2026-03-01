const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { sendEmailOTP } = require('../services/email.service');

// GET /api/users (admin only)
router.get('/', auth(false), async (req, res) => {
  try {
    if (req.user && req.user.role === 'admin') {
      const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
      return res.json(users);
    }
    return res.status(403).json({ message: 'Admin access required' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me
router.get('/me', auth(true), async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select('-passwordHash');
    if (!u) return res.status(404).json({ message: 'User not found' });
    res.json(u);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me (update profile)
router.put('/me', auth(true), async (req, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'email', 'phone', 'address', 'city', 'district', 'state', 'pinCode'];
    const filteredUpdates = {};

    // Only allow specific fields to be updated
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // Validate pinCode format if present
        if (field === 'pinCode' && updates[field] && !/^[0-9]{6}$/.test(updates[field])) {
          return res.status(400).json({ message: 'Pin code must be exactly 6 digits' });
        }
        filteredUpdates[field] = updates[field];
      }
    }

    // If email is being changed, check for duplicates
    if (filteredUpdates.email) {
      const existing = await User.findOne({
        email: filteredUpdates.email.toLowerCase(),
        _id: { $ne: req.user.id }
      });
      if (existing) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      filteredUpdates.email = filteredUpdates.email.toLowerCase();
    }

    // If phone is being changed, check for duplicates
    if (filteredUpdates.phone) {
      const existing = await User.findOne({
        phone: filteredUpdates.phone,
        _id: { $ne: req.user.id }
      });
      if (existing) {
        return res.status(409).json({ message: 'Phone number already in use' });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json(updated);
  } catch (err) {
    console.error('Update profile error', err);
    res.status(400).json({ message: err.message || 'Failed to update profile' });
  }
});

// PUT /api/users/me/password (update password)
router.put('/me/password', auth(true), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.passwordHash || '');
    if (!match) {
      // Fallback for legacy sha256 passwords
      const sha = require('crypto').createHash('sha256').update(currentPassword).digest('hex');
      if (sha !== user.passwordHash) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error', err);
    res.status(500).json({ message: err.message || 'Failed to update password' });
  }
});

// POST /api/users/me/request-phone-otp (trigger OTP for new phone)
router.post('/me/request-phone-otp', auth(true), async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Valid 10-digit phone number is required' });
    }

    // Check if phone is already in use
    const existing = await User.findOne({ phone, _id: { $ne: req.user.id } });
    if (existing) {
      return res.status(409).json({ message: 'Phone number already in use by another account' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear old OTPs for this user
    await OTP.deleteMany({ userId: req.user.id });

    // Save new OTP
    await OTP.create({
      userId: req.user.id,
      phone,
      code
    });

    // Send OTP to user's email for phone number update verification
    const user = await User.findById(req.user.id);
    if (user && user.email) {
      try {
        await sendEmailOTP(user.email, code);
      } catch (e) {
        console.error('Email OTP send failed for phone update', e);
      }
    }

    res.json({ success: true, message: 'Verification code sent' });
  } catch (err) {
    console.error('Phone OTP request error', err);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// POST /api/users/me/verify-phone-update (finalize phone update)
router.post('/me/verify-phone-update', auth(true), async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone and code are required' });
    }

    const otp = await OTP.findOne({ userId: req.user.id, phone, code });
    if (!otp) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Update user phone
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { phone, phoneVerified: true },
      { new: true }
    ).select('-passwordHash');

    // Delete OTP after use
    await OTP.deleteOne({ _id: otp._id });

    res.json({ success: true, message: 'Phone number updated successfully', user });
  } catch (err) {
    console.error('Phone verify error', err);
    res.status(500).json({ message: 'Failed to verify phone number' });
  }
});

// DELETE /api/users/me (soft delete account)
router.delete('/me', auth(true), async (req, res) => {
  try {
    const { password } = req.body; // Require password confirmation for security

    if (!password) {
      return res.status(400).json({ message: 'Password confirmation required to delete account' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify password
    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) {
      const sha = require('crypto').createHash('sha256').update(password).digest('hex');
      if (sha !== user.passwordHash) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    // Soft delete: set deleted flag to true
    user.deleted = true;
    await user.save();

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error', err);
    res.status(500).json({ message: err.message || 'Failed to delete account' });
  }
});

// POST /api/users (admin creates user)
router.post('/', async (req, res) => {
  try {
    // Expect passwordHash if creating directly; use /api/auth/register for normal user registration
    const u = new User(req.body);
    const saved = await u.save();
    res.status(201).json({ id: saved._id, email: saved.email, name: saved.name });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/users/:id/login-attempts - list login attempts for a user (or by email query)
router.get('/:id/login-attempts', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;
    const q = {};
    if (id && id !== 'me') q.user = id;
    if (email) q.email = email.toLowerCase();

    const attempts = await LoginAttempt.find(q).sort({ createdAt: -1 }).limit(200);
    res.json(attempts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
