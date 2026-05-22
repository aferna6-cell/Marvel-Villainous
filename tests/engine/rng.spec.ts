import { describe, expect, it } from 'vitest';
import { rng, rngInt } from '../../src/engine/rng';

describe('rng()', () => {
  it('is deterministic — same (seed, cursor) yields the same value', () => {
    const a = rng(42, 7);
    const b = rng(42, 7);
    expect(a).toEqual(b);
  });

  it('advances the cursor by one', () => {
    expect(rng(1, 0).nextCursor).toBe(1);
    expect(rng(1, 99).nextCursor).toBe(100);
  });

  it('returns values within [0, 1)', () => {
    let cursor = 0;
    for (let i = 0; i < 500; i++) {
      const r = rng(123, cursor);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
      cursor = r.nextCursor;
    }
  });

  it('produces different streams for different seeds', () => {
    expect(rng(1, 0).value).not.toBe(rng(2, 0).value);
  });
});

describe('rngInt()', () => {
  it('returns integers within [0, maxExclusive)', () => {
    let cursor = 0;
    for (let i = 0; i < 500; i++) {
      const r = rngInt(7, cursor, 6);
      expect(Number.isInteger(r.value)).toBe(true);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(6);
      cursor = r.nextCursor;
    }
  });

  it('rejects a non-positive bound', () => {
    expect(() => rngInt(1, 0, 0)).toThrow();
  });
});
