// Start-of-turn phase (marvel-villainous-plan.md §3, step 1).
// CHUNK 4 fills in start-of-turn ability triggers and condition resolution.

import { cloneState } from '../util';
import type { GameState } from '../types';

export function canAdvance(state: GameState): boolean {
  return state.phase === 'start';
}

/**
 * The `startTurn` action: enter the move phase, clear per-turn icon usage, and
 * enqueue a `turnStart` trigger for the event bus.
 */
export function applyStartTurn(state: GameState): GameState {
  const s = cloneState(state);
  s.phase = 'move';
  s.usedIcons = [];
  s.log.push({ turn: s.turn, player: s.activePlayer, message: 'start of turn' });
  s.pendingTriggers.push({ event: 'turnStart', player: s.activePlayer, payload: {} });
  return s;
}

/** Automatic advance: from the start phase, run start-of-turn processing. */
export function runAutomatic(state: GameState): GameState {
  return canAdvance(state) ? applyStartTurn(state) : state;
}
