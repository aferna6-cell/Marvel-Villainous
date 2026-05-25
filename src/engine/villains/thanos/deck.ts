// THANOS villain deck — 30 cards (authoritative card data from the user's
// spreadsheet b7b505d2-Marvel_Villainous_Infinite_Power_Decks.xlsx).
//
// Composition: 14 unique cards / 30 total
//   10 Allies  — Legions of Thanos ×5; Black Dwarf, Black Swan, Corvus
//                Glaive, Ebony Maw, Proxima Midnight (each ×1)
//   16 Effects — Consult the Well ×4; A Small Price to Pay ×3; Taste of
//                Cosmic Power ×3; Deliver Judgment ×2; The Mad Titan ×2;
//                Warp Reality ×2
//   4 Items    — Death's Favor ×3; Space Throne ×1
// Goal: collect all 6 Infinity Stones.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const thanosDeck: CardDef[] = [
  // ----- 10 Allies ----------------------------------------------------------
  ...copies('thanos-legions', 5, {
    villain: 'thanos',
    name: 'The Legions of Thanos',
    type: 'ally',
    cost: 1,
    strength: 2,
    text: 'No additional ability.',
    effects: [],
    tags: ['legions'],
    icons: [],
  }),
  {
    id: 'thanos-black-dwarf',
    villain: 'thanos',
    name: 'Black Dwarf',
    type: 'ally',
    cost: 3,
    strength: 6,
    text: 'BLACK DWARF cannot be played or relocated to Events.',
    effects: [{ op: 'villainSpecific', key: 'thanos.blackDwarf.restrictEvent', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },
  {
    id: 'thanos-black-swan',
    villain: 'thanos',
    name: 'Black Swan',
    type: 'ally',
    cost: 2,
    strength: 1,
    text: "If BLACK SWAN is at the same location as an Infinity Stone, she gains strength equal to the strongest Ally not under your control at her location.",
    effects: [{ op: 'villainSpecific', key: 'thanos.blackSwan.boost', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },
  {
    id: 'thanos-corvus-glaive',
    villain: 'thanos',
    name: 'Corvus Glaive',
    type: 'ally',
    cost: 3,
    strength: 4,
    text: "When CORVUS GLAIVE is relocated to another player's Domain, you may also relocate one THE LEGIONS OF THANOS Ally to his location.",
    effects: [{ op: 'villainSpecific', key: 'thanos.corvusGlaive.legionsRide', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },
  {
    id: 'thanos-ebony-maw',
    villain: 'thanos',
    name: 'Ebony Maw',
    type: 'ally',
    cost: 3,
    strength: 4,
    text: "If EBONY MAW is part of a vanquish action by Thanos to defeat an opponent's Ally with an attached Infinity Stone, he is not discarded.",
    effects: [{ op: 'villainSpecific', key: 'thanos.ebonyMaw.persistOnStoneKill', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },
  {
    id: 'thanos-proxima-midnight',
    villain: 'thanos',
    name: 'Proxima Midnight',
    type: 'ally',
    cost: 2,
    strength: 3,
    text: "When played, defeat a character with strength 3 or less at PROXIMA MIDNIGHT's location.",
    effects: [{ op: 'villainSpecific', key: 'thanos.proxima.snipe', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },

  // ----- 16 Effects ---------------------------------------------------------
  ...copies('thanos-consult', 4, {
    villain: 'thanos',
    name: 'Consult the Well',
    type: 'effect',
    cost: 2,
    text: 'Choose another player. That player receives a random unclaimed Infinity Stone. Once played you may relocate an Ally to that location.',
    effects: [{ op: 'villainSpecific', key: 'thanos.consultWell', payload: null }],
    tags: [],
    icons: [],
  }),
  ...copies('thanos-small-price', 3, {
    villain: 'thanos',
    name: 'A Small Price to Pay...',
    type: 'effect',
    cost: 0,
    text: 'Gain 1 Power plus 1 additional Power for each other Villain who controls an Infinity Stone.',
    effects: [{ op: 'villainSpecific', key: 'thanos.smallPrice', payload: null }],
    tags: [],
    icons: [],
  }),
  ...copies('thanos-taste-cosmic', 3, {
    villain: 'thanos',
    name: 'Taste of Cosmic Power',
    type: 'effect',
    cost: 2,
    text: 'Place a +1 strength token on an Ally you control. That Ally may immediately vanquish a character at this location with equal or lesser strength, and is not discarded after this vanquish action.',
    effects: [{ op: 'villainSpecific', key: 'thanos.tasteCosmic', payload: null }],
    tags: [],
    icons: [],
  }),
  ...copies('thanos-deliver-judgment', 2, {
    villain: 'thanos',
    name: 'Deliver Judgment',
    type: 'effect',
    cost: 3,
    text: 'Choose a location with an Infinity Stone. Relocate up to two Allies you control to that location. Place a +1 Strength token on each of your Allies at that location.',
    effects: [{ op: 'villainSpecific', key: 'thanos.deliverJudgment', payload: null }],
    tags: [],
    icons: [],
  }),
  ...copies('thanos-mad-titan', 2, {
    villain: 'thanos',
    name: 'The Mad Titan',
    type: 'effect',
    cost: 0,
    text: "Choose a character you do not control in the same location as one of your Allies. Defeat that character. The cost to play THE MAD TITAN is equal to the Strength of the defeated character.",
    effects: [{ op: 'villainSpecific', key: 'thanos.madTitan', payload: null }],
    tags: ['dynamicCost'],
    icons: [],
  }),
  ...copies('thanos-warp-reality', 2, {
    villain: 'thanos',
    name: 'Warp Reality',
    type: 'effect',
    cost: 1,
    text: 'Search your discard pile for an Effect card. Put it in your hand.',
    effects: [{ op: 'villainSpecific', key: 'thanos.warpReality', payload: null }],
    tags: [],
    icons: [],
  }),

  // ----- 4 Items ------------------------------------------------------------
  ...copies('thanos-deaths-favor', 3, {
    villain: 'thanos',
    name: "Death's Favor",
    type: 'item',
    cost: 2,
    text: "You may choose to perform an activate or vanquish action when you move to this location. A location may not hold more than one copy of DEATH'S FAVOR.",
    effects: [{ op: 'villainSpecific', key: 'thanos.deathsFavor', payload: null }],
    tags: [],
    icons: [],
  }),
  {
    id: 'thanos-space-throne',
    villain: 'thanos',
    name: 'Space Throne',
    type: 'item',
    cost: 2,
    text: 'This location gains RELOCATE.',
    effects: [{ op: 'villainSpecific', key: 'thanos.spaceThrone', payload: null }],
    tags: [],
    icons: [],
  },
];
