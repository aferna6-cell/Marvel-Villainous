// ULTRON villain deck — 30 cards (authoritative card data from the user's
// spreadsheet).
//
// Composition: 13 unique cards / 30 total
//   13 Allies  — Duplicate Sentry ×4; Flying Sentry, Heavy Attack Sentry
//                (each ×3); Alkhema, Giant Sentry, Jocasta (each ×1)
//   11 Effects — Reconfigure ×3; Assimilate Knowledge, Encephalo-Ray,
//                Every Contingency Covered, Technoforming (each ×2)
//   6 Items    — Impervious Alloy ×4; Assembly Line ×2
// Goal: reveal the Age of Ultron Upgrade.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const ultronDeck: CardDef[] = [
  // ----- 13 Allies ---------------------------------------------------------
  ...copies('ultron-duplicate-sentry', 4, {
    villain: 'ultron', name: 'Duplicate Sentry', type: 'ally', cost: 1, strength: 2,
    text: 'No additional ability.',
    effects: [], tags: ['sentry'], icons: [],
  }),
  ...copies('ultron-flying-sentry', 3, {
    villain: 'ultron', name: 'Flying Sentry', type: 'ally', cost: 2, strength: 3,
    text: 'If FLYING SENTRY is at an Event when it resolves, you may relocate this Ally to any location in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'ultron.flyingSentry.escape', payload: null }],
    tags: ['sentry'], icons: [],
  }),
  ...copies('ultron-heavy-attack-sentry', 3, {
    villain: 'ultron', name: 'Heavy Attack Sentry', type: 'ally', cost: 2, strength: 3,
    text: 'This location gains VANQUISH.',
    effects: [{ op: 'villainSpecific', key: 'ultron.heavyAttack.grantVanquish', payload: null }],
    tags: ['sentry'], icons: [],
  }),
  {
    id: 'ultron-alkhema',
    villain: 'ultron', name: 'Alkhema', type: 'ally', cost: 3, strength: 3,
    text: 'When ALKHEMA is played, defeat a character at her location.',
    effects: [{ op: 'villainSpecific', key: 'ultron.alkhema.snipe', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'ultron-giant-sentry',
    villain: 'ultron', name: 'Giant Sentry', type: 'ally', cost: 6, strength: 6,
    text: "You may discard two other Sentries from your hand instead of paying this card's cost.",
    effects: [{ op: 'villainSpecific', key: 'ultron.giantSentry.discardCost', payload: null }],
    tags: ['sentry'], icons: [],
  },
  {
    id: 'ultron-jocasta',
    villain: 'ultron', name: 'Jocasta', type: 'ally', cost: 4, strength: 3,
    text: 'When JOCASTA is played, you may relocate any Hero to any location in any Domain.',
    effects: [{ op: 'villainSpecific', key: 'ultron.jocasta.heroSwap', payload: null }],
    tags: [], icons: [],
  },

  // ----- 11 Effects --------------------------------------------------------
  ...copies('ultron-reconfigure', 3, {
    villain: 'ultron', name: 'Reconfigure', type: 'effect', cost: 0,
    text: 'Gain 1 Power for each location in your Domain with at least one Sentry.',
    effects: [{ op: 'villainSpecific', key: 'ultron.reconfigure', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('ultron-assimilate-knowledge', 2, {
    villain: 'ultron', name: 'Assimilate Knowledge', type: 'effect', cost: 1,
    text: 'Look at the top six cards of the Fate deck, then put them back face down in any order you wish.',
    effects: [{ op: 'villainSpecific', key: 'ultron.assimilateKnowledge', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('ultron-encephalo-ray', 2, {
    villain: 'ultron', name: 'Encephalo-Ray', type: 'effect', cost: 2,
    text: 'Place a -1 Strength token on each Hero in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'ultron.encephaloRay', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('ultron-every-contingency-covered', 2, {
    villain: 'ultron', name: 'Every Contingency Covered', type: 'effect', cost: 1,
    text: 'Choose either Item or Effect. Reveal cards from your deck until you reveal a card of that type. Add that card to your hand.',
    effects: [{ op: 'villainSpecific', key: 'ultron.everyContingency', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('ultron-technoforming', 2, {
    villain: 'ultron', name: 'Technoforming', type: 'effect', cost: 1,
    text: 'Place a +1 Strength token on an Ally you control. You may relocate that Ally to an Event.',
    effects: [{ op: 'villainSpecific', key: 'ultron.technoforming', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 6 Items -----------------------------------------------------------
  ...copies('ultron-impervious-alloy', 4, {
    villain: 'ultron', name: 'Impervious Alloy', type: 'item', cost: 2, strength: 2,
    text: 'When played, attach IMPERVIOUS ALLOY to an Ally you control. IMPERVIOUS ALLOY can only be removed if the attached Ally is defeated or removed.',
    effects: [{ op: 'villainSpecific', key: 'ultron.imperviousAlloy', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('ultron-assembly-line', 2, {
    villain: 'ultron', name: 'Assembly Line', type: 'item', cost: 1,
    text: 'ACTIVATE: Reveal cards from your deck until you reveal an Ally. Add that card to your hand. Gain 1 Power.',
    effects: [{ op: 'villainSpecific', key: 'ultron.assemblyLine', payload: null }],
    tags: [], icons: ['activate'],
  }),
];
