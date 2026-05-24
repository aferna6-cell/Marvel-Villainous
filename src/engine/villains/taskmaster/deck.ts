// TASKMASTER villain deck — 30 cards.
//
// Composition:
//   10 Allies     — Trainees ×3; Anaconda, Black Ant, Blood Spider,
//                   Crossbones, Death-Shield, Diamondback, Jagged Bow
//                   (each ×1)
//   10 Effects    — Conduct an Exercise ×4; Redeploy, Shadow Initiative,
//                   Trainer for Hire (each ×2)
//   8 Items       — Training Academy ×3; Training Dummy ×2; Taskmaster's
//                   Bow, Taskmaster's Shield, Taskmaster's Sword (each ×1)
//   2 Specialties — Lesson Plan, Photographic Reflexes (each ×1)

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const taskmasterDeck: CardDef[] = [
  // ----- 10 Allies ---------------------------------------------------------
  ...copies('taskmaster-trainees', 3, {
    villain: 'taskmaster', name: 'Trainees', type: 'ally', cost: 1, strength: 1,
    text: 'Cheap muscle in training.',
    effects: [], tags: [], icons: [],
  }),
  { id: 'taskmaster-anaconda',     villain: 'taskmaster', name: 'Anaconda', type: 'ally', cost: 2, strength: 3,
    text: 'Serpent Society member — squeezes the life out.',
    effects: [], tags: ['serpent'], icons: [] },
  { id: 'taskmaster-black-ant',    villain: 'taskmaster', name: 'Black Ant', type: 'ally', cost: 2, strength: 2,
    text: 'When BLACK ANT is played, you may peek at an opponent\'s hand.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.blackAnt.peek', payload: null }],
    tags: [], icons: [] },
  { id: 'taskmaster-blood-spider', villain: 'taskmaster', name: 'Blood Spider', type: 'ally', cost: 2, strength: 3,
    text: 'A Spider-Man imitator.',
    effects: [], tags: [], icons: [] },
  { id: 'taskmaster-crossbones',   villain: 'taskmaster', name: 'Crossbones', type: 'ally', cost: 2, strength: 3,
    text: 'Ex-special forces mercenary.',
    effects: [], tags: ['merc'], icons: [] },
  { id: 'taskmaster-death-shield', villain: 'taskmaster', name: 'Death-Shield', type: 'ally', cost: 2, strength: 3,
    text: 'Throwing-shield specialist.',
    effects: [], tags: [], icons: [] },
  { id: 'taskmaster-diamondback',  villain: 'taskmaster', name: 'Diamondback', type: 'ally', cost: 1, strength: 2,
    text: 'Serpent Society dagger expert.',
    effects: [], tags: ['serpent'], icons: [] },
  { id: 'taskmaster-jagged-bow',   villain: 'taskmaster', name: 'Jagged-Bow', type: 'ally', cost: 2, strength: 3,
    text: 'Skilled archer assassin.',
    effects: [], tags: [], icons: [] },

  // ----- 10 Effects --------------------------------------------------------
  ...copies('taskmaster-conduct-exercise', 4, {
    villain: 'taskmaster', name: 'Conduct an Exercise', type: 'effect', cost: 0,
    text: 'Complete the active Contract — advances the contract counter by 1.',
    effects: [{ op: 'villainSpecific', key: 'completeContract', payload: { contractId: 'exercise' } }],
    tags: [], icons: [],
  }),
  ...copies('taskmaster-redeploy', 2, {
    villain: 'taskmaster', name: 'Redeploy', type: 'effect', cost: 2,
    text: 'Move all your Allies into any one location.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.redeploy', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('taskmaster-shadow-initiative', 2, {
    villain: 'taskmaster', name: 'Shadow Initiative', type: 'effect', cost: 1,
    text: 'Draw 2 cards and then discard 1.',
    effects: [{ op: 'drawCards', n: 2 }],
    tags: [], icons: [],
  }),
  ...copies('taskmaster-trainer-for-hire', 2, {
    villain: 'taskmaster', name: 'Trainer for Hire', type: 'effect', cost: 0,
    text: 'Gain 2 Power and reveal a new Contract.',
    effects: [
      { op: 'gainPower', n: 2 },
      { op: 'villainSpecific', key: 'taskmaster.revealContract', payload: null },
    ],
    tags: [], icons: [],
  }),

  // ----- 8 Items -----------------------------------------------------------
  ...copies('taskmaster-training-academy', 3, {
    villain: 'taskmaster', name: 'Training Academy', type: 'item', cost: 1,
    text: 'Allies at this location gain +1 Strength.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.trainingAcademy', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('taskmaster-training-dummy', 2, {
    villain: 'taskmaster', name: 'Training Dummy', type: 'item', cost: 1,
    text: 'Counts as a strength-2 target for Vanquish exercises (placeholder Ally).',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.trainingDummy', payload: null }],
    tags: [], icons: [],
  }),
  { id: 'taskmaster-bow',    villain: 'taskmaster', name: "Taskmaster's Bow", type: 'item', cost: 2,
    text: 'Attach to an Ally — that Ally gains +2 Strength.',
    effects: [{ op: 'boostStrength', allyFilter: {}, n: 2, duration: 'permanent' }],
    tags: [], icons: [] },
  { id: 'taskmaster-shield', villain: 'taskmaster', name: "Taskmaster's Shield", type: 'item', cost: 0,
    text: 'Attach to an Ally — that Ally cannot be defeated by Strength 2 or less.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.shield.protect', payload: null }],
    tags: [], icons: [] },
  { id: 'taskmaster-sword',  villain: 'taskmaster', name: "Taskmaster's Sword", type: 'item', cost: 2,
    text: 'Attach to an Ally — that Ally gains +3 Strength.',
    effects: [{ op: 'boostStrength', allyFilter: {}, n: 3, duration: 'permanent' }],
    tags: [], icons: [] },

  // ----- 2 Specialties -----------------------------------------------------
  { id: 'taskmaster-lesson-plan',           villain: 'taskmaster', name: 'Lesson Plan', type: 'specialty', cost: 1,
    text: 'Look at the next Contract and choose to accept or pass.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.lessonPlan', payload: null }],
    tags: [], icons: [] },
  { id: 'taskmaster-photographic-reflexes', villain: 'taskmaster', name: 'Photographic Reflexes', type: 'specialty', cost: 2,
    text: 'Copy the effect of an opposing Hero card just defeated.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.photographicReflexes', payload: null }],
    tags: [], icons: [] },
];
