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

  // Core objective handlers.
  if (key === 'placeSoulMark') {
    const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['asgard'] = count + 1;
    log(`Hela placed a Soul Mark (${count + 1}/8)`);
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

  // Per-card handlers.
  if (key === 'hela.fenris.ignoreFirst') {
    log('Fenris Wolf — ignores the first Strength of any Hero he attacks (resolve manually).');
    return s;
  }
  if (key === 'hela.midgardSerpent.coverIcon') {
    log('Midgard Serpent — covers an icon at this location (use Strict-Icons toggle to enforce).');
    return s;
  }
  if (key === 'hela.deathsEmbrace') {
    // Park a prompt for the player to pick an ally to defeat for a Soul Mark.
    const choices: PromptChoice[] = [];
    for (const loc of p.realm.locations) {
      for (const a of loc.alliesPresent) choices.push({ kind: 'card', cardId: a.instanceId });
    }
    if (choices.length === 0) {
      log("Death's Embrace — no Allies in play; just place a Soul Mark.");
      const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
      p.objectiveProgress.steps['asgard'] = count + 1;
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: "Death's Embrace — defeat one of your Allies for a Soul Mark",
      choices: [...choices, { kind: 'skip' }],
    };
    return s;
  }
  if (key === 'hela.pricesOfLife') {
    const total = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    p.power += total;
    log(`Prices of Life — +${total} Power (1 per Soul Mark)`);
    return s;
  }
  if (key === 'hela.soulForASoul') {
    if (p.discard.length === 0) {
      log('Soul for a Soul — discard pile empty');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Soul for a Soul — return an Ally from discard to any location',
      choices: p.discard.map((cardId) => ({ kind: 'card' as const, cardId })),
    };
    return s;
  }
  if (key === 'hela.handOfGlory') {
    // Discard hand, draw same count. Simplification: park a prompt for how many.
    log('Hand of Glory — discard any number, then draw the same (resolve via Discard panel + Draw).');
    return s;
  }
  if (key === 'hela.bidding') {
    log("Hela's Bidding — take an extra action this turn (manual: re-fire the action).");
    return s;
  }
  if (key === 'hela.raiseTheDead') {
    if (p.discard.length === 0) {
      log('Raise the Dead — discard pile empty');
      return s;
    }
    s.pendingPrompt = {
      id: `prompt-${s.turn}-${s.log.length}`,
      player: ctx.player,
      kind: 'chooseCard',
      message: 'Raise the Dead — return an Ally from your discard to your hand',
      choices: p.discard.map((cardId) => ({ kind: 'card' as const, cardId })),
    };
    return s;
  }

  // Fate handlers.
  if (key === 'hela.fate.valkyrior.minStrength') {
    log('Valkyrior — Vanquish requires 1 Ally of Strength 3+.');
    return s;
  }
  if (key === 'hela.fate.angela.removeMark') {
    const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['asgard'] = Math.max(0, count - 1);
    log(`Angela arrives — removes one Soul Mark (${Math.max(0, count - 1)}/8).`);
    return s;
  }
  if (key === 'hela.fate.balder.blockSpecialty') {
    p.flags['balderBlocksSpecialty'] = true;
    log('Balder the Brave — Hela may not play Specialty cards while Balder is in play.');
    return s;
  }
  if (key === 'hela.fate.reviveSouls') {
    const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['asgard'] = Math.max(0, count - 1);
    log(`Revive Souls — Hela loses a Soul Mark (${Math.max(0, count - 1)}/8).`);
    return s;
  }
  if (key === 'hela.fate.odinForce.boostHero') {
    log('The Odin Force — the holding Hero gains +2 Strength (passive).');
    return s;
  }

  log(`hela villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
