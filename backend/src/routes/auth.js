const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const OTP = require('../models/OTP');
const { OAuth2Client } = require('google-auth-library');
const { sendEmailOTP } = require('../services/email.service');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/check-availability - Check if email/phone is available (for both buyer and seller)
router.post('/check-availability', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email is already registered' });
      }
    }

    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
      }

      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({ message: 'Phone number is already registered' });
      }
    }

    res.json({ available: true });
  } catch (err) {
    console.error('check-availability error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/register - Register new user (buyer or seller)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, address, city, district, state, pinCode } = req.body;
    const userRole = role || 'buyer';
    console.log('Register attempt:', { name, email, phone, role: userRole });

    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Validate phone number format (10 digits only)
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
      }
    }

    // Check for duplicate email (works for both buyer and seller roles)
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Check for duplicate phone number (works for both buyer and seller roles)
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({ message: 'Phone number is already registered' });
      }
    }

    // Validate pin code (6 digits only)
    if (pinCode && !/^[0-9]{6}$/.test(pinCode)) {
      return res.status(400).json({ message: 'Pin code must be exactly 6 digits' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const u = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: userRole,
      phone,
      phoneVerified: !!phone,
      address: address || null,
      city: city || null,
      district: district || null,
      state: state || null,
      pinCode: pinCode || null
    });
    console.log('Attempting to save user to MongoDB...');
    const saved = await u.save();
    console.log('User saved successfully to collection:', saved.collection.name, 'ID:', saved._id);

    const user = { id: saved._id, name: saved.name, email: saved.email, role: saved.role, phone: saved.phone, isVerified: saved.isVerified };
    const token = jwt.sign({ id: saved._id, email: saved.email, role: saved.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '24h' });

    // Set HTTP-only cookie with 24-hour expiration
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: true, // Required for sameSite: 'none'
      sameSite: 'none', // Allow cross-domain cookies
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      path: '/'
    });

    res.status(201).json({ user });
  } catch (err) {
    console.error('CRITICAL: Register error:', {
      message: err.message,
      stack: err.stack,
      data: { name: req.body.name, email: req.body.email, role: req.body.role }
    });
    res.status(500).json({ message: 'Registration failed. ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    if (!email || !password) {
      // Log failed attempt for missing credentials
      try { await LoginAttempt.create({ email: email || '', ip, userAgent, success: false, reason: 'missing_credentials' }); } catch (e) { console.error('LoginAttempt logging failed', e); }
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Log failed attempt for unknown user
      try { await LoginAttempt.create({ email: email.toLowerCase(), ip, userAgent, success: false, reason: 'user_not_found' }); } catch (e) { console.error('LoginAttempt logging failed', e); }
      return res.status(401).json({ message: 'Wrong email' });
    }

    // Deny login for soft-deleted accounts
    if (user.deleted) {
      try { await LoginAttempt.create({ user: user._id, email: user.email, ip, userAgent, success: false, reason: 'account_deleted' }); } catch (e) { console.error('LoginAttempt logging failed', e); }
      return res.status(403).json({ message: 'Account has been deleted' });
    }

    let match = false;
    try {
      match = await bcrypt.compare(password, user.passwordHash || '');
    } catch (e) {
      match = false;
    }

    // Fallback for legacy sha256-hashed passwords: compare sha256(password) to stored hash and then migrate to bcrypt
    if (!match && user.passwordHash && /^[a-f0-9]{64}$/i.test(String(user.passwordHash))) {
      const sha = require('crypto').createHash('sha256').update(password).digest('hex');
      if (sha === user.passwordHash) {
        match = true;
        // migrate to bcrypt
        try {
          const newHash = await bcrypt.hash(password, 10);
          user.passwordHash = newHash;
          await user.save();
          console.log('Migrated user password to bcrypt for user', user.email);
        } catch (e) {
          console.error('Password migration failed for user', user.email, e.message);
        }
      }
    }

    if (!match) {
      // Log failed attempt for invalid password
      try { await LoginAttempt.create({ user: user._id, email: user.email, ip, userAgent, success: false, reason: 'invalid_password' }); } catch (e) { console.error('LoginAttempt logging failed', e); }
      return res.status(401).json({ message: 'Wrong password' });
    }

    // Successful login - log the success
    try { await LoginAttempt.create({ user: user._id, email: user.email, ip, userAgent, success: true }); } catch (e) { console.error('LoginAttempt logging failed', e); }

    const payload = { id: user._id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '24h' });

    // Set HTTP-only cookie with 24-hour expiration
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: true, // Required for sameSite: 'none'
      sameSite: 'none', // Allow cross-domain cookies
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      path: '/'
    });

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
  } catch (err) {
    console.error('CRITICAL: Login error:', {
      message: err.message,
      stack: err.stack,
      dbStatus: mongoose.connection.readyState
    });
    res.status(500).json({ message: 'Login failed: ' + err.message });
  }
});

// POST /api/auth/google - Login with Google
router.post('/google', async (req, res) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Google ID Token required' });

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('CRITICAL: GOOGLE_CLIENT_ID missing on backend');
      return res.status(500).json({ message: 'Google Auth not configured on server' });
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch (verifyErr) {
      console.error('Google ID Token verification failed:', verifyErr.message);
      return res.status(401).json({ message: 'Google verification failed: ' + verifyErr.message });
    }

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }]
    });

    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        googleId,
        role: role || 'buyer',
        isVerified: true,
        image: picture
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.image) user.image = picture;
      await user.save();
    }

    if (user.deleted) {
      return res.status(403).json({ message: 'Account has been deleted' });
    }

    const payload = { id: user._id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '24h' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        needsProfileCompletion: !user.phone || !user.address
      }
    });
  } catch (err) {
    console.error('Google Auth error', err);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

// send-otp route removed as per user request (OTP disabled for registration)

// verify-otp route removed as per user request (OTP disabled for registration)

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Clear the auth cookie
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/verify - Verify current session
router.get('/verify', async (req, res) => {
  try {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ message: 'No active session' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      const user = await User.findById(payload.id).select('-passwordHash');

      if (!user || user.deleted) {
        res.clearCookie('authToken', { path: '/' });
        return res.status(401).json({ message: 'User not found or deleted' });
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          pinCode: user.pinCode
        }
      });
    } catch (err) {
      res.clearCookie('authToken', { path: '/' });
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
  } catch (err) {
    console.error('Verify session error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password - Send OTP for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Returns 200 even if not found to prevent email enumeration attacks
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ userId: user._id });
    await OTP.create({ userId: user._id, email: user.email, phone: user.phone, code });

    try {
      await sendEmailOTP(user.email, code);
    } catch (err) {
      console.error('Password reset email failed', err);
    }

    res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password - Verify OTP and set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = await OTP.findOne({ userId: user._id, code });
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    await OTP.deleteOne({ _id: otp._id });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
