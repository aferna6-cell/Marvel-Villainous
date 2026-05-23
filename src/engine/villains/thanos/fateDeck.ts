// THANOS villain Fate deck — 11-card structure per the rulebook (Setup §3:
// "5 Villain Fate decks with 11 cards each"). Composition confirmed from the
// game's components page + Fandom wiki cross-reference:
//
//   * 4 Heroes  : Adam Warlock, Drax the Destroyer, Gamora, Nebula
//   * 6 Effects : "A Stone Is Found" and "What Did It Cost?" copies summing to 6
//   * 1 Event   : "Sacrifices Must Be Made"
//
// Per the project's §0 ground rules the `name` field stays empty in the repo
// (and card text is never committed). The strengths printed on each Hero, the
// exact copy counts within the Effect set, and the per-card mechanical
// effects[] are pending the user transcribing them — see RULES_QUESTIONS
// Q14-fate. The engine model also lacks a proper Event card-type — Events
// (global cards placed in the center play area) are a CHUNK 7+ concern; the
// stub below files the Event under `fateEffect` with a TODO.

import type { CardDef } from '../../types';

export const thanosFateDeck: CardDef[] = [
  // ----- 4 Heroes ----------------------------------------------------------
  // card #1 in Thanos Fate deck — Hero (Adam Warlock; strength TBD)
  { id: 'fate-thanos-hero-1', villain: 'fate-thanos', name: '', type: 'hero', cost: 0, strength: 4, effects: [], icons: [] },
  // card #2 in Thanos Fate deck — Hero (Drax the Destroyer; strength TBD)
  { id: 'fate-thanos-hero-2', villain: 'fate-thanos', name: '', type: 'hero', cost: 0, strength: 5, effects: [], icons: [] },
  // card #3 in Thanos Fate deck — Hero (Gamora; strength TBD)
  { id: 'fate-thanos-hero-3', villain: 'fate-thanos', name: '', type: 'hero', cost: 0, strength: 3, effects: [], icons: [] },
  // card #4 in Thanos Fate deck — Hero (Nebula; strength TBD)
  { id: 'fate-thanos-hero-4', villain: 'fate-thanos', name: '', type: 'hero', cost: 0, strength: 3, effects: [], icons: [] },

  // ----- 6 Effects (split between "A Stone Is Found" and "What Did It Cost?") -----
  // card #5 in Thanos Fate deck — Effect
  { id: 'fate-thanos-effect-1', villain: 'fate-thanos', name: '', type: 'fateEffect', cost: 0, effects: [], icons: [] },
  // card #6 in Thanos Fate deck — Effect
  { id: 'fate-thanos-effect-2', villain: 'fate-thanos', name: '', type: 'fateEffect', cost: 0, effects: [], icons: [] },
  // card #7 in Thanos Fate deck — Effect
  { id: 'fate-thanos-effect-3', villain: 'fate-thanos', name: '', type: 'fateEffect', cost: 0, effects: [], icons: [] },
  // card #8 in Thanos Fate deck — Effect
  { id: 'fate-thanos-effect-4', villain: 'fate-thanos', name: '', type: 'fateEffect', cost: 0, effects: [], icons: [] },
  // card #9 in Thanos Fate deck — Effect
  { id: 'fate-thanos-effect-5', villain: 'fate-thanos', name: '', type: 'fateEffect', cost: 0, effects: [], icons: [] },
  // card #10 in Thanos Fate deck — Effect
  { id: 'fate-thanos-effect-6', villain: 'fate-thanos', name: '', type: 'fateEffect', cost: 0, effects: [], icons: [] },

  // ----- 1 Event (filed as fateEffect until the Event card-type is modeled) -----
  // card #11 in Thanos Fate deck — Event (Sacrifices Must Be Made; pending Q17)
  { id: 'fate-thanos-event-1', villain: 'fate-thanos', name: '', type: 'fateEffect', cost: 0, effects: [], icons: [] },
];
