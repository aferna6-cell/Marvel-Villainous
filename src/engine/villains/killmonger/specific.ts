// Killmonger `villainSpecific` keys (marvel-villainous-plan.md §5.3).
//
// Recognized keys:
//   - `defeatBoss` — bump `objectiveProgress.steps.bosses` by 1; the
//     Wakanda boss sequence requires 4.
//   - `claimWakanda` — terminal handler that sets the winner if 4 bosses
//     have been defeated.

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

  if (key === 'defeatBoss') {
    const count = (p.objectiveProgress.steps['bosses'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['bosses'] = count + 1;
    s.log.push({
      turn: s.turn,
      player: ctx.player,
      message: `Killmonger advanced the boss sequence (${count + 1}/4)`,
    });
    return s;
  }

  if (key === 'claimWakanda') {
    const count = (p.objectiveProgress.steps['bosses'] as number | undefined) ?? 0;
    if (count < 4) {
      s.log.push({
        turn: s.turn,
        player: ctx.player,
        message: `Wakanda not yet claimed — ${count}/4 bosses defeated`,
      });
      return s;
    }
    s.winner = ctx.player;
    s.log.push({ turn: s.turn, player: ctx.player, message: 'Killmonger claims Wakanda — VICTORY' });
    return s;
  }

  s.log.push({
    turn: s.turn,
    player: ctx.player,
    message: `killmonger villainSpecific "${key}" — no handler (no-op)`,
  });
  return s;
}
