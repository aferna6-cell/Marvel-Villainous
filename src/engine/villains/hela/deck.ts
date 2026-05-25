// HELA villain deck — 30 cards (authoritative card data from the user's
// spreadsheet).
//
// Composition: 14 unique cards / 30 total
//   11 Allies     — Dísir ×4; Draugr Swordsman ×4; Fenris Wolf, Leah,
//                   Midgard Serpent (each ×1)
//   14 Effects    — Marked by Death ×5; Death's Embrace ×3; Hel to Pay,
//                   Price of Life, Soul for a Soul (each ×2)
//   2 Items       — Nightsword ×2
//   3 Specialties — Hand of Glory, Hela's Bidding, Raise the Dead (each ×1)
// Goal: 8 Allies + Soul Marks at Odin's Vault.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const helaDeck: CardDef[] = [
  // ----- 11 Allies ---------------------------------------------------------
  ...copies('hela-disir', 4, {
    villain: 'hela', name: 'Dísir', type: 'ally', cost: 2, strength: 3,
    text: 'DÍSIR may be played from your discard pile.',
    effects: [],
    tags: ['asgard', 'undead'], icons: [],
    playableFromDiscard: true,
  }),
  ...copies('hela-draugr-swordsman', 4, {
    villain: 'hela', name: 'Draugr Swordsman', type: 'ally', cost: 1, strength: 2,
    text: 'DRAUGR SWORDSMAN gains 1 Strength for each DRAUGR SWORDSMAN in your discard pile.',
    effects: [{ op: 'villainSpecific', key: 'hela.draugr.scaleWithDiscard', payload: null }],
    tags: ['asgard', 'undead'], icons: [],
  }),
  {
    id: 'hela-fenris-wolf',
    villain: 'hela', name: 'Fenris Wolf', type: 'ally', cost: 2, strength: 3,
    text: 'If a Hero is played to a location in your Domain, you may play or relocate FENRIS WOLF to that location for free.',
    effects: [{ op: 'villainSpecific', key: 'hela.fenris.heroSummon', payload: null }],
    tags: ['beast'], icons: [],
  },
  {
    id: 'hela-leah',
    villain: 'hela', name: 'Leah', type: 'ally', cost: 2, strength: 2,
    text: 'When LEAH is played, you may attach a Soul Mark to one Hero at her location.',
    effects: [{ op: 'villainSpecific', key: 'hela.leah.mark', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'hela-midgard-serpent',
    villain: 'hela', name: 'Midgard Serpent', type: 'ally', cost: 3, strength: 5,
    text: 'When performing a vanquish action, MIDGARD SERPENT may be used to defeat each character with a Strength of 5 or less at its location.',
    effects: [{ op: 'villainSpecific', key: 'hela.midgardSerpent.sweep', payload: null }],
    tags: ['beast'], icons: [],
  },

  // ----- 14 Effects --------------------------------------------------------
  ...copies('hela-marked-by-death', 5, {
    villain: 'hela', name: 'Marked by Death', type: 'effect', cost: 1,
    text: 'Choose a Hero in any Domain without a Soul Mark. Attach a Soul Mark to that Hero.',
    effects: [{ op: 'villainSpecific', key: 'placeSoulMark', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('hela-deaths-embrace', 3, {
    villain: 'hela', name: "Death's Embrace", type: 'effect', cost: 0,
    text: 'Relocate a Hero with an attached Soul Mark to Niflheim.',
    effects: [{ op: 'villainSpecific', key: 'hela.deathsEmbrace', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('hela-hel-to-pay', 2, {
    villain: 'hela', name: 'Hel to Pay', type: 'effect', cost: 2,
    text: 'Choose a Hero with an attached Soul Mark in your Domain. Perform a vanquish action to defeat that Hero.',
    effects: [{ op: 'villainSpecific', key: 'hela.helToPay', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('hela-prices-of-life', 2, {
    villain: 'hela', name: 'Price of Life', type: 'effect', cost: 0,
    text: "Choose a Hero with an attached Soul Mark in another player's Domain. Remove the Soul Mark from that Hero, then gain Power equal to that Hero's Strength.",
    effects: [{ op: 'villainSpecific', key: 'hela.priceOfLife', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('hela-soul-for-a-soul', 2, {
    villain: 'hela', name: 'Soul for a Soul', type: 'effect', cost: 1,
    text: "Choose a Hero with an attached Soul Mark in any Domain and remove that Hero. If you do, you may defeat a Hero in Hela's Domain.",
    effects: [{ op: 'villainSpecific', key: 'hela.soulForASoul', payload: null }],
    tags: [], icons: [],
  }),

  // ----- 2 Items -----------------------------------------------------------
  ...copies('hela-nightsword', 2, {
    villain: 'hela', name: 'Nightsword', type: 'item', cost: 2,
    text: 'ACTIVATE: Attach a Soul Mark to any Hero without one at this location.',
    effects: [],
    activateEffects: [{ op: 'villainSpecific', key: 'hela.nightsword.activate', payload: null }],
    tags: [], icons: ['activate'],
  }),

  // ----- 3 Specialties -----------------------------------------------------
  {
    id: 'hela-hand-of-glory',
    villain: 'hela', name: 'Hand of Glory', type: 'specialty', cost: 2,
    text: "ACTIVATE: Choose a Hero from the Fate discard pile. Pay Power equal to their Strength, then play them to any Domain and attach a Soul Mark to them.",
    effects: [],
    activateEffects: [{ op: 'villainSpecific', key: 'hela.handOfGlory', payload: null }],
    tags: [], icons: ['activate'],
  },
  {
    id: 'hela-helas-bidding',
    villain: 'hela', name: "Hela's Bidding", type: 'specialty', cost: 3,
    text: 'Each time another player defeats a Hero with an attached Soul Mark, gain 3 Power.',
    effects: [{ op: 'villainSpecific', key: 'hela.bidding', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'hela-raise-the-dead',
    villain: 'hela', name: 'Raise the Dead', type: 'specialty', cost: 2,
    text: 'DRAUGR SWORDSMAN may be played from your discard pile to your Domain.',
    effects: [{ op: 'villainSpecific', key: 'hela.raiseTheDead', payload: null }],
    tags: [], icons: [],
  },
];
