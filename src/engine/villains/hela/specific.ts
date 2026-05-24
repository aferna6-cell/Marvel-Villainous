// Hela `villainSpecific` keys (marvel-villainous-plan.md §5.2).
//
// Recognized keys:
//   - `placeSoulMark` — bump `objectiveProgress.steps.asgard` by 1 (Soul
//     Marks count toward the 8-required total at Odin's Vault).
//   - `controlAsgard` — terminal "I've met the objective" handler that
//     sets the winner if asgard >= 8.
//
// Unknown keys log a no-op.

import { cloneState } from '../../util';
import type { EffectContext, GameState } from '../../types';

export function applyVillainSpecific(
  state: GameState,
  ctx: EffectContext,
  key: string,
  _payload: unknown,
): GameState {
  const s = cloneState(state);
  const p = s.players[ctx.player];
  if (!p) return s;

  if (key === 'placeSoulMark') {
    const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['asgard'] = count + 1;
    s.log.push({
      turn: s.turn,
      player: ctx.player,
      message: `Hela placed a Soul Mark (${count + 1}/8)`,
    });
    return s;
  }

  if (key === 'controlAsgard') {
    const count = (p.objectiveProgress.steps['asgard'] as number | undefined) ?? 0;
    if (count < 8) {
      s.log.push({
        turn: s.turn,
        player: ctx.player,
        message: `Asgard not yet controlled — ${count}/8 Allies+Soul Marks`,
      });
      return s;
    }
    s.winner = ctx.player;
    s.log.push({ turn: s.turn, player: ctx.player, message: 'Hela conquers Asgard — VICTORY' });
    return s;
  }

  s.log.push({
    turn: s.turn,
    player: ctx.player,
    message: `hela villainSpecific "${key}" — no handler (no-op)`,
  });
  return s;
}
