// Manual objective-progress edits. Until each villain's full handler chain
// is wired, players adjust their tracked counts by hand and the engine
// auto-detects victory via `checkWin`.

import { cloneState } from '../util';
import type { GameState, PlayerId } from '../types';

export function applySetObjectiveCount(
  state: GameState,
  player: PlayerId,
  key: string,
  delta: number,
): GameState {
  const s = cloneState(state);
  const p = s.players[player];
  if (!p) throw new Error('applySetObjectiveCount: player missing');
  const current = (p.objectiveProgress.steps[key] as number | undefined) ?? 0;
  const next = Math.max(0, current + delta);
  p.objectiveProgress.steps[key] = next;
  s.log.push({
    turn: s.turn,
    player,
    message: `${player} objective ${key} = ${next}`,
  });
  return s;
}

/**
 * Per-villain win-condition predicate. Reads each player's
 * `objectiveProgress.steps` and returns the first villain whose condition
 * is met, or null. The wikis (and rulebook villain guides) define each
 * objective; targets:
 *
 *  * Thanos     — six Infinity Stones collected (`stones >= 6`)
 *  * Hela       — combination of 8 Allies + Soul Marks at Odin's Vault
 *                 (`asgard >= 8`)
 *  * Killmonger — control Wakanda after defeating Black Panther sequence
 *                 (`bosses >= 4`)
 *  * Taskmaster — complete 4 contracts (`contracts >= 4`)
 *  * Ultron     — complete all 4 Upgrades + defeat the named hero
 *                 (`upgrades >= 4 && finalForm`)
 *
 * These targets are encoded structurally; per-villain specifics that go
 * beyond a single integer (e.g., Ultron's "defeated the right hero" flag)
 * sit alongside the count in the same `steps` map.
 */
export function checkWin(state: GameState): PlayerId | null {
  for (const id of state.playerOrder) {
    const p = state.players[id];
    if (!p) continue;
    const s = p.objectiveProgress.steps;
    const num = (k: string): number => (s[k] as number | undefined) ?? 0;
    const flag = (k: string): boolean => Boolean(s[k]);
    switch (p.villain) {
      case 'thanos':
        if (num('stones') >= 6) return id;
        break;
      case 'hela':
        if (num('asgard') >= 8) return id;
        break;
      case 'killmonger':
        if (num('bosses') >= 4) return id;
        break;
      case 'taskmaster':
        if (num('contracts') >= 4) return id;
        break;
      case 'ultron':
        if (num('upgrades') >= 4 && flag('finalForm')) return id;
        break;
    }
  }
  return null;
}
