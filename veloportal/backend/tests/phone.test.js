const { normalizePhone } = require('../utils/phone');

describe('normalizePhone (M-Pesa MSISDN formatting)', () => {
  test('converts 07XXXXXXXX to 2547XXXXXXXX', () => {
    expect(normalizePhone('0712345678')).toBe('254712345678');
  });

  test('converts +2547XXXXXXXX to 2547XXXXXXXX', () => {
    expect(normalizePhone('+254712345678')).toBe('254712345678');
  });

  test('converts bare 7XXXXXXXX to 2547XXXXXXXX', () => {
    expect(normalizePhone('712345678')).toBe('254712345678');
  });

  test('leaves an already-correct 2547XXXXXXXX untouched', () => {
    expect(normalizePhone('254712345678')).toBe('254712345678');
  });

  test('strips whitespace from the input', () => {
    expect(normalizePhone('0712 345 678')).toBe('254712345678');
  });

  test('handles Safaricom 01XX numbers the same way', () => {
    expect(normalizePhone('0112345678')).toBe('254112345678');
  });
});
