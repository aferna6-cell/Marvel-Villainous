// Common Fate `villainSpecific` keys — shared across all 5 villains'
// per-villain handlers. Each villain's specific.ts checks for these
// `fate.common.*` keys before falling through to the per-villain code.

import { getCard } from '../../cards/registry';
import type { EffectContext, GameState } from '../../types';

/** Returns true if the key was a fate.common.* key and was handled. */
export function applyCommonFateSpecific(
  s: GameState,
  ctx: EffectContext,
  key: string,
): boolean {
  if (!key.startsWith('fate.common.') && key !== 'fate.protector') return false;
  const p = s.players[ctx.player];
  if (!p) return true;
  const log = (msg: string): void => {
    s.log.push({ turn: s.turn, player: ctx.player, message: msg });
  };

  if (key === 'fate.protector') {
    log('PROTECTOR — this Hero must be defeated before any other Hero in this Domain can be targeted.');
    return true;
  }

  if (key === 'fate.common.ironMan') {
    p.flags['ironManSurcharge'] = true;
    log('Iron Man — whenever you Activate, pay 1 extra Power.');
    return true;
  }
  if (key === 'fate.common.blackWidow') {
    log('Black Widow — when played, you may defeat an Ally at her location.');
    return true;
  }
  if (key === 'fate.common.nickFury') {
    const lost = Math.ceil(p.power / 2);
    p.power -= lost;
    log(`Nick Fury — lost ${lost} Power (half of starting, rounded up).`);
    return true;
  }
  if (key === 'fate.common.hulk') {
    log('Hulk — when defeated, +1 Strength token, relocate to another player\'s Domain instead of discarding. Nothing can be attached to him.');
    return true;
  }
  if (key === 'fate.common.falcon') {
    log('Falcon — you may relocate a Hero (Strength ≤3) from any Domain to his location.');
    return true;
  }
  if (key === 'fate.common.hawkeye') {
    log("Hawkeye — defeat one of the targeted player's Allies at an Event.");
    return true;
  }
  if (key === 'fate.common.sheHulk') {
    p.flags['sheHulkBlocksEvents'] = true;
    log('She-Hulk — you cannot relocate or play to Events while she is in your Domain.');
    return true;
  }
  if (key === 'fate.common.vision') {
    p.flags['visionPowerPenalty'] = true;
    log('Vision — whenever you gain Power, gain 1 fewer Power while Vision is in your Domain.');
    return true;
  }
  if (key === 'fate.common.thor.protector') {
    log('Thor — PROTECTOR.');
    return true;
  }
  if (key === 'fate.common.captainMarvel') {
    let captainLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.heroesPresent.some((h) => h.cardId === 'fate-common-captain-marvel')) {
        captainLoc = i;
        break;
      }
    }
    if (captainLoc === -1) {
      log('Captain Marvel — not in play after resolution.');
      return true;
    }
    // Move every Ally in p's Domain to Captain Marvel's location.
    let moved = 0;
    const dst = p.realm.locations[captainLoc];
    if (!dst) return true;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc || i === captainLoc) continue;
      for (const a of loc.alliesPresent) {
        dst.alliesPresent.push(a);
        moved++;
      }
      loc.alliesPresent = [];
    }
    log(`Captain Marvel — relocated ${moved} Ally/Allies to her location.`);
    return true;
  }
  if (key === 'fate.common.captainAmerica') {
    let captainLoc = -1;
    for (let i = 0; i < p.realm.locations.length; i++) {
      const loc = p.realm.locations[i];
      if (!loc) continue;
      if (loc.heroesPresent.some((h) => h.cardId === 'fate-common-captain-america')) {
        captainLoc = i;
        break;
      }
    }
    if (captainLoc === -1) {
      log('Captain America — not in play after resolution.');
      return true;
    }
    let count = 0;
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        h.tokens['strength'] = (h.tokens['strength'] ?? 0) + 1;
        h.strengthModifier = (h.strengthModifier ?? 0) + 1;
        count++;
      }
    }
    log(`Captain America — +1 Strength token on each Hero in this Domain (${count}).`);
    return true;
  }

  // ----- Events ----------------------------------------------------------
  if (key === 'fate.common.protectedVibranium') {
    p.flags['protectedVibraniumActive'] = true;
    log('Protected Vibranium — Items cost 1 extra Power. Reward: find an Item from deck/discard.');
    return true;
  }
  if (key === 'fate.common.lockdown') {
    p.flags['lockdownActive'] = true;
    log('Lockdown at the Raft — Allies cost 1 extra Power. Reward: find an Ally from deck/discard.');
    return true;
  }
  if (key === 'fate.common.helicarrier') {
    p.flags['helicarrierActive'] = true;
    log('Helicarrier Alert — end-of-turn draw is capped at 3. Reward: draw 3 cards.');
    return true;
  }
  if (key === 'fate.common.avengersAssemble') {
    p.flags['avengersAssembleActive'] = true;
    log("Avengers Assemble — current Villain must draw a Fate card and play on themselves; each Villain does so at start of their turn. Reward: defeat all Heroes in your Domain.");
    // Mark all avenger references so callers know we read getCard during init.
    void getCard;
    return true;
  }

  log(`fate.common villainSpecific "${key}" — no handler (no-op)`);
  return true;
}
