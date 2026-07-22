const axios = require('axios');
const { normalizePhone } = require('./phone');

// Safaricom's sandbox environment only delivers a real STK push prompt to this
// published test number (or numbers you've explicitly registered as test
// credentials in the Daraja portal) — a real personal number will NOT receive
// anything in sandbox mode, even though the API call itself succeeds.
const SANDBOX_TEST_MSISDN = '254708374149';

const BASE_URL =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function assertConfigured() {
  // These four are genuinely required to build and sign the STK push request
  // itself — without them Daraja will reject the call outright.
  const required = ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY'];
  const missing = required.filter((k) => !process.env[k] || process.env[k].includes('your_') || process.env[k].includes('<your-'));
  if (missing.length) {
    const err = new Error(
      `M-Pesa is not fully configured — missing/placeholder values for: ${missing.join(', ')}. ` +
      `Set real values in backend/.env (see README section 5).`
    );
    err.statusCode = 500;
    throw err;
  }

  // The callback URL is passed through to Daraja as-is rather than blocked
  // here: Daraja accepts the request either way (it doesn't verify
  // reachability upfront), and this app's active status-polling fallback
  // (GET /api/payments/mpesa/status/:checkoutRequestId, which calls
  // stkQuery directly) confirms payment even if the callback never arrives.
  // A broken callback just means you rely entirely on polling instead of
  // getting an instant push update — it does not stop payments from working.
  const url = process.env.MPESA_CALLBACK_URL || '';
  const looksBroken = !url || url.includes('your-') || url.includes('<your') || !/^https:\/\//.test(url);
  if (looksBroken) {
    console.warn(
      '⚠️  MPESA_CALLBACK_URL is missing/placeholder/non-https — the STK push will still be sent, ' +
      'but relies on active status polling instead of an instant callback. See README section 6.'
    );
  }
}

/** Fetches an OAuth access token using the Consumer Key/Secret (Basic Auth) */
async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
}

/**
 * Initiates an STK Push (Lipa na M-Pesa Online) request to the customer's phone.
 * amount: number (KES, whole shillings)
 * phone: customer phone (any common Kenyan format)
 * accountReference: short string identifying what is being paid for (e.g. order number)
 * transactionDesc: short description shown to Daraja
 */
async function stkPush({ amount, phone, accountReference, transactionDesc }) {
  assertConfigured();

  const msisdn = normalizePhone(phone);
  if (!/^254(7|1)\d{8}$/.test(msisdn)) {
    const err = new Error(`"${phone}" is not a valid Kenyan phone number`);
    err.statusCode = 400;
    throw err;
  }

  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const accessToken = await getAccessToken();

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.max(1, Math.round(amount)),
    PartyA: msisdn,
    // For Lipa Na M-Pesa Online (STK Push) specifically, Daraja requires
    // PartyB to equal BusinessShortCode — NOT a separately-issued number.
    // (A separate PartyB, like a B2C/Initiator-style short code, is for a
    // different Daraja product entirely and gets this request rejected.)
    PartyB: shortcode,
    PhoneNumber: msisdn,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: (accountReference || 'VeloPortal').slice(0, 12),
    TransactionDesc: (transactionDesc || 'Payment').slice(0, 13),
  };

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  // Daraja can return HTTP 200 with a non-zero ResponseCode when it rejects the
  // request for reasons that don't surface as an HTTP error (e.g. sandbox
  // number not registered as a test MSISDN, invalid shortcode/PartyB combo).
  // Without this check we'd tell the customer "check your phone" for a push
  // that Safaricom never actually queued — exactly the "receipt but no
  // prompt" symptom.
  if (String(data.ResponseCode) !== '0') {
    const err = new Error(data.ResponseDescription || data.errorMessage || 'Safaricom rejected the STK push request.');
    err.statusCode = 502;
    err.daraja = data;
    throw err;
  }

  return data; // { MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription, CustomerMessage }
}

/** Queries the status of a previously initiated STK push (used as a fallback to the callback) */
async function stkQuery(checkoutRequestId) {
  assertConfigured();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const accessToken = await getAccessToken();

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return data;
}

module.exports = { getAccessToken, stkPush, stkQuery, normalizePhone, assertConfigured, SANDBOX_TEST_MSISDN };
