// THANOS villain Fate deck — 11 cards (rulebook + Marvel Villainous Wiki).
//
// Composition (per the Thanos wiki page + per-card infoboxes):
//   4 Heroes — Adam Warlock (str 6); Drax the Destroyer (str 5);
//              Gamora (str 3); Nebula (str 3)
//   6 Effects — A Stone Is Found ×3; What Did It Cost? ×3
//   1 Event  — Sacrifices Must Be Made (Event strength 7)
//
// Per the project's §0 ground rules `name` and `text` stay blank in the
// repo — mechanical metadata only.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const thanosFateDeck: CardDef[] = [
  // ----- 4 Heroes -----------------------------------------------------------
  // Adam Warlock — Hero; strength 6 (Thanos cannot win while Adam is in his Domain — CHUNK 7+)
  {
    id: 'fate-thanos-adam-warlock',
    villain: 'fate-thanos',
    name: '',
    type: 'hero',
    cost: 0,
    strength: 6,
    effects: [],
    tags: [],
    icons: [],
  },
  // Drax the Destroyer — Hero; strength 5 (rulebook: requires ≥2 Allies to Vanquish — CHUNK 7+)
  {
    id: 'fate-thanos-drax',
    villain: 'fate-thanos',
    name: '',
    type: 'hero',
    cost: 0,
    strength: 5,
    effects: [],
    tags: [],
    icons: [],
  },
  // Gamora — Hero; strength 3 (rulebook: can defeat an Ally / Hero / Rival / Variant — CHUNK 7+)
  {
    id: 'fate-thanos-gamora',
    villain: 'fate-thanos',
    name: '',
    type: 'hero',
    cost: 0,
    strength: 3,
    effects: [],
    tags: [],
    icons: [],
  },
  // Nebula — Hero; strength 3 (rulebook: gains +1 Strength tokens equal to Stones — CHUNK 7+)
  {
    id: 'fate-thanos-nebula',
    villain: 'fate-thanos',
    name: '',
    type: 'hero',
    cost: 0,
    strength: 3,
    effects: [],
    tags: [],
    icons: [],
  },

  // ----- 6 Effects ---------------------------------------------------------
  // A Stone Is Found — ×3; Effect (targeted Villain takes a random Stone — CHUNK 7+ villainSpecific)
  ...copies('fate-thanos-stone-is-found', 3, {
    villain: 'fate-thanos',
    name: '',
    type: 'fateEffect',
    cost: 0,
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.stoneIsFound', payload: null }],
    tags: [],
    icons: [],
  }),
  // What Did It Cost? — ×3; Effect (CHUNK 7+ villainSpecific)
  ...copies('fate-thanos-what-did-it-cost', 3, {
    villain: 'fate-thanos',
    name: '',
    type: 'fateEffect',
    cost: 0,
    effects: [{ op: 'villainSpecific', key: 'thanos.fate.whatDidItCost', payload: null }],
    tags: [],
    icons: [],
  }),

  // ----- 1 Event -----------------------------------------------------------
  // Sacrifices Must Be Made — Event; strength 7 (start-of-turn cost per Ally — CHUNK 7+)
  {
    id: 'fate-thanos-sacrifices-must-be-made',
    villain: 'fate-thanos',
    name: '',
    type: 'event',
    cost: 0,
    strength: 7,
    effects: [],
    tags: [],
    icons: [],
  },
];
