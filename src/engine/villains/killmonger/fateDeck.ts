// KILLMONGER villain Fate deck — 11 cards transcribed from the Marvel
// Villainous Wiki.
//
// Composition:
//   8 Heroes  — Dora Milaje ×2 (str 2); Hatut Zeraze ×2 (str 2); Black
//               Panther ×1 (str 4); Everett K. Ross ×1 (str 2); Okoye ×1
//               (str 3); Shuri ×1 (str 3)
//   2 Effects — Wakanda Forever ×2
//   1 Event   — Stolen Antiquities ×1 (str 5)
//
// Per §0: `name` and `text` stay blank in the repo.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const killmongerFateDeck: CardDef[] = [
  // ----- 8 Heroes ---------------------------------------------------------
  ...copies('fate-killmonger-dora-milaje', 2, {
    villain: 'fate-killmonger', name: '', type: 'hero', cost: 0, strength: 2,
    effects: [], tags: ['protector'], icons: [],
  }),
  ...copies('fate-killmonger-hatut-zeraze', 2, {
    villain: 'fate-killmonger', name: '', type: 'hero', cost: 0, strength: 2,
    effects: [], tags: [], icons: [],
  }),
  { id: 'fate-killmonger-black-panther',  villain: 'fate-killmonger', name: '', type: 'hero', cost: 0, strength: 4, effects: [], tags: [], icons: [] },
  { id: 'fate-killmonger-everett-k-ross', villain: 'fate-killmonger', name: '', type: 'hero', cost: 0, strength: 2, effects: [], tags: [], icons: [] },
  { id: 'fate-killmonger-okoye',          villain: 'fate-killmonger', name: '', type: 'hero', cost: 0, strength: 3, effects: [], tags: [], icons: [] },
  { id: 'fate-killmonger-shuri',          villain: 'fate-killmonger', name: '', type: 'hero', cost: 0, strength: 3, effects: [], tags: [], icons: [] },

  // ----- 2 Effects --------------------------------------------------------
  ...copies('fate-killmonger-wakanda-forever', 2, {
    villain: 'fate-killmonger', name: '', type: 'fateEffect', cost: 0, effects: [], tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  { id: 'fate-killmonger-stolen-antiquities', villain: 'fate-killmonger', name: '', type: 'event', cost: 0, strength: 5, effects: [], tags: [], icons: [] },
];
