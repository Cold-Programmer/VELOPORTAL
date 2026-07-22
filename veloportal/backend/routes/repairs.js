const router = require('express').Router();
const { RepairService, RepairBooking } = require('../models');
const { protect, staffOrAdmin, mechanicOrAdmin } = require('../middleware/auth');

// Data browsing requires a signed-in account — VeloPortal does not expose
// catalog/listing data to anonymous visitors.
router.use(protect);

router.get('/services', async (req, res, next) => {
  try {
    const services = await RepairService.findAll({ order: [['price', 'ASC']] });
    res.json({ services });
  } catch (err) { next(err); }
});

router.post('/services', protect, staffOrAdmin, async (req, res, next) => {
  try {
    const service = await RepairService.create(req.body);
    res.status(201).json({ service });
  } catch (err) { next(err); }
});

router.post('/bookings', protect, async (req, res, next) => {
  try {
    const { serviceId, bicycleDescription, scheduledDate, notes } = req.body;
    const service = await RepairService.findByPk(serviceId);
    if (!service) return res.status(404).json({ message: 'Repair service not found' });

    const booking = await RepairBooking.create({
      userId: req.user.id, serviceId, bicycleDescription, scheduledDate, notes,
      totalCost: service.price, mechanicName: 'To be assigned',
    });
    res.status(201).json({ booking });
  } catch (err) { next(err); }
});

router.get('/bookings/mine', protect, async (req, res, next) => {
  try {
    const bookings = await RepairBooking.findAll({
      where: { userId: req.user.id }, include: RepairService, order: [['createdAt', 'DESC']],
    });
    res.json({ bookings });
  } catch (err) { next(err); }
});

router.get('/bookings', protect, mechanicOrAdmin, async (req, res, next) => {
  try {
    const bookings = await RepairBooking.findAll({ include: RepairService, order: [['createdAt', 'DESC']] });
    res.json({ bookings });
  } catch (err) { next(err); }
});

router.put('/bookings/:id/status', protect, mechanicOrAdmin, async (req, res, next) => {
  try {
    const booking = await RepairBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = req.body.status;
    if (req.body.mechanicName) booking.mechanicName = req.body.mechanicName;
    await booking.save();
    res.json({ booking });
  } catch (err) { next(err); }
});

module.exports = router;
