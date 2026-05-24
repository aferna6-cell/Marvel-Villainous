// AI move advisor — MINIMAL HEURISTIC VERSION (plan §8 stub).
//
// The plan describes a full enumeration + scoring search. This is the
// initial heuristic version: walk a list of candidate actions for the
// current state in priority order, pick the first one `validate.isLegal`
// approves of, and return it with a short human-readable rationale.
//
// Future work (per plan §8): bounded depth-first enumeration of whole
// turn sequences, simulated through the pure reducer, scored by a weighted
// sum of per-villain features.

import { isLegal } from '../validate';
import { getCard } from '../cards/registry';
import type { Action, GameState, LocationIndex, PlayerId, PromptChoice } from '../types';

export interface Recommendation {
  action: Action;
  rationale: string[];
}

/** Compute a recommended action for the active player. */
export function suggestMove(state: GameState, asPlayer: PlayerId): Recommendation | null {
  if (state.winner !== null) return null;
  if (state.activePlayer !== asPlayer) {
    // Advisor only suggests for the active player.
    return null;
  }
  const player = state.players[asPlayer];
  if (!player) return null;

  // 1. Pending prompt — pick the first offered choice.
  if (state.pendingPrompt !== null) {
    const choice = state.pendingPrompt.choices[0];
    if (choice) {
      return {
        action: { kind: 'resolvePrompt', choice },
        rationale: [`Resolving the open prompt with "${describeChoice(choice)}".`],
      };
    }
  }

  // 2. Start of turn — kick off the turn.
  if (state.phase === 'start') {
    return {
      action: { kind: 'startTurn' },
      rationale: ['Start your turn — Move phase comes next.'],
    };
  }

  // 3. Move phase — pick the location with the most uncovered top icons.
  if (state.phase === 'move') {
    const current = player.realm.villainTokenAt;
    let best: LocationIndex = ([0, 1, 2, 3] as LocationIndex[]).find((i) => i !== current) ?? 1;
    let bestScore = -1;
    for (const i of [0, 1, 2, 3] as LocationIndex[]) {
      if (i === current && player.mustMoveDifferent) continue;
      const loc = player.realm.locations[i];
      if (!loc) continue;
      // Score: count of top-row icons usable (uncovered always means usable).
      const score = loc.topIcons.length + (loc.heroesPresent.length === 0 ? loc.bottomIcons.length : 0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return {
      action: { kind: 'moveVillain', to: best },
      rationale: [`Moving to location ${best + 1} — ${bestScore} usable icon(s).`],
    };
  }

  // 4. Actions phase — try, in priority order:
  if (state.phase === 'actions') {
    // 4a. An affordable playCard from the hand.
    for (const cardId of player.hand) {
      const def = getCard(cardId);
      if (!def) continue;
      if (player.power < def.cost) continue;
      const candidate: Action = { kind: 'playCard', cardId };
      if (isLegal(state, candidate) === true) {
        return {
          action: candidate,
          rationale: [`Playing ${cardId} (cost ${def.cost}, you have ${player.power} Power).`],
        };
      }
    }
    // 4b. Use the first uncovered, unused top icon at the current location.
    const currentLoc = player.realm.villainTokenAt;
    const loc = player.realm.locations[currentLoc];
    if (loc) {
      const icons = [...loc.topIcons, ...loc.bottomIcons];
      for (let i = 0; i < icons.length; i++) {
        const candidate: Action = { kind: 'useIcon', location: currentLoc, iconIndex: i };
        if (isLegal(state, candidate) === true) {
          return {
            action: candidate,
            rationale: [`Spending the "${icons[i]}" icon at your current location.`],
          };
        }
      }
    }
    // 4c. End the turn.
    return {
      action: { kind: 'endTurn' },
      rationale: ['No more useful actions — ending the turn.'],
    };
  }

  // 5. Fate or end phase — just end the turn.
  return {
    action: { kind: 'endTurn' },
    rationale: ['Wrapping up the turn.'],
  };
}

function describeChoice(choice: PromptChoice): string {
  switch (choice.kind) {
    case 'target':
      return `target ${choice.target.kind === 'player' ? choice.target.player : choice.target.kind}`;
    case 'card':
      return `card ${choice.cardId}`;
    case 'location':
      return `location ${choice.location + 1}`;
    case 'skip':
      return 'skip';
    case 'confirm':
      return 'confirm';
  }
}
