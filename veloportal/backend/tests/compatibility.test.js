const { checkCompatibility, TOLERANCE_MM } = require('../utils/compatibility');

const frame = { headtubeDiameter: 34.0, wheelSize: '29"' };

describe('checkCompatibility (bike customizer fit rule)', () => {
  test('matching fork within tolerance is compatible', () => {
    const result = checkCompatibility({ frame, fork: { steererDiameter: 34.0 }, wheel: null });
    expect(result.compatible).toBe(true);
  });

  test('fork exactly at the tolerance boundary is still compatible', () => {
    const result = checkCompatibility({ frame, fork: { steererDiameter: 34.0 + TOLERANCE_MM }, wheel: null });
    expect(result.compatible).toBe(true);
  });

  test('fork just outside tolerance is a mechanical conflict', () => {
    const result = checkCompatibility({ frame, fork: { steererDiameter: 34.0 + TOLERANCE_MM + 0.01 }, wheel: null });
    expect(result.compatible).toBe(false);
    expect(result.notes[0]).toMatch(/mechanical size conflict/i);
  });

  test('grossly mismatched fork (e.g. 44mm tapered on a 34mm frame) fails', () => {
    const result = checkCompatibility({ frame, fork: { steererDiameter: 44.0 }, wheel: null });
    expect(result.compatible).toBe(false);
  });

  test('matching wheel size is compatible', () => {
    const result = checkCompatibility({ frame, fork: null, wheel: { wheelSize: '29"' } });
    expect(result.compatible).toBe(true);
  });

  test('mismatched wheel size fails', () => {
    const result = checkCompatibility({ frame, fork: null, wheel: { wheelSize: '26"' } });
    expect(result.compatible).toBe(false);
  });

  test('fork ok but wheel mismatched still fails overall', () => {
    const result = checkCompatibility({ frame, fork: { steererDiameter: 34.0 }, wheel: { wheelSize: '26"' } });
    expect(result.compatible).toBe(false);
  });

  test('no fork or wheel selected is trivially compatible with no notes', () => {
    const result = checkCompatibility({ frame, fork: null, wheel: null });
    expect(result.compatible).toBe(true);
    expect(result.notes).toHaveLength(0);
  });

  test('throws when no frame is provided', () => {
    expect(() => checkCompatibility({ frame: null, fork: null, wheel: null })).toThrow();
  });
});
