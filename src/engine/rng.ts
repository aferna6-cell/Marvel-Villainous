// Seedable, pure RNG (mulberry32). The engine never holds RNG state in a
// global: every draw is a pure function of (seed, cursor). The caller threads
// the returned `nextCursor` forward, which keeps the whole engine
// replay-testable (marvel-villainous-plan.md §2).

export interface RngResult {
  /** Uniform value in [0, 1). */
  value: number;
  /** Cursor to pass to the next draw. */
  nextCursor: number;
}

/**
 * One mulberry32 step. `(seed, cursor)` fully determines `value`; the same
 * inputs always yield the same output, with no shared mutable state.
 */
export function rng(seed: number, cursor: number): RngResult {
  let t = (seed + Math.imul(cursor + 1, 0x9e3779b9)) | 0;
  t = (t + 0x6d2b79f5) | 0;
  let x = Math.imul(t ^ (t >>> 15), 1 | t);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return { value, nextCursor: cursor + 1 };
}

export interface RngIntResult {
  /** Integer in [0, maxExclusive). */
  value: number;
  nextCursor: number;
}

/** A bounded integer draw, in [0, maxExclusive). */
export function rngInt(seed: number, cursor: number, maxExclusive: number): RngIntResult {
  if (maxExclusive <= 0) throw new Error('rngInt: maxExclusive must be positive');
  const r = rng(seed, cursor);
  return { value: Math.floor(r.value * maxExclusive), nextCursor: r.nextCursor };
}

export interface ShuffleResult<T> {
  /** A new shuffled array — the input is not mutated. */
  items: T[];
  nextCursor: number;
}

/** Fisher-Yates shuffle driven by the seeded RNG. Pure: input is untouched. */
export function shuffle<T>(
  items: readonly T[],
  seed: number,
  cursor: number,
): ShuffleResult<T> {
  const result = items.slice();
  let c = cursor;
  for (let i = result.length - 1; i > 0; i--) {
    const r = rng(seed, c);
    c = r.nextCursor;
    const j = Math.floor(r.value * (i + 1));
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }
  return { items: result, nextCursor: c };
}
