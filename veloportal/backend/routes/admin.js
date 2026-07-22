const router = require('express').Router();
const { Op } = require('sequelize');
const { protect, adminOnly, staffOrAdmin, requireRole } = require('../middleware/auth');
const staffMechanicOrAdmin = requireRole('staff', 'mechanic', 'admin');
const slugify = require('slugify');
const {
  User, Bicycle, Category, Order, Rental, RepairBooking, Event, CommunityPost, Payment, Component,
} = require('../models');

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // considered "online" if seen in the last 5 minutes

router.use(protect); // every /api/admin/* route requires a logged-in, active user below

// ---- Overview analytics (financial data — super admin only) ----
router.get('/overview', adminOnly, async (req, res, next) => {
  try {
    const [userCount, bikeCount, orderCount, rentalCount, repairCount, eventCount, lowStockCount] = await Promise.all([
      User.count(), Bicycle.count(), Order.count(), Rental.count(), RepairBooking.count(), Event.count(),
      Bicycle.count({ where: { stock: { [Op.lte]: Bicycle.sequelize.col('lowStockThreshold') } } }),
    ]);
    const revenueOrders = await Order.sum('totalAmount', { where: { status: ['paid', 'completed', 'shipped', 'processing'] } });
    const revenueRentals = await Rental.sum('totalCost', { where: { paymentStatus: 'paid' } });
    res.json({
      userCount, bikeCount, orderCount, rentalCount, repairCount, eventCount, lowStockCount,
      totalRevenue: (Number(revenueOrders) || 0) + (Number(revenueRentals) || 0),
    });
  } catch (err) { next(err); }
});

// ---- A lightweight operations summary staff/mechanics can also see (no revenue figures) ----
router.get('/ops-summary', staffMechanicOrAdmin, async (req, res, next) => {
  try {
    const [bikeCount, orderCount, rentalCount, repairCount, eventCount, lowStockCount] = await Promise.all([
      Bicycle.count(), Order.count(), Rental.count(), RepairBooking.count(), Event.count(),
      Bicycle.count({ where: { stock: { [Op.lte]: Bicycle.sequelize.col('lowStockThreshold') } } }),
    ]);
    res.json({ bikeCount, orderCount, rentalCount, repairCount, eventCount, lowStockCount });
  } catch (err) { next(err); }
});

// ---- Users & role management (super admin only — this is the privilege boundary) ----
router.get('/users', adminOnly, async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });
    const now = Date.now();
    const withPresence = users.map((u) => {
      const plain = u.toJSON();
      plain.isOnline = !!plain.lastSeenAt && (now - new Date(plain.lastSeenAt).getTime()) < ONLINE_WINDOW_MS;
      return plain;
    });
    res.json({ users: withPresence });
  } catch (err) { next(err); }
});
router.put('/users/:id/role', adminOnly, async (req, res, next) => {
  try {
    const allowed = ['customer', 'mechanic', 'staff', 'admin'];
    if (!allowed.includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id === req.user.id && req.body.role !== 'admin') {
      return res.status(400).json({ message: 'You cannot demote your own account' });
    }
    user.role = req.body.role;
    await user.save();
    res.json({ user });
  } catch (err) { next(err); }
});
router.put('/users/:id/status', adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ message: 'You cannot deactivate your own account' });
    user.isActive = !!req.body.isActive;
    await user.save();
    res.json({ user });
  } catch (err) { next(err); }
});

// ---- Bicycles / accessories / equipment — staff can manage inventory ----
router.post('/bicycles', staffOrAdmin, async (req, res, next) => {
  try {
    const slug = slugify(req.body.name, { lower: true }) + '-' + Date.now().toString().slice(-5);
    const bike = await Bicycle.create({ ...req.body, slug });
    res.status(201).json({ bike });
  } catch (err) { next(err); }
});
router.put('/bicycles/:id', staffOrAdmin, async (req, res, next) => {
  try {
    const bike = await Bicycle.findByPk(req.params.id);
    if (!bike) return res.status(404).json({ message: 'Bicycle not found' });
    await bike.update(req.body);
    res.json({ bike });
  } catch (err) { next(err); }
});
// Quick restock — bump stock without re-submitting the full edit form
router.put('/bicycles/:id/restock', staffOrAdmin, async (req, res, next) => {
  try {
    const bike = await Bicycle.findByPk(req.params.id);
    if (!bike) return res.status(404).json({ message: 'Item not found' });
    const qty = Number(req.body.quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'Enter a positive quantity to add' });
    bike.stock += qty;
    await bike.save();
    res.json({ bike });
  } catch (err) { next(err); }
});
router.delete('/bicycles/:id', staffOrAdmin, async (req, res, next) => {
  try {
    await Bicycle.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted' });
  } catch (err) { next(err); }
});

// ---- Low-stock alerts for restock decisions ----
router.get('/low-stock', staffOrAdmin, async (req, res, next) => {
  try {
    const items = await Bicycle.findAll({
      where: { stock: { [Op.lte]: Bicycle.sequelize.col('lowStockThreshold') } },
      include: Category, order: [['stock', 'ASC']],
    });
    res.json({ items });
  } catch (err) { next(err); }
});

// ---- Customizer components (forks/wheels/handlebars/drivetrains) — staff can manage ----
router.get('/components', staffOrAdmin, async (req, res, next) => {
  try { res.json({ components: await Component.findAll({ order: [['partType', 'ASC']] }) }); }
  catch (err) { next(err); }
});
router.post('/components', staffOrAdmin, async (req, res, next) => {
  try { res.status(201).json({ component: await Component.create(req.body) }); }
  catch (err) { next(err); }
});
router.put('/components/:id', staffOrAdmin, async (req, res, next) => {
  try {
    const c = await Component.findByPk(req.params.id);
    if (!c) return res.status(404).json({ message: 'Component not found' });
    await c.update(req.body);
    res.json({ component: c });
  } catch (err) { next(err); }
});
router.delete('/components/:id', staffOrAdmin, async (req, res, next) => {
  try { await Component.destroy({ where: { id: req.params.id } }); res.json({ message: 'Component deleted' }); }
  catch (err) { next(err); }
});

// ---- Categories — full CRUD, super admin only (taxonomy changes affect the whole catalog) ----
router.get('/categories', staffOrAdmin, async (req, res, next) => {
  try { res.json({ categories: await Category.findAll({ order: [['name', 'ASC']] }) }); }
  catch (err) { next(err); }
});
router.post('/categories', adminOnly, async (req, res, next) => {
  try {
    const slug = slugify(req.body.name, { lower: true });
    const category = await Category.create({ ...req.body, slug });
    res.status(201).json({ category });
  } catch (err) { next(err); }
});
router.put('/categories/:id', adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const updates = { ...req.body };
    if (updates.name) updates.slug = slugify(updates.name, { lower: true });
    await category.update(updates);
    res.json({ category });
  } catch (err) { next(err); }
});
router.delete('/categories/:id', adminOnly, async (req, res, next) => {
  try {
    const inUse = await Bicycle.count({ where: { categoryId: req.params.id } });
    if (inUse > 0) return res.status(409).json({ message: `${inUse} item(s) still use this category — reassign them first.` });
    await Category.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
});

// ---- Orders / Rentals — staff can view & manage ----
router.get('/orders', staffOrAdmin, async (req, res, next) => {
  try { res.json({ orders: await Order.findAll({ order: [['createdAt', 'DESC']] }) }); }
  catch (err) { next(err); }
});
router.get('/rentals', staffOrAdmin, async (req, res, next) => {
  try { res.json({ rentals: await Rental.findAll({ include: Bicycle, order: [['createdAt', 'DESC']] }) }); }
  catch (err) { next(err); }
});

// ---- Community moderation — staff can moderate ----
router.get('/community/posts', staffOrAdmin, async (req, res, next) => {
  try { res.json({ posts: await CommunityPost.findAll({ order: [['createdAt', 'DESC']] }) }); }
  catch (err) { next(err); }
});
router.delete('/community/posts/:id', staffOrAdmin, async (req, res, next) => {
  try { await CommunityPost.destroy({ where: { id: req.params.id } }); res.json({ message: 'Post removed' }); }
  catch (err) { next(err); }
});

// ---- Payments — financial data, super admin only ----
router.get('/payments', adminOnly, async (req, res, next) => {
  try { res.json({ payments: await Payment.findAll({ order: [['createdAt', 'DESC']] }) }); }
  catch (err) { next(err); }
});

module.exports = router;
