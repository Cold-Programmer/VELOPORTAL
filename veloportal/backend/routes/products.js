const router = require('express').Router();
const { Op } = require('sequelize');
const slugify = require('slugify');
const { Bicycle, Category, Review, WishlistItem, User } = require('../models');
const { protect, optionalAuth } = require('../middleware/auth');

// Data browsing requires a signed-in account — VeloPortal does not expose
// catalog/listing data to anonymous visitors.
router.use(protect);

// GET /api/products - list with search, filter, sort, pagination
router.get('/', async (req, res, next) => {
  try {
    const {
      q, category, minPrice, maxPrice, brand, condition, productType,
      forRent, forSale, sort = 'newest', page = 1, limit = 12,
    } = req.query;

    const where = {};
    if (q) where.name = { [Op.iLike]: `%${q}%` };
    if (brand) where.brand = brand;
    if (condition) where.condition = condition;
    if (productType) where.productType = productType;
    if (forRent === 'true') where.forRent = true;
    if (forSale === 'true') where.forSale = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    const include = [{ model: Category, where: category ? { slug: category } : undefined, required: !!category }];

    const order = {
      newest: [['createdAt', 'DESC']],
      price_asc: [['price', 'ASC']],
      price_desc: [['price', 'DESC']],
      rating: [['ratingAvg', 'DESC']],
      name: [['name', 'ASC']],
    }[sort] || [['createdAt', 'DESC']];

    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await Bicycle.findAndCountAll({
      where, include, order, limit: Number(limit), offset, distinct: true,
    });

    res.json({ items: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
});

router.get('/featured', async (req, res, next) => {
  try {
    const items = await Bicycle.findAll({ where: { isFeatured: true }, include: Category, limit: 8 });
    res.json({ items });
  } catch (err) { next(err); }
});

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ categories });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const bike = await Bicycle.findOne({
      where: { slug: req.params.slug },
      include: [Category, { model: Review, include: [{ model: User, attributes: ['id', 'name', 'avatarUrl'] }] }],
    });
    if (!bike) return res.status(404).json({ message: 'Bicycle not found' });
    res.json({ item: bike });
  } catch (err) { next(err); }
});

// ---- Reviews ----
router.post('/:slug/reviews', protect, async (req, res, next) => {
  try {
    const bike = await Bicycle.findOne({ where: { slug: req.params.slug } });
    if (!bike) return res.status(404).json({ message: 'Bicycle not found' });
    const { rating, comment } = req.body;
    await Review.create({ rating, comment, userId: req.user.id, bicycleId: bike.id });

    const reviews = await Review.findAll({ where: { bicycleId: bike.id } });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await bike.update({ ratingAvg: avg.toFixed(1), ratingCount: reviews.length });

    res.status(201).json({ message: 'Review added' });
  } catch (err) { next(err); }
});

// ---- Wishlist ----
router.get('/wishlist/mine', protect, async (req, res, next) => {
  try {
    const items = await WishlistItem.findAll({ where: { userId: req.user.id }, include: Bicycle });
    res.json({ items });
  } catch (err) { next(err); }
});

router.post('/:slug/wishlist', protect, async (req, res, next) => {
  try {
    const bike = await Bicycle.findOne({ where: { slug: req.params.slug } });
    if (!bike) return res.status(404).json({ message: 'Bicycle not found' });
    const [item, created] = await WishlistItem.findOrCreate({
      where: { userId: req.user.id, bicycleId: bike.id },
    });
    if (!created) { await item.destroy(); return res.json({ wishlisted: false }); }
    res.json({ wishlisted: true });
  } catch (err) { next(err); }
});

module.exports = router;
