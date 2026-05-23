// HELA villain Fate deck — 11 cards transcribed from the Marvel Villainous Wiki.
//
// Composition:
//   5 Heroes  — Valkyrior ×3 (str 3); Angela ×1 (str 6); Balder ×1 (str 3)
//   4 Effects — Fate Intervenes ×2; Revive Souls ×2
//   1 Event   — Conquer Valhalla (str 7)
//   1 Item    — Odin-Force ×1
//
// Per §0: `name` and `text` stay blank in the repo.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const helaFateDeck: CardDef[] = [
  // ----- 5 Heroes ---------------------------------------------------------
  ...copies('fate-hela-valkyrior', 3, {
    villain: 'fate-hela', name: '', type: 'hero', cost: 0, strength: 3,
    effects: [], tags: [], icons: [],
  }),
  { id: 'fate-hela-angela', villain: 'fate-hela', name: '', type: 'hero', cost: 0, strength: 6, effects: [], tags: [], icons: [] },
  { id: 'fate-hela-balder', villain: 'fate-hela', name: '', type: 'hero', cost: 0, strength: 3, effects: [], tags: [], icons: [] },

  // ----- 4 Effects --------------------------------------------------------
  ...copies('fate-hela-fate-intervenes', 2, {
    villain: 'fate-hela', name: '', type: 'fateEffect', cost: 0, effects: [], tags: [], icons: [],
  }),
  ...copies('fate-hela-revive-souls', 2, {
    villain: 'fate-hela', name: '', type: 'fateEffect', cost: 0, effects: [], tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  { id: 'fate-hela-conquer-valhalla', villain: 'fate-hela', name: '', type: 'event', cost: 0, strength: 7, effects: [], tags: [], icons: [] },

  // ----- 1 Item -----------------------------------------------------------
  { id: 'fate-hela-odin-force', villain: 'fate-hela', name: '', type: 'item', cost: 0, effects: [], tags: [], icons: [] },
];
