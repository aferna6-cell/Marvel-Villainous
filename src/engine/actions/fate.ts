// `fateOpponent` action (marvel-villainous-plan.md §3, §4).
// Assumes legality already checked by validate.ts.
//
// This sets up the Fate decision: reveal the top 2 of the opponent's Fate
// deck and prompt the active player to choose one. The full resolution —
// playing the chosen card onto the opponent's realm and discarding the other
// — belongs to the Fate phase and lands in a later chunk.

import { shuffle } from '../rng';
import { cloneState } from '../util';
import type { GameState, PlayerId, PromptChoice } from '../types';

const FATE_REVEAL_COUNT = 2; // §4: reveal 2, play 1, discard 1.

export function applyFate(state: GameState, opponent: PlayerId): GameState {
  const s = cloneState(state);
  const target = s.players[opponent];
  if (!target) throw new Error('applyFate: opponent missing');

  // §11: reshuffle the Fate discard into the Fate deck when it runs low.
  if (target.fateDeck.length < FATE_REVEAL_COUNT && target.fateDiscard.length > 0) {
    const { items, nextCursor } = shuffle(
      [...target.fateDeck, ...target.fateDiscard],
      s.seed,
      s.rngCursor,
    );
    s.rngCursor = nextCursor;
    target.fateDeck = items;
    target.fateDiscard = [];
  }

  const revealed = target.fateDeck.slice(0, FATE_REVEAL_COUNT);
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `Fated ${opponent}: revealed ${revealed.length} Fate card(s)`,
  });

  if (revealed.length > 0) {
    const choices: PromptChoice[] = revealed.map((cardId) => ({ kind: 'card', cardId }));
    s.pendingPrompt = {
      id: `fate-${s.turn}-${s.log.length}`,
      player: s.activePlayer,
      kind: 'chooseCard',
      message: `choose which Fate card to play against ${opponent}`,
      choices,
    };
  }
  return s;
}
