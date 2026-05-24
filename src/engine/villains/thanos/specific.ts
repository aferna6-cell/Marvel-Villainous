// Thanos `villainSpecific` keys.
//
// Cards in thanos/deck.ts and thanos/fateDeck.ts dispatch on these keys
// via the `villainSpecific` effect op. Each handler performs the
// mechanical state mutation the printed card describes. Where a card's
// effect requires a player decision (e.g. "discard one of your Allies"),
// the handler parks a prompt; the player resolves it via `resolvePrompt`
// and the engine continues.
//
// Recognized keys:
//   - placeStone (payload: { stone?: string }) — generic stone-collect.
//   - snap — wins if stones == 6.
//   - thanos.consultWell — collect a stone (player picks via prompt).
//   - thanos.smallPrice — discard 1 Ally for +3 Power.
//   - thanos.tasteCosmic — +1 Power per stone collected.
//   - thanos.madTitan — pay X Power = strength of defeated character.
//   - thanos.deathsFavor.grantVanquish / thanos.spaceThrone.grantMove —
//     passive grants resolved at icon-use time (no-op when played).
//   - thanos.blackDwarf.restrictEvent / thanos.proxima.noHeroLocation —
//     passive restrictions read at placement time (no-op when played).
//   - thanos.blackSwan.boost — recompute Black Swan's strengthModifier
//     based on Black Order count.
//   - thanos.corvusGlaive.returnOnDefeat — re-hand on defeat (handled by
//     trigger bus later; this handler tags the in-play instance).
//   - thanos.fate.adamWarlock.blockSnap — passive flag; snap handler reads.
//   - thanos.fate.drax.minAllies — passive; legality check reads.
//   - thanos.fate.gamora.defeatAlly — prompt to defeat one Ally at her loc.
//   - thanos.fate.nebula.boostPerStone — recompute Nebula's strength.
//   - thanos.fate.stoneIsFound — opponent removes 1 stone from Thanos.
//   - thanos.fate.whatDidItCost — Thanos discards 2 cards from hand.
//   - thanos.fate.sacrifices.startOfTurn — start-of-turn trigger (passive).

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

  // Common Fate keys delegate to the shared handler first.
  if (applyCommonFateSpecific(s, ctx, key)) return s;

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
    // Adam Warlock blocks the Snap.
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

  if (key === 'thanos.consultWell') {
    // Hand-resolved as a stone-pick: bump the counter generically and
    // let the player record the specific stone via the +/- UI if needed.
    const count = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['stones'] = count + 1;
    const stones = (p.flags['stones'] as string[] | undefined) ?? [];
    p.flags['stones'] = [...stones, `stone-${count + 1}`];
    log(`Consult the Well — collected an Infinity Stone (${count + 1}/6)`);
    return s;
  }

  if (key === 'thanos.smallPrice') {
    // Park a prompt: "discard one of your Allies for +3 Power."
    const allyChoices: PromptChoice[] = [];
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      for (const a of loc.alliesPresent) {
        allyChoices.push({ kind: 'card', cardId: a.instanceId });
      }
    }
    if (allyChoices.length === 0) {
      log('A Small Price to Pay — no allies in play; +3 Power directly');
      p.power += 3;
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Discard one of your Allies — gain 3 Power',
      choices: [...allyChoices, { kind: 'skip' }],
    };
    log('A Small Price to Pay — awaiting ally discard');
    return s;
  }

  if (key === 'thanos.tasteCosmic') {
    const stones = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    p.power += stones;
    log(`Taste of Cosmic Power — +${stones} Power (one per Stone collected)`);
    return s;
  }

  if (key === 'thanos.madTitan') {
    // Dynamic cost (Q19): the player resolves the choice + cost manually
    // via the removeFromPlay + adjustPower escape hatches. Engine logs the
    // prompt so it's visible in the action log.
    log("The Mad Titan — pay Power equal to target's Strength; right-click target to defeat it, then −Pow.");
    return s;
  }

  if (key === 'thanos.deathsFavor.grantVanquish') {
    p.flags['deathsFavorActive'] = true;
    log("Death's Favor — its location now offers an extra Vanquish action.");
    return s;
  }

  if (key === 'thanos.spaceThrone.grantMove') {
    p.flags['spaceThroneActive'] = true;
    log('Space Throne — Thanos may now Move an Ally/Item at this location.');
    return s;
  }

  if (key === 'thanos.blackDwarf.restrictEvent') {
    log('Black Dwarf enters play — cannot be relocated to Events.');
    return s;
  }

  if (key === 'thanos.proxima.noHeroLocation') {
    log('Proxima Midnight enters play — cannot occupy a location with a Hero.');
    return s;
  }

  if (key === 'thanos.blackSwan.boost') {
    // Recompute every Black Swan in play: strength bonus = count of other
    // Black Order allies in Thanos's domain.
    let blackOrderCount = 0;
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) {
        const def = getCard(a.cardId);
        if (def?.tags?.includes('blackOrder') && def.id !== 'thanos-black-swan') {
          blackOrderCount++;
        }
      }
    }
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) {
        if (a.cardId === 'thanos-black-swan') a.strengthModifier = blackOrderCount;
      }
    }
    log(`Black Swan strength: +${blackOrderCount} (per other Black Order Ally)`);
    return s;
  }

  if (key === 'thanos.corvusGlaive.returnOnDefeat') {
    log('Corvus Glaive — when defeated, return to hand (manual: undo + draw).');
    return s;
  }

  if (key === 'thanos.fate.adamWarlock.blockSnap') {
    p.flags['adamWarlockBlocksSnap'] = true;
    log('Adam Warlock enters Thanos\'s Domain — Snap is blocked.');
    return s;
  }
  if (key === 'thanos.fate.drax.minAllies') {
    log('Drax the Destroyer — requires 2+ Allies to Vanquish.');
    return s;
  }
  if (key === 'thanos.fate.gamora.defeatAlly') {
    // Find allies at Gamora's location and prompt for one to defeat.
    const heroPos = (() => {
      for (let i = 0; i < p.realm.locations.length; i++) {
        const loc = p.realm.locations[i];
        if (!loc) continue;
        if (loc.heroesPresent.some((h) => h.cardId === 'fate-thanos-gamora')) return i;
      }
      return -1;
    })();
    if (heroPos === -1) {
      log('Gamora — already removed before resolution');
      return s;
    }
    const loc = p.realm.locations[heroPos];
    if (!loc) return s;
    if (loc.alliesPresent.length === 0) {
      log('Gamora played — no Allies at her location to defeat');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: `Gamora — defeat one of your Allies at location ${heroPos + 1}`,
      choices: loc.alliesPresent.map((a) => ({ kind: 'card' as const, cardId: a.instanceId })),
    };
    return s;
  }
  if (key === 'thanos.fate.nebula.boostPerStone') {
    const stones = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        if (h.cardId === 'fate-thanos-nebula') h.strengthModifier = stones;
      }
    }
    log(`Nebula strength: +${stones} (per Infinity Stone collected)`);
    return s;
  }
  if (key === 'thanos.fate.stoneIsFound') {
    const stones = (p.flags['stones'] as string[] | undefined) ?? [];
    if (stones.length > 0) {
      const removed = stones.pop();
      p.flags['stones'] = stones;
      const count = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 1;
      p.objectiveProgress.steps['stones'] = Math.max(0, count - 1);
      log(`A Stone Is Found — Thanos loses "${removed}" (${count - 1}/6)`);
    } else {
      log('A Stone Is Found — Thanos has no stones to lose');
    }
    return s;
  }
  if (key === 'thanos.fate.whatDidItCost') {
    // Discard 2 from Thanos's hand. Park a prompt for the player to pick.
    if (p.hand.length === 0) {
      log('What Did It Cost? — Thanos\'s hand is empty');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'What Did It Cost? — discard 2 cards from your hand',
      choices: p.hand.map((cardId) => ({ kind: 'card' as const, cardId })),
    };
    return s;
  }
  if (key === 'thanos.fate.sacrifices.startOfTurn') {
    log('Sacrifices Must Be Made — on start of each turn, discard an Ally or lose 2 Power.');
    return s;
  }

  log(`thanos villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
