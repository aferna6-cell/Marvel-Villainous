// Move + Actions phase (marvel-villainous-plan.md §3, steps 2-3).
//
// The main phase is entirely player-driven — the auto-advance loop must stop
// here and wait for the player's `moveVillain`, `useIcon`, `playCard`,
// `attackHero`, `discardCards`, `fateOpponent` or `endTurn` action.
//
// The "must move to a different location" rule is enforced by
// `validate.ts` against `PlayerState.mustMoveDifferent` (defaults to true,
// reset every start of turn; effects may flip it for the current turn).

import type { GameState } from '../types';

export function canAdvance(_state: GameState): boolean {
  return false;
}

export function runAutomatic(state: GameState): GameState {
  return state;
}
