// Taskmaster `villainSpecific` keys.

import { cloneState } from '../../util';
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

  // Core objective handler.
  if (key === 'completeContract') {
    const list = (p.flags['contracts'] as string[] | undefined) ?? [];
    const id = (payload as { contractId?: string } | null | undefined)?.contractId;
    if (id) list.push(id); // duplicates allowed — multiple exercises stack
    p.flags['contracts'] = list;
    const count = (p.objectiveProgress.steps['contracts'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['contracts'] = count + 1;
    log(`Taskmaster completed contract${id ? ` "${id}"` : ''} (${count + 1}/4)`);
    return s;
  }

  // Card-specific.
  if (key === 'taskmaster.blackAnt.peek') {
    log("Black Ant — peek at an opponent's hand (resolve via opponent showing their hand).");
    return s;
  }
  if (key === 'taskmaster.redeploy') {
    log("Redeploy — move all your Allies into one location (use Relocate action repeatedly).");
    return s;
  }
  if (key === 'taskmaster.revealContract') {
    log('Trainer for Hire — reveal a new Contract (handled by the player flipping the contract pile).');
    return s;
  }
  if (key === 'taskmaster.trainingAcademy') {
    log('Training Academy — Allies at this location gain +1 Strength (resolve manually).');
    return s;
  }
  if (key === 'taskmaster.trainingDummy') {
    log('Training Dummy — acts as a target Ally for Vanquish exercises.');
    return s;
  }
  if (key === 'taskmaster.shield.protect') {
    log("Taskmaster's Shield — attached Ally cannot be defeated by Strength 2 or less.");
    return s;
  }
  if (key === 'taskmaster.lessonPlan') {
    log('Lesson Plan — peek at the next Contract and accept or pass.');
    return s;
  }
  if (key === 'taskmaster.photographicReflexes') {
    log('Photographic Reflexes — copy a defeated Hero\'s ability (manual resolution).');
    return s;
  }

  // Fate handlers.
  if (key === 'taskmaster.fate.butterball.invulnerable') {
    log('Butterball — cannot be Vanquished; must be moved away.');
    return s;
  }
  if (key === 'taskmaster.fate.solo.discardItem') {
    log('Solo — Taskmaster discards 1 Item (resolve manually with right-click).');
    return s;
  }
  if (key === 'taskmaster.fate.foundByAvengers') {
    const count = (p.objectiveProgress.steps['contracts'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['contracts'] = Math.max(0, count - 1);
    log(`Found by the Avengers — Taskmaster loses 1 completed Contract (${Math.max(0, count - 1)}/4).`);
    return s;
  }
  if (key === 'taskmaster.fate.governmentWork') {
    p.flags['governmentWorkActive'] = true;
    log('Government Work — Contracts cost 1 extra Power while in play.');
    return s;
  }

  log(`taskmaster villainSpecific "${key}" — no handler (no-op)`);
  return s;
}
