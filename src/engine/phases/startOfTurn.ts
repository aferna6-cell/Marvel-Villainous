// Start-of-turn phase (marvel-villainous-plan.md §3, step 1).
//
// Triggers any "at start of turn" effects, resolves location conditions, and
// resets per-turn flags before handing control to the player for their Move
// phase. The triggered-ability event-bus drain happens in the reducer's
// auto-advance loop after this returns; CHUNK 5+ wires real handlers.

import { cloneState } from '../util';
import type { GameState, TriggerSpec } from '../types';

export function canAdvance(state: GameState): boolean {
  return state.phase === 'start' && state.pendingPrompt === null && state.winner === null;
}

/**
 * The `startTurn` action: enter the Move phase. Clears per-turn icon usage,
 * resets `mustMoveDifferent` to its default, and enqueues a `turnStart`
 * trigger plus one `conditionTick` trigger per condition card in play on the
 * active player's realm.
 */
export function applyStartTurn(state: GameState): GameState {
  const s = cloneState(state);
  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyStartTurn: active player missing');

  s.phase = 'move';
  s.usedIcons = [];
  player.mustMoveDifferent = true;

  s.log.push({ turn: s.turn, player: s.activePlayer, message: 'start of turn' });

  const triggers: TriggerSpec[] = [
    { event: 'turnStart', player: s.activePlayer, payload: {} },
  ];
  for (const loc of player.realm.locations) {
    for (const condition of loc.conditions) {
      triggers.push({
        event: 'conditionTick',
        player: s.activePlayer,
        payload: { cardId: condition.cardId, instanceId: condition.instanceId },
      });
    }
  }
  s.pendingTriggers.push(...triggers);
  return s;
}

/** Automatic advance: from the Start phase, run start-of-turn processing. */
export function runAutomatic(state: GameState): GameState {
  return canAdvance(state) ? applyStartTurn(state) : state;
}
