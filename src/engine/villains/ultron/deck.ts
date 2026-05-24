// ULTRON villain deck — 30 cards.
//
// Composition:
//   13 Allies   — Duplicate Sentry ×4; Flying Sentry, Heavy Attack Sentry
//                 (each ×3); Alkhema, Giant Sentry, Jocasta (each ×1)
//   11 Effects  — Reconfigure ×3; Assimilate Knowledge, Encephalo-Ray,
//                 Every Contingency Covered, Technoforming (each ×2)
//   6 Items     — Impervious Alloy ×4; Assembly Line ×2

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const ultronDeck: CardDef[] = [
  // ----- 13 Allies ---------------------------------------------------------
  ...copies('ultron-duplicate-sentry', 4, {
    villain: 'ultron', name: 'Duplicate Sentry', type: 'ally', cost: 1, strength: 2,
    text: 'Basic Sentry copy.',
    effects: [], tags: ['sentry'], icons: [],
  }),
  ...copies('ultron-flying-sentry', 3, {
    villain: 'ultron', name: 'Flying Sentry', type: 'ally', cost: 2, strength: 3,
    text: 'FLYING SENTRY may be relocated to any location for free.',
    effects: [{ op: 'villainSpecific', key: 'ultron.flyingSentry.freeRelocate', payload: null }],
    tags: ['sentry'], icons: [],
  }),
  ...copies('ultron-heavy-attack-sentry', 3, {
    villain: 'ultron', name: 'Heavy Attack Sentry', type: 'ally', cost: 2, strength: 3,
    text: 'When attacking a Hero, gain +2 Strength.',
    effects: [{ op: 'villainSpecific', key: 'ultron.heavyAttack.vanquishBoost', payload: null }],
    tags: ['sentry'], icons: [],
  }),
  { id: 'ultron-alkhema',      villain: 'ultron', name: 'Alkhema', type: 'ally', cost: 3, strength: 3,
    text: "When ALKHEMA is played, you may draw 1 card.",
    effects: [{ op: 'drawCards', n: 1 }],
    tags: [], icons: [] },
  { id: 'ultron-giant-sentry', villain: 'ultron', name: 'Giant Sentry', type: 'ally', cost: 6, strength: 6,
    text: 'GIANT SENTRY counts as one Upgrade.',
    effects: [{ op: 'villainSpecific', key: 'installUpgrade', payload: { slot: 'giant' } }],
    tags: ['sentry'], icons: [] },
  { id: 'ultron-jocasta',      villain: 'ultron', name: 'Jocasta', type: 'ally', cost: 4, strength: 3,
    text: 'When JOCASTA is played, Ultron reaches final form.',
    effects: [{ op: 'villainSpecific', key: 'markFinalForm', payload: null }],
    tags: [], icons: [] },

  // ----- 11 Effects --------------------------------------------------------
  ...copies('ultron-reconfigure', 3, {
    villain: 'ultron', name: 'Reconfigure', type: 'effect', cost: 0,
    text: 'Move one of your Sentries to any location.',
    effects: [{ op: 'moveAlly', from: 'any', to: 'anyLocation' }],
    tags: [], icons: [],
  }),
  ...copies('ultron-assimilate-knowledge', 2, {
    villain: 'ultron', name: 'Assimilate Knowledge', type: 'effect', cost: 1,
    text: 'Look at the top 2 cards of your deck — keep one, discard the other.',
    effects: [{ op: 'lookAtFate', n: 2, choose: 1 }],
    tags: [], icons: [],
  }),
  ...copies('ultron-encephalo-ray', 2, {
    villain: 'ultron', name: 'Encephalo-Ray', type: 'effect', cost: 2,
    text: 'An opponent discards 1 card from their hand.',
    effects: [{ op: 'forceDiscard', player: 'opponent', n: 1 }],
    tags: [], icons: [],
  }),
  ...copies('ultron-every-contingency-covered', 2, {
    villain: 'ultron', name: 'Every Contingency Covered', type: 'effect', cost: 1,
    text: 'Draw 2 cards.',
    effects: [{ op: 'drawCards', n: 2 }],
    tags: [], icons: [],
  }),
  ...copies('ultron-technoforming', 2, {
    villain: 'ultron', name: 'Technoforming', type: 'effect', cost: 1,
    text: 'Install an Upgrade at any location.',
    effects: [{ op: 'villainSpecific', key: 'installUpgrade', payload: { slot: 'forming' } }],
    tags: [], icons: [],
  }),

  // ----- 6 Items -----------------------------------------------------------
  ...copies('ultron-impervious-alloy', 4, {
    villain: 'ultron', name: 'Impervious Alloy', type: 'item', cost: 2, strength: 2,
    text: 'Attach to a Sentry — that Sentry gains +2 Strength.',
    effects: [{ op: 'boostStrength', allyFilter: { tags: ['sentry'] }, n: 2, duration: 'permanent' }],
    tags: [], icons: [],
  }),
  ...copies('ultron-assembly-line', 2, {
    villain: 'ultron', name: 'Assembly Line', type: 'item', cost: 1,
    text: 'Allies at this location cost 1 less Power to play.',
    effects: [{ op: 'villainSpecific', key: 'ultron.assemblyLine.costReduction', payload: null }],
    tags: [], icons: [],
  }),
];
