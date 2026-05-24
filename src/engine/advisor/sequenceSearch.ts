// Whole-turn sequence search (plan §8.1 full version).
//
// Bounded depth-first enumeration: from the current state, branch on
// every legal action; simulate each through the pure reducer; recurse
// until the turn ends (the active player rotates, the game ends, or a
// pending prompt blocks further moves), or until we hit the action-cap.
// Score the resulting end-of-turn state with the per-villain weighted
// feature set; keep the top-K sequences.
//
// Pruning:
//  - cap sequence length at K (default 8) — real turns rarely exceed this;
//  - cap branching factor per node (default 6) — keep only the top-scored
//    immediate successors when expanding;
//  - cap total nodes (default 5_000) — hard backstop;
//  - prompt branches enumerate only their offered choices (the reducer
//    already limits them).
//
// The search is deterministic: same state in, same Top-K out.

import { reduce } from '../state';
import { isLegal } from '../validate';
import { score } from './score';
import type { Action, GameState, LocationIndex, PlayerId } from '../types';

export interface Step {
  action: Action;
  /** State value after this action (single-step score). */
  score: number;
}

export interface Sequence {
  steps: Step[];
  /** State value at the end of the sequence. Higher is better. */
  score: number;
  /** True if the sequence advanced to the next player (turn really ended). */
  turnEnded: boolean;
}

interface SearchOpts {
  maxDepth?: number; // K from plan §8.1; default 8
  maxBranching?: number; // per-node successors kept; default 6
  maxNodes?: number; // hard cap on total simulated transitions; default 5000
  topK?: number; // best sequences returned; default 3
}

const LOCATIONS = [0, 1, 2, 3] as LocationIndex[];

function legalSuccessors(state: GameState, asPlayer: PlayerId): Action[] {
  const me = state.players[asPlayer];
  if (!me) return [];
  if (state.winner !== null) return [];

  // A pending prompt collapses the option space to its own choices.
  if (state.pendingPrompt !== null) {
    return state.pendingPrompt.choices.map((c) => ({ kind: 'resolvePrompt', choice: c }));
  }

  switch (state.phase) {
    case 'start':
      return [{ kind: 'startTurn' }];
    case 'move':
      return LOCATIONS
        .map((to): Action => ({ kind: 'moveVillain', to }))
        .filter((a) => isLegal(state, a) === true);
    case 'actions': {
      const out: Action[] = [];
      for (const cardId of me.hand) {
        const a: Action = { kind: 'playCard', cardId };
        if (isLegal(state, a) === true) out.push(a);
      }
      const loc = me.realm.locations[me.realm.villainTokenAt];
      if (loc) {
        const total = loc.topIcons.length + loc.bottomIcons.length;
        for (let i = 0; i < total; i++) {
          const a: Action = {
            kind: 'useIcon',
            location: me.realm.villainTokenAt,
            iconIndex: i,
          };
          if (isLegal(state, a) === true) out.push(a);
        }
      }
      const fateA: Action = { kind: 'fate' };
      if (isLegal(state, fateA) === true) out.push(fateA);
      out.push({ kind: 'endTurn' });
      return out;
    }
    case 'fate':
      return [{ kind: 'endTurn' }];
    case 'end':
      return [{ kind: 'drawToHandSize' }, { kind: 'endTurn' }];
    default:
      return [];
  }
}

/** Same-icon-twice-with-no-state-change pruning (plan §8.1). */
function isWastedIcon(prev: GameState, next: GameState, action: Action): boolean {
  if (action.kind !== 'useIcon') return false;
  return (
    prev.players[prev.activePlayer]?.power === next.players[prev.activePlayer]?.power &&
    prev.usedIcons.length + 1 === next.usedIcons.length
  );
}

/** DFS with branching/depth caps; returns the best K sequences found. */
export function searchSequences(
  state: GameState,
  asPlayer: PlayerId,
  opts: SearchOpts = {},
): Sequence[] {
  const maxDepth = opts.maxDepth ?? 8;
  const maxBranching = opts.maxBranching ?? 6;
  const maxNodes = opts.maxNodes ?? 5_000;
  const topK = opts.topK ?? 3;

  const best: Sequence[] = [];
  let nodesExpanded = 0;
  const startActive = state.activePlayer;

  function record(seq: Sequence): void {
    best.push(seq);
    best.sort((a, b) => b.score - a.score);
    if (best.length > topK) best.length = topK;
  }

  // Anything that hit endTurn lands in start/turn+1 — also terminal for our
  // purposes, even when the player rotation cycles back to the same seat
  // (single-seat solo or 2-player wrap on odd-numbered seats).
  const startTurn = state.turn;

  function dfs(s: GameState, path: Step[]): void {
    if (nodesExpanded >= maxNodes) return;

    // Terminal — game won, turn rotated to a new player, OR the turn counter
    // advanced (handles same-seat rotation in solo mode).
    const gameOver = s.winner !== null;
    const playerRotated = s.activePlayer !== startActive;
    const newTurn = s.turn !== startTurn;
    if (gameOver || playerRotated || newTurn) {
      record({ steps: path, score: score(s, asPlayer), turnEnded: true });
      return;
    }
    if (path.length >= maxDepth) {
      record({ steps: path, score: score(s, asPlayer), turnEnded: false });
      return;
    }

    // Expand. Score each immediate successor's resulting state, sort, keep
    // the top `maxBranching` candidates for deeper exploration.
    const successors: { action: Action; next: GameState; score: number }[] = [];
    for (const a of legalSuccessors(s, asPlayer)) {
      let next: GameState;
      try {
        next = reduce(s, a);
      } catch {
        continue;
      }
      nodesExpanded++;
      if (nodesExpanded >= maxNodes) break;
      if (isWastedIcon(s, next, a)) continue;
      successors.push({ action: a, next, score: score(next, asPlayer) });
    }
    if (successors.length === 0) {
      record({ steps: path, score: score(s, asPlayer), turnEnded: false });
      return;
    }
    successors.sort((a, b) => b.score - a.score);
    const pruned = successors.slice(0, maxBranching);
    for (const succ of pruned) {
      dfs(succ.next, [...path, { action: succ.action, score: succ.score }]);
    }
  }

  dfs(state, []);
  // If we never recorded anything (shouldn't happen), give back an empty list.
  return best;
}
