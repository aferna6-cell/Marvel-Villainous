// `playCard` action (marvel-villainous-plan.md §3; rulebook "Play a Card").
// Assumes legality already checked by validate.ts.
//
// Q5: "You may play an Ally to any location in your Domain or directly to an
//      Event. Items are directly played to your Domain only." (rulebook)
// The caller passes `target.location` for ally/item/condition placement.
// If omitted, defaults to the villain's current location.

import { cloneState } from '../util';
import { getCard } from '../cards/registry';
import { applyEffects } from '../cards/effects';
import type { CardId, GameState, InPlayCard, LocationIndex, TargetSpec } from '../types';

export function applyPlayCard(
  state: GameState,
  cardId: CardId,
  target?: TargetSpec,
): GameState {
  let s = cloneState(state);
  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyPlayCard: active player missing');

  const def = getCard(cardId);
  if (!def) throw new Error(`applyPlayCard: unknown card "${cardId}"`);

  // Surcharge from in-play Fate Events: Lockdown at the Raft (+1 to Allies)
  // and Protected Vibranium (+1 to Items).
  let effectiveCost = def.cost;
  if (player.flags['lockdownActive'] && def.type === 'ally') effectiveCost += 1;
  if (player.flags['protectedVibraniumActive'] && def.type === 'item') effectiveCost += 1;

  const handIdx = player.hand.indexOf(cardId);
  if (handIdx !== -1) {
    player.hand.splice(handIdx, 1);
  } else if (def.playableFromDiscard) {
    // Crossbones / Dísir: may be played directly from the discard pile.
    const discardIdx = player.discard.indexOf(cardId);
    if (discardIdx !== -1) {
      player.discard.splice(discardIdx, 1);
      s.log.push({
        turn: s.turn,
        player: s.activePlayer,
        message: `played ${cardId} directly from discard pile`,
      });
    }
  }
  player.power -= effectiveCost;
  if (effectiveCost !== def.cost) {
    s.log.push({
      turn: s.turn,
      player: s.activePlayer,
      message: `surcharge: paid ${effectiveCost} (printed ${def.cost})`,
    });
  }

  // Pick the destination location: the caller's `target.location` if it
  // names one, otherwise the villain's current location (sensible default).
  let placeAt: LocationIndex = player.realm.villainTokenAt;
  if (target?.kind === 'location' && target.player === s.activePlayer) {
    placeAt = target.location;
  }

  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `played ${cardId} for ${def.cost} power → loc ${placeAt + 1}`,
  });

  if (def.type === 'ally' || def.type === 'item' || def.type === 'condition') {
    const inPlay: InPlayCard = {
      instanceId: `inst-${s.instanceCounter}`,
      cardId,
      strengthModifier: 0,
      tokens: {},
    };
    s.instanceCounter += 1;
    const loc = player.realm.locations[placeAt];
    if (loc) {
      if (def.type === 'ally') loc.alliesPresent.push(inPlay);
      else if (def.type === 'item') loc.itemsPresent.push(inPlay);
      else loc.conditions.push(inPlay);
    }
  }

  s.pendingTriggers.push({
    event: 'cardPlayed',
    player: s.activePlayer,
    payload: { cardId, type: def.type, location: placeAt },
  });

  // Jagged Bow — autofires when Jagged Bow is played while a Global Event is
  // in play: park an optional free-Ally play prompt for the active player.
  if (cardId === 'taskmaster-jagged-bow' && s.globalEvent !== null) {
    const allyChoices = player.hand
      .map((id) => ({ id, def: getCard(id) }))
      .filter((x) => x.def?.type === 'ally')
      .map((x) => ({ kind: 'card' as const, cardId: x.id }));
    if (allyChoices.length > 0) {
      s.pendingPrompt = {
        id: `prompt-${s.turn}-${s.log.length}`,
        player: s.activePlayer,
        kind: 'chooseCard',
        message: 'Jagged Bow — play a second Ally to the Event for free',
        choices: [...allyChoices, { kind: 'skip' }],
        continuation: { kind: 'deferred', tag: 'jaggedBowExtra' },
      };
    }
  }

  s = applyEffects(s, def.effects, {
    player: s.activePlayer,
    sourceCardId: cardId,
    location: placeAt,
  });

  // One-shot cards go to the discard pile after their effects resolve.
  if (def.type === 'effect' || def.type === 'fateEffect') {
    const current = s.players[s.activePlayer];
    if (current) current.discard.push(cardId);
  }
  return s;
}
