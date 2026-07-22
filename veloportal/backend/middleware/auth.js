const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

// Generic role gate. Usage: requireRole('admin', 'staff')
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' });
  }
  next();
};

// Super admin only — user management, categories, payments, financial overview
exports.adminOnly = exports.requireRole('admin');

// Shop attendants + admin — inventory, orders, rentals, events, community moderation
exports.staffOrAdmin = exports.requireRole('staff', 'admin');

// Mechanics + admin — repair queue management
exports.mechanicOrAdmin = exports.requireRole('mechanic', 'admin');

// Attaches req.user if a valid token is present, but doesn't block the request otherwise
exports.optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    }
  } catch (_) { /* ignore invalid token for optional auth */ }
  next();
};
