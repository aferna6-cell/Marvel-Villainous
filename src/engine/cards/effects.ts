// Effect-primitive interpreter (marvel-villainous-plan.md §2.3).
//
// Cards never run arbitrary code — they declare an `EffectSpec[]`, and this
// module interprets each variant as a pure reducer step. Effects that need a
// player decision (which ally to move, which card to discard, ...) pause the
// engine by setting `state.pendingPrompt`; the decision arrives later as a
// `resolvePrompt` action. The `villainSpecific` op is the escape hatch and
// routes to `villains/<key>/specific.ts`.

import { shuffle } from '../rng';
import { cloneState } from '../util';
import { getCard } from './registry';
import { applyVillainSpecific as thanosSpecific } from '../villains/thanos/specific';
import { applyVillainSpecific as helaSpecific } from '../villains/hela/specific';
import { applyVillainSpecific as killmongerSpecific } from '../villains/killmonger/specific';
import { applyVillainSpecific as taskmasterSpecific } from '../villains/taskmaster/specific';
import { applyVillainSpecific as ultronSpecific } from '../villains/ultron/specific';
import type {
  AllyFilter,
  CardDef,
  EffectContext,
  EffectSpec,
  GameState,
  InPlayCard,
  PlayerId,
  PlayerState,
  Prompt,
  PromptChoice,
  PromptContinuation,
  TriggerSpec,
  VillainKey,
} from '../types';

type VillainSpecificFn = (
  state: GameState,
  ctx: EffectContext,
  key: string,
  payload: unknown,
) => GameState;

const villainSpecificHandlers: Record<VillainKey, VillainSpecificFn> = {
  thanos: thanosSpecific,
  hela: helaSpecific,
  killmonger: killmongerSpecific,
  taskmaster: taskmasterSpecific,
  ultron: ultronSpecific,
};

function getPlayer(s: GameState, ctx: EffectContext): PlayerState {
  const p = s.players[ctx.player];
  if (!p) throw new Error(`applyEffect: unknown player "${ctx.player}"`);
  return p;
}

function log(s: GameState, ctx: EffectContext, message: string): void {
  s.log.push({ turn: s.turn, player: ctx.player, message });
}

function enqueue(s: GameState, trigger: TriggerSpec): void {
  s.pendingTriggers.push(trigger);
}

/**
 * If a player's draw pile is empty, shuffle their discard pile into it using
 * the seeded RNG and advance the cursor (marvel-villainous-plan.md §11).
 * Mutates the passed (already-cloned) state.
 */
export function reshuffleDeck(s: GameState, player: PlayerState): void {
  if (player.deck.length > 0 || player.discard.length === 0) return;
  const { items, nextCursor } = shuffle(player.discard, s.seed, s.rngCursor);
  s.rngCursor = nextCursor;
  player.deck = items;
  player.discard = [];
}

function setPrompt(
  s: GameState,
  ctx: EffectContext,
  kind: Prompt['kind'],
  message: string,
  choices: PromptChoice[],
): void {
  s.pendingPrompt = {
    id: `prompt-${s.turn}-${s.log.length}`,
    player: ctx.player,
    kind,
    message,
    choices,
  };
  log(s, ctx, `awaiting decision: ${message}`);
}

function matchesAllyFilter(def: CardDef | undefined, filter: AllyFilter): boolean {
  if (!def) return false;
  if (filter.villain !== undefined && def.villain !== filter.villain) return false;
  if (filter.minStrength !== undefined && (def.strength ?? 0) < filter.minStrength) return false;
  if (filter.tags !== undefined) {
    const tags = def.tags ?? [];
    if (!filter.tags.every((t) => tags.includes(t))) return false;
  }
  return true;
}

/**
 * Interpret one EffectSpec as a pure state transition. The input `state` is
 * never mutated — a deep clone is returned.
 */
export function applyEffect(state: GameState, effect: EffectSpec, ctx: EffectContext): GameState {
  const s = cloneState(state);
  const player = getPlayer(s, ctx);

  switch (effect.op) {
    case 'gainPower': {
      player.power += effect.n;
      log(s, ctx, `gained ${effect.n} power`);
      enqueue(s, { event: 'powerGained', player: ctx.player, payload: { amount: effect.n } });
      return s;
    }

    case 'drawCards': {
      let drawn = 0;
      for (let i = 0; i < effect.n; i++) {
        reshuffleDeck(s, player);
        const card = player.deck.shift();
        if (card === undefined) break; // deck and discard both empty
        player.hand.push(card);
        drawn++;
      }
      log(s, ctx, `drew ${drawn} card(s)`);
      return s;
    }

    case 'discardSelf': {
      const id = ctx.sourceCardId;
      if (id === undefined) {
        log(s, ctx, 'discardSelf: no source card in context');
        return s;
      }
      const handIdx = player.hand.indexOf(id);
      if (handIdx !== -1) {
        player.hand.splice(handIdx, 1);
        player.discard.push(id);
        log(s, ctx, `discarded ${id}`);
      }
      return s;
    }

    case 'boostStrength': {
      let boosted = 0;
      for (const loc of player.realm.locations) {
        for (const ally of loc.alliesPresent) {
          if (matchesAllyFilter(getCard(ally.cardId), effect.allyFilter)) {
            ally.strengthModifier += effect.n;
            boosted++;
          }
        }
      }
      // NOTE: 'turn'-duration boosts are applied identically to 'permanent'
      // ones for now; turn-scoped expiry is deferred — see RULES_QUESTIONS.md.
      log(s, ctx, `boosted ${boosted} ally/allies by ${effect.n} (${effect.duration})`);
      return s;
    }

    case 'placeToken': {
      if (effect.on === 'self') {
        const tokens = (player.flags['tokens'] as Record<string, number> | undefined) ?? {};
        tokens[effect.tokenKind] = (tokens[effect.tokenKind] ?? 0) + 1;
        player.flags['tokens'] = tokens;
        log(s, ctx, `placed a ${effect.tokenKind} token`);
      } else {
        setPrompt(s, ctx, 'chooseCard', `choose a card for a ${effect.tokenKind} token`, []);
      }
      return s;
    }

    case 'defeatHero': {
      const matches: { locationIdx: number; hero: InPlayCard }[] = [];
      player.realm.locations.forEach((loc, locationIdx) => {
        if (effect.whereFilter.index !== undefined && effect.whereFilter.index !== locationIdx) {
          return;
        }
        for (const hero of loc.heroesPresent) matches.push({ locationIdx, hero });
      });
      if (matches.length === 0) {
        log(s, ctx, 'defeatHero: no matching hero');
        return s;
      }
      if (matches.length === 1) {
        const [only] = matches;
        if (only) {
          const loc = player.realm.locations[only.locationIdx];
          if (loc) {
            loc.heroesPresent = loc.heroesPresent.filter(
              (h) => h.instanceId !== only.hero.instanceId,
            );
            // Defeated hero goes to the SHARED Fate discard (rulebook §3).
            s.fateDiscard.push(only.hero.cardId);
            log(s, ctx, `defeated hero ${only.hero.cardId}`);
            enqueue(s, {
              event: 'heroDefeated',
              player: ctx.player,
              payload: { cardId: only.hero.cardId, location: only.locationIdx },
            });
          }
        }
        return s;
      }
      setPrompt(
        s,
        ctx,
        'chooseCard',
        'choose which hero to defeat',
        matches.map((m) => ({ kind: 'card', cardId: m.hero.cardId })),
      );
      return s;
    }

    // Effects below require a player decision the engine cannot make alone.
    // They pause via `pendingPrompt`; the resolution continuation lands in
    // CHUNK 4 once the prompt subsystem carries deferred-effect data.
    case 'moveAlly': {
      setPrompt(s, ctx, 'chooseCard', `move an ally (${effect.from} → ${effect.to})`, []);
      return s;
    }

    case 'moveHero': {
      setPrompt(s, ctx, 'chooseCard', `move a hero (${effect.from} → ${effect.to})`, []);
      return s;
    }

    case 'lookAtFate': {
      setPrompt(
        s,
        ctx,
        'chooseCard',
        `look at the top ${effect.n} Fate card(s), choose ${effect.choose}`,
        [],
      );
      return s;
    }

    case 'searchDeck': {
      setPrompt(s, ctx, 'chooseCard', `search your deck for a card into ${effect.into}`, []);
      return s;
    }

    case 'forceDiscard': {
      const opponents = s.playerOrder.filter((id) => id !== ctx.player);
      const target = opponents[0];
      if (target === undefined) {
        log(s, ctx, 'forceDiscard: no opponent');
        return s;
      }
      const targetState = s.players[target];
      const choices: PromptChoice[] =
        targetState?.hand.map((cardId) => ({ kind: 'card', cardId })) ?? [];
      setPrompt(s, { player: target }, 'chooseCard', `discard ${effect.n} card(s)`, choices);
      return s;
    }

    case 'villainSpecific': {
      const handler = villainSpecificHandlers[player.villain];
      return handler(state, ctx, effect.key, effect.payload);
    }

    default: {
      const exhaustive: never = effect;
      throw new Error(`applyEffect: unhandled effect ${JSON.stringify(exhaustive)}`);
    }
  }
}

/** Apply a list of effects in order, threading state through each. */
export function applyEffects(
  state: GameState,
  effects: readonly EffectSpec[],
  ctx: EffectContext,
): GameState {
  let s = state;
  for (const effect of effects) {
    s = applyEffect(s, effect, ctx);
    // A prompt pauses resolution: remaining effects wait for CHUNK 4's
    // continuation subsystem rather than resolving past an open decision.
    if (s.pendingPrompt !== null) break;
  }
  return s;
}

/** Resolve the current pending prompt, running any attached continuation. */
export function applyResolvePrompt(state: GameState, choice: PromptChoice): GameState {
  const prompt = state.pendingPrompt;
  if (prompt === null) throw new Error('applyResolvePrompt: no pending prompt');

  if (prompt.continuation?.kind === 'fatePlay') {
    return resolveFatePlay(state, prompt.continuation, choice);
  }
  if (prompt.continuation?.kind === 'fatePlaceLocation') {
    return resolveFatePlaceLocation(state, prompt.continuation, choice);
  }
  if (prompt.continuation?.kind === 'deferred') {
    return resolveDeferred(state, prompt, choice);
  }

  const s = cloneState(state);
  s.log.push({
    turn: s.turn,
    player: prompt.player,
    message: `resolved prompt "${prompt.message}" with ${choice.kind}`,
  });
  s.pendingPrompt = null;
  return s;
}

// --- Deferred-action resolver ---------------------------------------------

/** Locate a card instance in any zone of a player's realm. */
function findInstance(
  player: PlayerState,
  instanceId: string,
):
  | { card: InPlayCard; loc: number; zone: 'ally' | 'hero' | 'item' | 'condition' }
  | null {
  for (let i = 0; i < player.realm.locations.length; i++) {
    const loc = player.realm.locations[i];
    if (!loc) continue;
    for (const c of loc.alliesPresent) if (c.instanceId === instanceId) return { card: c, loc: i, zone: 'ally' };
    for (const c of loc.heroesPresent) if (c.instanceId === instanceId) return { card: c, loc: i, zone: 'hero' };
    for (const c of loc.itemsPresent) if (c.instanceId === instanceId) return { card: c, loc: i, zone: 'item' };
    for (const c of loc.conditions) if (c.instanceId === instanceId) return { card: c, loc: i, zone: 'condition' };
  }
  return null;
}

/** Remove (detach + discard) a single instance from a player's realm. */
function removeInstance(player: PlayerState, instanceId: string): void {
  for (const loc of player.realm.locations) {
    if (!loc) continue;
    const ally = loc.alliesPresent.find((c) => c.instanceId === instanceId);
    if (ally) {
      loc.alliesPresent = loc.alliesPresent.filter((c) => c.instanceId !== instanceId);
      player.discard.push(ally.cardId);
      // Cascade: items attached to this ally are also discarded.
      const attached = loc.itemsPresent.filter((it) => it.attachedTo === instanceId);
      loc.itemsPresent = loc.itemsPresent.filter((it) => it.attachedTo !== instanceId);
      for (const it of attached) player.discard.push(it.cardId);
      return;
    }
    const hero = loc.heroesPresent.find((c) => c.instanceId === instanceId);
    if (hero) {
      loc.heroesPresent = loc.heroesPresent.filter((c) => c.instanceId !== instanceId);
      return;
    }
    const item = loc.itemsPresent.find((c) => c.instanceId === instanceId);
    if (item) {
      loc.itemsPresent = loc.itemsPresent.filter((c) => c.instanceId !== instanceId);
      player.discard.push(item.cardId);
      return;
    }
  }
}

function nextInstance(s: GameState): string {
  return `inst-${++s.instanceCounter}`;
}

function resolveDeferred(state: GameState, prompt: Prompt, choice: PromptChoice): GameState {
  if (prompt.continuation?.kind !== 'deferred') {
    throw new Error('resolveDeferred: prompt has no deferred continuation');
  }
  const { tag, payload = {} } = prompt.continuation;
  const s = cloneState(state);
  const p = s.players[prompt.player];
  if (!p) {
    s.pendingPrompt = null;
    return s;
  }
  const log = (msg: string): void => {
    s.log.push({ turn: s.turn, player: prompt.player, message: msg });
  };
  s.pendingPrompt = null;

  if (choice.kind === 'skip') {
    log(`skipped: ${prompt.message}`);
    return s;
  }

  switch (tag) {
    case 'defeatCharacter':
    case 'discardOwnAlly': {
      if (choice.kind !== 'card') break;
      // Search every player's realm — many cross-realm effects feed this
      // resolver (Found by the Avengers step 2, etc.).
      let found: { card: InPlayCard; loc: number; ownerId: PlayerId; zone: 'ally' | 'hero' | 'item' | 'condition' } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f) { found = { card: f.card, loc: f.loc, ownerId: id, zone: f.zone }; break; }
      }
      if (!found) {
        log(`could not find instance "${choice.cardId}" to defeat`);
        break;
      }
      const owner = s.players[found.ownerId];
      if (!owner) break;
      // Heroes go to the shared Fate discard; allies go to owner's discard.
      if (found.zone === 'hero') {
        const loc = owner.realm.locations[found.loc];
        if (loc) {
          loc.heroesPresent = loc.heroesPresent.filter((h) => h.instanceId !== choice.cardId);
          s.fateDiscard.push(found.card.cardId);
        }
      } else {
        removeInstance(owner, choice.cardId);
      }
      log(`defeated ${found.card.cardId} at location ${found.loc + 1} (${found.ownerId})`);
      // Gamora boost: if the defeated card is a Thanos ally, place +2 tokens on Gamora.
      if (payload['gamoraBoost'] === true) {
        const def = getCard(found.card.cardId);
        if (def?.villain === 'thanos') {
          for (const loc of p.realm.locations) {
            for (const h of loc.heroesPresent) {
              if (h.cardId === 'fate-thanos-gamora') {
                h.strengthModifier += 2;
                h.tokens['strength'] = (h.tokens['strength'] ?? 0) + 2;
              }
            }
          }
          log('Gamora — +2 Strength tokens (defeated a Thanos Ally)');
        }
      }
      break;
    }
    case 'discardFromHand': {
      if (choice.kind !== 'card') break;
      const idx = p.hand.indexOf(choice.cardId);
      if (idx === -1) {
        log(`card "${choice.cardId}" not in hand`);
        break;
      }
      p.hand.splice(idx, 1);
      p.discard.push(choice.cardId);
      log(`discarded "${choice.cardId}" from hand`);
      // Multi-discard cycle: re-park if more discards remain.
      const remaining = Number(payload['remaining'] ?? 1) - 1;
      if (remaining > 0 && p.hand.length > 0) {
        s.pendingPrompt = {
          id: `prompt-${s.turn}-${s.log.length}`,
          player: prompt.player,
          kind: 'chooseCard',
          message: `${prompt.message} (${remaining} more)`,
          choices: p.hand.map((cardId) => ({ kind: 'card' as const, cardId })),
          continuation: { kind: 'deferred', tag: 'discardFromHand', payload: { remaining } },
        };
      }
      break;
    }
    case 'boostAlly':
    case 'debuffHero': {
      if (choice.kind !== 'card') break;
      const found = findInstance(p, choice.cardId);
      if (!found) break;
      const n = Number(payload['n'] ?? 1);
      const delta = tag === 'debuffHero' ? -n : n;
      found.card.strengthModifier += delta;
      found.card.tokens['strength'] = (found.card.tokens['strength'] ?? 0) + delta;
      log(`placed ${delta >= 0 ? '+' : ''}${delta} Strength token on ${found.card.cardId}`);
      break;
    }
    case 'soulMarkHero': {
      if (choice.kind !== 'card') break;
      // Search every player's realm — Marked by Death targets any Domain.
      let found: { card: InPlayCard; loc: number } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && f.zone === 'hero') {
          found = { card: f.card, loc: f.loc };
          break;
        }
      }
      if (!found) break;
      if (
        found.card.cardId.startsWith('fate-hela-valkyrior') ||
        found.card.cardId === 'fate-hela-angela' ||
        found.card.cardId === 'fate-hela-balder'
      ) {
        log(`Soul Marks may not be attached to ${found.card.cardId}`);
        break;
      }
      if (found.card.soulMark) {
        log(`${found.card.cardId} already has a Soul Mark`);
        break;
      }
      found.card.soulMark = true;
      found.card.tokens['mark'] = 1;
      // Counter advances for the Marking villain (the prompt's player).
      const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
      p.objectiveProgress.steps['asgard'] = count + 1;
      log(`Attached Soul Mark to ${found.card.cardId} (${count + 1}/8)`);
      break;
    }
    case 'playFromHandFree': {
      if (choice.kind !== 'card') break;
      const idx = p.hand.indexOf(choice.cardId);
      if (idx === -1) break;
      const def = getCard(choice.cardId);
      if (!def) break;
      p.hand.splice(idx, 1);
      const instanceId = nextInstance(s);
      const inst: InPlayCard = {
        instanceId,
        cardId: choice.cardId,
        strengthModifier: 0,
        tokens: {},
      };
      const loc = p.realm.locations[p.realm.villainTokenAt];
      if (loc) {
        if (def.type === 'ally') loc.alliesPresent.push(inst);
        else if (def.type === 'item') loc.itemsPresent.push(inst);
        else if (def.type === 'effect') p.discard.push(choice.cardId);
        else loc.conditions.push(inst);
      }
      log(`played ${choice.cardId} for free at location ${p.realm.villainTokenAt + 1}`);
      break;
    }
    case 'playFromDiscard': {
      if (choice.kind !== 'card') break;
      const idx = p.discard.indexOf(choice.cardId);
      if (idx === -1) break;
      const def = getCard(choice.cardId);
      if (!def) break;
      p.discard.splice(idx, 1);
      const instanceId = nextInstance(s);
      const inst: InPlayCard = {
        instanceId,
        cardId: choice.cardId,
        strengthModifier: 0,
        tokens: {},
      };
      const loc = p.realm.locations[p.realm.villainTokenAt];
      if (loc) {
        if (def.type === 'ally') loc.alliesPresent.push(inst);
        else if (def.type === 'item') loc.itemsPresent.push(inst);
        else loc.conditions.push(inst);
      }
      log(`played ${choice.cardId} from discard at location ${p.realm.villainTokenAt + 1}`);
      break;
    }
    case 'addToHandFromDiscard':
    case 'pickEffectFromDiscard': {
      if (choice.kind !== 'card') break;
      const discardIdx = p.discard.indexOf(choice.cardId);
      if (discardIdx !== -1) {
        p.discard.splice(discardIdx, 1);
        p.hand.push(choice.cardId);
        log(`returned ${choice.cardId} from discard to hand`);
        break;
      }
      const deckIdx = p.deck.indexOf(choice.cardId);
      if (deckIdx !== -1) {
        p.deck.splice(deckIdx, 1);
        p.hand.push(choice.cardId);
        log(`found ${choice.cardId} from deck and added to hand`);
      }
      break;
    }
    case 'giveStoneToOpponent': {
      if (choice.kind !== 'target' || choice.target.kind !== 'player') break;
      const opp = s.players[choice.target.player];
      if (!opp) break;
      const stones = (opp.flags['stones'] as string[] | undefined) ?? [];
      stones.push(`stone-${stones.length + 1}`);
      opp.flags['stones'] = stones;
      const count = (opp.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
      opp.objectiveProgress.steps['stones'] = count + 1;
      log(`${choice.target.player} received an Infinity Stone (${count + 1}/6)`);
      break;
    }
    case 'tasteCosmic': {
      if (choice.kind !== 'card') break;
      const found = findInstance(p, choice.cardId);
      if (!found || found.zone !== 'ally') break;
      found.card.strengthModifier += 1;
      found.card.tokens['strength'] = (found.card.tokens['strength'] ?? 0) + 1;
      found.card.tokens['tasteCosmicVanquish'] = 1; // signals "may immediately Vanquish without discarding"
      log(`Taste of Cosmic Power — +1 Strength on ${found.card.cardId}; may Vanquish immediately without discarding.`);
      break;
    }
    case 'attachItem': {
      if (choice.kind !== 'card') break;
      const itemInstanceId = String(payload['itemInstanceId'] ?? '');
      if (!itemInstanceId) break;
      const item = findInstance(p, itemInstanceId);
      if (!item || item.zone !== 'item') break;
      const target = findInstance(p, choice.cardId);
      if (!target) break;
      item.card.attachedTo = choice.cardId;
      // Move the item to the target's location.
      if (item.loc !== target.loc) {
        const src = p.realm.locations[item.loc];
        const dst = p.realm.locations[target.loc];
        if (src && dst) {
          src.itemsPresent = src.itemsPresent.filter((it) => it.instanceId !== itemInstanceId);
          dst.itemsPresent.push(item.card);
        }
      }
      const def = getCard(item.card.cardId);
      // Apply printed effect of the attach.
      if (def?.id === 'killmonger-wound') {
        target.card.strengthModifier -= 2;
        target.card.tokens['strength'] = (target.card.tokens['strength'] ?? 0) - 2;
      }
      if (def?.id?.startsWith('ultron-impervious-alloy')) {
        target.card.strengthModifier += 2;
        target.card.tokens['strength'] = (target.card.tokens['strength'] ?? 0) + 2;
      }
      if (def?.id === 'fate-hela-odin-force') {
        if (target.card.soulMark) {
          target.card.soulMark = false;
          delete target.card.tokens['mark'];
        }
        target.card.tokens['protector'] = 1;
      }
      log(`attached ${item.card.cardId} to ${target.card.cardId}`);
      break;
    }
    case 'madTitanDefeat': {
      if (choice.kind !== 'card') break;
      // Search every player's realm — Mad Titan targets characters not under
      // Thanos's control at locations where Thanos has an Ally.
      let found: { card: InPlayCard; loc: number; ownerId: PlayerId; zone: 'ally' | 'hero' } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && (f.zone === 'ally' || f.zone === 'hero')) {
          found = { card: f.card, loc: f.loc, ownerId: id, zone: f.zone };
          break;
        }
      }
      if (!found) {
        log(`Mad Titan — target ${choice.cardId} not found`);
        break;
      }
      const def = getCard(found.card.cardId);
      const cost = (def?.strength ?? 0) + (found.card.strengthModifier ?? 0);
      if (p.power < cost) {
        log(`Mad Titan — insufficient Power (${p.power}/${cost}); play fizzles`);
        break;
      }
      p.power -= cost;
      // Defeat the character.
      const owner = s.players[found.ownerId];
      if (!owner) break;
      removeInstance(owner, found.card.instanceId);
      if (found.zone === 'hero') {
        s.fateDiscard.push(found.card.cardId);
        const ownerIdx = owner.discard.lastIndexOf(found.card.cardId);
        if (ownerIdx !== -1) owner.discard.splice(ownerIdx, 1);
      }
      log(`Mad Titan — paid ${cost} Power, defeated ${found.card.cardId} in ${found.ownerId}'s Domain`);
      break;
    }
    case 'crossRealmCharacter': {
      if (choice.kind !== 'card') break;
      const purpose = String(payload['purpose'] ?? 'defeat');
      let found: { card: InPlayCard; loc: number; ownerId: PlayerId; zone: 'ally' | 'hero' | 'item' | 'condition' } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f) { found = { card: f.card, loc: f.loc, ownerId: id, zone: f.zone }; break; }
      }
      if (!found) break;
      const target = s.players[found.ownerId];
      if (!target) break;
      switch (purpose) {
        case 'returnToHand': {
          // Hatut Zeraze: return chosen Ally or Item to owner's hand.
          removeInstance(target, found.card.instanceId);
          // removeInstance pushed it to discard; pop and place in hand instead.
          const pile = target.discard;
          const idx = pile.lastIndexOf(found.card.cardId);
          if (idx !== -1) pile.splice(idx, 1);
          target.hand.push(found.card.cardId);
          log(`returned ${found.card.cardId} to ${found.ownerId}'s hand`);
          break;
        }
        case 'removeItem': {
          // Everett K. Ross / Shuri: remove an Item from opponent's Domain.
          removeInstance(target, found.card.instanceId);
          // If the source was Shuri, add +1 Strength tokens equal to the Item's cost.
          if (payload['boostShuriOnRemove'] === true) {
            const def = getCard(found.card.cardId);
            const cost = def?.cost ?? 0;
            for (const loc of p.realm.locations) {
              for (const h of loc.heroesPresent) {
                if (h.cardId === 'fate-killmonger-shuri') {
                  h.tokens['strength'] = (h.tokens['strength'] ?? 0) + cost;
                  h.strengthModifier = (h.strengthModifier ?? 0) + cost;
                }
              }
            }
            log(`Shuri — +${cost} Strength tokens (cost of removed Item)`);
          }
          log(`removed ${found.card.cardId} from ${found.ownerId}'s Domain`);
          break;
        }
        case 'relocateItem': {
          if (found.zone !== 'item') break;
          const dstLocStr = payload['toLocation'];
          const dstOwnerStr = payload['toOwner'];
          if (typeof dstLocStr === 'number' && typeof dstOwnerStr === 'string') {
            const dstOwner = s.players[dstOwnerStr as PlayerId];
            if (!dstOwner) break;
            const srcLoc = target.realm.locations[found.loc];
            if (!srcLoc) break;
            srcLoc.itemsPresent = srcLoc.itemsPresent.filter((it) => it.instanceId !== found!.card.instanceId);
            const dstLoc = dstOwner.realm.locations[dstLocStr];
            if (dstLoc) dstLoc.itemsPresent.push(found.card);
            log(`relocated Item ${found.card.cardId} → ${dstOwnerStr} loc ${dstLocStr + 1}`);
          }
          break;
        }
        case 'relocateHero': {
          if (found.zone !== 'hero') break;
          const dstLocStr = payload['toLocation'];
          const dstOwnerStr = payload['toOwner'];
          // If destination is unspecified, leave for follow-up; for now,
          // park a chooseLocation prompt against the destination owner.
          if (typeof dstLocStr === 'number' && typeof dstOwnerStr === 'string') {
            const dstOwner = s.players[dstOwnerStr as PlayerId];
            if (!dstOwner) break;
            const srcLoc = target.realm.locations[found.loc];
            if (!srcLoc) break;
            srcLoc.heroesPresent = srcLoc.heroesPresent.filter((h) => h.instanceId !== found!.card.instanceId);
            const dstLoc = dstOwner.realm.locations[dstLocStr];
            if (dstLoc) dstLoc.heroesPresent.push(found.card);
            log(`relocated ${found.card.cardId} → ${dstOwnerStr} loc ${dstLocStr + 1}`);
          }
          break;
        }
        default:
          log(`crossRealmCharacter: purpose "${purpose}" not implemented`);
      }
      break;
    }
    case 'priceOfLife': {
      if (choice.kind !== 'card') break;
      let found: { card: InPlayCard; ownerId: PlayerId } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && f.zone === 'hero') { found = { card: f.card, ownerId: id }; break; }
      }
      if (!found) break;
      if (!found.card.soulMark) break;
      found.card.soulMark = false;
      delete found.card.tokens['mark'];
      const def = getCard(found.card.cardId);
      const gain = (def?.strength ?? 0) + (found.card.strengthModifier ?? 0);
      p.power += gain;
      log(`Price of Life — removed mark from ${found.card.cardId}, gained ${gain} Power`);
      break;
    }
    case 'soulForASoul': {
      if (choice.kind !== 'card') break;
      // Step 1: remove the marked hero from wherever they are.
      let removed: { card: InPlayCard; ownerId: PlayerId; loc: number } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && f.zone === 'hero') { removed = { card: f.card, ownerId: id, loc: f.loc }; break; }
      }
      if (!removed) break;
      const ownerObj = s.players[removed.ownerId];
      if (!ownerObj) break;
      const srcLoc = ownerObj.realm.locations[removed.loc];
      if (!srcLoc) break;
      srcLoc.heroesPresent = srcLoc.heroesPresent.filter((h) => h.instanceId !== removed!.card.instanceId);
      s.fateDiscard.push(removed.card.cardId);
      log(`Soul for a Soul — removed marked ${removed.card.cardId} from ${removed.ownerId}'s Domain`);
      // Step 2: park a prompt for the player to defeat a Hero in Hela's
      // Domain (any Hero — marked or not).
      const heroChoices: PromptChoice[] = [];
      for (const loc of p.realm.locations) {
        for (const h of loc.heroesPresent) {
          heroChoices.push({ kind: 'card', cardId: h.instanceId });
        }
      }
      if (heroChoices.length === 0) {
        log('Soul for a Soul — no Hero in your Domain to defeat.');
        break;
      }
      s.pendingPrompt = {
        id: `prompt-${s.turn}-${s.log.length}`,
        player: prompt.player,
        kind: 'chooseCard',
        message: 'Soul for a Soul — defeat a Hero in your Domain',
        choices: [...heroChoices, { kind: 'skip' }],
        continuation: { kind: 'deferred', tag: 'defeatCharacter' },
      };
      break;
    }
    case 'tauntPickCharacter': {
      if (choice.kind !== 'card') break;
      const f = findInstance(p, choice.cardId);
      if (!f) break;
      // Park step 2: pick destination location in own Domain (any except current).
      const locChoices: PromptChoice[] = [];
      for (let i = 0; i < p.realm.locations.length; i++) {
        if (i !== f.loc) locChoices.push({ kind: 'location', location: i as 0 | 1 | 2 | 3 });
      }
      s.pendingPrompt = {
        id: `prompt-${s.turn}-${s.log.length}`,
        player: prompt.player,
        kind: 'chooseLocation',
        message: `Taunt — relocate ${f.card.cardId} to which of your locations?`,
        choices: locChoices,
        continuation: {
          kind: 'deferred',
          tag: 'tauntPickLocation',
          payload: { instanceId: choice.cardId, fromLoc: f.loc, zone: f.zone },
        },
      };
      break;
    }
    case 'tauntPickLocation': {
      if (choice.kind !== 'location') break;
      const instanceId = String(payload['instanceId'] ?? '');
      const fromLoc = Number(payload['fromLoc'] ?? -1);
      const zone = String(payload['zone'] ?? '');
      if (!instanceId || fromLoc < 0) break;
      const src = p.realm.locations[fromLoc];
      const dst = p.realm.locations[choice.location];
      if (!src || !dst) break;
      if (zone === 'ally') {
        const moved = src.alliesPresent.find((a) => a.instanceId === instanceId);
        if (!moved) break;
        src.alliesPresent = src.alliesPresent.filter((a) => a.instanceId !== instanceId);
        dst.alliesPresent.push(moved);
      } else if (zone === 'hero') {
        const moved = src.heroesPresent.find((a) => a.instanceId === instanceId);
        if (!moved) break;
        src.heroesPresent = src.heroesPresent.filter((a) => a.instanceId !== instanceId);
        dst.heroesPresent.push(moved);
      }
      log(`Taunt — relocated ${instanceId} from loc ${fromLoc + 1} to loc ${choice.location + 1}`);
      break;
    }
    case 'explosivesDefeat': {
      if (choice.kind !== 'card') break;
      const explodingId = String(payload['explosivesInstance'] ?? '');
      const alreadyDefeated = new Set<string>((payload['alreadyDefeated'] as string[]) ?? []);
      // Find and defeat the target.
      let foundOwner: PlayerId | null = null;
      let foundLoc = -1;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && (f.zone === 'ally' || f.zone === 'hero')) {
          foundOwner = id;
          foundLoc = f.loc;
          // Strength gate: ≤4.
          const def = getCard(f.card.cardId);
          if ((def?.strength ?? 99) > 4) {
            log(`Explosives — ${f.card.cardId} too strong (Str ${def?.strength ?? '?'}).`);
            return s;
          }
          break;
        }
      }
      if (!foundOwner) break;
      const owner = s.players[foundOwner];
      if (!owner) break;
      if (foundLoc >= 0) {
        const loc = owner.realm.locations[foundLoc];
        if (loc) {
          const hero = loc.heroesPresent.find((h) => h.instanceId === choice.cardId);
          if (hero) {
            loc.heroesPresent = loc.heroesPresent.filter((h) => h.instanceId !== choice.cardId);
            s.fateDiscard.push(hero.cardId);
          } else {
            removeInstance(owner, choice.cardId);
          }
        }
      }
      alreadyDefeated.add(choice.cardId);
      log(`Explosives — defeated ${choice.cardId} (${alreadyDefeated.size}/2)`);

      // Re-park for a second target if available and not already at 2.
      if (alreadyDefeated.size < 2) {
        const locOf = p.realm.locations.find((loc) => loc.itemsPresent.some((it) => it.instanceId === explodingId));
        if (locOf) {
          const moreChoices: PromptChoice[] = [];
          for (const id of s.playerOrder) {
            const other = s.players[id];
            if (!other) continue;
            for (const opLoc of other.realm.locations) {
              const sameLocation = opLoc === locOf;
              if (!sameLocation) continue;
              for (const c of [...opLoc.alliesPresent, ...opLoc.heroesPresent]) {
                if (alreadyDefeated.has(c.instanceId)) continue;
                const def = getCard(c.cardId);
                if ((def?.strength ?? 99) <= 4) moreChoices.push({ kind: 'card', cardId: c.instanceId });
              }
            }
          }
          if (moreChoices.length > 0) {
            s.pendingPrompt = {
              id: `prompt-${s.turn}-${s.log.length}`,
              player: prompt.player,
              kind: 'chooseCard',
              message: 'Explosives — pick a second character (Str ≤4) at this location, or Skip',
              choices: [...moreChoices, { kind: 'skip' }],
              continuation: {
                kind: 'deferred',
                tag: 'explosivesDefeat',
                payload: { explosivesInstance: explodingId, alreadyDefeated: Array.from(alreadyDefeated) },
              },
            };
            return s;
          }
        }
      }
      // After resolution, remove the Explosives item itself.
      if (explodingId) removeInstance(p, explodingId);
      break;
    }
    case 'shadowInitiative': {
      if (choice.kind !== 'card') break;
      const f = findInstance(p, choice.cardId);
      if (!f || f.zone !== 'ally') break;
      // Pick the next opponent in seat order.
      const opps = s.playerOrder.filter((id) => id !== prompt.player);
      const dstId = opps[s.turn % opps.length] ?? opps[0];
      if (!dstId) break;
      const dst = s.players[dstId];
      if (!dst) break;
      const srcLoc = p.realm.locations[f.loc];
      if (!srcLoc) break;
      srcLoc.alliesPresent = srcLoc.alliesPresent.filter((a) => a.instanceId !== choice.cardId);
      const dstLoc = dst.realm.locations[dst.realm.villainTokenAt];
      if (dstLoc) dstLoc.alliesPresent.push(f.card);
      f.card.strengthModifier += 1;
      f.card.tokens['strength'] = (f.card.tokens['strength'] ?? 0) + 1;
      log(`Shadow Initiative — sent ${f.card.cardId} to ${dstId}'s Domain with +1 Strength token`);
      break;
    }
    case 'trainerForHire': {
      if (choice.kind !== 'target' || choice.target.kind !== 'player') break;
      const opp = s.players[choice.target.player];
      if (!opp) break;
      // Reveal from their deck until an Ally appears.
      const revealed: string[] = [];
      let found: string | null = null;
      while (opp.deck.length > 0) {
        const top = opp.deck.shift();
        if (!top) break;
        const def = getCard(top);
        if (def?.type === 'ally') { found = top; break; }
        revealed.push(top);
      }
      for (const c of revealed) opp.discard.push(c);
      if (found) {
        const def = getCard(found);
        const dstLoc = opp.realm.locations[opp.realm.villainTokenAt];
        if (dstLoc) {
          dstLoc.alliesPresent.push({
            instanceId: `inst-${++s.instanceCounter}`,
            cardId: found,
            strengthModifier: 0,
            tokens: {},
          });
        }
        const bounty = (def?.cost ?? 0) + 1;
        p.power += bounty;
        log(`Trainer for Hire — revealed ${revealed.length} non-Ally(s); played "${found}" to ${choice.target.player} and gained ${bounty} Power.`);
      } else {
        log(`Trainer for Hire — no Ally in ${choice.target.player}'s deck (${revealed.length} discarded).`);
      }
      break;
    }
    case 'spiderCloneSummon': {
      // No choice needed; the handler ran on play and called this to mass-summon.
      break;
    }
    case 'fenrisWolfSummon': {
      if (choice.kind !== 'confirm') break;
      const dstLoc = Number(payload['location'] ?? -1);
      if (dstLoc < 0) break;
      // Find Fenris Wolf in hand or discard.
      let source: 'hand' | 'discard' | 'play' | null = null;
      let srcLocIdx = -1;
      const handIdx = p.hand.indexOf('hela-fenris-wolf');
      const discIdx = p.discard.indexOf('hela-fenris-wolf');
      if (handIdx !== -1) source = 'hand';
      else if (discIdx !== -1) source = 'discard';
      else {
        // already in play — relocate to the dst location.
        for (let i = 0; i < p.realm.locations.length; i++) {
          const loc = p.realm.locations[i];
          if (!loc) continue;
          if (loc.alliesPresent.some((a) => a.cardId === 'hela-fenris-wolf')) {
            source = 'play';
            srcLocIdx = i;
            break;
          }
        }
      }
      if (!source) break;
      const dst = p.realm.locations[dstLoc];
      if (!dst) break;
      if (source === 'hand') p.hand.splice(handIdx, 1);
      else if (source === 'discard') p.discard.splice(discIdx, 1);
      if (source === 'play') {
        const src = p.realm.locations[srcLocIdx];
        if (src) {
          const moved = src.alliesPresent.find((a) => a.cardId === 'hela-fenris-wolf');
          if (moved) {
            src.alliesPresent = src.alliesPresent.filter((a) => a.cardId !== 'hela-fenris-wolf');
            dst.alliesPresent.push(moved);
          }
        }
      } else {
        dst.alliesPresent.push({
          instanceId: `inst-${++s.instanceCounter}`,
          cardId: 'hela-fenris-wolf',
          strengthModifier: 0,
          tokens: {},
        });
      }
      log(`Fenris Wolf — auto-summoned to loc ${dstLoc + 1} (from ${source})`);
      break;
    }
    case 'photographicReflexesAttach': {
      if (choice.kind !== 'confirm') break;
      const effectCardId = String(payload['effectCardId'] ?? '');
      const prInstance = String(payload['prInstance'] ?? '');
      const originalPlayer = String(payload['originalPlayer'] ?? '');
      if (!effectCardId || !prInstance) break;
      if (p.power < 1) {
        log('Photographic Reflexes — not enough Power to attach.');
        break;
      }
      // Find PR instance and stash the effect on tokens.attachedEffect via a
      // synthetic field. Engine convention: tokens are number-valued only,
      // so we use the player flag `prAttached` to store the cardId pair.
      p.power -= 1;
      const attached = (p.flags['prAttached'] as Array<{ effectCardId: string; originalPlayer: string }>) ?? [];
      attached.push({ effectCardId, originalPlayer });
      p.flags['prAttached'] = attached;
      // Mark the PR instance with a count token.
      const found = findInstance(p, prInstance);
      if (found) {
        found.card.tokens['attachedEffects'] = (found.card.tokens['attachedEffects'] ?? 0) + 1;
      }
      log(`Photographic Reflexes — paid 1 Power, attached ${effectCardId} (originally ${originalPlayer}'s)`);
      break;
    }
    case 'jaggedBowExtra': {
      if (choice.kind !== 'card') break;
      // Free play of a chosen Ally from hand to any location.
      const cardId = choice.cardId;
      const idx = p.hand.indexOf(cardId);
      if (idx === -1) break;
      const def = getCard(cardId);
      if (!def || def.type !== 'ally') break;
      p.hand.splice(idx, 1);
      const dest = p.realm.locations[p.realm.villainTokenAt];
      if (!dest) break;
      dest.alliesPresent.push({
        instanceId: `inst-${++s.instanceCounter}`,
        cardId,
        strengthModifier: 0,
        tokens: {},
      });
      log(`Jagged Bow free-play — ${cardId} placed (no Power spent)`);
      break;
    }
    case 'foundByAvengersStep2': {
      // First step: remove the picked Ally.
      if (choice.kind !== 'card') break;
      const allyFound = findInstance(p, choice.cardId);
      if (allyFound && allyFound.zone === 'ally') {
        removeInstance(p, choice.cardId);
        log(`Found by the Avengers — removed Ally ${allyFound.card.cardId}`);
      }
      // Step 2: park a prompt asking which Hero (in any Domain) to also remove.
      const heroChoices: PromptChoice[] = [];
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        for (const loc of other.realm.locations) {
          for (const h of loc.heroesPresent) {
            heroChoices.push({ kind: 'card', cardId: h.instanceId });
          }
        }
      }
      if (heroChoices.length === 0) {
        log('Found by the Avengers — no Hero in any Domain to remove (step 2).');
        break;
      }
      s.pendingPrompt = {
        id: `prompt-${s.turn}-${s.log.length}`,
        player: prompt.player,
        kind: 'chooseCard',
        message: 'Found by the Avengers — pick a Hero to also remove (step 2)',
        choices: [...heroChoices, { kind: 'skip' }],
        continuation: { kind: 'deferred', tag: 'defeatCharacter' },
      };
      break;
    }
    case 'removeSoulMark': {
      if (choice.kind !== 'card') break;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && f.zone === 'hero' && f.card.soulMark) {
          f.card.soulMark = false;
          delete f.card.tokens['mark'];
          log(`removed Soul Mark from ${f.card.cardId}`);
          break;
        }
      }
      break;
    }
    case 'reviveSouls': {
      if (choice.kind !== 'card') break;
      const idx = s.fateDiscard.indexOf(choice.cardId);
      if (idx === -1) break;
      s.fateDiscard.splice(idx, 1);
      const dest = p.realm.locations[p.realm.villainTokenAt];
      if (!dest) break;
      dest.heroesPresent.push({
        instanceId: `inst-${++s.instanceCounter}`,
        cardId: choice.cardId,
        strengthModifier: 0,
        tokens: {},
      });
      log(`Revive Souls — ${choice.cardId} placed in ${prompt.player}'s Domain`);
      break;
    }
    case 'attachOdinForce': {
      if (choice.kind !== 'card') break;
      let found: { card: InPlayCard; ownerId: PlayerId; loc: number } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && f.zone === 'hero') { found = { card: f.card, ownerId: id, loc: f.loc }; break; }
      }
      if (!found) break;
      if (found.card.soulMark) {
        found.card.soulMark = false;
        delete found.card.tokens['mark'];
      }
      found.card.tokens['protector'] = 1;
      // Place the Odin-Force item attached to the hero, at the same location.
      const owner = s.players[found.ownerId];
      if (!owner) break;
      const loc = owner.realm.locations[found.loc];
      if (loc) {
        loc.itemsPresent.push({
          instanceId: `inst-${++s.instanceCounter}`,
          cardId: 'fate-hela-odin-force',
          strengthModifier: 0,
          tokens: {},
          attachedTo: choice.cardId,
        });
      }
      log(`Odin-Force attached to ${found.card.cardId} (PROTECTOR, no-mark)`);
      break;
    }
    case 'molecularRearranger': {
      if (choice.kind !== 'card') break;
      let target: { ownerId: PlayerId; cardId: string } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && (f.zone === 'ally' || f.zone === 'item')) {
          target = { ownerId: id, cardId: f.card.cardId };
          break;
        }
      }
      if (!target) break;
      const owner = s.players[target.ownerId];
      if (!owner) break;
      let removed = 0;
      for (const loc of owner.realm.locations) {
        const allyKeep: InPlayCard[] = [];
        for (const a of loc.alliesPresent) {
          if (a.cardId === target.cardId) {
            owner.discard.push(a.cardId);
            removed++;
          } else allyKeep.push(a);
        }
        loc.alliesPresent = allyKeep;
        const itemKeep: InPlayCard[] = [];
        for (const it of loc.itemsPresent) {
          if (it.cardId === target.cardId) {
            owner.discard.push(it.cardId);
            removed++;
          } else itemKeep.push(it);
        }
        loc.itemsPresent = itemKeep;
      }
      log(`Molecular Rearranger — removed ${removed} copies of ${target.cardId} from ${target.ownerId}'s Domain`);
      break;
    }
    case 'scarletWitchDiscard': {
      // The PromptChoice for type is encoded as {kind:'card', cardId: 'type:ally'}
      // (a synthetic; resolver inspects the cardId string).
      if (choice.kind !== 'card') break;
      const typeStr = choice.cardId.replace(/^type:/, '');
      const opp = s.players[payload['opponentId'] as PlayerId];
      if (!opp) break;
      const keep: string[] = [];
      let removed = 0;
      for (const cardId of opp.hand) {
        const def = getCard(cardId);
        if (def?.type === typeStr) {
          opp.discard.push(cardId);
          removed++;
        } else keep.push(cardId);
      }
      opp.hand = keep;
      log(`Scarlet Witch — ${opp.id} discarded ${removed} card(s) of type "${typeStr}"`);
      break;
    }
    case 'defeatHeroAtEvent': {
      if (choice.kind !== 'card') break;
      // For each player, find an ally at the global Event slot. The game
      // model puts Allies attached to the Event in `state.globalEvent`
      // somewhere — but the existing engine doesn't really model an "Event
      // location" slot per-player. Simplification: defeat the chosen ally
      // wherever it is.
      let target: { ownerId: PlayerId } | null = null;
      for (const id of s.playerOrder) {
        const other = s.players[id];
        if (!other) continue;
        const f = findInstance(other, choice.cardId);
        if (f && f.zone === 'ally') { target = { ownerId: id }; break; }
      }
      if (!target) break;
      const targetPlayer = s.players[target.ownerId];
      if (!targetPlayer) break;
      removeInstance(targetPlayer, choice.cardId);
      log(`Hawkeye — defeated ${target.ownerId}'s Ally ${choice.cardId} at the Event`);
      break;
    }
    case 'activateItem': {
      if (choice.kind !== 'card') break;
      const found = findInstance(p, choice.cardId);
      if (!found) {
        log(`activate: instance "${choice.cardId}" not found`);
        break;
      }
      const def = getCard(found.card.cardId);
      if (!def?.activateEffects?.length) {
        log(`activate: ${found.card.cardId} has no activate effects`);
        break;
      }
      log(`ACTIVATE ${found.card.cardId} at location ${found.loc + 1}`);
      const ctx: EffectContext = {
        player: prompt.player,
        sourceCardId: found.card.cardId,
        location: found.loc as 0 | 1 | 2 | 3,
      };
      // applyEffects is the public effect interpreter; it accepts an
      // EffectSpec[] and returns the post-resolution state. Running it
      // synchronously here threads the resolved state through.
      return applyEffects(s, def.activateEffects, ctx);
    }
    case 'pickAlly':
      // Lightweight: just log; meant to be a payload-driven trigger that
      // downstream handlers can interpret. Most actual ally-pick flows use
      // the more specific tags above.
      if (choice.kind === 'card') log(`picked ally ${choice.cardId}`);
      break;
    default: {
      // Exhaustive guard — TS will catch a missing case.
      const _exh: never = tag;
      void _exh;
    }
  }
  return s;
}

/**
 * Fate-prompt continuation (rulebook "Fate" action). The active player
 * revealed ONE card from the shared Fate deck and now chooses BOTH the target
 * opponent AND whether to play the card — per the rulebook order "reveal,
 * THEN choose which player to target." The choice is either:
 *  - `{ kind: 'target', target: { kind: 'player', player } }` — play the
 *     revealed card on the named opponent's realm;
 *  - `{ kind: 'skip' }` — discard with no effect (rulebook: "If you draw a
 *     Fate card and cannot play it for whatever reason, discard it with no
 *     effect.").
 *
 * Heroes / conditions land on the opponent's realm (CHUNK 6 default:
 * location 0 — pending RULES_QUESTIONS Q9 for per-card placement rules).
 * `fateEffect` cards resolve against the targeted opponent and go to the
 * shared Fate discard. `event` cards go to the central play area as the
 * Global Event (rulebook §I: only one Global Event in play at a time; if
 * one is already in play, the newly drawn one goes to the discard).
 */
function resolveFatePlay(
  state: GameState,
  continuation: Extract<PromptContinuation, { kind: 'fatePlay' }>,
  choice: PromptChoice,
): GameState {
  if (choice.kind !== 'target' && choice.kind !== 'skip') {
    throw new Error('resolveFatePlay: expected a target or skip choice');
  }

  let s = cloneState(state);

  // Remove the revealed cards from the top of the SHARED Fate deck.
  for (const cardId of continuation.revealed) {
    const idx = s.fateDeck.indexOf(cardId);
    if (idx !== -1) s.fateDeck.splice(idx, 1);
  }

  s.pendingPrompt = null;

  // Skip — rulebook escape clause.
  if (choice.kind === 'skip') {
    for (const cardId of continuation.revealed) s.fateDiscard.push(cardId);
    s.log.push({
      turn: s.turn,
      player: state.activePlayer,
      message: `Fate discarded ${continuation.revealed.join(', ')} with no effect`,
    });
    return s;
  }

  if (choice.target.kind !== 'player') {
    throw new Error('resolveFatePlay: Fate target must be a player');
  }
  const targetId = choice.target.player;
  if (targetId === state.activePlayer) {
    // Rulebook: "You may not choose to use a Fate action to play cards into
    // your own Domain."
    throw new Error('resolveFatePlay: cannot Fate yourself');
  }
  if (!continuation.eligibleTargets.includes(targetId)) {
    throw new Error('resolveFatePlay: chosen target was not offered by the prompt');
  }

  const opponent = s.players[targetId];
  if (!opponent) throw new Error('resolveFatePlay: target opponent missing');

  const [playedId] = continuation.revealed;
  if (playedId === undefined) {
    throw new Error('resolveFatePlay: nothing was revealed');
  }
  s.log.push({
    turn: s.turn,
    player: state.activePlayer,
    message: `Fate-played ${playedId} against ${targetId}`,
  });

  const def = getCard(playedId);
  if (!def) {
    // Unknown card: dump to the shared Fate discard so play can continue.
    s.fateDiscard.push(playedId);
    return s;
  }

  if (def.type === 'hero' || def.type === 'condition') {
    // Q9: the fating player chooses the destination location. Park a
    // follow-up prompt with one choice per location on the opponent's realm.
    const locationChoices: PromptChoice[] = ([0, 1, 2, 3] as const).map((i) => ({
      kind: 'location' as const,
      location: i,
    }));
    s.pendingPrompt = {
      id: `fate-place-${s.turn}-${s.log.length}`,
      player: state.activePlayer,
      kind: 'chooseLocation',
      message: `place ${playedId} on ${targetId}'s realm — which location?`,
      choices: locationChoices,
      continuation: { kind: 'fatePlaceLocation', opponent: targetId, cardId: playedId },
    };
    return s;
  }

  if (def.type === 'fateEffect') {
    s = applyEffects(s, def.effects, { player: targetId, sourceCardId: playedId });
    s.fateDiscard.push(playedId);
    return s;
  }

  if (def.type === 'event') {
    // Targeted Event constraint (rulebook §I, Q18 follow-up): if the Event
    // card names a specific villain, it MUST land on that villain. If the
    // chosen target is a different villain, the rulebook says to discard
    // it with no effect.
    if (def.targetedVillain !== undefined && opponent.villain !== def.targetedVillain) {
      s.fateDiscard.push(playedId);
      s.log.push({
        turn: s.turn,
        player: state.activePlayer,
        message: `Targeted Event ${playedId} discarded — ${targetId} is not ${def.targetedVillain}`,
      });
      return s;
    }
    // Rulebook §I: a Global Event card goes to the center play area as a new
    // and unique "location." Only one may be in play at a time — if one is
    // already in play, the newly drawn one goes to the discard.
    if (s.globalEvent !== null) {
      s.fateDiscard.push(playedId);
      s.log.push({
        turn: s.turn,
        player: state.activePlayer,
        message: `Event ${playedId} discarded — a Global Event is already in play`,
      });
      return s;
    }
    s.globalEvent = {
      instanceId: `inst-${s.instanceCounter}`,
      cardId: playedId,
      strengthModifier: 0,
      tokens: {},
    };
    s.instanceCounter += 1;
    s.log.push({
      turn: s.turn,
      player: state.activePlayer,
      message: `Event ${playedId} entered the center play area`,
    });
    return s;
  }

  // Any other type (unexpected on a fate card): send to the shared discard.
  s.fateDiscard.push(playedId);
  return s;
}

/**
 * Q9 step-2: the fating player picked a location on the opponent's realm
 * for the just-revealed hero or condition card. Place it there.
 */
function resolveFatePlaceLocation(
  state: GameState,
  continuation: Extract<PromptContinuation, { kind: 'fatePlaceLocation' }>,
  choice: PromptChoice,
): GameState {
  if (choice.kind !== 'location') {
    throw new Error('resolveFatePlaceLocation: expected a location choice');
  }
  const s = cloneState(state);
  s.pendingPrompt = null;
  const opp = s.players[continuation.opponent];
  const loc = opp?.realm.locations[choice.location];
  if (!opp || !loc) {
    s.fateDiscard.push(continuation.cardId);
    return s;
  }
  const def = getCard(continuation.cardId);
  const inPlay = {
    instanceId: `inst-${s.instanceCounter}`,
    cardId: continuation.cardId,
    strengthModifier: 0,
    tokens: {},
  };
  s.instanceCounter += 1;
  if (def?.type === 'hero') loc.heroesPresent.push(inPlay);
  else loc.conditions.push(inPlay); // condition or fallback
  s.log.push({
    turn: s.turn,
    player: state.activePlayer,
    message: `placed ${continuation.cardId} on ${continuation.opponent} loc ${choice.location + 1}`,
  });
  if (def?.type === 'hero') {
    s.pendingTriggers.push({
      event: 'heroArrived',
      player: continuation.opponent,
      payload: { cardId: continuation.cardId, location: choice.location, instanceId: inPlay.instanceId },
    });
  }
  return s;
}
