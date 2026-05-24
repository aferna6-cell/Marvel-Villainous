// Player-claimed victory. Until each villain's full objective handler lands,
// the player self-attests their printed win condition is met and the engine
// ratifies by setting `state.winner`. The win screen then shows the result.

import { cloneState } from '../util';
import type { GameState } from '../types';

export function applyClaimVictory(state: GameState): GameState {
  const s = cloneState(state);
  s.winner = s.activePlayer;
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `${s.activePlayer} (${s.players[s.activePlayer]?.villain ?? '?'}) claimed victory`,
  });
  return s;
}
