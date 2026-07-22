/** Normalizes a Kenyan phone number to the 2547XXXXXXXX format Daraja expects */
function normalizePhone(phone) {
  let p = String(phone || '').replace(/\s+/g, '').replace(/^\+/, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (/^7\d{8}$/.test(p) || /^1\d{8}$/.test(p)) p = '254' + p;
  return p;
}

function isValidKenyanMsisdn(phone) {
  return /^254(7|1)\d{8}$/.test(normalizePhone(phone));
}

module.exports = { normalizePhone, isValidKenyanMsisdn };
