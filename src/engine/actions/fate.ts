// `fate` action (rulebook "Fate" action; marvel-villainous-plan.md §3, §4).
// Assumes legality already checked by validate.ts.
//
// Per the printed rulebook: "Using a Fate action can disrupt an opponent's
// progress. Reveal ONE card from the top of the Fate deck, then choose which
// player to target." The target is chosen AFTER seeing the card, so this
// action takes NO opponent argument — instead the resolved prompt offers a
// per-opponent choice (plus a skip option for the rulebook's "if you cannot
// play it, discard it with no effect" escape clause).
//
// The Fate deck itself is the SINGLE SHARED deck built by setup.ts merging
// every villain's Fate deck together (rulebook Setup §3).

import { shuffle } from '../rng';
import { cloneState } from '../util';
import type { GameState, PromptChoice } from '../types';

/** Rulebook: reveal ONE card from the top of the Fate deck. */
export const FATE_REVEAL_COUNT = 1;

export function applyFate(state: GameState): GameState {
  const s = cloneState(state);

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
  const eligibleTargets = s.playerOrder.filter((id) => id !== s.activePlayer);
  s.log.push({
    turn: s.turn,
    player: s.activePlayer,
    message: `Fate action: revealed ${revealed.length} card(s)`,
  });

  if (revealed.length === 0) {
    // No card to reveal — auto-advance will leave the Fate phase cleanly.
    return s;
  }

  const [revealedCardId] = revealed;
  if (revealedCardId === undefined) return s;

  // Per rulebook (Q18): targeted Fate cards may still be played on any
  // opponent — the targeted villain is "more affected" but not required.
  // (Targeted *Events* are a separate constraint pending the Event subsystem
  // — Q17.)
  const choices: PromptChoice[] = [
    ...eligibleTargets.map(
      (opp): PromptChoice => ({
        kind: 'target',
        target: { kind: 'player', player: opp },
      }),
    ),
    // Rulebook escape clause: discard with no effect if unplayable / undesired.
    { kind: 'skip' },
  ];

  s.pendingPrompt = {
    id: `fate-${s.turn}-${s.log.length}`,
    player: s.activePlayer,
    kind: 'chooseTarget',
    message: `play "${revealedCardId}" against which opponent, or discard with no effect`,
    choices,
    continuation: { kind: 'fatePlay', eligibleTargets, revealed: [revealedCardId] },
  };
  return s;
}
