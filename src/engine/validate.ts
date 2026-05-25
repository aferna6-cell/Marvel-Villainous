// Legal-action checker (marvel-villainous-plan.md §2.2, §3, §11).
//
// `isLegal(state, action)` returns `true` or `{ reason }`. The UI greys out
// illegal actions; the reducer also gates every dispatch through this, so an
// illegal action can never mutate state. Every rule encoded here is recorded
// in RULES_TRACE.md.

import { getCard } from './cards/registry';
import { findUnusedIcon } from './actions/strict';
import { DEFAULT_HAND_SIZE, assertNever } from './util';
import type {
  Action,
  GameState,
  InPlayCard,
  Location,
  LocationIndex,
  PlayerState,
} from './types';

/** Result of a legality check: `true`, or an explained refusal. */
export type Legality = true | { reason: string };

function illegal(reason: string): Legality {
  return { reason };
}

function activePlayerState(state: GameState): PlayerState {
  const p = state.players[state.activePlayer];
  if (!p) throw new Error(`isLegal: active player "${state.activePlayer}" missing`);
  return p;
}

/** All icons at a location, top row then bottom row, in a single index space. */
function iconsAt(loc: Location): { icon: string; row: 'top' | 'bottom' }[] {
  return [
    ...loc.topIcons.map((icon) => ({ icon, row: 'top' as const })),
    ...loc.bottomIcons.map((icon) => ({ icon, row: 'bottom' as const })),
  ];
}

function findInPlay(realmLocations: readonly Location[], cardId: string, zone: 'ally' | 'hero'):
  | { card: InPlayCard; location: number }
  | undefined {
  for (let i = 0; i < realmLocations.length; i++) {
    const loc = realmLocations[i];
    if (!loc) continue;
    const pool = zone === 'ally' ? loc.alliesPresent : loc.heroesPresent;
    const card = pool.find((c) => c.cardId === cardId);
    if (card) return { card, location: i };
  }
  return undefined;
}

export function isLegal(state: GameState, action: Action): Legality {
  if (state.winner !== null) return illegal('the game is already over');

  // A pending prompt blocks every action except its resolution.
  if (state.pendingPrompt !== null && action.kind !== 'resolvePrompt') {
    return illegal('a pending prompt must be resolved first');
  }

  switch (action.kind) {
    case 'startTurn':
      return state.phase === 'start' ? true : illegal('can only start a turn in the start phase');

    case 'moveVillain': {
      if (state.phase !== 'move') return illegal('can only move during the move phase');
      const player = activePlayerState(state);
      // §3: the villain MUST move to a different location *unless* an effect
      // has flipped `mustMoveDifferent` for this turn.
      if (player.mustMoveDifferent && action.to === player.realm.villainTokenAt) {
        return illegal('the villain must move to a different location');
      }
      return true;
    }

    case 'useIcon': {
      if (state.phase !== 'actions') return illegal('can only use icons during the actions phase');
      const player = activePlayerState(state);
      // §3: you act at your villain's current location.
      if (action.location !== player.realm.villainTokenAt) {
        return illegal('icons can only be used at the villain’s current location');
      }
      const loc = player.realm.locations[action.location];
      if (!loc) return illegal('no such location');
      const icons = iconsAt(loc);
      const entry = icons[action.iconIndex];
      if (!entry) return illegal('no such icon at this location');
      // §3/§4: bottom-row icons are covered while a hero is present.
      if (entry.row === 'bottom' && loc.heroesPresent.length > 0) {
        return illegal('this icon is covered by a hero and cannot be used');
      }
      // Each icon may be used once per turn.
      const alreadyUsed = state.usedIcons.some(
        (u) => u.location === action.location && u.iconIndex === action.iconIndex,
      );
      if (alreadyUsed) return illegal('this icon has already been used this turn');
      return true;
    }

    case 'playCard': {
      if (state.phase !== 'actions') return illegal('can only play cards during the actions phase');
      const player = activePlayerState(state);
      const def = getCard(action.cardId);
      if (!def) return illegal(`unknown card "${action.cardId}"`);
      const inHand = player.hand.includes(action.cardId);
      const inDiscard = player.discard.includes(action.cardId);
      if (!inHand && !(inDiscard && def.playableFromDiscard)) {
        return illegal('that card is not in hand');
      }
      // §3/§11: cannot play a card you cannot pay for.
      if (player.power < def.cost) {
        return illegal(`not enough power (need ${def.cost}, have ${player.power})`);
      }
      // Q2: in strict mode, a Play-a-Card action requires an unused, uncovered
      // `play` icon at the active player's current location.
      if (state.strictIconMode && findUnusedIcon(state, 'play') === null) {
        return illegal('no unused "play" icon at your current location');
      }
      return true;
    }

    case 'attackHero': {
      if (state.phase !== 'actions') return illegal('can only attack during the actions phase');
      if (action.allyIds.length === 0) return illegal('no attacking allies named');
      const realm = activePlayerState(state).realm;
      const hero = findInPlay(realm.locations, action.heroId, 'hero');
      if (!hero) return illegal('that hero is not in play');

      // PROTECTOR enforcement: a Hero with PROTECTOR must be defeated before
      // any other Hero at the same location may be targeted. Heroes count as
      // PROTECTOR if their CardDef has tag 'protector', OR carry a runtime
      // `tokens.protector` marker (Odin-Force attach grants this).
      const targetCard = hero.card;
      const targetDef = getCard(targetCard.cardId);
      const targetIsProtector =
        targetDef?.tags?.includes('protector') === true ||
        (targetCard.tokens?.['protector'] ?? 0) > 0;
      if (!targetIsProtector) {
        const sameLoc = realm.locations[hero.location];
        if (sameLoc) {
          const blockingProtector = sameLoc.heroesPresent.find((h) => {
            if (h.instanceId === targetCard.instanceId) return false;
            const def = getCard(h.cardId);
            return (
              def?.tags?.includes('protector') === true ||
              (h.tokens?.['protector'] ?? 0) > 0
            );
          });
          if (blockingProtector) {
            return illegal(
              `a PROTECTOR Hero (${blockingProtector.cardId}) must be defeated first`,
            );
          }
        }
      }

      const seen = new Set<string>();
      for (const id of action.allyIds) {
        if (seen.has(id)) return illegal(`ally "${id}" listed twice`);
        seen.add(id);
        const ally = findInPlay(realm.locations, id, 'ally');
        if (!ally) return illegal(`ally "${id}" is not in play`);
        // §4: every named ally must be at the same location as the hero.
        if (ally.location !== hero.location) {
          return illegal('every attacking ally must be at the same location as the hero');
        }
      }
      // Q2: strict-mode vanquish requires a `vanquish` icon at the
      // active player's current location.
      if (state.strictIconMode && findUnusedIcon(state, 'vanquish') === null) {
        return illegal('no unused "vanquish" icon at your current location');
      }
      return true;
    }

    case 'discardCards': {
      if (state.phase !== 'actions') return illegal('can only discard during the actions phase');
      if (action.cardIds.length === 0) return illegal('no cards selected to discard');
      const player = activePlayerState(state);
      const hand = [...player.hand];
      for (const id of action.cardIds) {
        const idx = hand.indexOf(id);
        if (idx === -1) return illegal(`card "${id}" is not in hand`);
        hand.splice(idx, 1); // consume so duplicates are checked correctly
      }
      if (state.strictIconMode && findUnusedIcon(state, 'discard') === null) {
        return illegal('no unused "discard" icon at your current location');
      }
      return true;
    }

    case 'drawToHandSize': {
      if (state.phase !== 'end') return illegal('can only draw up to hand size in the end phase');
      const player = activePlayerState(state);
      // §11: drawing respects the hand-size limit; over the limit is a no-op.
      if (player.hand.length >= DEFAULT_HAND_SIZE) {
        return illegal('hand is already at the hand-size limit');
      }
      return true;
    }

    case 'fate': {
      if (state.phase !== 'actions' && state.phase !== 'fate') {
        return illegal('can only Fate during the actions or fate phase');
      }
      // Rulebook: "Reveal one card from the top of the Fate deck, then choose
      // which player to target." The target choice happens at prompt
      // resolution, so target-side rules (no-self-Fate, must be a seated
      // player) live in `cards/effects.ts` resolveFatePlay.
      // We still need at least one opponent for the action to make sense.
      const opponents = state.playerOrder.filter((id) => id !== state.activePlayer);
      if (opponents.length === 0) {
        return illegal('no opponents to Fate');
      }
      if (state.strictIconMode && findUnusedIcon(state, 'fate') === null) {
        return illegal('no unused "fate" icon at your current location');
      }
      return true;
    }

    case 'resolvePrompt': {
      const prompt = state.pendingPrompt;
      if (prompt === null) return illegal('there is no pending prompt to resolve');
      const offered = prompt.choices.some(
        (c) => JSON.stringify(c) === JSON.stringify(action.choice),
      );
      if (!offered) return illegal('that choice was not offered by the prompt');
      return true;
    }

    case 'endTurn':
      if (state.phase === 'actions' || state.phase === 'fate' || state.phase === 'end') {
        return true;
      }
      return illegal('cannot end the turn before the actions phase');

    case 'claimVictory':
      // Always legal for the active player on their own turn — the player
      // self-attests that the printed objective is met. The engine ratifies
      // by setting `state.winner`; opponents can dispute via Quit.
      return true;

    case 'setObjectiveCount':
      if (!state.playerOrder.includes(action.player)) {
        return illegal('that player is not in this game');
      }
      return true;

    case 'relocateAlly': {
      if (state.phase !== 'actions') return illegal('can only relocate during the actions phase');
      if (action.fromLocation === action.toLocation) {
        return illegal('the destination must be a different location');
      }
      const player = activePlayerState(state);
      const from = player.realm.locations[action.fromLocation];
      if (!from) return illegal('no such source location');
      const dest = player.realm.locations[action.toLocation];
      if (!dest) return illegal('no such destination location');
      const ally = from.alliesPresent.find((a) => a.instanceId === action.instanceId);
      if (!ally) return illegal('that ally is not at the source location');
      if (state.strictIconMode && findUnusedIcon(state, 'move') === null) {
        return illegal('no unused "move" icon at your current location');
      }
      return true;
    }

    case 'setStrictIconMode':
      return true;

    case 'removeFromPlay': {
      if (!state.playerOrder.includes(action.owner)) {
        return illegal('that player is not in this game');
      }
      return true;
    }

    case 'undo':
      if (state.history.length === 0) return illegal('nothing to undo');
      return true;

    case 'adjustPower':
      if (!state.playerOrder.includes(action.player)) {
        return illegal('that player is not in this game');
      }
      return true;

    case 'drawCards':
      if (!state.playerOrder.includes(action.player)) {
        return illegal('that player is not in this game');
      }
      if (action.n <= 0) return illegal('drawCards: n must be positive');
      return true;

    default:
      return assertNever(action);
  }
}

/** Convenience: legal locations the villain may move to from its current spot. */
export function legalMoveTargets(state: GameState): LocationIndex[] {
  const current = activePlayerState(state).realm.villainTokenAt;
  return ([0, 1, 2, 3] as LocationIndex[]).filter((i) => i !== current);
}
