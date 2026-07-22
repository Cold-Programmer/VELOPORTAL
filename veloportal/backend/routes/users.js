const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { Order, Rental, RepairBooking, EventRegistration, WishlistItem, Bicycle, Event, RepairService } = require('../models');

// Called periodically by the frontend while the app is open, so admins can see
// who is currently online (see Users tab in the operations console).
router.put('/heartbeat', protect, async (req, res, next) => {
  try {
    req.user.lastSeenAt = new Date();
    await req.user.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
});


// Aggregated dashboard summary for the logged-in user
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [orders, rentals, repairBookings, eventRegs, wishlist] = await Promise.all([
      Order.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 5 }),
      Rental.findAll({ where: { userId }, include: Bicycle, order: [['createdAt', 'DESC']], limit: 5 }),
      RepairBooking.findAll({ where: { userId }, include: RepairService, order: [['createdAt', 'DESC']], limit: 5 }),
      EventRegistration.findAll({ where: { userId }, include: Event, order: [['createdAt', 'DESC']], limit: 5 }),
      WishlistItem.count({ where: { userId } }),
    ]);
    res.json({ orders, rentals, repairBookings, eventRegistrations: eventRegs, wishlistCount: wishlist });
  } catch (err) { next(err); }
});

module.exports = router;
