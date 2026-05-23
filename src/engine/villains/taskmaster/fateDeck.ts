// TASKMASTER villain Fate deck — 11 cards transcribed from the Marvel
// Villainous Wiki.
//
// Composition:
//   6 Heroes  — Scarlet Spider Clone ×3 (str 1); Butterball ×1 (str 0);
//               Scott Lang ×1 (str 2); Solo ×1 (str 3)
//   4 Effects — Found by the Avengers ×4
//   1 Event   — Government Work (str 7)
//
// Per §0: `name` and `text` stay blank in the repo.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const taskmasterFateDeck: CardDef[] = [
  // ----- 6 Heroes ---------------------------------------------------------
  ...copies('fate-taskmaster-scarlet-spider-clone', 3, {
    villain: 'fate-taskmaster', name: '', type: 'hero', cost: 0, strength: 1,
    effects: [], tags: [], icons: [],
  }),
  { id: 'fate-taskmaster-butterball', villain: 'fate-taskmaster', name: '', type: 'hero', cost: 0, strength: 0, effects: [], tags: [], icons: [] },
  { id: 'fate-taskmaster-scott-lang', villain: 'fate-taskmaster', name: '', type: 'hero', cost: 0, strength: 2, effects: [], tags: [], icons: [] },
  { id: 'fate-taskmaster-solo',       villain: 'fate-taskmaster', name: '', type: 'hero', cost: 0, strength: 3, effects: [], tags: [], icons: [] },

  // ----- 4 Effects --------------------------------------------------------
  ...copies('fate-taskmaster-found-by-avengers', 4, {
    villain: 'fate-taskmaster', name: '', type: 'fateEffect', cost: 0, effects: [], tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  { id: 'fate-taskmaster-government-work', villain: 'fate-taskmaster', name: '', type: 'event', cost: 0, strength: 7, effects: [], tags: [], icons: [] },
];
