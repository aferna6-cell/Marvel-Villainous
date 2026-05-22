// End-of-turn phase (marvel-villainous-plan.md §3, step 5).
//
// `runAutomatic` performs the actual end-of-turn work — draw back up to the
// active player's hand size, rotate to the next player in `playerOrder`,
// reset per-turn state, and increment the turn counter when play wraps back
// to the first seat. The reducer's auto-advance loop will call this whenever
// the phase reaches `'end'` (set by `applyEndTurn`).

import { cloneState } from '../util';
import { applyDraw } from '../actions/endTurn';
import type { GameState } from '../types';

export function canAdvance(state: GameState): boolean {
  return state.phase === 'end' && state.pendingPrompt === null && state.winner === null;
}

export function runAutomatic(state: GameState): GameState {
  if (!canAdvance(state)) return state;

  // 1) Draw the active player back up to their hand size (§3 end-of-turn draw).
  const drawn = applyDraw(state, state.activePlayer);

  // 2) Rotate to the next player; increment `turn` on wrap to the first seat.
  const s = cloneState(drawn);
  const idx = s.playerOrder.indexOf(s.activePlayer);
  const nextIdx = (idx + 1) % s.playerOrder.length;
  const next = s.playerOrder[nextIdx];
  if (next === undefined) throw new Error('endOfTurn.runAutomatic: empty player order');

  if (nextIdx === 0) s.turn += 1;
  s.activePlayer = next;
  s.phase = 'start';
  s.usedIcons = [];
  s.log.push({ turn: s.turn, player: next, message: `turn passes to ${next}` });
  return s;
}
