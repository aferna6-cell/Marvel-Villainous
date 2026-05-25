// `attackHero` action (marvel-villainous-plan.md §4; rulebook "Vanquish").
// Assumes legality already checked by validate.ts.
//
// Per the rulebook: the player names one or more allies at the hero's
// location whose summed Strength must equal or exceed the hero's Strength.
// On a successful Vanquish, the hero AND every spent ally are discarded.
// (Rulebook example: 3 allies at the hero's location, two have combined
// strength 5 vs a 5-strength hero — those two and the hero are all
// discarded; the third ally remains.)

import { cloneState } from '../util';
import { getCard } from '../cards/registry';
import { defeatHero } from './defeat';
import type { CardId, GameState, InPlayCard, LocationIndex } from '../types';

interface FoundHero {
  location: LocationIndex;
  instanceId: string;
  strength: number;
}

interface FoundAlly {
  location: LocationIndex;
  instance: InPlayCard;
  effectiveStrength: number;
}

function findHero(state: GameState, heroId: CardId): FoundHero | undefined {
  const realm = state.players[state.activePlayer]?.realm;
  if (!realm) return undefined;
  for (let i = 0; i < realm.locations.length; i++) {
    const loc = realm.locations[i];
    if (!loc) continue;
    const hero = loc.heroesPresent.find((c) => c.cardId === heroId);
    if (hero) {
      return {
        location: i as LocationIndex,
        instanceId: hero.instanceId,
        strength: getCard(hero.cardId)?.strength ?? 0,
      };
    }
  }
  return undefined;
}

function findAllyAt(
  state: GameState,
  cardId: CardId,
  location: LocationIndex,
): FoundAlly | undefined {
  const realm = state.players[state.activePlayer]?.realm;
  if (!realm) return undefined;
  const loc = realm.locations[location];
  if (!loc) return undefined;
  const instance = loc.alliesPresent.find((c) => c.cardId === cardId);
  if (!instance) return undefined;
  const base = getCard(instance.cardId)?.strength ?? 0;
  return { location, instance, effectiveStrength: base + instance.strengthModifier };
}

export function applyAttack(
  state: GameState,
  allyIds: readonly CardId[],
  heroId: CardId,
): GameState {
  const s = cloneState(state);
  const hero = findHero(s, heroId);
  if (!hero) throw new Error('applyAttack: hero not in play');

  const allies: FoundAlly[] = [];
  for (const id of allyIds) {
    const ally = findAllyAt(s, id, hero.location);
    if (!ally) throw new Error(`applyAttack: ally "${id}" not at hero’s location`);
    allies.push(ally);
  }

  const summed = allies.reduce((acc, a) => acc + a.effectiveStrength, 0);
  if (summed < hero.strength) {
    s.log.push({
      turn: s.turn,
      player: s.activePlayer,
      message: `Vanquish failed: ${summed} strength vs hero ${heroId} (${hero.strength})`,
    });
    return s;
  }

  // Successful Vanquish: discard each spent ally, then defeat the hero.
  const owner = s.players[s.activePlayer];
  if (!owner) throw new Error('applyAttack: active player missing');
  const loc = owner.realm.locations[hero.location];
  if (!loc) throw new Error('applyAttack: location missing');

  for (const ally of allies) {
    loc.alliesPresent = loc.alliesPresent.filter(
      (a) => a.instanceId !== ally.instance.instanceId,
    );
    owner.discard.push(ally.instance.cardId);
    // Cascade: any item attached to this ally is also discarded.
    const attached = loc.itemsPresent.filter((it) => it.attachedTo === ally.instance.instanceId);
    loc.itemsPresent = loc.itemsPresent.filter((it) => it.attachedTo !== ally.instance.instanceId);
    for (const it of attached) owner.discard.push(it.cardId);
    s.pendingTriggers.push({
      event: 'allyDefeated',
      player: s.activePlayer,
      payload: { cardId: ally.instance.cardId, spent: true },
    });
  }

  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `Vanquished ${heroId} with ${allies.length} ally/allies (str ${summed} vs ${hero.strength})`,
  });
  return defeatHero(s, s.activePlayer, hero.location, hero.instanceId);
}
