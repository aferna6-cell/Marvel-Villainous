// Fate phase (marvel-villainous-plan.md §3, step 4; §4).
//
// Entry happens via the `fateOpponent` action, which sets `state.phase` to
// `'fate'`, reveals the top 2 of the opponent's Fate deck, and parks a
// `pendingPrompt` carrying a `fatePlay` continuation. The actual play/discard
// resolution lives in `cards/effects.applyResolvePrompt` (via
// `resolveFatePlay`), which is invoked when the player resolves the prompt.
//
// Once the Fate prompt is resolved (no `pendingPrompt`, phase still `'fate'`),
// the auto-advance loop calls `runAutomatic` here, which transitions the
// state into the `'end'` phase to wrap the turn.

import { cloneState } from '../util';
import type { GameState } from '../types';

export function canAdvance(state: GameState): boolean {
  return state.phase === 'fate' && state.pendingPrompt === null && state.winner === null;
}

export function runAutomatic(state: GameState): GameState {
  if (!canAdvance(state)) return state;
  const s = cloneState(state);
  s.phase = 'end';
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: 'Fate phase complete; entering end-of-turn phase',
  });
  return s;
}
