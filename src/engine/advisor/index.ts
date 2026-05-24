// AI move advisor (plan §8).
//
// Single-action top-K candidate search: enumerate every legal action from
// the current state for the active player, simulate each through the pure
// reducer, score the resulting state via the per-villain weight tables,
// and surface the top K with explanations. The advisor only ever runs on
// an explicit click — it never moves the game state itself.

import { searchTopK, type Candidate } from './search';
import { explain } from './explain';
import type { Action, GameState, PlayerId } from '../types';

export interface Recommendation {
  action: Action;
  rationale: string[];
  score: number;
}

/** Top recommendation only (back-compat with the original `suggestMove` API). */
export function suggestMove(state: GameState, asPlayer: PlayerId): Recommendation | null {
  if (state.winner !== null) return null;
  if (state.activePlayer !== asPlayer) return null;
  const top = searchTopK(state, asPlayer, 1)[0];
  if (!top) return null;
  return { action: top.action, rationale: explain(top), score: top.score };
}

/** Top-K recommendations, sorted by score descending. */
export function suggestTopK(
  state: GameState,
  asPlayer: PlayerId,
  k = 3,
): Recommendation[] {
  if (state.winner !== null) return [];
  if (state.activePlayer !== asPlayer) return [];
  return searchTopK(state, asPlayer, k).map((c: Candidate) => ({
    action: c.action,
    rationale: explain(c),
    score: c.score,
  }));
}

export type { Candidate };
