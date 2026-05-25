// THANOS villain Fate deck — 11 cards (authoritative card data from the
// user's spreadsheet).
//
// Composition:
//   4 Heroes  — Adam Warlock (6); Drax the Destroyer (5); Gamora (3);
//               Nebula (3)
//   6 Effects — A Stone is Found ×3; What Did It Cost? ×3
//   1 Event   — Sacrifices Must Be Made (strength 7)

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const thanosFateDeck: CardDef[] = [
  // ----- 4 Heroes -----------------------------------------------------------
  {
    id: 'fate-thanos-adam-warlock',
    villain: 'fate-thanos', name: 'Adam Warlock', type: 'hero', cost: 0, strength: 6,
    text: "Thanos cannot win the game if ADAM WARLOCK is in Thanos' Domain.",
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.adamWarlock.blockSnap', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'fate-thanos-drax',
    villain: 'fate-thanos', name: 'Drax the Destroyer', type: 'hero', cost: 0, strength: 5,
    text: 'At least two Allies must be used to defeat DRAX THE DESTROYER with a vanquish action.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.drax.minAllies', payload: { min: 2 } }],
    tags: ['guardian'], icons: [],
  },
  {
    id: 'fate-thanos-gamora',
    villain: 'fate-thanos', name: 'Gamora', type: 'hero', cost: 0, strength: 3,
    text: 'When GAMORA is played, defeat a character at her location. If that character is an Ally of Thanos, place 2 +1 strength tokens on GAMORA.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.gamora', payload: null }],
    tags: ['guardian'], icons: [],
  },
  {
    id: 'fate-thanos-nebula',
    villain: 'fate-thanos', name: 'Nebula', type: 'hero', cost: 0, strength: 3,
    text: 'When NEBULA is played, the targeted player loses Power equal to the number of Infinity Stones they control. Place a number of +1 Strength tokens on NEBULA equal to that Power.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.nebula', payload: null }],
    tags: ['guardian'], icons: [],
  },

  // ----- 6 Effects ---------------------------------------------------------
  ...copies('fate-thanos-stone-is-found', 3, {
    villain: 'fate-thanos', name: 'A Stone is Found', type: 'fateEffect', cost: 0,
    text: 'Choose a Villain other than Thanos. That Villain receives an unclaimed Infinity Stone. Once played, they may immediately activate it for free.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.stoneIsFound', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('fate-thanos-what-did-it-cost', 3, {
    villain: 'fate-thanos', name: 'What Did It Cost?', type: 'fateEffect', cost: 0,
    text: 'The targeted Villain must discard one card from their hand for each Infinity Stone they control up to the total number of cards in their hand.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.whatDidItCost', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event -----------------------------------------------------------
  {
    id: 'fate-thanos-sacrifices-must-be-made',
    villain: 'fate-thanos', name: 'Sacrifices Must Be Made', type: 'event', cost: 0, strength: 7,
    text: "Before moving, for each of Thanos' Allies in play, he must either pay 1 Power, discard one card from his hand, or remove the Ally. Reward: Thanos removes one Ally controlled by each other Villain.",
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.sacrifices', payload: null }],
    tags: [], icons: [],
    targetedVillain: 'thanos',
  },
];
