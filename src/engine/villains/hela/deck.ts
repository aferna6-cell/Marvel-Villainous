// HELA villain deck — 30 cards.
//
// Composition:
//   11 Allies      — Dísir ×4; Draugr Swordsman ×4; Fenris Wolf, Leah,
//                    Midgard Serpent (each ×1)
//   14 Effects     — Marked by Death ×5; Death's Embrace ×3; Hel to Pay,
//                    Prices of Life, Soul for a Soul (each ×2)
//   2 Items        — Nightsword ×2
//   3 Specialties  — Hand of Glory, Hela's Bidding, Raise the Dead (each ×1)
//
// User-overridden §0: names + ability text are encoded.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const helaDeck: CardDef[] = [
  // ----- 11 Allies ---------------------------------------------------------
  ...copies('hela-disir', 4, {
    villain: 'hela', name: 'Dísir', type: 'ally', cost: 2, strength: 3,
    text: 'Undead Asgardian shieldmaiden.',
    effects: [], tags: ['asgard', 'undead'], icons: [],
  }),
  ...copies('hela-draugr-swordsman', 4, {
    villain: 'hela', name: 'Draugr Swordsman', type: 'ally', cost: 1, strength: 2,
    text: 'Risen warrior of Hel.',
    effects: [], tags: ['asgard', 'undead'], icons: [],
  }),
  { id: 'hela-fenris-wolf', villain: 'hela', name: 'Fenris Wolf', type: 'ally', cost: 2, strength: 3,
    text: 'Fenris ignores the first Strength of any Hero he attacks.',
    effects: [{ op: 'villainSpecific', key: 'hela.fenris.ignoreFirst', payload: null }],
    tags: ['beast'], icons: [] },
  { id: 'hela-leah',         villain: 'hela', name: 'Leah', type: 'ally', cost: 2, strength: 2,
    text: 'When LEAH is played, you may draw 1 card.',
    effects: [{ op: 'drawCards', n: 1 }],
    tags: [], icons: [] },
  { id: 'hela-midgard-serpent', villain: 'hela', name: 'Midgard Serpent', type: 'ally', cost: 3, strength: 5,
    text: 'Massive sea-beast — covers any single icon at its location while present.',
    effects: [{ op: 'villainSpecific', key: 'hela.midgardSerpent.coverIcon', payload: null }],
    tags: ['beast'], icons: [] },

  // ----- 14 Effects --------------------------------------------------------
  ...copies('hela-marked-by-death', 5, {
    villain: 'hela', name: 'Marked by Death', type: 'effect', cost: 1,
    text: 'Place a Soul Mark on this location.',
    effects: [{ op: 'villainSpecific', key: 'placeSoulMark', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('hela-deaths-embrace', 3, {
    villain: 'hela', name: "Death's Embrace", type: 'effect', cost: 0,
    text: 'Defeat one of your own Allies at any location and place a Soul Mark there.',
    effects: [{ op: 'villainSpecific', key: 'hela.deathsEmbrace', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('hela-hel-to-pay', 2, {
    villain: 'hela', name: 'Hel to Pay', type: 'effect', cost: 2,
    text: 'Defeat any Hero of Strength 3 or less.',
    effects: [{ op: 'defeatHero', whereFilter: {} }],
    tags: [], icons: [],
  }),
  ...copies('hela-prices-of-life', 2, {
    villain: 'hela', name: 'Prices of Life', type: 'effect', cost: 0,
    text: 'Gain 1 Power for each Soul Mark on the board.',
    effects: [{ op: 'villainSpecific', key: 'hela.pricesOfLife', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('hela-soul-for-a-soul', 2, {
    villain: 'hela', name: 'Soul for a Soul', type: 'effect', cost: 1,
    text: 'Move a defeated Ally from your discard back to any location in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'hela.soulForASoul', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 2 Items -----------------------------------------------------------
  ...copies('hela-nightsword', 2, {
    villain: 'hela', name: 'Nightsword', type: 'item', cost: 2,
    text: 'The Ally holding NIGHTSWORD gains +2 Strength.',
    effects: [{ op: 'boostStrength', allyFilter: {}, n: 2, duration: 'permanent' }],
    tags: [], icons: [],
  }),

  // ----- 3 Specialties -----------------------------------------------------
  { id: 'hela-hand-of-glory',  villain: 'hela', name: 'Hand of Glory', type: 'specialty', cost: 2,
    text: 'Hela may discard any number of cards then draw the same number.',
    effects: [{ op: 'villainSpecific', key: 'hela.handOfGlory', payload: null }],
    tags: [], icons: [] },
  { id: 'hela-helas-bidding',  villain: 'hela', name: "Hela's Bidding", type: 'specialty', cost: 3,
    text: 'Take an extra action this turn.',
    effects: [{ op: 'villainSpecific', key: 'hela.bidding', payload: null }],
    tags: [], icons: [] },
  { id: 'hela-raise-the-dead', villain: 'hela', name: 'Raise the Dead', type: 'specialty', cost: 2,
    text: "Return one Ally from Hela's discard to her hand.",
    effects: [{ op: 'villainSpecific', key: 'hela.raiseTheDead', payload: null }],
    tags: [], icons: [] },
];
