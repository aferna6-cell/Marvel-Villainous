// Taskmaster `villainSpecific` keys (marvel-villainous-plan.md §5.4).
//
// Recognized keys:
//   - `completeContract` (payload: { contractId?: string }) — bump the
//     completed-contracts counter and record the contract id in
//     `flags.contracts: string[]`. checkWin auto-detects victory at 4.

import { cloneState } from '../../util';
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

  if (key === 'completeContract') {
    const list = (p.flags['contracts'] as string[] | undefined) ?? [];
    const id = (payload as { contractId?: string } | null | undefined)?.contractId;
    if (id && !list.includes(id)) list.push(id);
    p.flags['contracts'] = list;
    const count = (p.objectiveProgress.steps['contracts'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['contracts'] = count + 1;
    s.log.push({
      turn: s.turn,
      player: ctx.player,
      message: `Taskmaster completed contract${id ? ` "${id}"` : ''} (${count + 1}/4)`,
    });
    return s;
  }

  s.log.push({
    turn: s.turn,
    player: ctx.player,
    message: `taskmaster villainSpecific "${key}" — no handler (no-op)`,
  });
  return s;
}
