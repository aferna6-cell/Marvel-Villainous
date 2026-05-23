// Hero-defeat resolution (marvel-villainous-plan.md §4).
// Shared by the `attackHero` action and by `defeatHero` effects.
// Assumes legality already checked by the caller.

import { cloneState } from '../util';
import type { GameState, InstanceId, LocationIndex, PlayerId } from '../types';

/**
 * Remove a defeated hero from a realm: the hero card goes to its owner's Fate
 * discard pile, and a `heroDefeated` trigger is enqueued for the event bus.
 */
export function defeatHero(
  state: GameState,
  owner: PlayerId,
  locationIdx: LocationIndex,
  heroInstanceId: InstanceId,
): GameState {
  const s = cloneState(state);
  const owningPlayer = s.players[owner];
  if (!owningPlayer) throw new Error('defeatHero: owner missing');
  const loc = owningPlayer.realm.locations[locationIdx];
  if (!loc) throw new Error('defeatHero: location missing');

  const hero = loc.heroesPresent.find((h) => h.instanceId === heroInstanceId);
  if (!hero) throw new Error('defeatHero: hero not at that location');

  loc.heroesPresent = loc.heroesPresent.filter((h) => h.instanceId !== heroInstanceId);
  // Hero goes to the SHARED Fate discard pile (rulebook Setup §3: one Fate
  // deck and one discard pile for all players).
  s.fateDiscard.push(hero.cardId);
  s.log.push({ turn: s.turn, player: owner, message: `hero ${hero.cardId} defeated` });
  s.pendingTriggers.push({
    event: 'heroDefeated',
    player: owner,
    payload: { cardId: hero.cardId, location: locationIdx },
  });
  return s;
}
