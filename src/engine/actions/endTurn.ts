// `endTurn` action and the shared `applyDraw` helper
// (marvel-villainous-plan.md §3, step 5).
//
// The action itself just transitions the phase to `'end'`; the draw + rotate
// + phase-reset is performed by `phases/endOfTurn.ts`'s `runAutomatic`, which
// the reducer's auto-advance loop will run immediately after this returns.

import { cloneState, getHandSize } from '../util';
import { reshuffleDeck } from '../cards/effects';
import type { GameState, PlayerId } from '../types';

/**
 * Draw a player's hand back up to their effective hand-size limit
 * (per-villain override or `DEFAULT_HAND_SIZE`). Drawing never exceeds the
 * limit (§11). Reshuffles the deck from the discard pile if it runs out.
 */
export function applyDraw(state: GameState, player: PlayerId): GameState {
  const s = cloneState(state);
  const p = s.players[player];
  if (!p) throw new Error('applyDraw: player missing');

  const target = getHandSize(p);
  let drawn = 0;
  while (p.hand.length < target) {
    reshuffleDeck(s, p);
    const card = p.deck.shift();
    if (card === undefined) break; // deck and discard both empty
    p.hand.push(card);
    drawn++;
  }
  s.log.push({
    turn: s.turn,
    player,
    message: `drew ${drawn} card(s) up to hand size ${target}`,
  });
  return s;
}

/**
 * The `endTurn` action: enter the `'end'` phase. The phase machine's
 * `endOfTurn.runAutomatic` (invoked by the reducer's auto-advance) performs
 * the actual end-of-turn work — draw, rotate, reset.
 */
export function applyEndTurn(state: GameState): GameState {
  const s = cloneState(state);
  s.phase = 'end';
  s.pendingTriggers.push({ event: 'turnEnd', player: s.activePlayer, payload: {} });
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: 'ended actions; entering end-of-turn phase',
  });
  return s;
}
