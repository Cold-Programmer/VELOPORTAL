const router = require('express').Router();
const { Payment, Order, Rental, EventRegistration } = require('../models');
const { protect } = require('../middleware/auth');
const { stkQuery, SANDBOX_TEST_MSISDN } = require('../utils/mpesa');

// Applies a final M-Pesa result (from either the webhook callback or the
// active stkQuery fallback below) to a Payment row and the record it belongs
// to. Shared so both paths behave identically and never drift out of sync.
async function applyResult(payment, { resultCode, resultDesc, mpesaReceiptNumber }) {
  if (payment.status !== 'pending') return payment; // already settled — don't overwrite

  if (Number(resultCode) === 0) {
    payment.status = 'success';
    payment.mpesaReceiptNumber = mpesaReceiptNumber || payment.mpesaReceiptNumber;
    payment.resultDesc = resultDesc;
    await payment.save();

    if (payment.purpose === 'order') {
      await Order.update({ status: 'paid' }, { where: { id: payment.referenceId } });
    } else if (payment.purpose === 'rental') {
      await Rental.update({ status: 'confirmed', paymentStatus: 'paid' }, { where: { id: payment.referenceId } });
    } else if (payment.purpose === 'rental_penalty') {
      await Rental.update({ lateFeeStatus: 'paid' }, { where: { id: payment.referenceId } });
    } else if (payment.purpose === 'event') {
      await EventRegistration.update({ paymentStatus: 'paid' }, { where: { id: payment.referenceId } });
    }
  } else {
    payment.status = 'failed';
    payment.resultDesc = resultDesc;
    await payment.save();
  }
  return payment;
}

// Daraja calls this URL after the customer completes/cancels the STK prompt.
// Must be a publicly reachable HTTPS URL (see MPESA_CALLBACK_URL in .env).
router.post('/mpesa/callback', async (req, res, next) => {
  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) return res.status(400).json({ message: 'Malformed callback payload' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    const payment = await Payment.findOne({ where: { checkoutRequestId: CheckoutRequestID } });
    if (!payment) return res.status(200).json({ message: 'Payment record not found, ignoring' });

    const items = CallbackMetadata?.Item || [];
    const mpesaReceiptNumber = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
    await applyResult(payment, { resultCode: ResultCode, resultDesc: ResultDesc, mpesaReceiptNumber });

    // Daraja expects this exact acknowledgement shape
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) { next(err); }
});

// Active fallback: ask Daraja directly for the transaction's current status
// and persist the result. Used when the callback hasn't arrived yet (e.g. the
// callback URL is unreachable) — this is what actually flips a stuck
// "pending" payment to success/failed instead of just reporting raw data.
router.get('/mpesa/status/:checkoutRequestId', protect, async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ where: { checkoutRequestId: req.params.checkoutRequestId } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status !== 'pending') return res.json({ status: payment.status, payment });

    try {
      const result = await stkQuery(req.params.checkoutRequestId);
      // ResultCode is only present once the customer has responded to the
      // prompt (entered PIN, cancelled, or it timed out). While the prompt is
      // still awaiting input, Daraja returns errorCode 500.001.1001 — that is
      // NOT a failure, it just means "still waiting," so we leave it pending.
      if (result.ResultCode !== undefined) {
        await applyResult(payment, { resultCode: result.ResultCode, resultDesc: result.ResultDesc });
      }
      const fresh = await Payment.findByPk(payment.id);
      res.json({ status: fresh.status, daraja: result });
    } catch (queryErr) {
      // Query itself failing (e.g. rate-limited) shouldn't break polling —
      // just report the current known status.
      res.json({ status: payment.status, queryError: queryErr.message });
    }
  } catch (err) { next(err); }
});

router.get('/mine', protect, async (req, res, next) => {
  try {
    const payments = await Payment.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ payments });
  } catch (err) { next(err); }
});

// Non-secret config the frontend uses to show sandbox guidance (e.g. "use
// this test number") — never exposes keys/secrets/passkey.
router.get('/mpesa/config', (req, res) => {
  const env = process.env.MPESA_ENV || 'sandbox';
  res.json({
    environment: env,
    isSandbox: env !== 'production',
    sandboxTestMsisdn: env !== 'production' ? SANDBOX_TEST_MSISDN : null,
  });
});

module.exports = router;
