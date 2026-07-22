const rateLimit = require('express-rate-limit');

// In development, rapid repeated testing (checkout, retry, rebooking) is
// completely normal — the limits below are the PRODUCTION posture. In dev
// they're multiplied way up so you never get blocked while iterating, while
// still exercising the same code path.
const isProd = process.env.NODE_ENV === 'production';
const scale = isProd ? 1 : 20; // 20x more headroom outside production

// General API traffic — generous, just a backstop against abuse
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300 * scale,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down and try again shortly.' },
});

// Tighter limit on auth endpoints — mitigates credential stuffing / brute force
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20 * scale,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait 15 minutes and try again.' },
});

// M-Pesa initiation endpoints — still guards against spamming STK prompts to
// someone else's phone number in production, but won't get in your way
// while testing/demoing locally.
exports.paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10 * scale,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many payment attempts. Please wait a few minutes and try again.' },
});
