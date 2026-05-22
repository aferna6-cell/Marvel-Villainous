// `gainPower` action icon (marvel-villainous-plan.md §3).
// Assumes legality already checked by validate.ts.

import { cloneState } from '../util';
import type { GameState, PlayerId } from '../types';

/**
 * Power granted by one `gainPower` action icon.
 * PLACEHOLDER VALUE — the printed per-icon amount must be confirmed against
 * the rulebook. See RULES_QUESTIONS.md.
 */
export const POWER_PER_GAIN_ICON = 1;

export function applyGain(state: GameState, player: PlayerId, amount: number): GameState {
  const s = cloneState(state);
  const p = s.players[player];
  if (!p) throw new Error('applyGain: player missing');

  p.power += amount;
  s.log.push({ turn: s.turn, player, message: `gained ${amount} power` });
  s.pendingTriggers.push({ event: 'powerGained', player, payload: { amount } });
  return s;
}
