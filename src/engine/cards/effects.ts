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

  const s = cloneState(state);
  s.log.push({
    turn: s.turn,
    player: prompt.player,
    message: `resolved prompt "${prompt.message}" with ${choice.kind}`,
  });
  s.pendingPrompt = null;
  return s;
}

/**
 * Fate-prompt continuation (rulebook "Fate" action). The active player
 * revealed ONE card from the shared Fate deck. The choice is either:
 *  - `{ kind: 'card', cardId }` — play the revealed card on the fated opponent;
 *  - `{ kind: 'skip' }` — discard with no effect (rulebook: "If you draw a
 *     Fate card and cannot play it for whatever reason, discard it with no
 *     effect.").
 *
 * Heroes / conditions are placed on the opponent's realm (CHUNK 6 default:
 * location 0 — pending RULES_QUESTIONS Q9 for per-card placement rules).
 * fateEffect cards resolve against the opponent and then go to the shared
 * Fate discard. The revealed card is always removed from the top of the
 * shared Fate deck.
 */
function resolveFatePlay(
  state: GameState,
  continuation: Extract<PromptContinuation, { kind: 'fatePlay' }>,
  choice: PromptChoice,
): GameState {
  if (choice.kind !== 'card' && choice.kind !== 'skip') {
    throw new Error('resolveFatePlay: expected a card or skip choice');
  }

  let s = cloneState(state);
  const opponent = s.players[continuation.opponent];
  if (!opponent) throw new Error('resolveFatePlay: opponent missing');

  // Remove the revealed cards from the top of the SHARED Fate deck (we peeked
  // when fating; now we commit by removing them).
  for (const cardId of continuation.revealed) {
    const idx = s.fateDeck.indexOf(cardId);
    if (idx !== -1) s.fateDeck.splice(idx, 1);
  }

  s.pendingPrompt = null;

  // Skip: rulebook lets the active player decline an unplayable Fate card.
  // The revealed card goes straight to the shared Fate discard.
  if (choice.kind === 'skip') {
    for (const cardId of continuation.revealed) s.fateDiscard.push(cardId);
    s.log.push({
      turn: s.turn,
      player: state.activePlayer,
      message: `Fate discarded ${continuation.revealed.join(', ')} with no effect`,
    });
    return s;
  }

  if (!continuation.revealed.includes(choice.cardId)) {
    throw new Error('resolveFatePlay: chosen card was not among the revealed cards');
  }
  const playedId = choice.cardId;
  s.log.push({
    turn: s.turn,
    player: state.activePlayer,
    message: `Fate-played ${playedId} against ${continuation.opponent}`,
  });

  const def = getCard(playedId);
  if (!def) {
    // Unknown card: dump it to the shared Fate discard so play can continue.
    s.fateDiscard.push(playedId);
    return s;
  }

  if (def.type === 'hero' || def.type === 'condition') {
    // CHUNK 6 placement default: location 0. Per-card placement target is
    // RULES_QUESTIONS Q9.
    const loc = opponent.realm.locations[0];
    if (loc) {
      const inPlay = {
        instanceId: `inst-${s.instanceCounter}`,
        cardId: playedId,
        strengthModifier: 0,
        tokens: {},
      };
      s.instanceCounter += 1;
      if (def.type === 'hero') loc.heroesPresent.push(inPlay);
      else loc.conditions.push(inPlay);
    }
    return s;
  }

  if (def.type === 'fateEffect') {
    s = applyEffects(s, def.effects, { player: continuation.opponent, sourceCardId: playedId });
    s.fateDiscard.push(playedId);
    return s;
  }

  // Any other type (unexpected on a fate card): send to the shared discard.
  s.fateDiscard.push(playedId);
  return s;
}
