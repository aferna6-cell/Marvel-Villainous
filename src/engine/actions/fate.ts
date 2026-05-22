// `fateOpponent` action (marvel-villainous-plan.md §3, §4).
// Assumes legality already checked by validate.ts.
//
// Entering Fate transitions the active player into the `'fate'` phase,
// reveals the top 2 of the chosen opponent's Fate deck, and sets a
// `pendingPrompt` whose `continuation` carries the revealed cards so
// `applyResolvePrompt` can play one and discard the other.

import { shuffle } from '../rng';
import { cloneState } from '../util';
import type { GameState, PlayerId, PromptChoice } from '../types';

/** §4: a Fate action reveals 2, plays 1, discards 1. */
export const FATE_REVEAL_COUNT = 2;

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
  s.phase = 'fate';
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `Fated ${opponent}: revealed ${revealed.length} Fate card(s)`,
  });

  if (revealed.length === 0) {
    // Nothing to choose; the auto-advance loop will leave the Fate phase.
    return s;
  }

  const choices: PromptChoice[] = revealed.map((cardId) => ({ kind: 'card', cardId }));
  s.pendingPrompt = {
    id: `fate-${s.turn}-${s.log.length}`,
    player: s.activePlayer,
    kind: 'chooseCard',
    message: `choose which Fate card to play against ${opponent} (the other will be discarded)`,
    choices,
    continuation: { kind: 'fatePlay', opponent, revealed: [...revealed] },
  };
  return s;
}
