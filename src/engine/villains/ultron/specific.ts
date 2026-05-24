// Ultron `villainSpecific` keys.

import { cloneState } from '../../util';
import { getCard } from '../../cards/registry';
import { applyCommonFateSpecific } from '../common/specific';
import type { EffectContext, GameState } from '../../types';

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

  // Core objective handlers.
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

  // Card-specific.
  if (key === 'ultron.flyingSentry.freeRelocate') {
    log('Flying Sentry — relocate for free (no Move icon required).');
    return s;
  }
  if (key === 'ultron.heavyAttack.vanquishBoost') {
    log('Heavy Attack Sentry — +2 Strength when attacking a Hero (resolve manually in Vanquish).');
    return s;
  }
  if (key === 'ultron.assemblyLine.costReduction') {
    p.flags['assemblyLineActive'] = true;
    log('Assembly Line — Allies at this location cost 1 less Power (resolve via −Pow before playCard).');
    return s;
  }

  // Fate handlers.
  if (key === 'ultron.fate.hankPym.removeUpgrade') {
    const count = (p.objectiveProgress.steps['upgrades'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['upgrades'] = Math.max(0, count - 1);
    log(`Hank Pym arrives — Ultron loses 1 Upgrade (${Math.max(0, count - 1)}/4).`);
    return s;
  }
  if (key === 'ultron.fate.scarletWitch.discardItem') {
    log('Scarlet Witch — Ultron discards 1 Item (resolve manually with right-click).');
    return s;
  }
  if (key === 'ultron.fate.wonderMan.boostPerAvenger') {
    // Find Wonder Man instances and boost per other Avenger Hero in same realm.
    for (const loc of p.realm.locations) {
      const avengerCount = loc.heroesPresent.filter((h) => {
        const def = getCard(h.cardId);
        return def?.tags?.includes('avenger') && h.cardId !== 'fate-ultron-wonder-man';
      }).length;
      for (const h of loc.heroesPresent) {
        if (h.cardId === 'fate-ultron-wonder-man') h.strengthModifier = avengerCount;
      }
    }
    log("Wonder Man recomputed — +1 per other Avenger in Ultron's Domain.");
    return s;
  }
  if (key === 'ultron.fate.deactivationSwitch') {
    p.flags['deactivationSwitchActive'] = true;
    log('Deactivation Switch — Ultron may not use the Activate icon at this location.');
    return s;
  }
  if (key === 'ultron.fate.invasionStark.startOfTurn') {
    log('Invasion of Stark Industries — Ultron loses 1 Power at the start of each turn (passive).');
    return s;
  }

  log(`ultron villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
