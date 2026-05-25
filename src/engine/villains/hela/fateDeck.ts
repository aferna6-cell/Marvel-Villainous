// HELA villain Fate deck — 11 cards (authoritative card data from the user's
// spreadsheet).
//
// Composition:
//   5 Heroes  — Valkyrior ×3 (str 3); Angela ×1 (str 6); Balder ×1 (str 3)
//   4 Effects — Fate Intervenes ×2; Revive Souls ×2
//   1 Event   — Conquer Valhalla (str 7)
//   1 Item    — Odin-Force ×1

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const helaFateDeck: CardDef[] = [
  // ----- 5 Heroes ---------------------------------------------------------
  ...copies('fate-hela-valkyrior', 3, {
    villain: 'fate-hela', name: 'Valkyrior', type: 'hero', cost: 0, strength: 3,
    text: 'Soul Marks may not be attached to VALKYRIOR.',
    effects: [{ op: 'villainSpecific', key: 'hela.fate.valkyrior.noMark', payload: null }],
    tags: ['asgard'], icons: [],
  }),
  {
    id: 'fate-hela-angela',
    villain: 'fate-hela', name: 'Angela', type: 'hero', cost: 0, strength: 6,
    text: "Soul Marks may not be attached to ANGELA. When played, remove a Soul Mark from Odin's Vault.",
    effects: [{ op: 'villainSpecific', key: 'hela.fate.angela', payload: null }],
    tags: ['asgard'], icons: [],
  },
  {
    id: 'fate-hela-balder',
    villain: 'fate-hela', name: 'Balder', type: 'hero', cost: 0, strength: 3,
    text: 'Soul Marks may not be attached to BALDER. When played, remove a Soul Mark from any one Hero.',
    effects: [{ op: 'villainSpecific', key: 'hela.fate.balder', payload: null }],
    tags: ['asgard'], icons: [],
  },

  // ----- 4 Effects --------------------------------------------------------
  ...copies('fate-hela-fate-intervenes', 2, {
    villain: 'fate-hela', name: 'Fate Intervenes', type: 'fateEffect', cost: 0,
    text: "Shuffle the targeted player's discard pile into their Villain deck.",
    effects: [{ op: 'villainSpecific', key: 'hela.fate.intervenes', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('fate-hela-revive-souls', 2, {
    villain: 'fate-hela', name: 'Revive Souls', type: 'fateEffect', cost: 0,
    text: "Choose a Hero in the Fate discard pile. Play that Hero to the targeted player's Domain.",
    effects: [{ op: 'villainSpecific', key: 'hela.fate.reviveSouls', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  {
    id: 'fate-hela-conquer-valhalla',
    villain: 'fate-hela', name: 'Conquer Valhalla', type: 'event', cost: 0, strength: 7,
    text: "Hela may not play, find or access any cards in her discard pile. Reward: Hela may immediately attach Soul Marks on all Heroes in all Domains that don't already have one.",
    effects: [{ op: 'villainSpecific', key: 'hela.fate.conquerValhalla', payload: null }],
    tags: [], icons: [],
    targetedVillain: 'hela',
  },

  // ----- 1 Item -----------------------------------------------------------
  {
    id: 'fate-hela-odin-force',
    villain: 'fate-hela', name: 'Odin-Force', type: 'item', cost: 0,
    text: 'When ODIN-FORCE is played, attach it to a Hero. If this Hero has an attached Soul Mark, remove it. This Hero cannot have a Soul Mark attached and gains PROTECTOR.',
    effects: [{ op: 'villainSpecific', key: 'hela.fate.odinForce', payload: null }],
    tags: [], icons: [],
  },
];
