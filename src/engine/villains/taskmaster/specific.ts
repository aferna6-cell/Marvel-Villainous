// Taskmaster `villainSpecific` keys.

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
  if (key === 'completeContract') {
    const list = (p.flags['contracts'] as string[] | undefined) ?? [];
    const id = (payload as { contractId?: string } | null | undefined)?.contractId;
    if (id) list.push(id);
    p.flags['contracts'] = list;
    const count = (p.objectiveProgress.steps['contracts'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['contracts'] = count + 1;
    log(`Taskmaster completed contract${id ? ` "${id}"` : ''} (${count + 1}/4)`);
    return s;
  }

  // ----- Allies -----------------------------------------------------------
  if (key === 'taskmaster.trainees.absorb') {
    p.flags['traineesAbsorb'] = true;
    log("Trainees — instead of discarding an Ally used in Vanquish at this location, remove the Trainees instead.");
    return s;
  }
  if (key === 'taskmaster.anaconda.spreadBoost') {
    log('Anaconda — when used in a Vanquish, place +1 Strength tokens on each remaining Ally at her previous location.');
    return s;
  }
  if (key === 'taskmaster.blackAnt.freePlay') {
    if (p.hand.length === 0) {
      log('Black Ant — no Allies in hand for a free play.');
      return s;
    }
    const allies = p.hand.filter((id) => getCard(id)?.type === 'ally');
    if (allies.length === 0) {
      log('Black Ant — no Allies in hand for a free play.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Black Ant — choose another Ally to play from your hand for free',
      choices: [
        ...allies.map((cardId): PromptChoice => ({ kind: 'card', cardId })),
        { kind: 'skip' },
      ],
      continuation: { kind: 'deferred', tag: 'playFromHandFree' },
    };
    return s;
  }
  if (key === 'taskmaster.bloodSpider.heroDrag') {
    let bsLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.alliesPresent.some((a) => a.cardId === 'taskmaster-blood-spider')) {
        bsLoc = i;
        break;
      }
    }
    if (bsLoc === -1) {
      log('Blood Spider — not in play after resolution.');
      return s;
    }
    const choices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const h of loc.heroesPresent) {
          choices.push({ kind: 'card', cardId: h.instanceId });
        }
      }
    }
    if (choices.length === 0) {
      log('Blood Spider — no Hero to relocate.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Blood Spider — relocate a Hero to her location",
      choices: [...choices, { kind: 'skip' }],
      continuation: {
        kind: 'deferred',
        tag: 'crossRealmCharacter',
        payload: { purpose: 'relocateHero', toOwner: ctx.player, toLocation: bsLoc },
      },
    };
    return s;
  }
  if (key === 'taskmaster.crossbones.playFromDiscard') {
    log('Crossbones — may be played from your discard pile.');
    return s;
  }
  if (key === 'taskmaster.deathShield.scaleWithHeroes') {
    for (const loc of p.realm.locations) {
      const heroCount = loc.heroesPresent.length;
      for (const a of loc.alliesPresent) {
        if (a.cardId === 'taskmaster-death-shield') a.strengthModifier = heroCount;
      }
    }
    log('Death Shield — +1 Strength per Hero at his location.');
    return s;
  }
  if (key === 'taskmaster.diamondback.heroDebuff') {
    let dbLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.alliesPresent.some((a) => a.cardId === 'taskmaster-diamondback')) {
        dbLoc = i;
        break;
      }
    }
    if (dbLoc === -1) {
      log('Diamondback — not in play after resolution.');
      return s;
    }
    const loc = p.realm.locations[dbLoc];
    if (!loc) return s;
    if (loc.heroesPresent.length === 0) {
      log('Diamondback — no Hero at her location.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Diamondback — place a -1 Strength token on a Hero at her location',
      choices: loc.heroesPresent.map(
        (h): PromptChoice => ({ kind: 'card', cardId: h.instanceId }),
      ),
      continuation: { kind: 'deferred', tag: 'debuffHero', payload: { n: 1 } },
    };
    return s;
  }
  if (key === 'taskmaster.jaggedBow.eventBonus') {
    log('Jagged Bow — after relocating/playing to an Event, you may relocate/play a second Ally to the same Event for free.');
    return s;
  }

  // ----- Effects ----------------------------------------------------------
  if (key === 'taskmaster.conductExercise') {
    log('Conduct Exercise — perform an activate action (use an Activate icon at your location).');
    return s;
  }
  if (key === 'taskmaster.redeploy') {
    // Park the first of three relocate prompts.
    const allies: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) allies.push({ kind: 'card', cardId: a.instanceId });
    }
    if (allies.length === 0) {
      log('Redeploy — no Allies to relocate.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Redeploy — pick an Ally to relocate (1 of up to 3)',
      choices: [...allies, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'tauntPickCharacter', payload: { remaining: 3 } },
    };
    return s;
  }
  if (key === 'taskmaster.shadowInitiative') {
    // Pick one of your Allies; the player resolves destination + token via
    // the relocateHero/Ally + boost pattern. Simpler: prompt picks the Ally;
    // resolver auto-relocates to next opponent's location and applies +1.
    const allies: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) allies.push({ kind: 'card', cardId: a.instanceId });
    }
    if (allies.length === 0) {
      log('Shadow Initiative — no Allies to send.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Shadow Initiative — send an Ally to another player's Domain (+1 Str token)",
      choices: [...allies, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'shadowInitiative' },
    };
    return s;
  }
  if (key === 'taskmaster.trainerForHire') {
    // Choose an opponent, reveal from their Villain deck until an Ally
    // appears, play that Ally to their Domain at their villain's location,
    // gain Power = its cost + 1.
    const opps = s.playerOrder.filter((id) => id !== ctx.player);
    if (opps.length === 0) {
      log('Trainer for Hire — no opponents.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseTarget',
      message: "Trainer for Hire — pick an opponent (you reveal their deck until an Ally appears)",
      choices: opps.map(
        (player): PromptChoice => ({ kind: 'target', target: { kind: 'player', player } }),
      ),
      continuation: { kind: 'deferred', tag: 'trainerForHire' },
    };
    return s;
  }

  // ----- Items ------------------------------------------------------------
  if (key === 'taskmaster.trainingAcademy') {
    p.flags['trainingAcademyActive'] = true;
    log('Training Academy — when a character is Vanquished at this location, place +1 tokens on each Ally here and discard this Item instead of the Allies.');
    return s;
  }
  if (key === 'taskmaster.trainingDummy') {
    const allyChoices: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      const hasDummy = loc.itemsPresent.some((it) => it.cardId.startsWith('taskmaster-training-dummy-'));
      if (!hasDummy) continue;
      for (const a of loc.alliesPresent) {
        allyChoices.push({ kind: 'card', cardId: a.instanceId });
      }
    }
    if (allyChoices.length === 0) {
      log('Training Dummy — ACTIVATE: no Ally at this location to boost.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Training Dummy — place a +1 Strength token on an Ally at this location',
      choices: [...allyChoices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'boostAlly', payload: { n: 1 } },
    };
    return s;
  }
  if (key === 'taskmaster.bow.grantVanquish') {
    p.flags['bowVanquish'] = true;
    log("Taskmaster's Bow — this location gains VANQUISH.");
    return s;
  }
  if (key === 'taskmaster.shield.bodyguard') {
    log("Taskmaster's Shield — when an Ally at this location would be defeated or removed, you may remove the Shield instead.");
    return s;
  }
  if (key === 'taskmaster.sword.locationBuff') {
    // All of Taskmaster's Allies at the Sword's location gain +1 Strength.
    for (const loc of p.realm.locations) {
      const hasSword = loc.itemsPresent.some((it) => it.cardId === 'taskmaster-sword');
      if (!hasSword) continue;
      for (const a of loc.alliesPresent) {
        a.tokens['strength'] = (a.tokens['strength'] ?? 0) + 1;
        a.strengthModifier = (a.strengthModifier ?? 0) + 1;
      }
    }
    log("Taskmaster's Sword — all your Allies at this location gain +1 Strength.");
    return s;
  }

  // ----- Specialties ------------------------------------------------------
  if (key === 'taskmaster.lessonPlan') {
    // Pay 1 Power up-front, then park a prompt offering every Item/Effect
    // in your discard pile or deck; pick one to add to hand.
    if (p.power < 1) {
      log('Lesson Plan — not enough Power (need 1).');
      return s;
    }
    p.power -= 1;
    const choices: PromptChoice[] = [];
    const seen = new Set<string>();
    for (const id of [...p.discard, ...p.deck]) {
      if (seen.has(id)) continue;
      seen.add(id);
      const cdef = getCard(id);
      if (cdef?.type === 'item' || cdef?.type === 'effect') {
        choices.push({ kind: 'card', cardId: id });
      }
    }
    if (choices.length === 0) {
      log('Lesson Plan — no Item or Effect in deck/discard.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Lesson Plan — choose an Item or Effect to add to hand (from deck or discard)',
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'pickEffectFromDiscard' },
    };
    return s;
  }
  if (key === 'taskmaster.photographicReflexes') {
    log('Photographic Reflexes — when another player plays an Effect, you may pay 1 Power to attach that Effect; ACTIVATE later to play it.');
    return s;
  }

  // ----- Fate -------------------------------------------------------------
  if (key === 'taskmaster.fate.spiderClone.summonOthers') {
    // Find this clone's location, then pull the other two from Fate deck/discard.
    let cloneLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.heroesPresent.some((h) => h.cardId.startsWith('fate-taskmaster-scarlet-spider-clone'))) {
        cloneLoc = i;
        break;
      }
    }
    if (cloneLoc === -1) return s;
    const dst = p.realm.locations[cloneLoc];
    if (!dst) return s;
    const alreadyHere = new Set(
      dst.heroesPresent
        .filter((h) => h.cardId.startsWith('fate-taskmaster-scarlet-spider-clone'))
        .map((h) => h.cardId),
    );
    let summoned = 0;
    const allClones = [
      'fate-taskmaster-scarlet-spider-clone-1',
      'fate-taskmaster-scarlet-spider-clone-2',
      'fate-taskmaster-scarlet-spider-clone-3',
    ];
    for (const cid of allClones) {
      if (alreadyHere.has(cid)) continue;
      const dIdx = s.fateDeck.indexOf(cid);
      if (dIdx !== -1) {
        s.fateDeck.splice(dIdx, 1);
        dst.heroesPresent.push({
          instanceId: `inst-${++s.instanceCounter}`,
          cardId: cid,
          strengthModifier: 0,
          tokens: {},
        });
        summoned++;
        continue;
      }
      const fdIdx = s.fateDiscard.indexOf(cid);
      if (fdIdx !== -1) {
        s.fateDiscard.splice(fdIdx, 1);
        dst.heroesPresent.push({
          instanceId: `inst-${++s.instanceCounter}`,
          cardId: cid,
          strengthModifier: 0,
          tokens: {},
        });
        summoned++;
      }
    }
    log(`Scarlet Spider Clone — summoned ${summoned} additional clone(s).`);
    return s;
  }
  if (key === 'taskmaster.fate.butterball') {
    p.flags['butterballInPlay'] = true;
    log('Butterball — cannot be defeated; before moving, pay 3 Power + discard 1 card to remove him.');
    return s;
  }
  if (key === 'taskmaster.fate.scottLang') {
    let scottLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.heroesPresent.some((h) => h.cardId === 'fate-taskmaster-scott-lang')) {
        scottLoc = i;
        break;
      }
    }
    if (scottLoc !== -1) {
      const loc = p.realm.locations[scottLoc];
      if (loc) {
        for (const a of loc.alliesPresent) {
          a.tokens['strength'] = (a.tokens['strength'] ?? 0) - 1;
          a.strengthModifier = (a.strengthModifier ?? 0) - 1;
        }
        log(`Scott Lang — all Allies at his location lose 1 Strength (${loc.alliesPresent.length} affected).`);
      }
    }
    return s;
  }
  if (key === 'taskmaster.fate.solo') {
    log('Solo — if he is the only Hero in a Domain, he gains 2 Strength.');
    return s;
  }
  if (key === 'taskmaster.fate.foundByAvengers') {
    // Step 1: pick an Ally of the targeted Villain (ctx.player is the Fated
    // villain here). Then step 2 picks a Hero to remove as well.
    const allies: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) allies.push({ kind: 'card', cardId: a.instanceId });
    }
    if (allies.length === 0) {
      log('Found by the Avengers — no Allies in the targeted Domain.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Found by the Avengers — pick an Ally to remove (step 1)',
      choices: [...allies, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'foundByAvengersStep2' },
    };
    return s;
  }
  if (key === 'taskmaster.fate.governmentWork') {
    p.flags['governmentWorkActive'] = true;
    log('Government Work — Taskmaster cannot relocate Allies or Items except to this Event.');
    return s;
  }

  log(`taskmaster villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
