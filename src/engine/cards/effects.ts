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
      const found = findInstance(p, choice.cardId);
      if (!found) {
        log(`could not find instance "${choice.cardId}" to defeat`);
        break;
      }
      removeInstance(p, choice.cardId);
      log(`defeated ${found.card.cardId} at location ${found.loc + 1}`);
      // If Gamora was the source and the defeated card is a Thanos ally, +2 strength tokens.
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
      const found = findInstance(p, choice.cardId);
      if (!found || found.zone !== 'hero') break;
      // Heroes with the "no-soul-mark" tag refuse.
      if (
        found.card.cardId === 'fate-hela-valkyrior-1' ||
        found.card.cardId === 'fate-hela-valkyrior-2' ||
        found.card.cardId === 'fate-hela-valkyrior-3' ||
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
      const idx = p.discard.indexOf(choice.cardId);
      if (idx === -1) break;
      p.discard.splice(idx, 1);
      p.hand.push(choice.cardId);
      log(`returned ${choice.cardId} from discard to hand`);
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
  return s;
}
