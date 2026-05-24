// Toggle rulebook-strict icon enforcement (Q2).
//
// Off (default): the engine acts as a relaxed state tracker — playCard,
//   attackHero, fate, discardCards, and relocateAlly are independently
//   legal whenever the actions phase is open.
// On: each of those actions requires an unused matching icon at the active
//   player's current location and consumes it.
//
// `engine/validate.ts` and the relevant action handlers branch on
// `state.strictIconMode`.

import { cloneState } from '../util';
import type { GameState } from '../types';

export function applySetStrictIconMode(state: GameState, value: boolean): GameState {
  const s = cloneState(state);
  s.strictIconMode = value;
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `strict icon mode → ${value ? 'ON' : 'OFF'}`,
  });
  return s;
}

/**
 * Look up an unused, uncovered icon of the given type at the active player's
 * current location. Returns the iconIndex if found; null otherwise.
 */
export function findUnusedIcon(state: GameState, iconType: string): number | null {
  const player = state.players[state.activePlayer];
  if (!player) return null;
  const loc = player.realm.locations[player.realm.villainTokenAt];
  if (!loc) return null;
  const heroesCovering = loc.heroesPresent.length > 0;
  const all = [...loc.topIcons, ...loc.bottomIcons];
  for (let i = 0; i < all.length; i++) {
    if (all[i] !== iconType) continue;
    const isBottom = i >= loc.topIcons.length;
    if (isBottom && heroesCovering) continue;
    const used = state.usedIcons.some(
      (u) => u.location === player.realm.villainTokenAt && u.iconIndex === i,
    );
    if (used) continue;
    return i;
  }
  return null;
}

/** Mutates the cloned state to mark the given icon as used. */
export function consumeIcon(state: GameState, iconIndex: number): void {
  const player = state.players[state.activePlayer];
  if (!player) return;
  state.usedIcons.push({ location: player.realm.villainTokenAt, iconIndex });
}
