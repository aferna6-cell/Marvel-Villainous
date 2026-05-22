// End-of-turn phase (marvel-villainous-plan.md §3, step 5).
// The actual end-of-turn work (draw to hand size, pass to next player) lives
// in actions/endTurn.ts; this scaffold exposes the phase interface.

import { applyEndTurn } from '../actions/endTurn';
import type { GameState } from '../types';

export function canAdvance(state: GameState): boolean {
  return state.phase === 'end' || state.phase === 'actions' || state.phase === 'fate';
}

export function runAutomatic(state: GameState): GameState {
  return canAdvance(state) ? applyEndTurn(state) : state;
}
