// TASKMASTER villain deck — 30 cards transcribed from the Marvel Villainous
// Wiki.
//
// Composition:
//   10 Allies     — Trainees ×3; Anaconda, Black Ant, Blood Spider,
//                   Crossbones, Death Shield, Diamondback, Jagged Bow
//                   (each ×1)
//   10 Effects    — Conduct Exercise ×4; Redeploy, Shadow Initiative,
//                   Trainer for Hire (each ×2)
//   8 Items       — Training Academy ×3; Training Dummy ×2; Taskmaster's
//                   Bow, Taskmaster's Shield, Taskmaster's Sword (each ×1)
//   2 Specialties — Lesson Plan, Photographic Reflexes (each ×1)
//
// Per §0: `name` and `text` stay blank in the repo.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const taskmasterDeck: CardDef[] = [
  // ----- 10 Allies ---------------------------------------------------------
  ...copies('taskmaster-trainees', 3, {
    villain: 'taskmaster', name: '', type: 'ally', cost: 1, strength: 1,
    effects: [], tags: [], icons: [],
  }),
  { id: 'taskmaster-anaconda',     villain: 'taskmaster', name: '', type: 'ally', cost: 2, strength: 3, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-black-ant',    villain: 'taskmaster', name: '', type: 'ally', cost: 2, strength: 2, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-blood-spider', villain: 'taskmaster', name: '', type: 'ally', cost: 2, strength: 3, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-crossbones',   villain: 'taskmaster', name: '', type: 'ally', cost: 2, strength: 3, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-death-shield', villain: 'taskmaster', name: '', type: 'ally', cost: 2, strength: 3, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-diamondback',  villain: 'taskmaster', name: '', type: 'ally', cost: 1, strength: 2, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-jagged-bow',   villain: 'taskmaster', name: '', type: 'ally', cost: 2, strength: 3, effects: [], tags: [], icons: [] },

  // ----- 10 Effects --------------------------------------------------------
  ...copies('taskmaster-conduct-exercise', 4, {
    villain: 'taskmaster', name: '', type: 'effect', cost: 0, effects: [], tags: [], icons: [],
  }),
  ...copies('taskmaster-redeploy', 2, {
    villain: 'taskmaster', name: '', type: 'effect', cost: 2, effects: [], tags: [], icons: [],
  }),
  ...copies('taskmaster-shadow-initiative', 2, {
    villain: 'taskmaster', name: '', type: 'effect', cost: 1, effects: [], tags: [], icons: [],
  }),
  ...copies('taskmaster-trainer-for-hire', 2, {
    villain: 'taskmaster', name: '', type: 'effect', cost: 0, effects: [], tags: [], icons: [],
  }),

  // ----- 8 Items -----------------------------------------------------------
  ...copies('taskmaster-training-academy', 3, {
    villain: 'taskmaster', name: '', type: 'item', cost: 1, effects: [], tags: [], icons: [],
  }),
  ...copies('taskmaster-training-dummy', 2, {
    villain: 'taskmaster', name: '', type: 'item', cost: 1, effects: [], tags: [], icons: [],
  }),
  { id: 'taskmaster-bow',    villain: 'taskmaster', name: '', type: 'item', cost: 2, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-shield', villain: 'taskmaster', name: '', type: 'item', cost: 0, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-sword',  villain: 'taskmaster', name: '', type: 'item', cost: 2, effects: [], tags: [], icons: [] },

  // ----- 2 Specialties -----------------------------------------------------
  { id: 'taskmaster-lesson-plan',           villain: 'taskmaster', name: '', type: 'specialty', cost: 1, effects: [], tags: [], icons: [] },
  { id: 'taskmaster-photographic-reflexes', villain: 'taskmaster', name: '', type: 'specialty', cost: 2, effects: [], tags: [], icons: [] },
];
