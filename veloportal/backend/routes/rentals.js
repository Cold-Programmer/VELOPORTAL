const router = require('express').Router();
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Rental, Bicycle, Payment } = require('../models');
const { protect, staffOrAdmin } = require('../middleware/auth');

// Data browsing requires a signed-in account — VeloPortal does not expose
// catalog/listing data to anonymous visitors.
router.use(protect);
const { stkPush } = require('../utils/mpesa');
const { paymentLimiter } = require('../middleware/rateLimit');

const attachPayment = async (rental, bicycleOverride) => {
  const [payment, penaltyPayment] = await Promise.all([
    Payment.findOne({ where: { purpose: 'rental', referenceId: rental.id }, order: [['createdAt', 'DESC']] }),
    Payment.findOne({ where: { purpose: 'rental_penalty', referenceId: rental.id }, order: [['createdAt', 'DESC']] }),
  ]);
  const plain = rental.toJSON ? rental.toJSON() : rental;
  // Explicit override wins — used right after creation, when the caller
  // already has the Bicycle loaded and the fresh instance has no
  // association attached yet (avoids an extra DB round trip and any
  // ambiguity around Sequelize instance-property association behaviour).
  if (bicycleOverride) plain.Bicycle = bicycleOverride.toJSON ? bicycleOverride.toJSON() : bicycleOverride;
  plain.Payment = payment || null;
  plain.PenaltyPayment = penaltyPayment || null;
  return plain;
};

// Check availability for a bicycle across a date range
router.get('/availability/:bicycleId', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const overlap = await Rental.findOne({
      where: {
        bicycleId: req.params.bicycleId,
        status: { [Op.in]: ['pending', 'confirmed', 'active'] },
        startDate: { [Op.lt]: end },
        endDate: { [Op.gt]: start },
      },
    });
    res.json({ available: !overlap });
  } catch (err) { next(err); }
});

router.post(
  '/',
  protect,
  paymentLimiter,
  [
    body('bicycleId').notEmpty().withMessage('Select a bicycle to rent'),
    body('startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid start date'),
    body('endDate').notEmpty().withMessage('End date is required').isISO8601().withMessage('Invalid end date'),
    body('phone').trim().notEmpty().withMessage('An M-Pesa phone number is required')
      .matches(/^(?:\+254|0)?7\d{8}$/).withMessage('Enter a valid Kenyan phone number, e.g. 07XXXXXXXX'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });

      const { bicycleId, startDate, endDate, phone } = req.body;
      if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({ message: 'End time must be after the start time' });
      }

      const bike = await Bicycle.findByPk(bicycleId);
      if (!bike || !bike.forRent) return res.status(404).json({ message: 'Rental bicycle not found' });

      const overlap = await Rental.findOne({
        where: {
          bicycleId, status: { [Op.in]: ['pending', 'confirmed', 'active'] },
          startDate: { [Op.lt]: endDate }, endDate: { [Op.gt]: startDate },
        },
      });
      if (overlap) return res.status(409).json({ message: 'Bicycle is already booked for that period' });

      const hours = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 36e5));
      const totalCost = hours * Number(bike.rentalPricePerHour);

      const rental = await Rental.create({
        userId: req.user.id, bicycleId, startDate, endDate, totalCost, status: 'pending',
      });

      try {
        const stk = await stkPush({
          amount: totalCost, phone, accountReference: 'RENTAL', transactionDesc: 'Bike rental',
        });
        await Payment.create({
          userId: req.user.id, amount: totalCost, phone, purpose: 'rental',
          referenceId: rental.id, merchantRequestId: stk.MerchantRequestID,
          checkoutRequestId: stk.CheckoutRequestID, status: 'pending',
        });
        return res.status(201).json({ rental: await attachPayment(rental, bike), mpesa: stk, paymentInitiated: true });
      } catch (mpesaErr) {
        const reason = mpesaErr.response?.data?.errorMessage || mpesaErr.response?.data?.ResponseDescription || mpesaErr.message;
        console.error(`[mpesa] STK push failed: ${reason}`, mpesaErr.daraja || mpesaErr.response?.data || '');
        return res.status(201).json({
          rental: await attachPayment(rental, bike), paymentInitiated: false,
          message: `Booking held, but the M-Pesa prompt could not be sent (${reason}). Retry payment from your dashboard.`,
        });
      }
    } catch (err) { next(err); }
  }
);

router.post('/:id/retry-payment', protect, paymentLimiter, async (req, res, next) => {
  try {
    const rental = await Rental.findOne({ where: { id: req.params.id, userId: req.user.id }, include: Bicycle });
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    if (rental.status !== 'pending') return res.status(400).json({ message: 'This rental is not awaiting payment' });

    const phone = req.body.phone;
    if (!phone || !/^(?:\+254|0)?7\d{8}$/.test(phone)) {
      return res.status(400).json({ message: 'Enter a valid Kenyan phone number, e.g. 07XXXXXXXX' });
    }

    const stk = await stkPush({ amount: rental.totalCost, phone, accountReference: 'RENTAL', transactionDesc: 'Bike rental' });
    await Payment.create({
      userId: req.user.id, amount: rental.totalCost, phone, purpose: 'rental',
      referenceId: rental.id, merchantRequestId: stk.MerchantRequestID,
      checkoutRequestId: stk.CheckoutRequestID, status: 'pending',
    });
    res.json({ mpesa: stk });
  } catch (err) {
    const reason = err.response?.data?.errorMessage || err.response?.data?.ResponseDescription || err.message;
    console.error(`[mpesa] STK push failed: ${reason}`, err.daraja || err.response?.data || '');
    res.status(502).json({ message: `Could not reach M-Pesa: ${reason}` });
  }
});

router.get('/mine', protect, async (req, res, next) => {
  try {
    const rentals = await Rental.findAll({
      where: { userId: req.user.id }, include: Bicycle, order: [['createdAt', 'DESC']],
    });
    res.json({ rentals });
  } catch (err) { next(err); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const where = ['admin', 'staff'].includes(req.user.role) ? { id: req.params.id } : { id: req.params.id, userId: req.user.id };
    const rental = await Rental.findOne({ where, include: Bicycle });
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    res.json({ rental: await attachPayment(rental) });
  } catch (err) { next(err); }
});

router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    const rental = await Rental.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    rental.status = 'cancelled';
    await rental.save();
    res.json({ rental });
  } catch (err) { next(err); }
});

router.put('/:id/status', protect, staffOrAdmin, async (req, res, next) => {
  try {
    const rental = await Rental.findByPk(req.params.id);
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    rental.status = req.body.status;
    await rental.save();
    res.json({ rental });
  } catch (err) { next(err); }
});

// Shop attendant/mechanic check-in: logs the actual return time and auto-calculates any
// late-return penalty, exactly as described in the SDS "Calculate Overdue & Late Penalty
// Invoices" module — this is what powers the ledger-style receipt.
router.put('/:id/checkin', protect, staffOrAdmin, async (req, res, next) => {
  try {
    const rental = await Rental.findByPk(req.params.id, { include: Bicycle });
    if (!rental) return res.status(404).json({ message: 'Rental not found' });

    const actualReturnDate = req.body.actualReturnDate ? new Date(req.body.actualReturnDate) : new Date();
    const overdueMs = actualReturnDate - new Date(rental.endDate);
    const lateHours = overdueMs > 0 ? Math.ceil(overdueMs / 36e5) : 0;
    const lateFee = lateHours * Number(rental.Bicycle?.rentalPricePerHour || 0);

    rental.actualReturnDate = actualReturnDate;
    rental.lateHours = lateHours;
    rental.lateFee = lateFee;
    rental.lateFeeStatus = lateFee > 0 ? 'unpaid' : 'none';
    rental.status = 'completed';
    await rental.save();

    res.json({ rental: await attachPayment(rental) });
  } catch (err) { next(err); }
});

// Rider settles an outstanding late-return penalty via a fresh M-Pesa STK push
router.post('/:id/pay-penalty', protect, paymentLimiter, async (req, res, next) => {
  try {
    const rental = await Rental.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    if (rental.lateFeeStatus !== 'unpaid' || Number(rental.lateFee) <= 0) {
      return res.status(400).json({ message: 'There is no outstanding penalty on this rental' });
    }
    const phone = req.body.phone;
    if (!phone || !/^(?:\+254|0)?7\d{8}$/.test(phone)) {
      return res.status(400).json({ message: 'Enter a valid Kenyan phone number, e.g. 07XXXXXXXX' });
    }

    const stk = await stkPush({ amount: rental.lateFee, phone, accountReference: 'PENALTY', transactionDesc: 'Late fee' });
    await Payment.create({
      userId: req.user.id, amount: rental.lateFee, phone, purpose: 'rental_penalty',
      referenceId: rental.id, merchantRequestId: stk.MerchantRequestID,
      checkoutRequestId: stk.CheckoutRequestID, status: 'pending',
    });
    res.json({ mpesa: stk });
  } catch (err) {
    const reason = err.response?.data?.errorMessage || err.response?.data?.ResponseDescription || err.message;
    console.error(`[mpesa] STK push failed: ${reason}`, err.daraja || err.response?.data || '');
    res.status(502).json({ message: `Could not reach M-Pesa: ${reason}` });
  }
});

module.exports = router;
