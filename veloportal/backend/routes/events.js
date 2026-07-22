const router = require('express').Router();
const { v4: uuid } = require('uuid');
const slugify = require('slugify');
const { Op } = require('sequelize');
const { Event, EventRegistration, User, Payment } = require('../models');
const { protect, staffOrAdmin } = require('../middleware/auth');
const { stkPush } = require('../utils/mpesa');
const { paymentLimiter } = require('../middleware/rateLimit');

// Data browsing requires a signed-in account — VeloPortal does not expose
// catalog/listing data to anonymous visitors.
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { q, upcoming } = req.query;
    const where = {};
    if (q) where.title = { [Op.iLike]: `%${q}%` };
    if (upcoming === 'true') where.date = { [Op.gte]: new Date() };
    const events = await Event.findAll({ where, order: [['date', 'ASC']] });
    res.json({ events });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { slug: req.params.slug } });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const registeredCount = await EventRegistration.count({ where: { eventId: event.id, status: 'registered' } });
    res.json({ event, spotsLeft: Math.max(0, event.capacity - registeredCount) });
  } catch (err) { next(err); }
});

router.post('/', protect, staffOrAdmin, async (req, res, next) => {
  try {
    const slug = slugify(req.body.title, { lower: true }) + '-' + Date.now().toString().slice(-4);
    const event = await Event.create({ ...req.body, slug });
    res.status(201).json({ event });
  } catch (err) { next(err); }
});

router.put('/:id', protect, staffOrAdmin, async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const updates = { ...req.body };
    if (updates.title && updates.title !== event.title) {
      updates.slug = slugify(updates.title, { lower: true }) + '-' + Date.now().toString().slice(-4);
    }
    await event.update(updates);
    res.json({ event });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, staffOrAdmin, async (req, res, next) => {
  try {
    const deleted = await Event.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) { next(err); }
});

const attachEventPayment = async (registration, eventOverride) => {
  const payment = await Payment.findOne({ where: { purpose: 'event', referenceId: registration.id }, order: [['createdAt', 'DESC']] });
  const plain = registration.toJSON ? registration.toJSON() : registration;
  // Explicit override wins — used right after creation, when the caller
  // already has the Event loaded and the fresh instance has no association
  // attached yet (avoids an extra DB round trip / association ambiguity).
  if (eventOverride) plain.Event = eventOverride.toJSON ? eventOverride.toJSON() : eventOverride;
  plain.Payment = payment || null;
  return plain;
};

router.post('/:slug/register', protect, paymentLimiter, async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { slug: req.params.slug } });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const registeredCount = await EventRegistration.count({ where: { eventId: event.id, status: 'registered' } });
    if (registeredCount >= event.capacity) return res.status(409).json({ message: 'Event is fully booked' });

    const existing = await EventRegistration.findOne({ where: { eventId: event.id, userId: req.user.id } });
    if (existing) return res.status(409).json({ message: 'You are already registered for this event' });

    const isFree = Number(event.price) === 0;
    const { paymentMethod, phone } = req.body; // 'mpesa' | 'cash' — required only for paid events

    if (!isFree && !['mpesa', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Choose a payment method: M-Pesa or cash at the event' });
    }

    const reg = await EventRegistration.create({
      eventId: event.id, userId: req.user.id, ticketCode: `TICKET-${uuid().slice(0, 8).toUpperCase()}`,
      paymentMethod: isFree ? 'free' : paymentMethod,
      paymentStatus: isFree ? 'paid' : paymentMethod === 'cash' ? 'due_at_event' : 'pending',
    });


    // Paid via M-Pesa: fire the STK push now
    if (!isFree && paymentMethod === 'mpesa') {
      if (!phone || !/^(?:\+254|0)?7\d{8}$/.test(phone)) {
        return res.status(400).json({ message: 'Enter a valid Kenyan phone number, e.g. 07XXXXXXXX' });
      }
      try {
        const stk = await stkPush({ amount: event.price, phone, accountReference: 'EVENT', transactionDesc: event.title.slice(0, 13) });
        await Payment.create({
          userId: req.user.id, amount: event.price, phone, purpose: 'event',
          referenceId: reg.id, merchantRequestId: stk.MerchantRequestID,
          checkoutRequestId: stk.CheckoutRequestID, status: 'pending',
        });
        return res.status(201).json({ registration: await attachEventPayment(reg, event), mpesa: stk, paymentInitiated: true });
      } catch (mpesaErr) {
        const reason = mpesaErr.response?.data?.errorMessage || mpesaErr.response?.data?.ResponseDescription || mpesaErr.message;
        console.error(`[mpesa] STK push failed: ${reason}`, mpesaErr.daraja || mpesaErr.response?.data || '');
        return res.status(201).json({
          registration: await attachEventPayment(reg, event), paymentInitiated: false,
          message: `Registered, but the M-Pesa prompt could not be sent (${reason}). Retry payment from your dashboard.`,
        });
      }
    }

    res.status(201).json({ registration: await attachEventPayment(reg, event), paymentInitiated: false });
  } catch (err) { next(err); }
});

// Retry a failed/expired M-Pesa prompt for an event registration
router.post('/registrations/:id/retry-payment', protect, paymentLimiter, async (req, res, next) => {
  try {
    const reg = await EventRegistration.findOne({ where: { id: req.params.id, userId: req.user.id }, include: Event });
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.paymentMethod !== 'mpesa' || reg.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'This registration is not awaiting M-Pesa payment' });
    }
    const phone = req.body.phone;
    if (!phone || !/^(?:\+254|0)?7\d{8}$/.test(phone)) {
      return res.status(400).json({ message: 'Enter a valid Kenyan phone number, e.g. 07XXXXXXXX' });
    }
    const stk = await stkPush({ amount: reg.Event.price, phone, accountReference: 'EVENT', transactionDesc: reg.Event.title.slice(0, 13) });
    await Payment.create({
      userId: req.user.id, amount: reg.Event.price, phone, purpose: 'event',
      referenceId: reg.id, merchantRequestId: stk.MerchantRequestID,
      checkoutRequestId: stk.CheckoutRequestID, status: 'pending',
    });
    res.json({ mpesa: stk });
  } catch (err) {
    const reason = err.response?.data?.errorMessage || err.response?.data?.ResponseDescription || err.message;
    console.error(`[mpesa] STK push failed: ${reason}`, err.daraja || err.response?.data || '');
    res.status(502).json({ message: `Could not reach M-Pesa: ${reason}` });
  }
});

router.get('/registrations/mine', protect, async (req, res, next) => {
  try {
    const registrations = await EventRegistration.findAll({
      where: { userId: req.user.id }, include: Event, order: [['createdAt', 'DESC']],
    });
    const withPayments = await Promise.all(registrations.map(attachEventPayment));
    res.json({ registrations: withPayments });
  } catch (err) { next(err); }
});

router.get('/registrations/:id', protect, async (req, res, next) => {
  try {
    const where = ['admin', 'staff'].includes(req.user.role) ? { id: req.params.id } : { id: req.params.id, userId: req.user.id };
    const reg = await EventRegistration.findOne({ where, include: Event });
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    res.json({ registration: await attachEventPayment(reg) });
  } catch (err) { next(err); }
});

module.exports = router;
