// Fate phase (marvel-villainous-plan.md §3, step 4; §4).
// Reveal-2 / play-1 / discard-1 resolution is built out in a later chunk.

import type { GameState } from '../types';

export function canAdvance(state: GameState): boolean {
  return state.phase === 'fate';
}

export function runAutomatic(state: GameState): GameState {
  return state;
}
