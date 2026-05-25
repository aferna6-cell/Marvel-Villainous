// TASKMASTER villain Fate deck — 11 cards (authoritative card data from
// the user's spreadsheet).
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
    text: 'When played, find and play the other two SCARLET SPIDER CLONES to this location.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.spiderClone.summonOthers', payload: null }],
    tags: ['clone'], icons: [],
  }),
  {
    id: 'fate-taskmaster-butterball',
    villain: 'fate-taskmaster', name: 'Butterball', type: 'hero', cost: 0, strength: 0,
    text: 'BUTTERBALL cannot be defeated. Before moving your Villain, you may pay 3 Power and discard one card from your hand to remove BUTTERBALL.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.butterball', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'fate-taskmaster-scott-lang',
    villain: 'fate-taskmaster', name: 'Scott Lang', type: 'hero', cost: 0, strength: 2,
    text: "All Allies at SCOTT LANG's location lose 1 Strength.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.scottLang', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-taskmaster-solo',
    villain: 'fate-taskmaster', name: 'Solo', type: 'hero', cost: 0, strength: 3,
    text: 'If SOLO is the only Hero in a Domain, he gains 2 Strength.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.solo', payload: null }],
    tags: [], icons: [],
  },

  // ----- 4 Effects --------------------------------------------------------
  ...copies('fate-taskmaster-found-by-avengers', 4, {
    villain: 'fate-taskmaster', name: 'Found by the Avengers', type: 'fateEffect', cost: 0,
    text: 'Choose an Ally controlled by the targeted Villain, then choose any Hero in any Domain. Remove both characters.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.foundByAvengers', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  {
    id: 'fate-taskmaster-government-work',
    villain: 'fate-taskmaster', name: 'Government Work', type: 'event', cost: 0, strength: 7,
    text: "Taskmaster cannot relocate Allies or Items except to this Event. Reward: Find an Ally from Taskmaster's deck or discard pile and play it immediately for free.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.fate.governmentWork', payload: null }],
    tags: [], icons: [],
    targetedVillain: 'taskmaster',
  },
];
