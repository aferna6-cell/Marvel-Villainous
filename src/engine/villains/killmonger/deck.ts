// KILLMONGER villain deck — 30 cards transcribed from the Marvel Villainous Wiki.
//
// Composition:
//   7 Allies     — Dog of War ×3; Knight, King, Rook, W'Kabi (each ×1)
//   9 Effects    — Killmonger's Fury ×4; Execute Plan, Taunt (each ×2);
//                  Overpower ×1
//   10 Items     — Weapons Cache ×4; Explosives ×3; Wound ×2; Hacking Rig ×1
//                  (Wound has printed Strength -2.)
//   4 Specialties — Armored Rhino, Heart-Shaped Herb, Rage of K'liluna,
//                   Stolen Wisdom (each ×1)
//
// Per §0: `name` and `text` stay blank in the repo.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const killmongerDeck: CardDef[] = [
  // ----- 7 Allies ----------------------------------------------------------
  ...copies('killmonger-dog-of-war', 3, {
    villain: 'killmonger', name: '', type: 'ally', cost: 1, strength: 2,
    effects: [], tags: [], icons: [],
  }),
  { id: 'killmonger-knight', villain: 'killmonger', name: '', type: 'ally', cost: 3, strength: 5, effects: [], tags: [], icons: [] },
  { id: 'killmonger-king',   villain: 'killmonger', name: '', type: 'ally', cost: 2, strength: 4, effects: [], tags: [], icons: [] },
  { id: 'killmonger-rook',   villain: 'killmonger', name: '', type: 'ally', cost: 2, strength: 2, effects: [], tags: [], icons: [] },
  { id: 'killmonger-wkabi',  villain: 'killmonger', name: '', type: 'ally', cost: 2, strength: 3, effects: [], tags: [], icons: [] },

  // ----- 9 Effects ---------------------------------------------------------
  ...copies('killmonger-fury', 4, {
    villain: 'killmonger', name: '', type: 'effect', cost: 2, effects: [], tags: [], icons: [],
  }),
  ...copies('killmonger-execute-plan', 2, {
    villain: 'killmonger', name: '', type: 'effect', cost: 1, effects: [], tags: [], icons: [],
  }),
  ...copies('killmonger-taunt', 2, {
    villain: 'killmonger', name: '', type: 'effect', cost: 0, effects: [], tags: [], icons: [],
  }),
  { id: 'killmonger-overpower', villain: 'killmonger', name: '', type: 'effect', cost: 2, effects: [], tags: [], icons: [] },

  // ----- 10 Items ----------------------------------------------------------
  ...copies('killmonger-weapons-cache', 4, {
    villain: 'killmonger', name: '', type: 'item', cost: 1, effects: [], tags: [], icons: [],
  }),
  ...copies('killmonger-explosives', 3, {
    villain: 'killmonger', name: '', type: 'item', cost: 2, effects: [], tags: [], icons: [],
  }),
  // Wound — Item with printed Strength −2 (it's attached to an Ally to reduce
  // their effective strength).
  ...copies('killmonger-wound', 2, {
    villain: 'killmonger', name: '', type: 'item', cost: 1, strength: -2,
    effects: [], tags: [], icons: [],
  }),
  { id: 'killmonger-hacking-rig', villain: 'killmonger', name: '', type: 'item', cost: 2, effects: [], tags: [], icons: [] },

  // ----- 4 Specialties -----------------------------------------------------
  { id: 'killmonger-armored-rhino',     villain: 'killmonger', name: '', type: 'specialty', cost: 0, effects: [], tags: [], icons: [] },
  { id: 'killmonger-heart-shaped-herb', villain: 'killmonger', name: '', type: 'specialty', cost: 3, effects: [], tags: [], icons: [] },
  { id: 'killmonger-rage-of-kliluna',   villain: 'killmonger', name: '', type: 'specialty', cost: 1, effects: [], tags: [], icons: [] },
  { id: 'killmonger-stolen-wisdom',     villain: 'killmonger', name: '', type: 'specialty', cost: 3, effects: [], tags: [], icons: [] },
];
