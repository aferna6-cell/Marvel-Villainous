// Killmonger `villainSpecific` keys.

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
  if (key === 'defeatBoss') {
    const count = (p.objectiveProgress.steps['bosses'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['bosses'] = count + 1;
    log(`Killmonger advanced the boss sequence (${count + 1}/4)`);
    return s;
  }
  if (key === 'claimWakanda') {
    const count = (p.objectiveProgress.steps['bosses'] as number | undefined) ?? 0;
    if (count < 4) {
      log(`Wakanda not yet claimed — ${count}/4 objectives complete`);
      return s;
    }
    s.winner = ctx.player;
    log('Killmonger claims Wakanda — VICTORY');
    return s;
  }

  // ----- Allies -----------------------------------------------------------
  if (key === 'killmonger.dogOfWar.foreignDomain') {
    log("Dog of War — may be played to another player's Domain.");
    return s;
  }
  if (key === 'killmonger.king.dragItem') {
    log('King — when played, you may relocate an unattached Item you control to his location.');
    return s;
  }
  if (key === 'killmonger.rook.bodyguard') {
    p.flags['rookBodyguard'] = true;
    log("Rook — when another Ally at his location would be defeated, you may remove Rook instead.");
    return s;
  }
  if (key === 'killmonger.wkabi.activateDiscount') {
    p.flags['wkabiDiscount'] = true;
    log("W'Kabi — Activated Ability Power cost reduced by 1 while he is in play.");
    return s;
  }

  // ----- Effects ----------------------------------------------------------
  if (key === 'killmonger.fury') {
    // Defeat a character of Strength ≤4 in your Domain — park a prompt.
    const choices: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) {
        const def = getCard(a.cardId);
        if ((def?.strength ?? 99) <= 4) choices.push({ kind: 'card', cardId: a.instanceId });
      }
      for (const h of loc.heroesPresent) {
        const def = getCard(h.cardId);
        if ((def?.strength ?? 99) <= 4) choices.push({ kind: 'card', cardId: h.instanceId });
      }
    }
    if (choices.length === 0) {
      log("Killmonger's Fury — no eligible target (Strength 4 or less).");
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Killmonger's Fury — defeat a character of Strength 4 or less in your Domain",
      choices,
      continuation: { kind: 'deferred', tag: 'defeatCharacter' },
    };
    return s;
  }
  if (key === 'killmonger.executePlan') {
    log('Execute Plan — perform an activate action (use an Activate icon at your location).');
    return s;
  }
  if (key === 'killmonger.taunt') {
    log('Taunt — relocate any character in your Domain to a different location in your Domain.');
    return s;
  }
  if (key === 'killmonger.overpower') {
    let count = 0;
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) {
        a.tokens['strength'] = (a.tokens['strength'] ?? 0) + 1;
        a.strengthModifier = (a.strengthModifier ?? 0) + 1;
        count++;
      }
    }
    log(`Overpower — placed +1 Strength token on each of your Allies (${count}).`);
    return s;
  }

  // ----- Items ------------------------------------------------------------
  if (key === 'killmonger.weaponsCache') {
    log('Weapons Cache — on your turn, you may pay up to 3 Power to reduce target Strength by 1 each until end of turn.');
    return s;
  }
  if (key === 'killmonger.explosives') {
    log('Explosives — remove this Item to defeat up to two characters at this location (each Strength 4 or less).');
    return s;
  }
  if (key === 'killmonger.wound') {
    log('Wound — attach to a character you do not control; they lose 2 Strength.');
    return s;
  }
  if (key === 'killmonger.hackingRig') {
    // Find the player with the most Power that isn't ctx.player.
    let maxPower = 0;
    let maxIs = '';
    for (const other of s.playerOrder) {
      const o = s.players[other];
      if (!o) continue;
      if (o.power > maxPower) {
        maxPower = o.power;
        maxIs = other;
      }
    }
    if (maxIs === ctx.player) {
      log('Hacking Rig — you have the most Power; cannot activate.');
      return s;
    }
    const gain = Math.ceil(maxPower / 2);
    p.power += gain;
    log(`Hacking Rig — ACTIVATE: gained ${gain} Power (half of ${maxPower}, rounded up).`);
    return s;
  }

  // ----- Specialties ------------------------------------------------------
  if (key === 'killmonger.armoredRhino') {
    p.flags['armoredRhinoActive'] = true;
    log("Armored Rhino — Heroes at Killmonger's location lose 1 Strength.");
    return s;
  }
  if (key === 'killmonger.heartShapedHerb') {
    log('Heart-Shaped Herb — gain PLAY A CARD. (Cannot be played if Klaw is in your Domain.)');
    return s;
  }
  if (key === 'killmonger.rage') {
    // Reveal from deck until KILLMONGER'S FURY appears; add to hand. The
    // player must discard a card from hand first (resolved manually).
    const revealed: string[] = [];
    let found: string | null = null;
    while (p.deck.length > 0) {
      const top = p.deck.shift();
      if (!top) break;
      if (top.startsWith('killmonger-fury-')) {
        found = top;
        break;
      }
      revealed.push(top);
    }
    for (const c of revealed) p.discard.push(c);
    if (found) {
      p.hand.push(found);
      log(`Rage of K'liluna — found "${found}" after revealing ${revealed.length} card(s).`);
    } else {
      log(`Rage of K'liluna — no Killmonger's Fury in deck (${revealed.length} discarded).`);
    }
    return s;
  }
  if (key === 'killmonger.stolenWisdom') {
    // Reveal cards from deck until 2 Items are revealed; add them to hand,
    // discard the rest.
    const revealed: string[] = [];
    const items: string[] = [];
    while (p.deck.length > 0 && items.length < 2) {
      const top = p.deck.shift();
      if (!top) break;
      const cdef = getCard(top);
      if (cdef?.type === 'item') items.push(top);
      else revealed.push(top);
    }
    for (const c of revealed) p.discard.push(c);
    for (const it of items) p.hand.push(it);
    log(`Stolen Wisdom — revealed ${revealed.length} non-Item(s), drew ${items.length} Item(s).`);
    return s;
  }

  // ----- Fate -------------------------------------------------------------
  if (key === 'fate.protector') {
    log('PROTECTOR — must be defeated before any other Hero in this Domain can be targeted.');
    return s;
  }
  if (key === 'killmonger.fate.hatutZeraze') {
    // Cross-realm prompt: choose an Ally (Strength ≤2) or any Item in the
    // targeted Fated-on player's Domain; return it to their hand.
    // The "targeted player" is each opponent; for simplicity we let the
    // player choose among ALL opposing Allies (Strength ≤2) and Items.
    const choices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      if (id === ctx.player) continue;
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const a of loc.alliesPresent) {
          const def = getCard(a.cardId);
          if ((def?.strength ?? 99) <= 2) choices.push({ kind: 'card', cardId: a.instanceId });
        }
        for (const it of loc.itemsPresent) {
          choices.push({ kind: 'card', cardId: it.instanceId });
        }
      }
    }
    if (choices.length === 0) {
      log('Hatut Zeraze — no eligible target.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Hatut Zeraze — return an Ally (Str ≤2) or Item to its owner's hand",
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'crossRealmCharacter', payload: { purpose: 'returnToHand' } },
    };
    return s;
  }
  if (key === 'killmonger.fate.blackPanther') {
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        if (h.cardId === 'fate-killmonger-black-panther') h.strengthModifier = (h.strengthModifier ?? 0) + 2;
      }
    }
    log("Black Panther — +2 Strength while in Killmonger's Domain.");
    return s;
  }
  if (key === 'killmonger.fate.everettRoss') {
    const choices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      if (id === ctx.player) continue;
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const it of loc.itemsPresent) {
          choices.push({ kind: 'card', cardId: it.instanceId });
        }
      }
    }
    if (choices.length === 0) {
      log('Everett K. Ross — no opposing Items in play.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Everett K. Ross — remove an Item from an opposing Domain",
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'crossRealmCharacter', payload: { purpose: 'removeItem' } },
    };
    return s;
  }
  if (key === 'killmonger.fate.okoye') {
    log('Okoye — when played, find DORA MILAJE and play her to the same location as Okoye.');
    return s;
  }
  if (key === 'killmonger.fate.shuri') {
    const choices: PromptChoice[] = [];
    for (const id of s.playerOrder) {
      if (id === ctx.player) continue;
      const other = s.players[id];
      if (!other) continue;
      for (const loc of other.realm.locations) {
        for (const it of loc.itemsPresent) {
          choices.push({ kind: 'card', cardId: it.instanceId });
        }
      }
    }
    if (choices.length === 0) {
      log('Shuri — no opposing Items in play.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Shuri — remove an opposing Item; +1 Str tokens on Shuri equal to its cost",
      choices: [...choices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'crossRealmCharacter', payload: { purpose: 'removeItem', boostShuriOnRemove: true } },
    };
    return s;
  }
  if (key === 'killmonger.fate.wakandaForever') {
    log("Wakanda Forever — find BLACK PANTHER and play/relocate him to Killmonger's Domain; if already in play, +1 Strength token on him.");
    return s;
  }
  if (key === 'killmonger.fate.stolenAntiquities') {
    p.flags['stolenAntiquitiesActive'] = true;
    log('Stolen Antiquities — Killmonger cannot play Items while this is in play.');
    return s;
  }

  log(`killmonger villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
