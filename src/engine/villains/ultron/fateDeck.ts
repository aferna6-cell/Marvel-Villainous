// ULTRON villain Fate deck — 11 cards (authoritative card data from the
// user's spreadsheet).
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
  {
    id: 'fate-ultron-hank-pym',
    villain: 'fate-ultron', name: 'Hank Pym', type: 'hero', cost: 0, strength: 2,
    text: 'While HANK PYM is in your Domain, you may not play or find cards from your discard pile.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.hankPym', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-ultron-mockingbird',
    villain: 'fate-ultron', name: 'Mockingbird', type: 'hero', cost: 0, strength: 2,
    text: 'When MOCKINGBIRD is played, the targeted player loses 2 Power.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.mockingbird', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-ultron-scarlet-witch',
    villain: 'fate-ultron', name: 'Scarlet Witch', type: 'hero', cost: 0, strength: 4,
    text: 'When SCARLET WITCH is played, choose a card type. The targeted player must reveal their hand and discard all cards of that chosen type.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.scarletWitch', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-ultron-wasp',
    villain: 'fate-ultron', name: 'Wasp', type: 'hero', cost: 0, strength: 3,
    text: "When WASP is played, you may relocate any Hero from the targeted player's Domain to a new location in any player's Domain.",
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.wasp', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-ultron-wonder-man',
    villain: 'fate-ultron', name: 'Wonder Man', type: 'hero', cost: 0, strength: 4,
    text: "When WONDER MAN is defeated, find VISION, then play or relocate him to WONDER MAN's previous location.",
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.wonderMan', payload: null }],
    tags: ['avenger'], icons: [],
  },

  // ----- 3 Effects --------------------------------------------------------
  ...copies('fate-ultron-molecular-rearranger', 3, {
    villain: 'fate-ultron', name: 'Molecular Rearranger', type: 'fateEffect', cost: 0,
    text: "When MOLECULAR REARRANGER is played, choose an Item or Ally card in the targeted player's Domain. That player must remove all copies of that card from their Domain.",
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.molecularRearranger', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 2 Items ----------------------------------------------------------
  ...copies('fate-ultron-deactivation-switch', 2, {
    villain: 'fate-ultron', name: 'Deactivation Switch', type: 'item', cost: 0,
    text: 'Attach DEACTIVATION SWITCH to a Specialty. The Specialty may no longer be used until the targeted player pays 2 Power on their turn to remove DEACTIVATION SWITCH.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.deactivationSwitch', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  {
    id: 'fate-ultron-invasion-stark',
    villain: 'fate-ultron', name: 'Invasion of Stark Enterprises', type: 'event', cost: 0, strength: 8,
    text: 'When gaining Power, Ultron gains 1 fewer Power. Reward: Ultron gains 6 Power.',
    effects: [{ op: 'villainSpecific', key: 'ultron.fate.invasionStark', payload: null }],
    tags: [], icons: [],
    targetedVillain: 'ultron',
  },
];
