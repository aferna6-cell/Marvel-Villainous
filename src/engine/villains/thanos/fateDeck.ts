// THANOS villain Fate deck — 11 cards.
//
// Composition:
//   4 Heroes — Adam Warlock (str 6); Drax the Destroyer (str 5);
//              Gamora (str 3); Nebula (str 3)
//   6 Effects — A Stone Is Found ×3; What Did It Cost? ×3
//   1 Event  — Sacrifices Must Be Made (strength 7)

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const thanosFateDeck: CardDef[] = [
  // ----- 4 Heroes -----------------------------------------------------------
  {
    id: 'fate-thanos-adam-warlock',
    villain: 'fate-thanos',
    name: 'Adam Warlock',
    type: 'hero',
    cost: 0,
    strength: 6,
    text: 'While ADAM WARLOCK is in his Domain, Thanos cannot perform the Snap.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.adamWarlock.blockSnap', payload: null }],
    tags: ['avenger'],
    icons: [],
  },
  {
    id: 'fate-thanos-drax',
    villain: 'fate-thanos',
    name: 'Drax the Destroyer',
    type: 'hero',
    cost: 0,
    strength: 5,
    text: 'DRAX requires at least 2 Allies to Vanquish.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.drax.minAllies', payload: { min: 2 } }],
    tags: ['guardian'],
    icons: [],
  },
  {
    id: 'fate-thanos-gamora',
    villain: 'fate-thanos',
    name: 'Gamora',
    type: 'hero',
    cost: 0,
    strength: 3,
    text: 'When GAMORA is played, defeat one of your Allies at her location (if any).',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.gamora.defeatAlly', payload: null }],
    tags: ['guardian'],
    icons: [],
  },
  {
    id: 'fate-thanos-nebula',
    villain: 'fate-thanos',
    name: 'Nebula',
    type: 'hero',
    cost: 0,
    strength: 3,
    text: 'NEBULA gains +1 Strength for each Infinity Stone Thanos has collected.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.nebula.boostPerStone', payload: null }],
    tags: ['guardian'],
    icons: [],
  },

  // ----- 6 Effects ---------------------------------------------------------
  ...copies('fate-thanos-stone-is-found', 3, {
    villain: 'fate-thanos',
    name: 'A Stone Is Found',
    type: 'fateEffect',
    cost: 0,
    text: 'Take a random Infinity Stone from Thanos and return it to the Infinity Well.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.stoneIsFound', payload: null }],
    tags: [],
    icons: [],
  }),
  ...copies('fate-thanos-what-did-it-cost', 3, {
    villain: 'fate-thanos',
    name: 'What Did It Cost?',
    type: 'fateEffect',
    cost: 0,
    text: 'Thanos discards 2 cards from his hand.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.whatDidItCost', payload: null }],
    tags: [],
    icons: [],
  }),

  // ----- 1 Event -----------------------------------------------------------
  {
    id: 'fate-thanos-sacrifices-must-be-made',
    villain: 'fate-thanos',
    name: 'Sacrifices Must Be Made',
    type: 'event',
    cost: 0,
    strength: 7,
    text: 'At the start of his turn, Thanos must discard 1 Ally from his Domain or lose 2 Power.',
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.sacrifices.startOfTurn', payload: null }],
    tags: [],
    icons: [],
    targetedVillain: 'thanos',
  },
];
