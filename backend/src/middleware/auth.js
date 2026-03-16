const jwt = require('jsonwebtoken');

module.exports = function auth(required = true) {
  return (req, res, next) => {
    // Try to get token from cookie first (for multi-tab support)
    let token = req.cookies?.authToken;
    
    // Fallback to Authorization header for backward compatibility
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      if (required) return res.status(401).json({ message: 'Authentication required' });
      req.user = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      req.user = { id: payload.id, email: payload.email, role: payload.role };
      return next();
    } catch (err) {
      // If token is expired or invalid, clear the cookie
      if (req.cookies?.authToken) {
        res.clearCookie('authToken', { path: '/' });
      }
      if (required) {
        return res.status(401).json({ message: 'Invalid or expired session. Please login again.' });
      }
      req.user = null;
      return next();
    }
  };
};
