// HELA villain Fate deck — 11 cards.
//
// Composition:
//   5 Heroes  — Valkyrior ×3 (str 3); Angela ×1 (str 6); Balder ×1 (str 3)
//   4 Effects — Fate Intervenes ×2; Revive Souls ×2
//   1 Event   — Conquer Valhalla (str 7)
//   1 Item    — The Odin Force ×1

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const helaFateDeck: CardDef[] = [
  // ----- 5 Heroes ---------------------------------------------------------
  ...copies('fate-hela-valkyrior', 3, {
    villain: 'fate-hela', name: 'Valkyrior', type: 'hero', cost: 0, strength: 3,
    text: 'Asgardian warrior — Vanquish requires at least 1 Ally with Strength 3+.',
    effects: [{ op: 'villainSpecific', key: 'hela.fate.valkyrior.minStrength', payload: null }],
    tags: ['asgard'], icons: [],
  }),
  { id: 'fate-hela-angela', villain: 'fate-hela', name: 'Angela', type: 'hero', cost: 0, strength: 6,
    text: 'Removes a Soul Mark from her location when played.',
    effects: [{ op: 'villainSpecific', key: 'hela.fate.angela.removeMark', payload: null }],
    tags: ['asgard'], icons: [] },
  { id: 'fate-hela-balder', villain: 'fate-hela', name: 'Balder the Brave', type: 'hero', cost: 0, strength: 3,
    text: 'While BALDER is in play, Hela may not play Specialty cards.',
    effects: [{ op: 'villainSpecific', key: 'hela.fate.balder.blockSpecialty', payload: null }],
    tags: ['asgard'], icons: [] },

  // ----- 4 Effects --------------------------------------------------------
  ...copies('fate-hela-fate-intervenes', 2, {
    villain: 'fate-hela', name: 'Fate Intervenes', type: 'fateEffect', cost: 0,
    text: "Hela's player draws 2 Fate cards and chooses which to play.",
    effects: [{ op: 'lookAtFate', n: 2, choose: 1 }],
    tags: [], icons: [],
  }),
  ...copies('fate-hela-revive-souls', 2, {
    villain: 'fate-hela', name: 'Revive Souls', type: 'fateEffect', cost: 0,
    text: "Remove a Soul Mark from Hela's Domain.",
    effects: [{ op: 'villainSpecific', key: 'hela.fate.reviveSouls', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 1 Event ----------------------------------------------------------
  { id: 'fate-hela-conquer-valhalla', villain: 'fate-hela', name: 'Conquer Valhalla', type: 'event', cost: 0, strength: 7,
    text: 'Asgardians gain +1 Strength while CONQUER VALHALLA is in play.',
    effects: [{ op: 'boostStrength', allyFilter: { tags: ['asgard'] }, n: 1, duration: 'permanent' }],
    tags: [], icons: [],
    targetedVillain: 'hela',
  },

  // ----- 1 Item -----------------------------------------------------------
  { id: 'fate-hela-odin-force', villain: 'fate-hela', name: 'The Odin Force', type: 'item', cost: 0,
    text: 'The Hero holding THE ODIN FORCE gains +2 Strength.',
    effects: [{ op: 'villainSpecific', key: 'hela.fate.odinForce.boostHero', payload: null }],
    tags: [], icons: [] },
];
