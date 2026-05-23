// HELA villain deck — 30 cards transcribed from the Marvel Villainous Wiki.
//
// Composition (per the Hela wiki page + per-card infoboxes):
//   11 Allies      — Dísir ×4; Draugr Swordsman ×4; Fenris Wolf, Leah,
//                    Midgard Serpent (each ×1)
//   14 Effects     — Marked by Death ×5; Death's Embrace ×3; Hel to Pay,
//                    Prices of Life, Soul for a Soul (each ×2)
//   2 Items        — Nightsword ×2
//   3 Specialties  — Hand of Glory, Hela's Bidding, Raise the Dead (each ×1)
//
// Per §0: `name` and `text` stay blank in the repo. Ability text is encoded
// as `villainSpecific` placeholders or empty `effects[]` until CHUNK 7+
// wires the per-card behavior.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const helaDeck: CardDef[] = [
  // ----- 11 Allies ---------------------------------------------------------
  ...copies('hela-disir', 4, {
    villain: 'hela', name: '', type: 'ally', cost: 2, strength: 3,
    effects: [], tags: [], icons: [],
  }),
  ...copies('hela-draugr-swordsman', 4, {
    villain: 'hela', name: '', type: 'ally', cost: 1, strength: 2,
    effects: [], tags: [], icons: [],
  }),
  { id: 'hela-fenris-wolf', villain: 'hela', name: '', type: 'ally', cost: 2, strength: 3, effects: [], tags: [], icons: [] },
  { id: 'hela-leah',         villain: 'hela', name: '', type: 'ally', cost: 2, strength: 2, effects: [], tags: [], icons: [] },
  { id: 'hela-midgard-serpent', villain: 'hela', name: '', type: 'ally', cost: 3, strength: 5, effects: [], tags: [], icons: [] },

  // ----- 14 Effects --------------------------------------------------------
  ...copies('hela-marked-by-death', 5, {
    villain: 'hela', name: '', type: 'effect', cost: 1, effects: [], tags: [], icons: [],
  }),
  ...copies('hela-deaths-embrace', 3, {
    villain: 'hela', name: '', type: 'effect', cost: 0, effects: [], tags: [], icons: [],
  }),
  ...copies('hela-hel-to-pay', 2, {
    villain: 'hela', name: '', type: 'effect', cost: 2, effects: [], tags: [], icons: [],
  }),
  ...copies('hela-prices-of-life', 2, {
    villain: 'hela', name: '', type: 'effect', cost: 0, effects: [], tags: [], icons: [],
  }),
  ...copies('hela-soul-for-a-soul', 2, {
    villain: 'hela', name: '', type: 'effect', cost: 1, effects: [], tags: [], icons: [],
  }),

  // ----- 2 Items -----------------------------------------------------------
  ...copies('hela-nightsword', 2, {
    villain: 'hela', name: '', type: 'item', cost: 2, effects: [], tags: [], icons: [],
  }),

  // ----- 3 Specialties -----------------------------------------------------
  { id: 'hela-hand-of-glory',  villain: 'hela', name: '', type: 'specialty', cost: 2, effects: [], tags: [], icons: [] },
  { id: 'hela-helas-bidding',  villain: 'hela', name: '', type: 'specialty', cost: 3, effects: [], tags: [], icons: [] },
  { id: 'hela-raise-the-dead', villain: 'hela', name: '', type: 'specialty', cost: 2, effects: [], tags: [], icons: [] },
];
