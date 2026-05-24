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

  // Core objective handlers.
  if (key === 'defeatBoss') {
    const count = (p.objectiveProgress.steps['bosses'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['bosses'] = count + 1;
    log(`Killmonger advanced the boss sequence (${count + 1}/4)`);
    return s;
  }
  if (key === 'claimWakanda') {
    const count = (p.objectiveProgress.steps['bosses'] as number | undefined) ?? 0;
    if (count < 4) {
      log(`Wakanda not yet claimed — ${count}/4 bosses defeated`);
      return s;
    }
    s.winner = ctx.player;
    log('Killmonger claims Wakanda — VICTORY');
    return s;
  }

  // Card-specific handlers.
  if (key === 'killmonger.rook.buffLocation') {
    log('Rook arrives — Allies at this location gain +1 Strength (resolve manually).');
    return s;
  }
  if (key === 'killmonger.overpower') {
    log('Overpower — defeat any Hero. Use the right-click remove + skip the Vanquish discard.');
    return s;
  }
  if (key === 'killmonger.weaponsCache') {
    log('Weapons Cache — Allies here gain +1 Strength (resolve manually).');
    return s;
  }
  if (key === 'killmonger.explosives') {
    // Defeat a Hero of strength 4 or less — park a prompt.
    const choices: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        const def = getCard(h.cardId);
        if ((def?.strength ?? 0) <= 4) choices.push({ kind: 'card', cardId: h.instanceId });
      }
    }
    if (choices.length === 0) {
      log('Explosives — no eligible Hero (Strength 4 or less)');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Explosives — defeat a Hero of Strength 4 or less',
      choices,
    };
    return s;
  }
  if (key === 'killmonger.wound') {
    log('Wound — attach to a Hero (right-click + Strength edits manually).');
    return s;
  }
  if (key === 'killmonger.armoredRhino') {
    log('Armored Rhino — placed at the first available location.');
    return s;
  }

  // Fate handlers.
  if (key === 'killmonger.fate.blackPanther.blockClaim') {
    p.flags['blackPantherBlocksClaim'] = true;
    log('Black Panther — Killmonger cannot Claim Wakanda while Black Panther is in his Domain.');
    return s;
  }
  if (key === 'killmonger.fate.okoye.boostWithDora') {
    // Compute: +1 strength to Okoye if a Dora Milaje is also present.
    for (const loc of p.realm.locations) {
      const hasDora = loc.heroesPresent.some((h) => h.cardId.startsWith('fate-killmonger-dora-milaje'));
      for (const h of loc.heroesPresent) {
        if (h.cardId === 'fate-killmonger-okoye') h.strengthModifier = hasDora ? 1 : 0;
      }
    }
    log('Okoye — recomputed boost based on Dora Milaje presence.');
    return s;
  }
  if (key === 'killmonger.fate.shuri.discardItem') {
    log('Shuri — Killmonger discards 1 Item (resolve manually with right-click).');
    return s;
  }
  if (key === 'killmonger.fate.wakandaForever') {
    for (const loc of p.realm.locations) {
      for (const h of loc.heroesPresent) {
        const def = getCard(h.cardId);
        if (def?.tags?.includes('wakandan')) h.strengthModifier += 1;
      }
    }
    log('Wakanda Forever — Wakandan Heroes gain +1 Strength.');
    return s;
  }
  if (key === 'killmonger.fate.stolenAntiquities') {
    p.flags['stolenAntiquitiesActive'] = true;
    log('Stolen Antiquities — Killmonger may not play Specialty cards while in play.');
    return s;
  }

  log(`killmonger villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
