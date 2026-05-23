// ULTRON villain Fate deck — 11 cards transcribed from the Marvel Villainous
// Wiki.
//
// Composition:
//   5 Heroes  — Hank Pym ×1 (str 2); Mockingbird ×1 (str 2);
//               Scarlet Witch ×1 (str 4); Wasp ×1 (str 3);
//               Wonder Man ×1 (str 4)
//   3 Effects — Molecular Rearranger ×3
//   2 Items   — Deactivation Switch ×2
//   1 Event   — Invasion of Stark Enterprises (str 8)
//
// Per §0: `name` and `text` stay blank in the repo.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const ultronFateDeck: CardDef[] = [
  // ----- 5 Heroes ---------------------------------------------------------
  { id: 'fate-ultron-hank-pym',      villain: 'fate-ultron', name: '', type: 'hero', cost: 0, strength: 2, effects: [], tags: [], icons: [] },
  { id: 'fate-ultron-mockingbird',   villain: 'fate-ultron', name: '', type: 'hero', cost: 0, strength: 2, effects: [], tags: [], icons: [] },
  { id: 'fate-ultron-scarlet-witch', villain: 'fate-ultron', name: '', type: 'hero', cost: 0, strength: 4, effects: [], tags: [], icons: [] },
  { id: 'fate-ultron-wasp',          villain: 'fate-ultron', name: '', type: 'hero', cost: 0, strength: 3, effects: [], tags: [], icons: [] },
  { id: 'fate-ultron-wonder-man',    villain: 'fate-ultron', name: '', type: 'hero', cost: 0, strength: 4, effects: [], tags: [], icons: [] },

  // ----- 3 Effects --------------------------------------------------------
  ...copies('fate-ultron-molecular-rearranger', 3, {
    villain: 'fate-ultron', name: '', type: 'fateEffect', cost: 0, effects: [], tags: [], icons: [],
  }),

  // ----- 2 Items ----------------------------------------------------------
  ...copies('fate-ultron-deactivation-switch', 2, {
    villain: 'fate-ultron', name: '', type: 'item', cost: 0, effects: [], tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  { id: 'fate-ultron-invasion-stark', villain: 'fate-ultron', name: '', type: 'event', cost: 0, strength: 8, effects: [], tags: [], icons: [] },
];
