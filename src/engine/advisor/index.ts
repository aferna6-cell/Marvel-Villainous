// AI move advisor (plan §8).
//
// Single-action top-K candidate search: enumerate every legal action from
// the current state for the active player, simulate each through the pure
// reducer, score the resulting state via the per-villain weight tables,
// and surface the top K with explanations. The advisor only ever runs on
// an explicit click — it never moves the game state itself.

import { searchTopK, type Candidate } from './search';
import { searchSequences, type Sequence } from './sequenceSearch';
import { explain } from './explain';
import { describeAction } from './explain';
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

/** Top-K single-action recommendations, sorted by score descending. */
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

export interface SequenceRecommendation {
  /** Step-by-step action plan from now through end-of-turn. */
  steps: { action: Action; description: string; score: number }[];
  /** Final state value at the end of the sequence. */
  score: number;
  /** Whether the sequence actually rotates to the next player. */
  turnEnded: boolean;
  /** Short bullets explaining the plan (action highlights). */
  rationale: string[];
}

/**
 * Plan §8.1 whole-turn search: returns the top-K full-turn action
 * sequences for the active player. Each sequence is a list of Actions
 * that can be dispatched in order; the UI's "Auto-play this turn"
 * fires them one at a time with a small delay so the player can watch.
 */
export function suggestTurnSequences(
  state: GameState,
  asPlayer: PlayerId,
  k = 3,
): SequenceRecommendation[] {
  if (state.winner !== null) return [];
  if (state.activePlayer !== asPlayer) return [];
  const seqs: Sequence[] = searchSequences(state, asPlayer, { topK: k });
  return seqs.map((seq) => ({
    steps: seq.steps.map((s) => ({
      action: s.action,
      description: describeAction(s.action),
      score: s.score,
    })),
    score: seq.score,
    turnEnded: seq.turnEnded,
    rationale: seq.steps.slice(0, 4).map((s, i) => `${i + 1}. ${describeAction(s.action)}`),
  }));
}

export type { Candidate, Sequence };
