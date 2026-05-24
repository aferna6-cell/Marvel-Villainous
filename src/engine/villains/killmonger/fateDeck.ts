// KILLMONGER villain Fate deck — 11 cards.
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
    text: 'Wakandan royal guard.',
    effects: [], tags: ['protector', 'wakandan'], icons: [],
  }),
  ...copies('fate-killmonger-hatut-zeraze', 2, {
    villain: 'fate-killmonger', name: 'Hatut Zeraze', type: 'hero', cost: 0, strength: 2,
    text: 'Wakandan secret police.',
    effects: [], tags: ['wakandan'], icons: [],
  }),
  { id: 'fate-killmonger-black-panther',  villain: 'fate-killmonger', name: 'Black Panther', type: 'hero', cost: 0, strength: 4,
    text: 'While BLACK PANTHER is in his Domain, Killmonger cannot Claim Wakanda.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.blackPanther.blockClaim', payload: null }],
    tags: ['wakandan', 'protector'], icons: [] },
  { id: 'fate-killmonger-everett-k-ross', villain: 'fate-killmonger', name: 'Everett K. Ross', type: 'hero', cost: 0, strength: 2,
    text: 'CIA contact — peek at the top card of any deck when played.',
    effects: [{ op: 'lookAtFate', n: 1, choose: 0 }],
    tags: [], icons: [] },
  { id: 'fate-killmonger-okoye',          villain: 'fate-killmonger', name: 'Okoye', type: 'hero', cost: 0, strength: 3,
    text: 'OKOYE gains +1 Strength while a Dora Milaje is also in this Domain.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.okoye.boostWithDora', payload: null }],
    tags: ['wakandan', 'protector'], icons: [] },
  { id: 'fate-killmonger-shuri',          villain: 'fate-killmonger', name: 'Shuri', type: 'hero', cost: 0, strength: 3,
    text: "When SHURI is played, Killmonger's player discards 1 Item.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.shuri.discardItem', payload: null }],
    tags: ['wakandan'], icons: [] },

  // ----- 2 Effects --------------------------------------------------------
  ...copies('fate-killmonger-wakanda-forever', 2, {
    villain: 'fate-killmonger', name: 'Wakanda Forever', type: 'fateEffect', cost: 0,
    text: 'All Wakandan Heroes in this Domain gain +1 Strength.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.wakandaForever', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  { id: 'fate-killmonger-stolen-antiquities', villain: 'fate-killmonger', name: 'Stolen Antiquities', type: 'event', cost: 0, strength: 5,
    text: "Killmonger cannot use Specialty cards while STOLEN ANTIQUITIES is in play.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.fate.stolenAntiquities', payload: null }],
    tags: [], icons: [],
    targetedVillain: 'killmonger',
  },
];
