// `attackHero` action (marvel-villainous-plan.md §4).
// Assumes legality already checked by validate.ts.
//
// NOTE: the printed Vanquish rule sums the strength of *all* allies at the
// hero's location. This action names a single ally; the multi-ally sum is
// deferred — see RULES_QUESTIONS.md. For now one named ally attacks one hero.

import { cloneState } from '../util';
import { getCard } from '../cards/registry';
import { defeatHero } from './defeat';
import type { CardId, GameState, LocationIndex } from '../types';

export function applyAttack(state: GameState, allyId: CardId, heroId: CardId): GameState {
  const s = cloneState(state);
  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyAttack: active player missing');

  let allyStrength: number | undefined;
  let heroLocation: LocationIndex | undefined;
  let heroInstanceId: string | undefined;
  let heroStrength = 0;

  player.realm.locations.forEach((loc, idx) => {
    const ally = loc.alliesPresent.find((c) => c.cardId === allyId);
    if (ally) {
      allyStrength = (getCard(ally.cardId)?.strength ?? 0) + ally.strengthModifier;
    }
    const hero = loc.heroesPresent.find((c) => c.cardId === heroId);
    if (hero) {
      heroLocation = idx as LocationIndex;
      heroInstanceId = hero.instanceId;
      heroStrength = getCard(hero.cardId)?.strength ?? 0;
    }
  });

  if (allyStrength === undefined || heroLocation === undefined || heroInstanceId === undefined) {
    throw new Error('applyAttack: ally or hero not in play');
  }

  if (allyStrength >= heroStrength) {
    s.log.push({
      turn: s.turn,
      player: s.activePlayer,
      message: `${allyId} (${allyStrength}) vanquishes ${heroId} (${heroStrength})`,
    });
    return defeatHero(s, s.activePlayer, heroLocation, heroInstanceId);
  }

  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `${allyId} (${allyStrength}) cannot vanquish ${heroId} (${heroStrength})`,
  });
  return s;
}
