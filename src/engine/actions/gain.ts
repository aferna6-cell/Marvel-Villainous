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

  // Passive penalties on power gain from in-play Fate cards.
  let net = amount;
  let note = '';
  if (p.flags['visionPowerPenalty']) {
    net = Math.max(0, net - 1);
    note += ' (Vision: -1)';
  }
  if (p.flags['invasionStarkActive']) {
    net = Math.max(0, net - 1);
    note += ' (Invasion: -1)';
  }

  p.power += net;
  s.log.push({ turn: s.turn, player, message: `gained ${net} power${note}` });
  s.pendingTriggers.push({ event: 'powerGained', player, payload: { amount: net } });
  return s;
}
