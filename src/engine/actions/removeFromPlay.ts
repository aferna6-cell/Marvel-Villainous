// `removeFromPlay` action — pure removal of one in-play instance.
//
// Many card effects say "defeat X", "destroy X", "discard the hero" — none
// of which the engine wires automatically (per §0 we don't encode card
// text). This action is the hotseat group's escape hatch: click an in-play
// card, dispatch this, and the engine pure-removes it from wherever it
// sits and sends it to the appropriate discard pile.

import { cloneState } from '../util';
import { getCard } from '../cards/registry';
import type { GameState, InPlayCard, InstanceId, PlayerId } from '../types';

interface Hit {
  zone: 'ally' | 'item' | 'hero' | 'condition' | 'event';
  location: number; // -1 for the global event slot
  card: InPlayCard;
}

function findInPlayInstance(state: GameState, owner: PlayerId, instanceId: InstanceId): Hit | null {
  const p = state.players[owner];
  if (!p) return null;
  for (let i = 0; i < p.realm.locations.length; i++) {
    const loc = p.realm.locations[i];
    if (!loc) continue;
    const ally = loc.alliesPresent.find((c) => c.instanceId === instanceId);
    if (ally) return { zone: 'ally', location: i, card: ally };
    const item = loc.itemsPresent.find((c) => c.instanceId === instanceId);
    if (item) return { zone: 'item', location: i, card: item };
    const hero = loc.heroesPresent.find((c) => c.instanceId === instanceId);
    if (hero) return { zone: 'hero', location: i, card: hero };
    const cond = loc.conditions.find((c) => c.instanceId === instanceId);
    if (cond) return { zone: 'condition', location: i, card: cond };
  }
  if (state.globalEvent && state.globalEvent.instanceId === instanceId) {
    return { zone: 'event', location: -1, card: state.globalEvent };
  }
  return null;
}

export function applyRemoveFromPlay(
  state: GameState,
  owner: PlayerId,
  instanceId: InstanceId,
): GameState {
  const hit = findInPlayInstance(state, owner, instanceId);
  if (!hit) throw new Error(`removeFromPlay: instance "${instanceId}" not in ${owner}'s play area`);

  const s = cloneState(state);
  const p = s.players[owner];
  if (!p) throw new Error('removeFromPlay: owner missing');

  if (hit.zone === 'event') {
    s.globalEvent = null;
    s.fateDiscard.push(hit.card.cardId);
    s.log.push({
      turn: s.turn,
      player: owner,
      message: `removed the Global Event (${hit.card.cardId}) from play`,
    });
    s.pendingTriggers.push({
      event: 'conditionTick',
      player: owner,
      payload: { kind: 'eventRemoved', cardId: hit.card.cardId },
    });
    return s;
  }

  const loc = p.realm.locations[hit.location];
  if (!loc) throw new Error('removeFromPlay: location vanished');
  if (hit.zone === 'ally') {
    loc.alliesPresent = loc.alliesPresent.filter((c) => c.instanceId !== instanceId);
    p.discard.push(hit.card.cardId);
    s.pendingTriggers.push({
      event: 'allyDefeated',
      player: owner,
      payload: { cardId: hit.card.cardId, location: hit.location },
    });
  } else if (hit.zone === 'item') {
    loc.itemsPresent = loc.itemsPresent.filter((c) => c.instanceId !== instanceId);
    p.discard.push(hit.card.cardId);
  } else if (hit.zone === 'condition') {
    loc.conditions = loc.conditions.filter((c) => c.instanceId !== instanceId);
    // Conditions are Fate-deck cards — they go to the shared Fate discard.
    const def = getCard(hit.card.cardId);
    if (def && (def.type === 'condition' || def.type === 'fateEffect')) s.fateDiscard.push(hit.card.cardId);
    else p.discard.push(hit.card.cardId);
  } else {
    // hero
    loc.heroesPresent = loc.heroesPresent.filter((c) => c.instanceId !== instanceId);
    s.fateDiscard.push(hit.card.cardId);
    s.pendingTriggers.push({
      event: 'heroDefeated',
      player: owner,
      payload: { cardId: hit.card.cardId, location: hit.location },
    });
  }

  s.log.push({
    turn: s.turn,
    player: owner,
    message: `removed ${hit.zone} ${hit.card.cardId} from ${owner} loc ${hit.location + 1}`,
  });
  return s;
}
