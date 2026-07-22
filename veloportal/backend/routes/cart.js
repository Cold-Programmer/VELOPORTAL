const router = require('express').Router();
const { CartItem, Bicycle } = require('../models');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const items = await CartItem.findAll({ where: { userId: req.user.id }, include: Bicycle });
    const total = items.reduce((s, i) => s + Number(i.Bicycle.price) * i.quantity, 0);
    res.json({ items, total });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { bicycleId, quantity = 1 } = req.body;
    const bike = await Bicycle.findByPk(bicycleId);
    if (!bike) return res.status(404).json({ message: 'Bicycle not found' });

    let item = await CartItem.findOne({ where: { userId: req.user.id, bicycleId } });
    if (item) { item.quantity += Number(quantity); await item.save(); }
    else { item = await CartItem.create({ userId: req.user.id, bicycleId, quantity }); }
    res.status(201).json({ item });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const item = await CartItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ message: 'Cart item not found' });
    item.quantity = req.body.quantity;
    await item.save();
    res.json({ item });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await CartItem.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Removed from cart' });
  } catch (err) { next(err); }
});

module.exports = router;
