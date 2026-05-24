// Thanos `villainSpecific` keys (marvel-villainous-plan.md §5.1).
//
// Per §0 we don't encode card text in the repo. What we DO encode is the
// mechanical keys a card's `villainSpecific` effect dispatches on. Cards
// list these keys in their `effects[]` array; the handler below performs
// the mechanical state change.
//
// Recognized keys:
//   - `placeStone` (payload: { stone?: string }) — collect one Infinity
//     Stone token. `objectiveProgress.steps.stones` is bumped; the named
//     stone (if any) is added to `flags.stones: string[]`. checkWin
//     auto-detects victory at 6 stones.
//   - `snap` — terminal "click to win" action. If all 6 stones are
//     already collected the player wins immediately; otherwise the
//     handler is a no-op and logs why.
//
// Unknown keys fall through to a logged no-op so the engine keeps
// running even when a card's metadata is incomplete.

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

  if (key === 'placeStone') {
    const stones = (p.flags['stones'] as string[] | undefined) ?? [];
    const stoneName = (payload as { stone?: string } | null | undefined)?.stone;
    if (stoneName && !stones.includes(stoneName)) stones.push(stoneName);
    p.flags['stones'] = stones;
    const count = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    p.objectiveProgress.steps['stones'] = count + 1;
    s.log.push({
      turn: s.turn,
      player: ctx.player,
      message: `Thanos collected Infinity Stone${stoneName ? ` "${stoneName}"` : ''} (${count + 1}/6)`,
    });
    return s;
  }

  if (key === 'snap') {
    const count = (p.objectiveProgress.steps['stones'] as number | undefined) ?? 0;
    if (count < 6) {
      s.log.push({
        turn: s.turn,
        player: ctx.player,
        message: `Snap unavailable — only ${count}/6 Infinity Stones collected`,
      });
      return s;
    }
    s.winner = ctx.player;
    s.log.push({
      turn: s.turn,
      player: ctx.player,
      message: 'THE SNAP — Thanos wins',
    });
    return s;
  }

  s.log.push({
    turn: s.turn,
    player: ctx.player,
    message: `thanos villainSpecific "${key}" — no handler (no-op)`,
  });
  return s;
}
