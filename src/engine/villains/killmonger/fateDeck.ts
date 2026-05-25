// KILLMONGER villain Fate deck — 11 cards (authoritative card data from
// the user's spreadsheet).
//
// Composition:
//   8 Heroes  — Dora Milaje ×2 (str 2); Hatut Zeraze ×2 (str 2); Black
//               Panther ×1 (str 4); Everett K. Ross ×1 (str 2); Okoye ×1
//               (str 3); Shuri ×1 (str 3)
//   2 Effects — Wakanda Forever ×2
//   1 Event   — Stolen Antiquities ×1 (str 5)

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const killmongerFateDeck: CardDef[] = [
  // ----- 8 Heroes ---------------------------------------------------------
  ...copies('fate-killmonger-dora-milaje', 2, {
    villain: 'fate-killmonger', name: 'Dora Milaje', type: 'hero', cost: 0, strength: 2,
    text: 'PROTECTOR.',
    effects: [{ op: 'villainSpecific', key: 'fate.protector', payload: null }],
    tags: ['protector', 'wakandan'], icons: [],
  }),
  ...copies('fate-killmonger-hatut-zeraze', 2, {
    villain: 'fate-killmonger', name: 'Hatut Zeraze', type: 'hero', cost: 0, strength: 2,
    text: "When HATUT ZERAZE is played, choose an Ally with a Strength of 2 or less or an Item in the targeted player's Domain, then return it to their hand.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.hatutZeraze', payload: null }],
    tags: ['wakandan'], icons: [],
  }),
  {
    id: 'fate-killmonger-black-panther',
    villain: 'fate-killmonger', name: 'Black Panther', type: 'hero', cost: 0, strength: 4,
    text: "BLACK PANTHER gains 2 Strength while in Killmonger's Domain.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.blackPanther', payload: null }],
    tags: ['wakandan'], icons: [],
  },
  {
    id: 'fate-killmonger-everett-k-ross',
    villain: 'fate-killmonger', name: 'Everett K. Ross', type: 'hero', cost: 0, strength: 2,
    text: "When EVERETT K. ROSS is played, you may remove an Item from the targeted player's Domain.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.everettRoss', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'fate-killmonger-okoye',
    villain: 'fate-killmonger', name: 'Okoye', type: 'hero', cost: 0, strength: 3,
    text: 'When OKOYE is played, find DORA MILAJE, then play that card to the same location as OKOYE.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.okoye', payload: null }],
    tags: ['wakandan'], icons: [],
  },
  {
    id: 'fate-killmonger-shuri',
    villain: 'fate-killmonger', name: 'Shuri', type: 'hero', cost: 0, strength: 3,
    text: "When SHURI is played, remove an Item from the targeted player's Domain. Place +1 Strength tokens equal to the cost of that Item on SHURI.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.shuri', payload: null }],
    tags: ['wakandan'], icons: [],
  },

  // ----- 2 Effects --------------------------------------------------------
  ...copies('fate-killmonger-wakanda-forever', 2, {
    villain: 'fate-killmonger', name: 'Wakanda Forever', type: 'fateEffect', cost: 0,
    text: "Find BLACK PANTHER and either play or relocate him to Killmonger's Domain. If BLACK PANTHER is already in play, place a +1 Strength token on him.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.wakandaForever', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  {
    id: 'fate-killmonger-stolen-antiquities',
    villain: 'fate-killmonger', name: 'Stolen Antiquities', type: 'event', cost: 0, strength: 5,
    text: 'Killmonger cannot play Items. Reward: Killmonger may find any Item in his deck or discard pile, then play it immediately for free to his Domain.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.stolenAntiquities', payload: null }],
    tags: [], icons: [],
    targetedVillain: 'killmonger',
  },
];
