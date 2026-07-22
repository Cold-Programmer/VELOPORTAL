require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();
app.set('trust proxy', 1); // correct client IPs behind a proxy/load balancer for rate limiting

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VeloPortal API' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/rentals', require('./routes/rentals'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/events', require('./routes/events'));
app.use('/api/community', require('./routes/community'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/customizer', require('./routes/customizer'));
app.use('/api/admin', require('./routes/admin'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    // IMPORTANT: plain sequelize.sync() only creates tables that don't exist
    // yet — it does NOT add new columns to a table that's already there. This
    // project's models have gained many fields over time (regNumber,
    // lastSeenAt, isActive, avatarUrl, productType, lowStockThreshold, and
    // more). If your database was first created before some of those were
    // added and never fully reseeded, your live schema can silently drift
    // out of sync with the code — which shows up as exactly this kind of
    // confusing "Invalid email or password" / "Registration failed" error,
    // because Sequelize is reading/writing columns that may not match what's
    // actually in the table. `alter: true` auto-corrects this on every
    // restart in development. Use real migrations instead in production —
    // `alter: true` is not safe for production data.
    await sequelize.sync(process.env.NODE_ENV === 'production' ? {} : { alter: true });
    console.log('✅ Models synced');
    app.listen(PORT, () => console.log(`🚴 VeloPortal API running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Unable to start server:', err.message);
    process.exit(1);
  }
})();
