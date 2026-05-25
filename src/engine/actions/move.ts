// `moveVillain` action (marvel-villainous-plan.md §3, step 2).
// Assumes legality already checked by validate.ts.
//
// Engine convention (per the user's preferred experience): moving to a
// location AUTO-COLLECTS any `gainPower` icons in the destination's top
// row (player-side, uncovered) that haven't been used this turn. The
// icons are marked spent so the player can't double-collect.

import { cloneState } from '../util';
import { applyGain } from './gain';
import type { GameState, LocationIndex } from '../types';

export function applyMove(state: GameState, to: LocationIndex): GameState {
  let s = cloneState(state);
  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyMove: active player missing');

  const from = player.realm.villainTokenAt;
  player.realm.villainTokenAt = to;
  s.phase = 'actions';
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `moved villain to location ${to + 1}`,
  });
  s.pendingTriggers.push({
    event: 'villainMoved',
    player: s.activePlayer,
    payload: { from, to },
  });

  // Auto-collect gainPower icons from the destination's top row.
  const loc = player.realm.locations[to];
  if (loc) {
    for (let i = 0; i < loc.topIcons.length; i++) {
      const icon = loc.topIcons[i];
      if (!icon) continue;
      const alreadyUsed = s.usedIcons.some((u) => u.location === to && u.iconIndex === i);
      if (alreadyUsed) continue;
      let amount = 0;
      if (icon === 'gainPower') amount = 1;
      else if (icon === 'gainPower2') amount = 2;
      else if (icon === 'gainPower3') amount = 3;
      if (amount > 0) {
        s = applyGain(s, s.activePlayer, amount);
        s.usedIcons.push({ location: to, iconIndex: i });
      }
    }
  }
  return s;
}
