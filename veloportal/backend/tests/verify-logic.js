// Runs the same assertions as tests/compatibility.test.js and tests/mpesa.test.js
// using only Node's built-in assert module — no npm install required. Useful for a
// quick sanity check before `npm install && npm test` (the full Jest suite).
//
// Run with:  node tests/verify-logic.js
const assert = require('assert');
const { checkCompatibility, TOLERANCE_MM } = require('../utils/compatibility');
const { normalizePhone } = require('../utils/phone');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed += 1;
  } catch (err) {
    console.log(`  \x1b[31m✗ ${name}\x1b[0m\n    ${err.message}`);
    failed += 1;
  }
}

console.log('checkCompatibility (bike customizer fit rule)');
const frame = { headtubeDiameter: 34.0, wheelSize: '29"' };

check('matching fork within tolerance is compatible', () => {
  assert.strictEqual(checkCompatibility({ frame, fork: { steererDiameter: 34.0 }, wheel: null }).compatible, true);
});
check('fork exactly at the tolerance boundary is still compatible', () => {
  assert.strictEqual(checkCompatibility({ frame, fork: { steererDiameter: 34.0 + TOLERANCE_MM }, wheel: null }).compatible, true);
});
check('fork just outside tolerance is a mechanical conflict', () => {
  const r = checkCompatibility({ frame, fork: { steererDiameter: 34.0 + TOLERANCE_MM + 0.01 }, wheel: null });
  assert.strictEqual(r.compatible, false);
  assert.match(r.notes[0], /mechanical size conflict/i);
});
check('grossly mismatched fork (44mm on a 34mm frame) fails', () => {
  assert.strictEqual(checkCompatibility({ frame, fork: { steererDiameter: 44.0 }, wheel: null }).compatible, false);
});
check('matching wheel size is compatible', () => {
  assert.strictEqual(checkCompatibility({ frame, fork: null, wheel: { wheelSize: '29"' } }).compatible, true);
});
check('mismatched wheel size fails', () => {
  assert.strictEqual(checkCompatibility({ frame, fork: null, wheel: { wheelSize: '26"' } }).compatible, false);
});
check('fork ok but wheel mismatched still fails overall', () => {
  assert.strictEqual(checkCompatibility({ frame, fork: { steererDiameter: 34.0 }, wheel: { wheelSize: '26"' } }).compatible, false);
});
check('no fork or wheel selected is trivially compatible with no notes', () => {
  const r = checkCompatibility({ frame, fork: null, wheel: null });
  assert.strictEqual(r.compatible, true);
  assert.strictEqual(r.notes.length, 0);
});
check('throws when no frame is provided', () => {
  assert.throws(() => checkCompatibility({ frame: null, fork: null, wheel: null }));
});

console.log('\nnormalizePhone (M-Pesa MSISDN formatting)');
check('converts 07XXXXXXXX to 2547XXXXXXXX', () => {
  assert.strictEqual(normalizePhone('0712345678'), '254712345678');
});
check('converts +2547XXXXXXXX to 2547XXXXXXXX', () => {
  assert.strictEqual(normalizePhone('+254712345678'), '254712345678');
});
check('converts bare 7XXXXXXXX to 2547XXXXXXXX', () => {
  assert.strictEqual(normalizePhone('712345678'), '254712345678');
});
check('leaves an already-correct 2547XXXXXXXX untouched', () => {
  assert.strictEqual(normalizePhone('254712345678'), '254712345678');
});
check('strips whitespace from the input', () => {
  assert.strictEqual(normalizePhone('0712 345 678'), '254712345678');
});
check('handles Safaricom 01XX numbers the same way', () => {
  assert.strictEqual(normalizePhone('0112345678'), '254112345678');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
