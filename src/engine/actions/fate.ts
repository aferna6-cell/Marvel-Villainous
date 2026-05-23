// `fateOpponent` action (rulebook "Fate" action; marvel-villainous-plan.md §3, §4).
// Assumes legality already checked by validate.ts.
//
// Per the printed rulebook: "Using a Fate action can disrupt an opponent's
// progress. Reveal ONE card from the top of the Fate deck, then choose which
// player to target." This is reveal-1 from the SINGLE SHARED Fate deck (built
// by setup.ts merging every villain's Fate deck together — rulebook Setup §3).
//
// The plan §3 step 4 described "reveal 2 / play 1 / discard 1" which is the
// Disney Villainous rule — different from Marvel Villainous: Infinite Power.
// Per §0.1 of the plan ("rulebook wins, every time") the engine matches the
// printed reveal-1 rule.

import { shuffle } from '../rng';
import { cloneState } from '../util';
import type { GameState, PlayerId } from '../types';

/** Rulebook: reveal ONE card from the top of the Fate deck. */
export const FATE_REVEAL_COUNT = 1;

export function applyFate(state: GameState, opponent: PlayerId): GameState {
  const s = cloneState(state);
  const target = s.players[opponent];
  if (!target) throw new Error('applyFate: opponent missing');

  // Rulebook §11: when the Fate deck is empty, shuffle the Fate discard pile
  // back to form a new Fate deck.
  if (s.fateDeck.length < FATE_REVEAL_COUNT && s.fateDiscard.length > 0) {
    const { items, nextCursor } = shuffle([...s.fateDeck, ...s.fateDiscard], s.seed, s.rngCursor);
    s.rngCursor = nextCursor;
    s.fateDeck = items;
    s.fateDiscard = [];
  }

  s.phase = 'fate';
  const revealed = s.fateDeck.slice(0, FATE_REVEAL_COUNT);
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `Fated ${opponent}: revealed ${revealed.length} Fate card(s)`,
  });

  if (revealed.length === 0) {
    // Nothing left in the Fate deck or its discard — the auto-advance loop
    // will leave the Fate phase on the next tick.
    return s;
  }

  // CHUNK 6 simplification: the player chose the target before the reveal.
  // The rulebook's strict ordering is reveal-then-target; capturing that as
  // a two-step prompt is RULES_QUESTIONS Q16 follow-up work. For now the
  // continuation just plays the revealed card on the pre-chosen opponent.
  const [revealedCardId] = revealed;
  if (revealedCardId === undefined) return s;
  s.pendingPrompt = {
    id: `fate-${s.turn}-${s.log.length}`,
    player: s.activePlayer,
    kind: 'chooseCard',
    message: `play "${revealedCardId}" against ${opponent}, or discard with no effect`,
    choices: [
      { kind: 'card', cardId: revealedCardId },
      { kind: 'skip' },
    ],
    continuation: { kind: 'fatePlay', opponent, revealed: [revealedCardId] },
  };
  return s;
}
