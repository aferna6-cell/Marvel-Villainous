// `useIcon` action (marvel-villainous-plan.md §3, step 3).
// Assumes legality already checked by validate.ts.
//
// Using an icon marks it spent for the turn and applies its self-contained
// effect. The `gainPower` icon grants power directly. The `activate` and
// villain-specific icons route to per-villain logic (CHUNK 4+). The `play`,
// `move`, `fate`, `discard` and `vanquish` icons enable a follow-up action —
// the precise icon→action coupling is a rulebook detail (see
// RULES_QUESTIONS.md), so for now they are simply recorded as used.

import { cloneState } from '../util';
import { applyGain, POWER_PER_GAIN_ICON } from './gain';
import { applyActivate } from './activate';
import type { ActionIcon, GameState, LocationIndex } from '../types';

export function applyUseIcon(
  state: GameState,
  location: LocationIndex,
  iconIndex: number,
): GameState {
  const s = cloneState(state);
  s.usedIcons.push({ location, iconIndex });

  const player = s.players[s.activePlayer];
  if (!player) throw new Error('applyUseIcon: active player missing');
  const loc = player.realm.locations[location];
  if (!loc) throw new Error('applyUseIcon: location missing');

  const icons: ActionIcon[] = [...loc.topIcons, ...loc.bottomIcons];
  const icon = icons[iconIndex];
  if (icon === undefined) throw new Error('applyUseIcon: icon index out of range');

  s.log.push({ turn: s.turn, player: s.activePlayer, message: `used "${icon}" icon` });

  switch (icon) {
    case 'gainPower':
      return applyGain(s, s.activePlayer, POWER_PER_GAIN_ICON);
    case 'gainPower2':
      return applyGain(s, s.activePlayer, 2);
    case 'gainPower3':
      return applyGain(s, s.activePlayer, 3);
    case 'activate':
    case 'villainSpecific1':
    case 'villainSpecific2':
      return applyActivate(s, s.activePlayer, icon);
    case 'move':
    case 'play':
    case 'fate':
    case 'discard':
    case 'vanquish':
      s.log.push({
        turn: s.turn,
        player: s.activePlayer,
        message: `"${icon}" icon enables a follow-up action this turn`,
      });
      return s;
    default: {
      const exhaustive: never = icon;
      throw new Error(`applyUseIcon: unhandled icon ${String(exhaustive)}`);
    }
  }
}
