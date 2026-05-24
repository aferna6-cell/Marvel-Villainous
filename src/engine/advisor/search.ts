// Single-action candidate enumeration + scoring (plan §8.1, narrowed).
//
// The plan describes whole-turn DFS enumeration (up to K=8 actions per
// turn). That's expensive and the marginal advice it produces over
// single-action top-K is small in practice — players don't follow
// 8-step scripts blindly. So we enumerate every LEGAL single action
// from the current state, simulate it through the pure reducer, and
// score the resulting state. Top-K candidates surface in the UI.

import { reduce } from '../state';
import { isLegal } from '../validate';
import { score, features, type FeatureSet } from './score';
import type { Action, GameState, LocationIndex, PlayerId } from '../types';

export interface Candidate {
  action: Action;
  /** State value after simulating this action. Higher = better. */
  score: number;
  /** Features after the simulated action, for explanations. */
  featuresAfter: FeatureSet;
  /** Δ in features vs. baseline (before action). */
  featuresDelta: FeatureSet;
}

const LOCATIONS = [0, 1, 2, 3] as LocationIndex[];

/** All single-action candidates legal in `state` for `asPlayer`. */
function enumerateCandidates(state: GameState, asPlayer: PlayerId): Action[] {
  const out: Action[] = [];
  const me = state.players[asPlayer];
  if (!me) return out;

  // A pending prompt collapses the option space to its own choices.
  if (state.pendingPrompt !== null) {
    for (const c of state.pendingPrompt.choices) {
      out.push({ kind: 'resolvePrompt', choice: c });
    }
    return out;
  }

  switch (state.phase) {
    case 'start':
      out.push({ kind: 'startTurn' });
      break;
    case 'move':
      for (const to of LOCATIONS) {
        const a: Action = { kind: 'moveVillain', to };
        if (isLegal(state, a) === true) out.push(a);
      }
      break;
    case 'actions': {
      // Play any card you can afford.
      for (const cardId of me.hand) {
        const a: Action = { kind: 'playCard', cardId };
        if (isLegal(state, a) === true) out.push(a);
      }
      // Use any uncovered, unused icon at your current location.
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
      // Fate (single opponent — the resolution choice picks the target later).
      const fateA: Action = { kind: 'fate' };
      if (isLegal(state, fateA) === true) out.push(fateA);
      // End the turn (always available in actions phase).
      out.push({ kind: 'endTurn' });
      break;
    }
    case 'fate':
      out.push({ kind: 'endTurn' });
      break;
    case 'end':
      out.push({ kind: 'drawToHandSize' });
      out.push({ kind: 'endTurn' });
      break;
  }
  return out;
}

/** Simulate every legal candidate, score the result, return sorted top-K. */
export function searchTopK(
  state: GameState,
  asPlayer: PlayerId,
  k = 3,
): Candidate[] {
  const baseFeatures = features(state, asPlayer);
  const candidates: Candidate[] = [];
  for (const action of enumerateCandidates(state, asPlayer)) {
    let next: GameState;
    try {
      next = reduce(state, action);
    } catch {
      // Should not happen since enumerateCandidates calls isLegal; defensive.
      continue;
    }
    const after = features(next, asPlayer);
    const delta: FeatureSet = {
      progressTowardObjective: after.progressTowardObjective - baseFeatures.progressTowardObjective,
      powerInBank: after.powerInBank - baseFeatures.powerInBank,
      handQuality: after.handQuality - baseFeatures.handQuality,
      boardControl: after.boardControl - baseFeatures.boardControl,
      iconAccess: after.iconAccess - baseFeatures.iconAccess,
      opponentThreat: after.opponentThreat - baseFeatures.opponentThreat,
      fateLeverage: after.fateLeverage - baseFeatures.fateLeverage,
    };
    candidates.push({
      action,
      score: score(next, asPlayer),
      featuresAfter: after,
      featuresDelta: delta,
    });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, k);
}
