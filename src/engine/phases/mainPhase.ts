// Move + actions phase (marvel-villainous-plan.md §3, steps 2-3).
// This phase is entirely player-driven; there is no automatic processing.
// CHUNK 4 wires the move→actions→fate progression.

import type { GameState } from '../types';

export function canAdvance(state: GameState): boolean {
  return state.phase === 'actions';
}

export function runAutomatic(state: GameState): GameState {
  return state;
}
