// `activate` / villain-specific action icon (marvel-villainous-plan.md §5).
// Assumes legality already checked by validate.ts.
//
// The per-villain economics of the activate and villain-specific icons depend
// on the printed rulebook and per-villain boards; they are implemented with
// each villain in CHUNK 4+. For now this records the icon use.

import { cloneState } from '../util';
import type { ActionIcon, GameState, PlayerId } from '../types';

export function applyActivate(state: GameState, player: PlayerId, icon: ActionIcon): GameState {
  const s = cloneState(state);
  s.log.push({
    turn: s.turn,
    player,
    message: `used "${icon}" icon (villain-specific effect pending CHUNK 4+)`,
  });
  return s;
}
