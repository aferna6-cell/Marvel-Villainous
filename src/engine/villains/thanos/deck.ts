// THANOS villain deck — 30 cards.
//
// Composition (per the Thanos wiki page and per-card infoboxes):
//   10 Allies  — The Legions of Thanos ×5; Black Dwarf ×1; Black Swan ×1;
//                Corvus Glaive ×1; Ebony Maw ×1; Proxima Midnight ×1
//   16 Effects — Consult the Well ×4; A Small Price to Pay ×3; Taste of
//                Cosmic Power ×3; Deliver Judgment ×2; The Mad Titan ×2;
//                Warp Reality ×2
//   4 Items    — Death's Favor ×3; Space Throne ×1
//
// Per the project's revised goal (the user explicitly overrode §0), card
// names + printed ability text are encoded here. Ability text was
// reconstructed from prior wiki scraping notes and Marvel Villainous
// rulebook references — minor wording differences from the physical card
// are possible; the mechanical effect keys are the load-bearing piece.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const thanosDeck: CardDef[] = [
  // ----- 10 Allies ----------------------------------------------------------

  ...copies('thanos-legions', 5, {
    villain: 'thanos',
    name: 'The Legions of Thanos',
    type: 'ally',
    cost: 1,
    strength: 2,
    text: "Thanos's rank-and-file army.",
    effects: [],
    tags: ['legions'],
    icons: [],
  }),

  {
    id: 'thanos-black-dwarf',
    villain: 'thanos',
    name: 'Black Dwarf',
    type: 'ally',
    cost: 3,
    strength: 6,
    text: 'BLACK DWARF cannot be played or relocated to Events.',
    effects: [{ op: 'villainSpecific', key: 'thanos.blackDwarf.restrictEvent', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },
  {
    id: 'thanos-black-swan',
    villain: 'thanos',
    name: 'Black Swan',
    type: 'ally',
    cost: 2,
    strength: 1,
    text: 'BLACK SWAN gains +1 Strength for each other Black Order Ally Thanos has in play.',
    effects: [{ op: 'villainSpecific', key: 'thanos.blackSwan.boost', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },
  {
    id: 'thanos-corvus-glaive',
    villain: 'thanos',
    name: 'Corvus Glaive',
    type: 'ally',
    cost: 3,
    strength: 4,
    text: 'When CORVUS GLAIVE is defeated, return him to your hand instead of the discard pile (once per game).',
    effects: [{ op: 'villainSpecific', key: 'thanos.corvusGlaive.returnOnDefeat', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },
  {
    id: 'thanos-ebony-maw',
    villain: 'thanos',
    name: 'Ebony Maw',
    type: 'ally',
    cost: 3,
    strength: 4,
    text: 'When EBONY MAW is played, draw 1 card.',
    effects: [{ op: 'drawCards', n: 1 }],
    tags: ['blackOrder'],
    icons: [],
  },
  {
    id: 'thanos-proxima-midnight',
    villain: 'thanos',
    name: 'Proxima Midnight',
    type: 'ally',
    cost: 2,
    strength: 3,
    text: 'PROXIMA MIDNIGHT cannot be assigned to a location with a Hero.',
    effects: [{ op: 'villainSpecific', key: 'thanos.proxima.noHeroLocation', payload: null }],
    tags: ['blackOrder'],
    icons: [],
  },

  // ----- 16 Effects ---------------------------------------------------------

  ...copies('thanos-consult', 4, {
    villain: 'thanos',
    name: 'Consult the Well',
    type: 'effect',
    cost: 2,
    text: 'Take an Infinity Stone from the Infinity Well and place it on a matching location in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'thanos.consultWell', payload: null }],
    tags: [],
    icons: [],
  }),

  ...copies('thanos-small-price', 3, {
    villain: 'thanos',
    name: 'A Small Price To Pay...',
    type: 'effect',
    cost: 0,
    text: 'Discard one of your Allies to gain 3 Power.',
    effects: [{ op: 'villainSpecific', key: 'thanos.smallPrice', payload: null }],
    tags: [],
    icons: [],
  }),

  ...copies('thanos-taste-cosmic', 3, {
    villain: 'thanos',
    name: 'Taste of Cosmic Power',
    type: 'effect',
    cost: 2,
    text: 'Gain 1 Power for each Infinity Stone you have collected.',
    effects: [{ op: 'villainSpecific', key: 'thanos.tasteCosmic', payload: null }],
    tags: [],
    icons: [],
  }),

  ...copies('thanos-deliver-judgment', 2, {
    villain: 'thanos',
    name: 'Deliver Judgment',
    type: 'effect',
    cost: 3,
    text: 'Defeat a Hero of Strength 4 or less.',
    effects: [{ op: 'defeatHero', whereFilter: {} }],
    tags: [],
    icons: [],
  }),

  ...copies('thanos-mad-titan', 2, {
    villain: 'thanos',
    name: 'The Mad Titan',
    type: 'effect',
    cost: 0,
    text: 'PLAY COST equals the Strength of the target character. Defeat any one character (Ally or Hero) at any location.',
    effects: [{ op: 'villainSpecific', key: 'thanos.madTitan', payload: null }],
    tags: [],
    icons: [],
  }),

  ...copies('thanos-warp-reality', 2, {
    villain: 'thanos',
    name: 'Warp Reality',
    type: 'effect',
    cost: 1,
    text: 'Move any Ally or Item in your Domain to any location.',
    effects: [{ op: 'moveAlly', from: 'any', to: 'anyLocation' }],
    tags: [],
    icons: [],
  }),

  // ----- 4 Items ------------------------------------------------------------

  ...copies('thanos-deaths-favor', 3, {
    villain: 'thanos',
    name: "Death's Favor",
    type: 'item',
    cost: 2,
    text: "While DEATH'S FAVOR is in play at a location, that location gains an additional Vanquish action icon.",
    effects: [{ op: 'villainSpecific', key: 'thanos.deathsFavor.grantVanquish', payload: null }],
    tags: [],
    icons: [],
  }),

  {
    id: 'thanos-space-throne',
    villain: 'thanos',
    name: 'Space Throne',
    type: 'item',
    cost: 2,
    text: 'While SPACE THRONE is in play, the Thanos token gains the "Move an Item or Ally" ability at its location.',
    effects: [{ op: 'villainSpecific', key: 'thanos.spaceThrone.grantMove', payload: null }],
    tags: [],
    icons: [],
  },
];
