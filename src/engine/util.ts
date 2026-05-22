// Small shared engine utilities. Kept in one file to avoid an import cycle
// between state.ts (the reducer) and validate.ts (the legality checker).

import type { GameState, PlayerState } from './types';

/** Compile-time exhaustiveness guard for discriminated unions. */
export function assertNever(value: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(value)}`);
}

/**
 * Deep clone of game state. Every reducer/action clones its input through this
 * before mutating, which guarantees no action ever mutates state in place
 * (marvel-villainous-plan.md §2 — the engine is a pure reducer).
 */
export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

/**
 * Default end-of-turn draw-up-to hand size (marvel-villainous-plan.md §3).
 * Per-villain exceptions are encoded by setting `PlayerState.handSize`.
 */
export const DEFAULT_HAND_SIZE = 4;

/**
 * Resolve a player's effective hand size: their per-villain override if set,
 * otherwise the global default.
 */
export function getHandSize(player: PlayerState): number {
  return player.handSize ?? DEFAULT_HAND_SIZE;
}
