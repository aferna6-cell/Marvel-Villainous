// `discardCards` action (marvel-villainous-plan.md §3).
// Assumes legality already checked by validate.ts.

import { cloneState } from '../util';
import type { CardId, GameState } from '../types';

export function applyDiscard(state: GameState, cardIds: readonly CardId[]): GameState {
  const s = cloneState(state);
  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyDiscard: active player missing');

  for (const id of cardIds) {
    const idx = player.hand.indexOf(id);
    if (idx === -1) throw new Error(`applyDiscard: card "${id}" not in hand`);
    player.hand.splice(idx, 1);
    player.discard.push(id);
  }
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `discarded ${cardIds.length} card(s)`,
  });
  return s;
}
