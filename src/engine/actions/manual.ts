// Manual hotseat adjustments: free-form Power tick and out-of-phase draw.
//
// Card text says things like "lose 2 Power" or "draw 1 card" that the
// engine doesn't auto-resolve (§0 — no card text in the repo). Players
// dispatch these to mechanize the effects themselves.

import { cloneState } from '../util';
import { reshuffleDeck } from '../cards/effects';
import type { GameState, PlayerId } from '../types';

export function applyAdjustPower(state: GameState, player: PlayerId, delta: number): GameState {
  const s = cloneState(state);
  const p = s.players[player];
  if (!p) throw new Error('applyAdjustPower: player missing');
  const before = p.power;
  // Rulebook §11: Power floors at 0.
  p.power = Math.max(0, p.power + delta);
  s.log.push({
    turn: s.turn,
    player,
    message: `${player} power ${before} → ${p.power} (${delta >= 0 ? '+' : ''}${delta})`,
  });
  return s;
}

export function applyDrawCards(state: GameState, player: PlayerId, n: number): GameState {
  const s = cloneState(state);
  const p = s.players[player];
  if (!p) throw new Error('applyDrawCards: player missing');
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    reshuffleDeck(s, p);
    const card = p.deck.shift();
    if (card === undefined) break; // both piles exhausted
    p.hand.push(card);
    drawn++;
  }
  s.log.push({ turn: s.turn, player, message: `${player} drew ${drawn} card(s)` });
  return s;
}
