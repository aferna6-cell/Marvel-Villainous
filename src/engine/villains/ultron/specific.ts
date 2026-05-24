// Ultron `villainSpecific` keys (marvel-villainous-plan.md §5.5).
//
// Recognized keys:
//   - `installUpgrade` (payload: { slot?: string }) — bump the upgrade
//     counter and record the slot in `flags.upgrades: string[]`.
//   - `markFinalForm` — set the `finalForm` flag (used by checkWin in
//     combination with upgrades >= 4).

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

  if (key === 'installUpgrade') {
    const list = (p.flags['upgrades'] as string[] | undefined) ?? [];
    const slot = (payload as { slot?: string } | null | undefined)?.slot;
    if (slot && !list.includes(slot)) list.push(slot);
    p.flags['upgrades'] = list;
    const count = (p.objectiveProgress.steps['upgrades'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['upgrades'] = count + 1;
    s.log.push({
      turn: s.turn,
      player: ctx.player,
      message: `Ultron installed upgrade${slot ? ` "${slot}"` : ''} (${count + 1}/4)`,
    });
    return s;
  }

  if (key === 'markFinalForm') {
    p.objectiveProgress.steps['finalForm'] = 1;
    s.log.push({
      turn: s.turn,
      player: ctx.player,
      message: 'Ultron reaches final form',
    });
    return s;
  }

  s.log.push({
    turn: s.turn,
    player: ctx.player,
    message: `ultron villainSpecific "${key}" — no handler (no-op)`,
  });
  return s;
}
