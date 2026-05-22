// `endTurn` action and the `drawToHandSize` step (marvel-villainous-plan.md §3).
// Assumes legality already checked by validate.ts.

import { cloneState, DEFAULT_HAND_SIZE } from '../util';
import { reshuffleDeck } from '../cards/effects';
import type { GameState, PlayerId } from '../types';

/**
 * Draw a player's hand back up to the hand-size limit (§3 end-of-turn draw).
 * Drawing never exceeds the limit (§11). Reshuffles the deck if it runs out.
 */
export function applyDraw(state: GameState, player: PlayerId): GameState {
  const s = cloneState(state);
  const p = s.players[player];
  if (!p) throw new Error('applyDraw: player missing');

  let drawn = 0;
  while (p.hand.length < DEFAULT_HAND_SIZE) {
    reshuffleDeck(s, p);
    const card = p.deck.shift();
    if (card === undefined) break; // deck and discard both empty
    p.hand.push(card);
    drawn++;
  }
  s.log.push({ turn: s.turn, player, message: `drew ${drawn} card(s) up to hand size` });
  return s;
}

/**
 * End the active player's turn: draw back up to hand size, then pass to the
 * next player in `playerOrder`. The turn counter increments when play wraps
 * back to the first seat.
 */
export function applyEndTurn(state: GameState): GameState {
  const drawn = applyDraw(state, state.activePlayer);
  const s = cloneState(drawn);

  s.pendingTriggers.push({ event: 'turnEnd', player: s.activePlayer, payload: {} });

  const idx = s.playerOrder.indexOf(s.activePlayer);
  const nextIdx = (idx + 1) % s.playerOrder.length;
  const next = s.playerOrder[nextIdx];
  if (next === undefined) throw new Error('applyEndTurn: empty player order');

  if (nextIdx === 0) s.turn += 1;
  s.activePlayer = next;
  s.phase = 'start';
  s.usedIcons = [];
  s.log.push({ turn: s.turn, player: next, message: `turn passes to ${next}` });
  return s;
}
