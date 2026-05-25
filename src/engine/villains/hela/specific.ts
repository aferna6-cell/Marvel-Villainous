// Hela `villainSpecific` keys.

import { cloneState } from '../../util';
import { applyCommonFateSpecific } from '../common/specific';
import type { EffectContext, GameState, PromptChoice } from '../../types';

export function applyVillainSpecific(
  state: GameState,
  ctx: EffectContext,
  key: string,
  _payload: unknown,
): GameState {
  const s = cloneState(state);
  const p = s.players[ctx.player];
  if (!p) return s;
  const log = (msg: string): void => {
    s.log.push({ turn: s.turn, player: ctx.player, message: msg });
  };

  if (applyCommonFateSpecific(s, ctx, key)) return s;

  // ----- objective primitives ---------------------------------------------
  if (key === 'placeSoulMark') {
    const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['asgard'] = count + 1;
    log(`Hela attached a Soul Mark (${count + 1}/8)`);
    return s;
  }
  if (key === 'controlAsgard') {
    const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    if (count < 8) {
      log(`Asgard not yet controlled — ${count}/8`);
      return s;
    }
    s.winner = ctx.player;
    log('Hela conquers Asgard — VICTORY');
    return s;
  }

  // ----- Allies -----------------------------------------------------------
  if (key === 'hela.disir.playFromDiscard') {
    log('Dísir — may be played from your discard pile (Play action sources from discard, no extra cost).');
    return s;
  }
  if (key === 'hela.draugr.scaleWithDiscard') {
    const draugrInDiscard = p.discard.filter((id) => id.startsWith('hela-draugr-swordsman-')).length;
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) {
        if (a.cardId.startsWith('hela-draugr-swordsman-')) a.strengthModifier = draugrInDiscard;
      }
    }
    log(`Draugr Swordsman — +${draugrInDiscard} Strength (one per Draugr in discard).`);
    return s;
  }
  if (key === 'hela.fenris.heroSummon') {
    log('Fenris Wolf — when a Hero is played to your Domain, you may play or relocate Fenris there for free.');
    return s;
  }
  if (key === 'hela.leah.mark') {
    // Find Leah's location, prompt for an unmarked Hero there.
    let leahLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.alliesPresent.some((a) => a.cardId === 'hela-leah')) {
        leahLoc = i;
        break;
      }
    }
    if (leahLoc === -1) {
      log('Leah — not in play after resolution.');
      return s;
    }
    const loc = p.realm.locations[leahLoc];
    if (!loc) return s;
    const choices: PromptChoice[] = loc.heroesPresent
      .filter((h) => !(h as { soulMark?: boolean }).soulMark)
      .map((h) => ({ kind: 'card' as const, cardId: h.instanceId }));
    if (choices.length === 0) {
      log('Leah — no Hero at her location to mark.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Leah — attach a Soul Mark to a Hero at her location',
      choices: [...choices, { kind: 'skip' }],
    };
    return s;
  }
  if (key === 'hela.midgardSerpent.sweep') {
    log('Midgard Serpent — may defeat each character of Strength 5 or less at her location in a single Vanquish.');
    return s;
  }

  // ----- Effects ----------------------------------------------------------
  if (key === 'hela.deathsEmbrace') {
    log("Death's Embrace — relocate a Hero with an attached Soul Mark to Niflheim (use the Move-hero action then advance the Asgard counter).");
    return s;
  }
  if (key === 'hela.helToPay') {
    log("Hel to Pay — choose a Hero in your Domain with a Soul Mark and Vanquish him (right-click + ObjectiveTracker +).");
    return s;
  }
  if (key === 'hela.priceOfLife') {
    log("Price of Life — remove a Soul Mark from a Hero in another player's Domain, then gain Power equal to that Hero's Strength.");
    return s;
  }
  if (key === 'hela.soulForASoul') {
    log("Soul for a Soul — remove a marked Hero from any Domain; if you do, defeat a Hero in Hela's Domain.");
    return s;
  }

  // ----- Items ------------------------------------------------------------
  if (key === 'hela.nightsword.activate') {
    log('Nightsword — ACTIVATE: attach a Soul Mark to an unmarked Hero at this location.');
    return s;
  }

  // ----- Specialties ------------------------------------------------------
  if (key === 'hela.handOfGlory') {
    log('Hand of Glory — ACTIVATE: choose a Hero in the Fate discard pile, pay Power = their Strength, play them to any Domain, attach a Soul Mark.');
    return s;
  }
  if (key === 'hela.bidding') {
    p.flags['biddingActive'] = true;
    log("Hela's Bidding — passive: gain 3 Power each time another player defeats a marked Hero.");
    return s;
  }
  if (key === 'hela.raiseTheDead') {
    const draugrInDiscard = p.discard
      .filter((id) => id.startsWith('hela-draugr-swordsman-'));
    if (draugrInDiscard.length === 0) {
      log('Raise the Dead — no Draugr Swordsman in discard.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Raise the Dead — play a Draugr Swordsman from your discard pile',
      choices: draugrInDiscard.map((cardId) => ({ kind: 'card' as const, cardId })),
    };
    return s;
  }

  // ----- Fate -------------------------------------------------------------
  if (key === 'hela.fate.valkyrior.noMark') {
    log('Valkyrior — Soul Marks may not be attached to her.');
    return s;
  }
  if (key === 'hela.fate.angela') {
    const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['asgard'] = Math.max(0, count - 1);
    log(`Angela arrives — removes a Soul Mark from Odin's Vault (${Math.max(0, count - 1)}/8). Soul Marks cannot be attached to Angela.`);
    return s;
  }
  if (key === 'hela.fate.balder') {
    log('Balder — Soul Marks cannot be attached to him. When played, remove a Soul Mark from any one Hero.');
    return s;
  }
  if (key === 'hela.fate.intervenes') {
    log("Fate Intervenes — shuffle the targeted player's discard pile into their Villain deck.");
    return s;
  }
  if (key === 'hela.fate.reviveSouls') {
    log("Revive Souls — choose a Hero in the Fate discard pile; play that Hero to the targeted player's Domain.");
    return s;
  }
  if (key === 'hela.fate.conquerValhalla') {
    p.flags['conquerValhallaActive'] = true;
    log('Conquer Valhalla — Hela may not play, find, or access cards in her discard while in play.');
    return s;
  }
  if (key === 'hela.fate.odinForce') {
    log('Odin-Force — attach to a Hero: remove any Soul Mark, no Soul Mark may be attached, gains PROTECTOR.');
    return s;
  }

  log(`hela villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
