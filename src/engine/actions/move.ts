// `moveVillain` action (marvel-villainous-plan.md §3, step 2).
// Assumes legality already checked by validate.ts.

import { cloneState } from '../util';
import type { GameState, LocationIndex } from '../types';

export function applyMove(state: GameState, to: LocationIndex): GameState {
  const s = cloneState(state);
  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyMove: active player missing');

  const from = player.realm.villainTokenAt;
  player.realm.villainTokenAt = to;
  s.phase = 'actions';
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `moved villain to location ${to}`,
  });
  s.pendingTriggers.push({
    event: 'villainMoved',
    player: s.activePlayer,
    payload: { from, to },
  });
  return s;
}
