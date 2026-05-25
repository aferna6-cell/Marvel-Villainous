// Hela `villainSpecific` keys.

import { cloneState } from '../../util';
import { getCard } from '../../cards/registry';
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
    // Marked by Death: choose a Hero in ANY Domain without a Soul Mark.
    // Gather eligible heroes across every seated player.
    const choices: PromptChoice[] = [];
    for (const playerId of s.playerOrder) {
      const player = s.players[playerId];
      if (!player) continue;
      for (const loc of player.realm.locations) {
        for (const h of loc.heroesPresent) {
          if (h.soulMark) continue;
          if (
            h.cardId.startsWith('fate-hela-valkyrior') ||
            h.cardId === 'fate-hela-angela' ||
            h.cardId === 'fate-hela-balder'
          ) continue;
          choices.push({ kind: 'card', cardId: h.instanceId });
        }
      }
    }
    if (choices.length === 0) {
      log('Marked by Death — no unmarked Hero in any Domain.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Marked by Death — attach a Soul Mark to a Hero in any Domain',
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'soulMarkHero' },
    };
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
      continuation: { kind: 'deferred', tag: 'soulMarkHero' },
    };
    return s;
  }
  if (key === 'hela.midgardSerpent.sweep') {
    log('Midgard Serpent — may defeat each character of Strength 5 or less at her location in a single Vanquish.');
    return s;
  }

  // ----- Effects ----------------------------------------------------------
  if (key === 'hela.deathsEmbrace') {
    // Relocate a marked Hero to "Niflheim" — engine convention: location 0
    // of Hela's Domain (her starting location). The Asgard counter has
    // already been bumped when the Soul Mark was attached, so this is just
    // a movement.
    const markedChoices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const h of loc.heroesPresent) {
          if (h.soulMark) markedChoices.push({ kind: 'card', cardId: h.instanceId });
        }
      }
    }
    if (markedChoices.length === 0) {
      log("Death's Embrace — no marked Hero in any Domain.");
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Death's Embrace — relocate a marked Hero to Niflheim (Hela's loc 0)",
      choices: [...markedChoices, { kind: 'skip' }],
      continuation: {
        kind: 'deferred',
        tag: 'crossRealmCharacter',
        payload: { purpose: 'relocateHero', toOwner: ctx.player, toLocation: 0 },
      },
    };
    return s;
  }
  if (key === 'hela.helToPay') {
    // Defeat a marked Hero in Hela's Domain. Picks one to remove.
    const myMarked: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        if (h.soulMark) myMarked.push({ kind: 'card', cardId: h.instanceId });
      }
    }
    if (myMarked.length === 0) {
      log('Hel to Pay — no marked Hero in your Domain.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Hel to Pay — Vanquish a marked Hero in your Domain',
      choices: [...myMarked, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'defeatCharacter' },
    };
    return s;
  }
  if (key === 'hela.priceOfLife') {
    // Choose a marked Hero in an OPPONENT's Domain; remove the mark; gain
    // Power equal to Hero strength.
    const choices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      if (id === ctx.player) continue;
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const h of loc.heroesPresent) {
          if (h.soulMark) choices.push({ kind: 'card', cardId: h.instanceId });
        }
      }
    }
    if (choices.length === 0) {
      log('Price of Life — no marked Hero in any opponent Domain.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Price of Life — remove a Soul Mark in an opponent's Domain (gain Power = Hero's Strength)",
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'priceOfLife' },
    };
    return s;
  }
  if (key === 'hela.soulForASoul') {
    // Remove a marked Hero from any Domain — then defeat a Hero in Hela's
    // Domain. Done as a 2-step: first pick the marked hero (anywhere), then
    // pick one of Hela's heroes to defeat.
    const choices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const h of loc.heroesPresent) {
          if (h.soulMark) choices.push({ kind: 'card', cardId: h.instanceId });
        }
      }
    }
    if (choices.length === 0) {
      log('Soul for a Soul — no marked Hero in any Domain.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Soul for a Soul — remove a marked Hero from any Domain',
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'soulForASoul' },
    };
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
      continuation: { kind: 'deferred', tag: 'playFromDiscard' },
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
    // Park a prompt for the player to pick any marked Hero to unmark.
    const markedChoices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const h of loc.heroesPresent) {
          if (h.soulMark) markedChoices.push({ kind: 'card', cardId: h.instanceId });
        }
      }
    }
    if (markedChoices.length === 0) {
      log('Balder — no marked Hero to unmark.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Balder — remove a Soul Mark from any one Hero',
      choices: [...markedChoices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'removeSoulMark' },
    };
    return s;
  }
  if (key === 'hela.fate.intervenes') {
    // Shuffle Hela's (the targeted villain's) discard into her deck.
    // Hela is the targeted villain — the active player picks the target,
    // but in single-target Fate effects the target is the active player
    // (Hela's victim). For simplicity, shuffle the Fated-on player's
    // discard back into their deck. Since this handler runs in context
    // of the Fate resolution, ctx.player is the targeted Villain.
    const all = [...p.discard, ...p.deck];
    p.discard = [];
    p.deck = all;
    log(`Fate Intervenes — shuffled ${all.length} cards from discard back into deck`);
    return s;
  }
  if (key === 'hela.fate.reviveSouls') {
    // Pick a Hero from the shared Fate discard and play to the targeted
    // player's Domain at their villain's current location.
    const heroIds: PromptChoice[] = [];
    for (const cid of s.fateDiscard) {
      const def = getCard(cid);
      if (def?.type === 'hero') heroIds.push({ kind: 'card', cardId: cid });
    }
    if (heroIds.length === 0) {
      log('Revive Souls — no Hero in the Fate discard.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Revive Souls — play a Hero from the Fate discard to your Domain',
      choices: [...heroIds, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'reviveSouls' },
    };
    return s;
  }
  if (key === 'hela.fate.conquerValhalla') {
    p.flags['conquerValhallaActive'] = true;
    log('Conquer Valhalla — Hela may not play, find, or access cards in her discard while in play.');
    return s;
  }
  if (key === 'hela.fate.odinForce') {
    // Attach to any Hero in any Domain.
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
      log('Odin-Force — no Hero to attach to.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Odin-Force — attach to a Hero (remove their Soul Mark; gains PROTECTOR; cannot be marked)',
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'attachOdinForce' },
    };
    return s;
  }

  log(`hela villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
