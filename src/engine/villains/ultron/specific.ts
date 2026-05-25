// Ultron `villainSpecific` keys.

import { cloneState } from '../../util';
import { getCard } from '../../cards/registry';
import { applyCommonFateSpecific } from '../common/specific';
import type { EffectContext, GameState, PromptChoice } from '../../types';

export function applyVillainSpecific(
  state: GameState,
  ctx: EffectContext,
  key: string,
  payload: unknown,
): GameState {
  const s = cloneState(state);
  const p = s.players[ctx.player];
  if (!p) return s;
  const log = (msg: string): void => {
    s.log.push({ turn: s.turn, player: ctx.player, message: msg });
  };

  if (applyCommonFateSpecific(s, ctx, key)) return s;

  // ----- objective primitives ---------------------------------------------
  if (key === 'installUpgrade') {
    const list = (p.flags['upgrades'] as string[] | undefined) ?? [];
    const slot = (payload as { slot?: string } | null | undefined)?.slot;
    if (slot && !list.includes(slot)) list.push(slot);
    p.flags['upgrades'] = list;
    const count = (p.objectiveProgress.steps['upgrades'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['upgrades'] = count + 1;
    log(`Ultron installed upgrade${slot ? ` "${slot}"` : ''} (${count + 1}/4)`);
    return s;
  }
  if (key === 'markFinalForm') {
    p.objectiveProgress.steps['finalForm'] = 1;
    log('Ultron reaches final form');
    return s;
  }

  // ----- Allies -----------------------------------------------------------
  if (key === 'ultron.flyingSentry.escape') {
    log('Flying Sentry — when at an Event when it resolves, you may relocate this Ally to any location in your Domain.');
    return s;
  }
  if (key === 'ultron.heavyAttack.grantVanquish') {
    p.flags['heavyAttackVanquish'] = true;
    log('Heavy Attack Sentry — this location gains VANQUISH.');
    return s;
  }
  if (key === 'ultron.alkhema.snipe') {
    let alkLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.alliesPresent.some((a) => a.cardId === 'ultron-alkhema')) {
        alkLoc = i;
        break;
      }
    }
    if (alkLoc === -1) {
      log('Alkhema — not in play after resolution.');
      return s;
    }
    const loc = p.realm.locations[alkLoc];
    if (!loc) return s;
    const choices: PromptChoice[] = [];
    for (const a of loc.alliesPresent) {
      if (a.cardId !== 'ultron-alkhema') choices.push({ kind: 'card', cardId: a.instanceId });
    }
    for (const h of loc.heroesPresent) {
      choices.push({ kind: 'card', cardId: h.instanceId });
    }
    if (choices.length === 0) {
      log('Alkhema — no character at her location to defeat.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Alkhema — defeat a character at her location',
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'defeatCharacter' },
    };
    return s;
  }
  if (key === 'ultron.giantSentry.discardCost') {
    log('Giant Sentry — may discard two other Sentries from your hand instead of paying the 6 Power cost.');
    return s;
  }
  if (key === 'ultron.jocasta.heroSwap') {
    const heroes: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const h of loc.heroesPresent) heroes.push({ kind: 'card', cardId: h.instanceId });
      }
    }
    if (heroes.length === 0) {
      log('Jocasta — no Hero in any Domain to relocate.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Jocasta — relocate any Hero to Ultron's current location",
      choices: [...heroes, { kind: 'skip' }],
      continuation: {
        kind: 'deferred',
        tag: 'crossRealmCharacter',
        payload: { purpose: 'relocateHero', toOwner: ctx.player, toLocation: p.realm.villainTokenAt },
      },
    };
    return s;
  }

  // ----- Effects ----------------------------------------------------------
  if (key === 'ultron.reconfigure') {
    let locsWithSentry = 0;
    for (const loc of p.realm.locations) {
      const hasSentry = loc.alliesPresent.some((a) => {
        const def = getCard(a.cardId);
        return def?.tags?.includes('sentry');
      });
      if (hasSentry) locsWithSentry++;
    }
    p.power += locsWithSentry;
    log(`Reconfigure — gained ${locsWithSentry} Power (one per location with a Sentry).`);
    return s;
  }
  if (key === 'ultron.assimilateKnowledge') {
    // Engine simplification: log the top 6 Fate-deck cards so the player can
    // see them, then leave them in place (rearrange not modelled).
    const peek = s.fateDeck.slice(0, 6);
    log(`Assimilate Knowledge — top of Fate deck: ${peek.join(', ') || '(empty)'}`);
    return s;
  }
  if (key === 'ultron.encephaloRay') {
    let count = 0;
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        h.tokens['strength'] = (h.tokens['strength'] ?? 0) - 1;
        h.strengthModifier = (h.strengthModifier ?? 0) - 1;
        count++;
      }
    }
    log(`Encephalo-Ray — placed a -1 Strength token on each Hero in Ultron's Domain (${count} hero${count === 1 ? '' : 'es'}).`);
    return s;
  }
  if (key === 'ultron.everyContingency') {
    // Defaults to seeking an Effect first then an Item; the choice between
    // Item/Effect is the player's, so we reveal until either appears and let
    // the player resolve by choosing one (or fall back to the first match).
    const revealed: string[] = [];
    let found: string | null = null;
    while (p.deck.length > 0) {
      const top = p.deck.shift();
      if (!top) break;
      const cdef = getCard(top);
      if (cdef?.type === 'effect' || cdef?.type === 'item') {
        found = top;
        break;
      }
      revealed.push(top);
    }
    for (const c of revealed) p.discard.push(c);
    if (found) {
      p.hand.push(found);
      log(`Every Contingency Covered — revealed ${revealed.length} non-target(s), drew "${found}".`);
    } else {
      log(`Every Contingency Covered — no Item/Effect found in deck (${revealed.length} discarded).`);
    }
    return s;
  }
  if (key === 'ultron.technoforming') {
    const allies: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) allies.push({ kind: 'card', cardId: a.instanceId });
    }
    if (allies.length === 0) {
      log('Technoforming — no Allies to boost.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Technoforming — place a +1 Strength token on an Ally',
      choices: [...allies, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'boostAlly', payload: { n: 1 } },
    };
    return s;
  }

  // ----- Items ------------------------------------------------------------
  if (key === 'ultron.imperviousAlloy') {
    log('Impervious Alloy — attach to an Ally; only removed when the Ally is defeated or removed.');
    return s;
  }
  if (key === 'ultron.assemblyLine') {
    // Reveal from the top of your deck until an Ally appears, add it to
    // hand, send the rest to discard, then +1 Power.
    const revealed: string[] = [];
    let foundAlly: string | null = null;
    while (p.deck.length > 0) {
      const top = p.deck.shift();
      if (!top) break;
      const cdef = getCard(top);
      if (cdef?.type === 'ally') {
        foundAlly = top;
        break;
      }
      revealed.push(top);
    }
    for (const c of revealed) p.discard.push(c);
    if (foundAlly) {
      p.hand.push(foundAlly);
      log(`Assembly Line — revealed ${revealed.length} non-Ally(s), drew "${foundAlly}".`);
    } else {
      log(`Assembly Line — no Ally found in deck (${revealed.length} cards revealed and discarded).`);
    }
    p.power += 1;
    log('Assembly Line — gained 1 Power.');
    return s;
  }

  // ----- Fate -------------------------------------------------------------
  if (key === 'ultron.fate.hankPym') {
    p.flags['hankPymBlocksDiscard'] = true;
    log("Hank Pym — Ultron may not play or find cards from his discard pile while Hank Pym is in his Domain.");
    return s;
  }
  if (key === 'ultron.fate.mockingbird') {
    const lost = Math.min(p.power, 2);
    p.power -= lost;
    log(`Mockingbird — Ultron loses ${lost} Power.`);
    return s;
  }
  if (key === 'ultron.fate.scarletWitch') {
    // Choose a card type to force a discard. Engine simplification: park a
    // prompt offering the four primary types as synthetic `card` choices.
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Scarlet Witch — choose a card type; targeted player discards all matching cards from hand",
      choices: [
        { kind: 'card', cardId: 'type:ally' },
        { kind: 'card', cardId: 'type:item' },
        { kind: 'card', cardId: 'type:effect' },
        { kind: 'card', cardId: 'type:specialty' },
        { kind: 'skip' },
      ],
      continuation: { kind: 'deferred', tag: 'scarletWitchDiscard', payload: { opponentId: ctx.player } },
    };
    return s;
  }
  if (key === 'ultron.fate.wasp') {
    const heroes: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const h of loc.heroesPresent) heroes.push({ kind: 'card', cardId: h.instanceId });
      }
    }
    if (heroes.length === 0) {
      log('Wasp — no Hero to relocate.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Wasp — relocate any Hero to Ultron's current location",
      choices: [...heroes, { kind: 'skip' }],
      continuation: {
        kind: 'deferred',
        tag: 'crossRealmCharacter',
        payload: { purpose: 'relocateHero', toOwner: ctx.player, toLocation: p.realm.villainTokenAt },
      },
    };
    return s;
  }
  if (key === 'ultron.fate.wonderMan') {
    log("Wonder Man — when defeated, find VISION and play or relocate him to Wonder Man's previous location.");
    return s;
  }
  if (key === 'ultron.fate.molecularRearranger') {
    const choices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      if (id === ctx.player) continue;
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const a of loc.alliesPresent) choices.push({ kind: 'card', cardId: a.instanceId });
        for (const it of loc.itemsPresent) choices.push({ kind: 'card', cardId: it.instanceId });
      }
    }
    if (choices.length === 0) {
      log('Molecular Rearranger — no Ally/Item in any opposing Domain.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Molecular Rearranger — pick an Item or Ally; opponent removes ALL copies of it",
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'molecularRearranger' },
    };
    return s;
  }
  if (key === 'ultron.fate.deactivationSwitch') {
    p.flags['deactivationSwitchActive'] = true;
    log('Deactivation Switch — attach to a Specialty; it may not be used until the player pays 2 Power to remove it.');
    return s;
  }
  if (key === 'ultron.fate.invasionStark') {
    p.flags['invasionStarkActive'] = true;
    log('Invasion of Stark Enterprises — Ultron gains 1 fewer Power when gaining Power. Reward: gain 6 Power.');
    return s;
  }

  log(`ultron villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
