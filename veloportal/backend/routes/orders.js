const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { Order, OrderItem, CartItem, Bicycle, Payment } = require('../models');
const { protect, staffOrAdmin } = require('../middleware/auth');
const { stkPush } = require('../utils/mpesa');
const { paymentLimiter } = require('../middleware/rateLimit');
const { sendOrderConfirmationEmail } = require('../utils/email');

router.use(protect);

const attachPayment = async (order) => {
  const payment = await Payment.findOne({
    where: { purpose: 'order', referenceId: order.id },
    order: [['createdAt', 'DESC']],
  });
  const plain = order.toJSON();
  plain.Payment = payment || null;
  return plain;
};

// Create an order from the user's current cart, then trigger an M-Pesa STK push
router.post(
  '/checkout',
  paymentLimiter,
  [
    body('shippingAddress').trim().notEmpty().withMessage('Delivery address is required'),
    body('shippingCity').trim().notEmpty().withMessage('City is required'),
    body('shippingPhone')
      .trim().notEmpty().withMessage('Phone number is required for M-Pesa payment')
      .matches(/^(?:\+254|0)?7\d{8}$/).withMessage('Enter a valid Kenyan phone number, e.g. 07XXXXXXXX'),
    body('paymentMethod').optional().isIn(['mpesa', 'cash_on_delivery']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });

      const { shippingAddress, shippingCity, shippingPhone, paymentMethod = 'mpesa' } = req.body;
      const cartItems = await CartItem.findAll({ where: { userId: req.user.id }, include: Bicycle });
      if (!cartItems.length) return res.status(400).json({ message: 'Your cart is empty' });

      const totalAmount = cartItems.reduce((s, i) => s + Number(i.Bicycle.price) * i.quantity, 0);
      const orderNumber = 'VP-' + Date.now().toString().slice(-8);

      const order = await Order.create({
        userId: req.user.id, orderNumber, totalAmount, shippingAddress, shippingCity,
        shippingPhone, paymentMethod, status: 'pending_payment',
      });

      await Promise.all(cartItems.map((i) => OrderItem.create({
        orderId: order.id, bicycleId: i.bicycleId, quantity: i.quantity, price: i.Bicycle.price,
      })));

      await CartItem.destroy({ where: { userId: req.user.id } });

      // Send order confirmation email (non-blocking)
      sendOrderConfirmationEmail({
        to: req.user.email, name: req.user.name, orderNumber,
        totalAmount,
        items: cartItems.map(i => ({ name: i.Bicycle.name, quantity: i.quantity, price: Number(i.Bicycle.price) })),
      }).catch((e) => console.error('[email:order]', e.message));

      if (paymentMethod === 'mpesa') {
        try {
          const stk = await stkPush({
            amount: totalAmount, phone: shippingPhone,
            accountReference: orderNumber, transactionDesc: 'VeloPortal order',
          });
          await Payment.create({
            userId: req.user.id, amount: totalAmount, phone: shippingPhone, purpose: 'order',
            referenceId: order.id, merchantRequestId: stk.MerchantRequestID,
            checkoutRequestId: stk.CheckoutRequestID, status: 'pending',
          });
          return res.status(201).json({ order: await attachPayment(order), mpesa: stk, paymentInitiated: true });
        } catch (mpesaErr) {
          // The order is safely on record even if Safaricom's sandbox rejects the STK request
          // (e.g. bad test credentials, unreachable callback URL). Surface a clear reason
          // instead of a raw 500, and let the customer retry payment without re-ordering.
          const reason = mpesaErr.response?.data?.errorMessage || mpesaErr.response?.data?.ResponseDescription || mpesaErr.message;
          console.error(`[mpesa] STK push failed: ${reason}`, mpesaErr.daraja || mpesaErr.response?.data || '');
          return res.status(201).json({
            order: await attachPayment(order), paymentInitiated: false,
            message: `Order placed, but the M-Pesa prompt could not be sent (${reason}). You can retry payment from your dashboard.`,
          });
        }
      }

      res.status(201).json({ order: await attachPayment(order), paymentInitiated: false });
    } catch (err) { next(err); }
  }
);

// Retry payment for an order stuck in pending_payment (failed/expired STK push)
router.post('/:id/retry-payment', paymentLimiter, async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending_payment') return res.status(400).json({ message: 'This order is not awaiting payment' });

    const stk = await stkPush({
      amount: order.totalAmount, phone: req.body.phone || order.shippingPhone,
      accountReference: order.orderNumber, transactionDesc: 'VeloPortal order',
    });
    await Payment.create({
      userId: req.user.id, amount: order.totalAmount, phone: req.body.phone || order.shippingPhone,
      purpose: 'order', referenceId: order.id, merchantRequestId: stk.MerchantRequestID,
      checkoutRequestId: stk.CheckoutRequestID, status: 'pending',
    });
    res.json({ mpesa: stk });
  } catch (err) {
    const reason = err.response?.data?.errorMessage || err.response?.data?.ResponseDescription || err.message;
    console.error(`[mpesa] STK push failed: ${reason}`, err.daraja || err.response?.data || '');
    res.status(502).json({ message: `Could not reach M-Pesa: ${reason}` });
  }
});

router.get('/mine', async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, include: Bicycle }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const where = ['admin', 'staff'].includes(req.user.role) ? { id: req.params.id } : { id: req.params.id, userId: req.user.id };
    const order = await Order.findOne({ where, include: [{ model: OrderItem, include: Bicycle }] });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order: await attachPayment(order) });
  } catch (err) { next(err); }
});

router.put('/:id/status', staffOrAdmin, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = req.body.status;
    await order.save();
    res.json({ order });
  } catch (err) { next(err); }
});

module.exports = router;
