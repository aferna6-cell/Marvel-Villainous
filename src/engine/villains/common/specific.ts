// Common Fate `villainSpecific` keys — shared across all 5 villains'
// per-villain handlers. Each villain's specific.ts checks for these
// `fate.common.*` keys before falling through to a no-op.

import { getCard } from '../../cards/registry';
import type { EffectContext, GameState } from '../../types';

/** Returns null if the key is not a fate.common.* key (caller should fall through). */
export function applyCommonFateSpecific(
  s: GameState,
  ctx: EffectContext,
  key: string,
): boolean {
  if (!key.startsWith('fate.common.')) return false;
  const p = s.players[ctx.player];
  if (!p) return true;
  const log = (msg: string): void => {
    s.log.push({ turn: s.turn, player: ctx.player, message: msg });
  };

  if (key === 'fate.common.blackWidow.discard') {
    log('Black Widow — the villain discards 1 card (resolve manually via Discard).');
    return true;
  }
  if (key === 'fate.common.hulk.tenacious') {
    log('Hulk — when defeated, roll 1d6; on 4+ move Hulk instead of defeating him.');
    return true;
  }
  if (key === 'fate.common.sheHulk.teamBoost') {
    for (const loc of p.realm.locations) {
      const otherAvengers = loc.heroesPresent.filter((h) => {
        const def = getCard(h.cardId);
        return def?.tags?.includes('avenger') && h.cardId !== 'fate-common-she-hulk';
      }).length;
      for (const h of loc.heroesPresent) {
        if (h.cardId === 'fate-common-she-hulk') h.strengthModifier = otherAvengers > 0 ? 1 : 0;
      }
    }
    log('She-Hulk — recomputed boost (+1 with another Avenger in the same Domain).');
    return true;
  }
  if (key === 'fate.common.thor.zap') {
    p.power = Math.max(0, p.power - 2);
    log('Thor arrives — villain loses 2 Power.');
    return true;
  }
  if (key === 'fate.common.captainMarvel.minAllies') {
    log('Captain Marvel — Vanquish requires at least 3 Allies.');
    return true;
  }
  if (key === 'fate.common.captainAmerica.discardItem') {
    log('Captain America — villain discards 1 Item (resolve manually with right-click).');
    return true;
  }
  if (key === 'fate.common.avengersAssemble') {
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        const def = getCard(h.cardId);
        if (def?.tags?.includes('avenger')) h.strengthModifier += 1;
      }
    }
    log('Avengers Assemble — Avenger Heroes here gain +1 Strength.');
    return true;
  }
  if (key === 'fate.common.lockdown') {
    p.flags['lockdownActive'] = true;
    log('Lockdown at the Raft — villain may not play Mercenary allies.');
    return true;
  }
  if (key === 'fate.common.protectedVibranium') {
    p.flags['vibraniumActive'] = true;
    log('Protected Vibranium — Items cannot be played for free in this Domain.');
    return true;
  }

  log(`fate.common villainSpecific "${key}" — no handler (no-op)`);
  return true;
}
