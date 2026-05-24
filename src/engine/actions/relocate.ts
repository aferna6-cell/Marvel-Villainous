// Relocate action (rulebook §7 — Relocate Allies/Items between locations
// within your own Domain). Assumes legality already checked by validate.ts.

import { cloneState } from '../util';
import type { GameState, InstanceId, LocationIndex } from '../types';

export function applyRelocateAlly(
  state: GameState,
  fromLocation: LocationIndex,
  instanceId: InstanceId,
  toLocation: LocationIndex,
): GameState {
  const s = cloneState(state);
  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyRelocateAlly: active player missing');

  const from = player.realm.locations[fromLocation];
  const dest = player.realm.locations[toLocation];
  if (!from || !dest) throw new Error('applyRelocateAlly: location missing');

  const idx = from.alliesPresent.findIndex((a) => a.instanceId === instanceId);
  if (idx === -1) throw new Error('applyRelocateAlly: ally not at source');

  const [ally] = from.alliesPresent.splice(idx, 1);
  if (ally) dest.alliesPresent.push(ally);

  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `relocated ${ally?.cardId ?? '?'} from loc ${fromLocation} → ${toLocation}`,
  });
  return s;
}
