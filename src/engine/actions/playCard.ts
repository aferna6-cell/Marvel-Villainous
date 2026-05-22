// `playCard` action (marvel-villainous-plan.md §3).
// Assumes legality already checked by validate.ts.
//
// NOTE: allies/items/conditions are placed at the villain's current location.
// Whether the player may instead choose a destination location is a rulebook
// detail — see RULES_QUESTIONS.md.

import { cloneState } from '../util';
import { getCard } from '../cards/registry';
import { applyEffects } from '../cards/effects';
import type { CardId, GameState, InPlayCard, TargetSpec } from '../types';

export function applyPlayCard(
  state: GameState,
  cardId: CardId,
  _target?: TargetSpec,
): GameState {
  let s = cloneState(state);
  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyPlayCard: active player missing');

  const def = getCard(cardId);
  if (!def) throw new Error(`applyPlayCard: unknown card "${cardId}"`);

  const handIdx = player.hand.indexOf(cardId);
  if (handIdx !== -1) player.hand.splice(handIdx, 1);
  player.power -= def.cost;

  const locIdx = player.realm.villainTokenAt;
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `played ${cardId} for ${def.cost} power`,
  });

  if (def.type === 'ally' || def.type === 'item' || def.type === 'condition') {
    const inPlay: InPlayCard = {
      instanceId: `inst-${s.instanceCounter}`,
      cardId,
      strengthModifier: 0,
      tokens: {},
    };
    s.instanceCounter += 1;
    const loc = player.realm.locations[locIdx];
    if (loc) {
      if (def.type === 'ally') loc.alliesPresent.push(inPlay);
      else if (def.type === 'item') loc.itemsPresent.push(inPlay);
      else loc.conditions.push(inPlay);
    }
  }

  s.pendingTriggers.push({
    event: 'cardPlayed',
    player: s.activePlayer,
    payload: { cardId, type: def.type },
  });

  s = applyEffects(s, def.effects, {
    player: s.activePlayer,
    sourceCardId: cardId,
    location: locIdx,
  });

  // One-shot cards go to the discard pile after their effects resolve.
  if (def.type === 'effect' || def.type === 'fateEffect') {
    const current = s.players[s.activePlayer];
    if (current) current.discard.push(cardId);
  }
  return s;
}
