// Thanos-specific effect resolution (marvel-villainous-plan.md §5.1).
// The `villainSpecific` effect op routes here. Real logic — Infinity Stone
// collection and the Snap — lands in CHUNK 4 (M4). This is the stub.

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
    message: `thanos villainSpecific "${key}" not implemented (CHUNK 4+)`,
  });
  return s;
}
