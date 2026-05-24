// TASKMASTER villain Fate deck — 11 cards.
//
// Composition:
//   6 Heroes  — Scarlet Spider Clone ×3 (str 1); Butterball ×1 (str 0);
//               Scott Lang ×1 (str 2); Solo ×1 (str 3)
//   4 Effects — Found by the Avengers ×4
//   1 Event   — Government Work (str 7)

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const taskmasterFateDeck: CardDef[] = [
  // ----- 6 Heroes ---------------------------------------------------------
  ...copies('fate-taskmaster-scarlet-spider-clone', 3, {
    villain: 'fate-taskmaster', name: 'Scarlet Spider Clone', type: 'hero', cost: 0, strength: 1,
    text: 'A swarm of low-strength annoyances.',
    effects: [], tags: ['clone'], icons: [],
  }),
  { id: 'fate-taskmaster-butterball', villain: 'fate-taskmaster', name: 'Butterball', type: 'hero', cost: 0, strength: 0,
    text: 'BUTTERBALL cannot be vanquished — it must be moved away by an effect.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.butterball.invulnerable', payload: null }],
    tags: [], icons: [] },
  { id: 'fate-taskmaster-scott-lang', villain: 'fate-taskmaster', name: 'Scott Lang', type: 'hero', cost: 0, strength: 2,
    text: "SCOTT LANG covers the Play icon at his location.",
    effects: [], tags: ['avenger'], icons: ['play'] },
  { id: 'fate-taskmaster-solo',       villain: 'fate-taskmaster', name: 'Solo', type: 'hero', cost: 0, strength: 3,
    text: "When SOLO is played, Taskmaster's player discards 1 Item.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.solo.discardItem', payload: null }],
    tags: [], icons: [] },

  // ----- 4 Effects --------------------------------------------------------
  ...copies('fate-taskmaster-found-by-avengers', 4, {
    villain: 'fate-taskmaster', name: 'Found by the Avengers', type: 'fateEffect', cost: 0,
    text: "Discard Taskmaster's active Contract.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.foundByAvengers', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  { id: 'fate-taskmaster-government-work', villain: 'fate-taskmaster', name: 'Government Work', type: 'event', cost: 0, strength: 7,
    text: "While GOVERNMENT WORK is in play, Taskmaster's Contracts cost 1 extra Power.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.governmentWork', payload: null }],
    tags: [], icons: [],
    targetedVillain: 'taskmaster',
  },
];
