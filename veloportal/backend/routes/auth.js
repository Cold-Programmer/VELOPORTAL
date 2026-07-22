const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitize = (user) => {
  const u = user.toJSON ? user.toJSON() : user;
  delete u.password;
  delete u.resetPasswordToken;
  delete u.emailVerifyToken;
  return u;
};

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('regNumber').optional({ checkFalsy: true }).isLength({ max: 20 }).withMessage('Registration number is too long'),
    body('phone').optional({ checkFalsy: true }).isLength({ min: 7, max: 15 }).withMessage('Enter a valid phone number'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });

      const { name, email, password, phone, regNumber } = req.body;
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

      const hashed = await bcrypt.hash(password, 10);
      const emailVerifyToken = crypto.randomBytes(20).toString('hex');
      const user = await User.create({
        name, email, password: hashed, phone: phone || null, regNumber: regNumber || null, emailVerifyToken,
      });

      // Send welcome + verification email (falls back to console.log if SMTP not configured)
      sendWelcomeEmail({ to: email, name, verifyToken: emailVerifyToken }).catch((e) => console.error('[email:welcome]', e.message));

      const token = signToken(user);
      res.status(201).json({ token, user: sanitize(user) });
    } catch (err) { next(err); }
  }
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().withMessage('A valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });

      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });
      if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated. Contact support.' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: 'Invalid email or password' });

      user.lastSeenAt = new Date();
      await user.save();

      const token = signToken(user);
      res.json({ token, user: sanitize(user) });
    } catch (err) { next(err); }
  }
);

router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { emailVerifyToken: req.params.token } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification link' });
    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  } catch (err) { next(err); }
});

router.post('/forgot-password', authLimiter, body('email').isEmail(), async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    sendPasswordResetEmail({ to: user.email, name: user.name, resetToken: token }).catch((e) => console.error('[email:reset]', e.message));
    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) { next(err); }
});

router.post(
  '/reset-password/:token',
  authLimiter,
  body('password').isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      const user = await User.findOne({
        where: { resetPasswordToken: req.params.token },
      });
      if (!user || user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired reset link' });
      }
      user.password = await bcrypt.hash(req.body.password, 10);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      res.json({ message: 'Password has been reset successfully' });
    } catch (err) { next(err); }
  }
);

router.get('/me', protect, async (req, res) => res.json({ user: sanitize(req.user) }));

// ---- Profile CRUD (update / change password / deactivate own account) ----
router.put(
  '/me',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional({ checkFalsy: true }).isLength({ min: 7, max: 15 }).withMessage('Enter a valid phone number'),
    body('email').optional().isEmail().withMessage('Enter a valid email'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });

      const { name, phone, avatarUrl, regNumber, email } = req.body;
      if (email && email !== req.user.email) {
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(409).json({ message: 'That email is already in use' });
      }
      await req.user.update({
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(regNumber !== undefined && { regNumber }),
        ...(email !== undefined && { email }),
      });
      res.json({ user: sanitize(req.user) });
    } catch (err) { next(err); }
  }
);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });

      const { currentPassword, newPassword } = req.body;
      const match = await bcrypt.compare(currentPassword, req.user.password);
      if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

      req.user.password = await bcrypt.hash(newPassword, 10);
      await req.user.save();
      res.json({ message: 'Password updated successfully' });
    } catch (err) { next(err); }
  }
);

// Self-service account deactivation (soft delete — preserves order/payment history integrity)
router.delete('/me', protect, async (req, res, next) => {
  try {
    req.user.isActive = false;
    await req.user.save();
    res.json({ message: 'Your account has been deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
