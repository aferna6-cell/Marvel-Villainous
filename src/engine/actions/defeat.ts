// Hero-defeat resolution (marvel-villainous-plan.md §4).
// Shared by the `attackHero` action and by `defeatHero` effects.
// Assumes legality already checked by the caller.

import { cloneState } from '../util';
import type { GameState, InstanceId, LocationIndex, PlayerId } from '../types';

/**
 * Remove a defeated hero from a realm. Several Heroes have an "instead of
 * discarding…" clause that this handler honors before falling through to the
 * standard "hero goes to the shared Fate discard pile" behavior:
 *   - Hulk: +1 Strength token, relocate to another player's Domain.
 *   - Wonder Man: when defeated, find VISION and play him to Wonder Man's
 *     previous location.
 *   - Hela Bidding passive: opponent gains 3 Power when a marked Hero is
 *     defeated.
 *
 * In all cases a `heroDefeated` trigger is enqueued for the event bus.
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

  // Detach attached items first (they cascade with the hero by default unless
  // the hero is moved instead of discarded).
  const movedInstead =
    hero.cardId === 'fate-common-hulk' &&
    // Hulk relocates only if there's another player to send him to.
    s.playerOrder.filter((id) => id !== owner).length > 0;

  // Remove the hero from this location regardless.
  loc.heroesPresent = loc.heroesPresent.filter((h) => h.instanceId !== heroInstanceId);

  if (movedInstead) {
    // Hulk gets a +1 Strength token and shows up in a *different* villain's
    // Domain. We pick the next seat in player order deterministically.
    hero.strengthModifier += 1;
    hero.tokens['strength'] = (hero.tokens['strength'] ?? 0) + 1;
    const others = s.playerOrder.filter((id) => id !== owner);
    const dest = others[(s.turn + 0) % others.length] ?? others[0];
    const destPlayer = dest ? s.players[dest] : undefined;
    if (destPlayer) {
      const destLoc = destPlayer.realm.locations[destPlayer.realm.villainTokenAt];
      if (destLoc) destLoc.heroesPresent.push(hero);
      s.log.push({
        turn: s.turn,
        player: owner,
        message: `Hulk relocates to ${dest}'s Domain with +1 Strength (instead of discarding)`,
      });
    }
  } else {
    // Standard defeat: hero card to shared Fate discard.
    s.fateDiscard.push(hero.cardId);
    s.log.push({ turn: s.turn, player: owner, message: `hero ${hero.cardId} defeated` });

    // Hela's Bidding: opponents who marked this hero gain 3 Power.
    if (hero.soulMark) {
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other || id === owner) continue;
        if (other.flags['biddingActive']) {
          other.power += 3;
          s.log.push({
            turn: s.turn,
            player: id,
            message: `Hela's Bidding — gained 3 Power (marked Hero defeated)`,
          });
        }
      }
    }

    // Wonder Man: find Vision from the shared Fate deck/discard and play to
    // the same location. (Engine "find" = pull from deck; "play" = put in
    // place. Mechanically: search both piles, splice out the first Vision,
    // and put him at locationIdx.)
    if (hero.cardId === 'fate-ultron-wonder-man') {
      const visionId = 'fate-common-vision';
      let visionFound = false;
      const fdIdx = s.fateDeck.indexOf(visionId);
      if (fdIdx !== -1) {
        s.fateDeck.splice(fdIdx, 1);
        visionFound = true;
      } else {
        const ddIdx = s.fateDiscard.indexOf(visionId);
        if (ddIdx !== -1) {
          s.fateDiscard.splice(ddIdx, 1);
          visionFound = true;
        }
      }
      if (visionFound) {
        const nextInstance = `inst-${++s.instanceCounter}`;
        loc.heroesPresent.push({
          instanceId: nextInstance,
          cardId: visionId,
          strengthModifier: 0,
          tokens: {},
        });
        s.log.push({
          turn: s.turn,
          player: owner,
          message: 'Wonder Man defeated — Vision arrives at his previous location.',
        });
      }
    }
  }

  s.pendingTriggers.push({
    event: 'heroDefeated',
    player: owner,
    payload: { cardId: hero.cardId, location: locationIdx, marked: hero.soulMark === true },
  });
  return s;
}
