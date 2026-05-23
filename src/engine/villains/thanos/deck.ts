// THANOS villain deck — 30 cards (rulebook + Marvel Villainous Wiki).
//
// Composition (per the Thanos wiki page and per-card infoboxes):
//   10 Allies  — The Legions of Thanos ×5; Black Dwarf ×1; Black Swan ×1;
//                Corvus Glaive ×1; Ebony Maw ×1; Proxima Midnight ×1
//   16 Effects — Consult the Well ×4; A Small Price to Pay ×3; Taste of
//                Cosmic Power ×3; Deliver Judgment ×2; The Mad Titan ×2;
//                Warp Reality ×2
//   4 Items    — Death's Favor ×3; Space Throne ×1
//
// Per the project's §0 ground rules `name` and `text` stay blank in the
// repo — only mechanical metadata is committed. The `effects[]` slots
// currently hold only the directly-supported §2.3 EffectSpec primitives;
// where a card's printed ability does not yet map cleanly to a primitive
// (most of them), the slot stays empty and is logged as a follow-up so
// CHUNK 7+ can wire the bespoke handlers via `villainSpecific`.

import type { CardDef } from '../../types';

// Helper to mint N copies of the same CardDef shape with sequential ids.
function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const thanosDeck: CardDef[] = [
  // ----- 10 Allies ----------------------------------------------------------

  // The Legions of Thanos — ×5; Ally; cost 1; strength 2
  ...copies('thanos-legions', 5, {
    villain: 'thanos',
    name: '',
    type: 'ally',
    cost: 1,
    strength: 2,
    effects: [],
    tags: [],
    icons: [],
  }),

  // Black Dwarf — ×1; Ally; cost 3; strength 6
  // Card restriction: "BLACK DWARF cannot be played or relocated to Events." (CHUNK 7+ via villainSpecific)
  {
    id: 'thanos-black-dwarf',
    villain: 'thanos',
    name: '',
    type: 'ally',
    cost: 3,
    strength: 6,
    effects: [],
    tags: ['blackOrder'],
    icons: [],
  },

  // Black Swan — ×1; Ally; cost 2; strength 1 (gains strength under conditions; CHUNK 7+)
  {
    id: 'thanos-black-swan',
    villain: 'thanos',
    name: '',
    type: 'ally',
    cost: 2,
    strength: 1,
    effects: [],
    tags: ['blackOrder'],
    icons: [],
  },

  // Corvus Glaive — ×1; Ally; cost 3; strength 4
  {
    id: 'thanos-corvus-glaive',
    villain: 'thanos',
    name: '',
    type: 'ally',
    cost: 3,
    strength: 4,
    effects: [],
    tags: ['blackOrder'],
    icons: [],
  },

  // Ebony Maw — ×1; Ally; cost 3; strength 4
  {
    id: 'thanos-ebony-maw',
    villain: 'thanos',
    name: '',
    type: 'ally',
    cost: 3,
    strength: 4,
    effects: [],
    tags: ['blackOrder'],
    icons: [],
  },

  // Proxima Midnight — ×1; Ally; cost 2; strength 3
  {
    id: 'thanos-proxima-midnight',
    villain: 'thanos',
    name: '',
    type: 'ally',
    cost: 2,
    strength: 3,
    effects: [],
    tags: ['blackOrder'],
    icons: [],
  },

  // ----- 16 Effects ---------------------------------------------------------

  // Consult the Well — ×4; Effect; cost 2 (gives opponent a Stone, then relocate ally — CHUNK 7+ via villainSpecific)
  ...copies('thanos-consult', 4, {
    villain: 'thanos',
    name: '',
    type: 'effect',
    cost: 2,
    effects: [],
    tags: [],
    icons: [],
  }),

  // A Small Price to Pay... — ×3; Effect; cost 0
  ...copies('thanos-small-price', 3, {
    villain: 'thanos',
    name: '',
    type: 'effect',
    cost: 0,
    effects: [],
    tags: [],
    icons: [],
  }),

  // Taste of Cosmic Power — ×3; Effect; cost 2
  ...copies('thanos-taste-cosmic', 3, {
    villain: 'thanos',
    name: '',
    type: 'effect',
    cost: 2,
    effects: [],
    tags: [],
    icons: [],
  }),

  // Deliver Judgment — ×2; Effect; cost 3
  ...copies('thanos-deliver-judgment', 2, {
    villain: 'thanos',
    name: '',
    type: 'effect',
    cost: 3,
    effects: [],
    tags: [],
    icons: [],
  }),

  // The Mad Titan — ×2; Effect; DYNAMIC cost (= strength of defeated character).
  // Encoded as cost 0 in the static model; the dynamic-cost handling lands
  // with villainSpecific in CHUNK 7+. See RULES_QUESTIONS Q19.
  ...copies('thanos-mad-titan', 2, {
    villain: 'thanos',
    name: '',
    type: 'effect',
    cost: 0,
    effects: [{ op: 'villainSpecific', key: 'thanos.madTitan', payload: null }],
    tags: [],
    icons: [],
  }),

  // Warp Reality — ×2; Effect; cost 1
  ...copies('thanos-warp-reality', 2, {
    villain: 'thanos',
    name: '',
    type: 'effect',
    cost: 1,
    effects: [],
    tags: [],
    icons: [],
  }),

  // ----- 4 Items ------------------------------------------------------------

  // Death's Favor — ×3; Item; cost 2 (grants an Activate or Vanquish action at its location)
  ...copies('thanos-deaths-favor', 3, {
    villain: 'thanos',
    name: '',
    type: 'item',
    cost: 2,
    effects: [],
    tags: [],
    icons: [],
  }),

  // Space Throne — ×1; Item; cost 2 (location gains RELOCATE)
  {
    id: 'thanos-space-throne',
    villain: 'thanos',
    name: '',
    type: 'item',
    cost: 2,
    effects: [],
    tags: [],
    icons: [],
  },
];
