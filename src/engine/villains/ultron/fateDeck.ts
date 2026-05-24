// ULTRON villain Fate deck — 11 cards.
//
// Composition:
//   5 Heroes  — Hank Pym ×1 (str 2); Mockingbird ×1 (str 2);
//               Scarlet Witch ×1 (str 4); Wasp ×1 (str 3);
//               Wonder Man ×1 (str 4)
//   3 Effects — Molecular Rearranger ×3
//   2 Items   — Deactivation Switch ×2
//   1 Event   — Invasion of Stark Enterprises (str 8)

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const ultronFateDeck: CardDef[] = [
  // ----- 5 Heroes ---------------------------------------------------------
  { id: 'fate-ultron-hank-pym',      villain: 'fate-ultron', name: 'Hank Pym', type: 'hero', cost: 0, strength: 2,
    text: 'When HANK PYM is played, the Ultron player loses 1 Upgrade.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.hankPym.removeUpgrade', payload: null }],
    tags: ['avenger'], icons: [] },
  { id: 'fate-ultron-mockingbird',   villain: 'fate-ultron', name: 'Mockingbird', type: 'hero', cost: 0, strength: 2,
    text: 'MOCKINGBIRD covers the Activate icon at her location.',
    effects: [], tags: ['avenger'], icons: ['activate'] },
  { id: 'fate-ultron-scarlet-witch', villain: 'fate-ultron', name: 'Scarlet Witch', type: 'hero', cost: 0, strength: 4,
    text: 'When SCARLET WITCH is played, Ultron discards 1 Item.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.scarletWitch.discardItem', payload: null }],
    tags: ['avenger'], icons: [] },
  { id: 'fate-ultron-wasp',          villain: 'fate-ultron', name: 'Wasp', type: 'hero', cost: 0, strength: 3,
    text: "WASP covers the Move icon at her location.",
    effects: [], tags: ['avenger'], icons: ['move'] },
  { id: 'fate-ultron-wonder-man',    villain: 'fate-ultron', name: 'Wonder Man', type: 'hero', cost: 0, strength: 4,
    text: "WONDER MAN gains +1 Strength for each other Avenger Hero in Ultron's Domain.",
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.wonderMan.boostPerAvenger', payload: null }],
    tags: ['avenger'], icons: [] },

  // ----- 3 Effects --------------------------------------------------------
  ...copies('fate-ultron-molecular-rearranger', 3, {
    villain: 'fate-ultron', name: 'Molecular Rearranger', type: 'fateEffect', cost: 0,
    text: 'Move an Ultron Ally to a different location.',
    effects: [{ op: 'moveAlly', from: 'any', to: 'anyLocation' }],
    tags: [], icons: [],
  }),

  // ----- 2 Items ----------------------------------------------------------
  ...copies('fate-ultron-deactivation-switch', 2, {
    villain: 'fate-ultron', name: 'Deactivation Switch', type: 'item', cost: 0,
    text: 'While in play, Ultron cannot use the Activate icon at this location.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.deactivationSwitch', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  { id: 'fate-ultron-invasion-stark', villain: 'fate-ultron', name: 'Invasion of Stark Industries', type: 'event', cost: 0, strength: 8,
    text: 'Ultron loses 1 Power at the start of each of his turns while this is in play.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.invasionStark.startOfTurn', payload: null }],
    tags: [], icons: [],
    targetedVillain: 'ultron',
  },
];
