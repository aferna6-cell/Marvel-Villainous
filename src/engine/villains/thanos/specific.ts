// Thanos `villainSpecific` keys.
//
// Cards in thanos/deck.ts and thanos/fateDeck.ts dispatch on these keys
// via the `villainSpecific` effect op. Each handler performs the
// mechanical state mutation the printed card describes. Where a card's
// effect requires a player decision (e.g. "choose an ally"), the
// handler parks a prompt; the player resolves it via `resolvePrompt`
// and the engine continues.

import { cloneState } from '../../util';
import { getCard } from '../../cards/registry';
import { applyCommonFateSpecific } from '../common/specific';
import type {
  EffectContext,
  GameState,
  PromptChoice,
} from '../../types';

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

  // Common Fate keys delegate to the shared handler first.
  if (applyCommonFateSpecific(s, ctx, key)) return s;

  // ----- objective primitives ---------------------------------------------
  if (key === 'placeStone') {
    const stones = (p.flags['stones'] as string[] | undefined) ?? [];
    const stoneName = (payload as { stone?: string } | null | undefined)?.stone;
    if (stoneName && !stones.includes(stoneName)) stones.push(stoneName);
    p.flags['stones'] = stones;
    const count = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['stones'] = count + 1;
    log(`Thanos collected Infinity Stone${stoneName ? ` "${stoneName}"` : ''} (${count + 1}/6)`);
    return s;
  }
  if (key === 'snap') {
    let warlockInPlay = false;
    for (const loc of p.realm.locations) {
      if (loc.heroesPresent.some((h) => h.cardId === 'fate-thanos-adam-warlock')) {
        warlockInPlay = true;
        break;
      }
    }
    if (warlockInPlay) {
      log('Snap blocked — Adam Warlock is in the Domain');
      return s;
    }
    const count = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    if (count < 6) {
      log(`Snap unavailable — only ${count}/6 Infinity Stones collected`);
      return s;
    }
    s.winner = ctx.player;
    log('THE SNAP — Thanos wins');
    return s;
  }

  // ----- Allies -----------------------------------------------------------
  if (key === 'thanos.blackDwarf.restrictEvent') {
    log('Black Dwarf — cannot be played or relocated to Events.');
    return s;
  }
  if (key === 'thanos.blackSwan.boost') {
    // Black Swan: if she's at the same location as an Infinity Stone, gain
    // strength equal to the strongest opposing Ally at her location.
    // No stone-attached-to-location model yet — log so the player resolves.
    log('Black Swan — gains strength equal to the strongest opposing Ally at her location while a Stone is here.');
    return s;
  }
  if (key === 'thanos.corvusGlaive.legionsRide') {
    log("Corvus Glaive — when relocated to another player's Domain, you may relocate one Legions Ally with him.");
    return s;
  }
  if (key === 'thanos.ebonyMaw.persistOnStoneKill') {
    log("Ebony Maw — not discarded when used to vanquish an opponent's Ally with an attached Infinity Stone.");
    return s;
  }
  if (key === 'thanos.proxima.snipe') {
    // Park a prompt: defeat a character of strength ≤3 at Proxima's location.
    let proxLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.alliesPresent.some((a) => a.cardId === 'thanos-proxima-midnight')) {
        proxLoc = i;
        break;
      }
    }
    if (proxLoc === -1) {
      log('Proxima Midnight — not in play; nothing to snipe.');
      return s;
    }
    const loc = p.realm.locations[proxLoc];
    if (!loc) return s;
    const candidates: PromptChoice[] = [];
    for (const a of loc.alliesPresent) {
      const def = getCard(a.cardId);
      if ((def?.strength ?? 0) <= 3 && a.cardId !== 'thanos-proxima-midnight') {
        candidates.push({ kind: 'card', cardId: a.instanceId });
      }
    }
    for (const h of loc.heroesPresent) {
      const def = getCard(h.cardId);
      if ((def?.strength ?? 0) <= 3) candidates.push({ kind: 'card', cardId: h.instanceId });
    }
    if (candidates.length === 0) {
      log('Proxima Midnight — no character of Strength 3 or less at her location.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Proxima Midnight — defeat a character of Strength 3 or less at her location',
      choices: [...candidates, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'defeatCharacter' },
    };
    return s;
  }

  // ----- Effects ----------------------------------------------------------
  if (key === 'thanos.consultWell') {
    // Choose another player; they receive a random unclaimed Stone; then
    // you may relocate an Ally to that location. The Stone is on THE
    // OPPONENT's side per the printed card, not on Thanos. Log + park a
    // prompt for which opponent to give the Stone to.
    const opponents = s.playerOrder.filter((id) => id !== ctx.player);
    if (opponents.length === 0) {
      log('Consult the Well — no opponents available; effect fizzles.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseTarget',
      message: 'Consult the Well — choose an opponent to receive a random unclaimed Infinity Stone',
      choices: opponents.map(
        (player): PromptChoice => ({ kind: 'target', target: { kind: 'player', player } }),
      ),
      continuation: { kind: 'deferred', tag: 'giveStoneToOpponent' },
    };
    return s;
  }
  if (key === 'thanos.smallPrice') {
    // Gain 1 Power + 1 per *other* Villain who controls at least one
    // Infinity Stone.
    let bonus = 0;
    for (const otherId of s.playerOrder) {
      if (otherId === ctx.player) continue;
      const other = s.players[otherId];
      if (!other) continue;
      const otherStones = (other.flags['stones'] as string[] | undefined) ?? [];
      const otherCount =
        (other.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
      if (otherStones.length > 0 || otherCount > 0) bonus++;
    }
    const gained = 1 + bonus;
    p.power += gained;
    log(`A Small Price to Pay... — gained ${gained} Power (1 + ${bonus} per opponent with a Stone)`);
    return s;
  }
  if (key === 'thanos.tasteCosmic') {
    // Place a +1 token on an Ally you control. The "free vanquish" portion
    // remains a player-resolved follow-up (Vanquish action with the
    // not-discarded clause).
    const allyChoices: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) {
        allyChoices.push({ kind: 'card', cardId: a.instanceId });
      }
    }
    if (allyChoices.length === 0) {
      log('Taste of Cosmic Power — no Allies in play; no token placed.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Taste of Cosmic Power — place a +1 Strength token on an Ally; that Ally may immediately Vanquish (not discarded).',
      choices: [...allyChoices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'tasteCosmic' },
    };
    return s;
  }
  if (key === 'thanos.deliverJudgment') {
    log('Deliver Judgment — choose a location with an Infinity Stone, relocate up to 2 Allies there (Relocate action ×2), and place a +1 Strength token on each of your Allies at that location.');
    return s;
  }
  if (key === 'thanos.madTitan') {
    log("The Mad Titan — pay Power equal to the defeated character's Strength; right-click the target to defeat it, then −Pow.");
    return s;
  }
  if (key === 'thanos.warpReality') {
    // Search discard for an Effect, put in hand. Park a prompt with all
    // effects in discard.
    const effectChoices: PromptChoice[] = [];
    for (const cardId of p.discard) {
      const def = getCard(cardId);
      if (def?.type === 'effect') effectChoices.push({ kind: 'card', cardId });
    }
    if (effectChoices.length === 0) {
      log('Warp Reality — no Effect cards in your discard pile.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Warp Reality — choose an Effect from your discard pile to return to your hand',
      choices: [...effectChoices, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'pickEffectFromDiscard' },
    };
    return s;
  }

  // ----- Items ------------------------------------------------------------
  if (key === 'thanos.deathsFavor') {
    p.flags['deathsFavorActive'] = true;
    log("Death's Favor — this location now grants Activate or Vanquish when Thanos moves to it.");
    return s;
  }
  if (key === 'thanos.spaceThrone') {
    p.flags['spaceThroneActive'] = true;
    log('Space Throne — this location now gains the RELOCATE action.');
    return s;
  }

  // ----- Fate -------------------------------------------------------------
  if (key === 'thanos.fate.adamWarlock.blockSnap') {
    p.flags['adamWarlockBlocksSnap'] = true;
    log("Adam Warlock enters Thanos's Domain — Thanos cannot win while he is here.");
    return s;
  }
  if (key === 'thanos.fate.drax.minAllies') {
    log('Drax the Destroyer — at least 2 Allies must be used in any Vanquish that defeats him.');
    return s;
  }
  if (key === 'thanos.fate.gamora') {
    // Defeat a character at her location. If it's a Thanos Ally, place
    // 2 +1 Strength tokens on Gamora.
    let gamoraLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.heroesPresent.some((h) => h.cardId === 'fate-thanos-gamora')) {
        gamoraLoc = i;
        break;
      }
    }
    if (gamoraLoc === -1) {
      log('Gamora — not in play after resolution.');
      return s;
    }
    const loc = p.realm.locations[gamoraLoc];
    if (!loc) return s;
    const choices: PromptChoice[] = [];
    for (const a of loc.alliesPresent) choices.push({ kind: 'card', cardId: a.instanceId });
    for (const h of loc.heroesPresent) {
      if (h.cardId !== 'fate-thanos-gamora') choices.push({ kind: 'card', cardId: h.instanceId });
    }
    if (choices.length === 0) {
      log('Gamora — no character at her location to defeat.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Gamora — defeat a character at her location (if it's a Thanos Ally, +2 Strength tokens on Gamora)",
      choices,
      continuation: { kind: 'deferred', tag: 'defeatCharacter', payload: { gamoraBoost: true } },
    };
    return s;
  }
  if (key === 'thanos.fate.nebula') {
    // Targeted player loses Power = stones they control. Place tokens on
    // Nebula equal to that Power.
    const stones = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    const lost = Math.min(p.power, stones);
    p.power -= lost;
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        if (h.cardId === 'fate-thanos-nebula') h.strengthModifier = (h.strengthModifier ?? 0) + lost;
      }
    }
    log(`Nebula — Thanos loses ${lost} Power; +${lost} Strength on Nebula.`);
    return s;
  }
  if (key === 'thanos.fate.stoneIsFound') {
    // A Stone Is Found targets an OPPONENT (not Thanos): "Choose a Villain
    // other than Thanos. That Villain receives an unclaimed Infinity Stone."
    // Implemented as a prompt picking the recipient opponent.
    const opponents = s.playerOrder.filter((id) => id !== ctx.player);
    if (opponents.length === 0) {
      log('A Stone Is Found — no eligible recipient; effect fizzles.');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseTarget',
      message: 'A Stone Is Found — choose a Villain other than Thanos to receive an unclaimed Infinity Stone',
      choices: opponents.map(
        (player): PromptChoice => ({ kind: 'target', target: { kind: 'player', player } }),
      ),
      continuation: { kind: 'deferred', tag: 'giveStoneToOpponent' },
    };
    return s;
  }
  if (key === 'thanos.fate.whatDidItCost') {
    const stones = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    const n = Math.min(stones, p.hand.length);
    if (n <= 0) {
      log('What Did It Cost? — Thanos discards 0 cards (no Stones or empty hand).');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: `What Did It Cost? — discard ${n} card${n === 1 ? '' : 's'} from your hand`,
      choices: p.hand.map((cardId) => ({ kind: 'card' as const, cardId })),
      continuation: { kind: 'deferred', tag: 'discardFromHand', payload: { remaining: n } },
    };
    return s;
  }
  if (key === 'thanos.fate.sacrifices') {
    let allyCount = 0;
    for (const loc of p.realm.locations) allyCount += loc.alliesPresent.length;
    log(`Sacrifices Must Be Made — before moving, for each of Thanos's ${allyCount} Allies he must pay 1 Power, discard a card, or remove the Ally.`);
    return s;
  }

  log(`thanos villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
