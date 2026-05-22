// Killmonger-specific effect resolution (marvel-villainous-plan.md §5.3).
// The `villainSpecific` effect op routes here. Real logic lands in CHUNK 6.

import { cloneState } from '../../util';
import type { EffectContext, GameState } from '../../types';

export function applyVillainSpecific(
  state: GameState,
  ctx: EffectContext,
  key: string,
  _payload: unknown,
): GameState {
  const s = cloneState(state);
  s.log.push({
    turn: s.turn,
    player: ctx.player,
    message: `killmonger villainSpecific "${key}" not implemented (CHUNK 6+)`,
  });
  return s;
}
