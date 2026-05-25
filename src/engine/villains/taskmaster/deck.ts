// TASKMASTER villain deck — 30 cards (authoritative card data from the
// user's spreadsheet).
//
// Composition: 19 unique cards / 30 total
//   10 Allies     — Trainees ×3; Anaconda, Black Ant, Blood Spider,
//                   Crossbones, Death Shield, Diamondback, Jagged Bow
//                   (each ×1)
//   10 Effects    — Conduct Exercise ×4; Redeploy, Shadow Initiative,
//                   Trainer for Hire (each ×2)
//   8 Items       — Training Academy ×3; Training Dummy ×2; Taskmaster's
//                   Bow, Taskmaster's Shield, Taskmaster's Sword (each ×1)
//   2 Specialties — Lesson Plan, Photographic Reflexes (each ×1)
// Goal: 4 Allies at 4 different locations w/ Strength 5+.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const taskmasterDeck: CardDef[] = [
  // ----- 10 Allies ---------------------------------------------------------
  ...copies('taskmaster-trainees', 3, {
    villain: 'taskmaster', name: 'Trainees', type: 'ally', cost: 1, strength: 1,
    text: "Instead of discarding an Ally used in a vanquish action at this location, remove TRAINEES instead. You may not use TRAINEES' ability if TRAINEES are involved in a vanquish action.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.trainees.absorb', payload: null }],
    tags: [], icons: [],
  }),
  {
    id: 'taskmaster-anaconda',
    villain: 'taskmaster', name: 'Anaconda', type: 'ally', cost: 2, strength: 3,
    text: 'When ANACONDA is used in a vanquish action, place a +1 Strength token on each remaining Ally you control at her previous location.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.anaconda.spreadBoost', payload: null }],
    tags: ['serpent'], icons: [],
  },
  {
    id: 'taskmaster-black-ant',
    villain: 'taskmaster', name: 'Black Ant', type: 'ally', cost: 2, strength: 2,
    text: 'When BLACK ANT is played, you may play another Ally from your hand for free.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.blackAnt.freePlay', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'taskmaster-blood-spider',
    villain: 'taskmaster', name: 'Blood Spider', type: 'ally', cost: 2, strength: 3,
    text: "When BLOOD SPIDER is played, you may relocate a Hero from any location to BLOOD SPIDER's location.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.bloodSpider.heroDrag', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'taskmaster-crossbones',
    villain: 'taskmaster', name: 'Crossbones', type: 'ally', cost: 2, strength: 3,
    text: 'CROSSBONES may be played from your discard pile.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.crossbones.playFromDiscard', payload: null }],
    tags: ['merc'], icons: [],
  },
  {
    id: 'taskmaster-death-shield',
    villain: 'taskmaster', name: 'Death Shield', type: 'ally', cost: 2, strength: 3,
    text: 'DEATH SHIELD gains 1 Strength for each Hero at his location.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.deathShield.scaleWithHeroes', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'taskmaster-diamondback',
    villain: 'taskmaster', name: 'Diamondback', type: 'ally', cost: 1, strength: 2,
    text: "When DIAMONDBACK is played, place a -1 Strength token on any Hero at DIAMONDBACK's location.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.diamondback.heroDebuff', payload: null }],
    tags: ['serpent'], icons: [],
  },
  {
    id: 'taskmaster-jagged-bow',
    villain: 'taskmaster', name: 'Jagged Bow', type: 'ally', cost: 2, strength: 3,
    text: 'After relocating or playing JAGGED BOW to an Event, you may relocate or play a second Ally to the same Event for free.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.jaggedBow.eventBonus', payload: null }],
    tags: [], icons: [],
  },

  // ----- 10 Effects --------------------------------------------------------
  ...copies('taskmaster-conduct-exercise', 4, {
    villain: 'taskmaster', name: 'Conduct Exercise', type: 'effect', cost: 0,
    text: 'Perform an activate action.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.conductExercise', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('taskmaster-redeploy', 2, {
    villain: 'taskmaster', name: 'Redeploy', type: 'effect', cost: 2,
    text: 'Relocate up to three Allies you control.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.redeploy', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('taskmaster-shadow-initiative', 2, {
    villain: 'taskmaster', name: 'Shadow Initiative', type: 'effect', cost: 1,
    text: "Relocate an Ally you control from your Domain to another player's Domain. Place a +1 Strength token on that Ally.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.shadowInitiative', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('taskmaster-trainer-for-hire', 2, {
    villain: 'taskmaster', name: 'Trainer for Hire', type: 'effect', cost: 0,
    text: "Choose another player. Reveal cards from that player's Villain deck until you reveal an Ally. Play that Ally to that player's Domain for free, then gain Power equal to that Ally's cost plus 1.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.trainerForHire', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 8 Items -----------------------------------------------------------
  ...copies('taskmaster-training-academy', 3, {
    villain: 'taskmaster', name: 'Training Academy', type: 'item', cost: 1,
    text: 'When a Character is vanquished at this location, place a +1 Strength token on each Ally at this location, then discard this card instead of discarding any Ally cards.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.trainingAcademy', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('taskmaster-training-dummy', 2, {
    villain: 'taskmaster', name: 'Training Dummy', type: 'item', cost: 1,
    text: 'ACTIVATE: Place a +1 Strength token on an Ally you control at this location.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.trainingDummy', payload: null }],
    tags: [], icons: ['activate'],
  }),
  {
    id: 'taskmaster-bow',
    villain: 'taskmaster', name: "Taskmaster's Bow", type: 'item', cost: 2,
    text: 'This location gains VANQUISH.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.bow.grantVanquish', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'taskmaster-shield',
    villain: 'taskmaster', name: "Taskmaster's Shield", type: 'item', cost: 0,
    text: "When an Ally at this location would be defeated or removed, you may remove TASKMASTER'S SHIELD instead.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.shield.bodyguard', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'taskmaster-sword',
    villain: 'taskmaster', name: "Taskmaster's Sword", type: 'item', cost: 2,
    text: "All of Taskmaster's Allies gain 1 Strength while at the same location as TASKMASTER'S SWORD.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.sword.locationBuff', payload: null }],
    tags: [], icons: [],
  },

  // ----- 2 Specialties -----------------------------------------------------
  {
    id: 'taskmaster-lesson-plan',
    villain: 'taskmaster', name: 'Lesson Plan', type: 'specialty', cost: 1,
    text: 'ACTIVATE: Pay 1 Power. Find an Item or Effect in your discard pile or deck and put that card into your hand.',
    effects: [{ op: 'villainSpecific', key: 'taskmaster.lessonPlan', payload: null }],
    tags: [], icons: ['activate'],
  },
  {
    id: 'taskmaster-photographic-reflexes',
    villain: 'taskmaster', name: 'Photographic Reflexes', type: 'specialty', cost: 2,
    text: "After another player plays an Effect card from their hand, you may immediately pay 1 Power to attach that Effect to PHOTOGRAPHIC REFLEXES. ACTIVATE: Use an activate action to play the Effect attached to PHOTOGRAPHIC REFLEXES, then discard the Effect to its original Villain's discard pile.",
    effects: [{ op: 'villainSpecific', key: 'taskmaster.photographicReflexes', payload: null }],
    tags: [], icons: ['activate'],
  },
];
