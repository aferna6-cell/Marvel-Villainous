// KILLMONGER villain deck — 30 cards (authoritative card data from the
// user's spreadsheet).
//
// Composition: 17 unique cards / 30 total
//   7 Allies      — Dog of War ×3; Knight, King, Rook, W'Kabi (each ×1)
//   9 Effects     — Killmonger's Fury ×4; Execute Plan, Taunt (each ×2);
//                   Overpower ×1
//   10 Items      — Weapons Cache ×4; Explosives ×3; Wound ×2; Hacking
//                   Rig ×1
//   4 Specialties — Armored Rhino, Heart-Shaped Herb, Rage of K'liluna,
//                   Stolen Wisdom (each ×1)
// Goal: defeat Klaw + Black Panther, plant 2 Explosives.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const killmongerDeck: CardDef[] = [
  // ----- 7 Allies ----------------------------------------------------------
  ...copies('killmonger-dog-of-war', 3, {
    villain: 'killmonger', name: 'Dog of War', type: 'ally', cost: 1, strength: 2,
    text: "You may play DOG OF WAR to another player's Domain.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.dogOfWar.foreignDomain', payload: null }],
    tags: ['merc'], icons: [],
  }),
  {
    id: 'killmonger-knight',
    villain: 'killmonger', name: 'Knight', type: 'ally', cost: 3, strength: 5,
    text: 'No additional ability.',
    effects: [], tags: [], icons: [],
  },
  {
    id: 'killmonger-king',
    villain: 'killmonger', name: 'King', type: 'ally', cost: 2, strength: 4,
    text: 'When KING is played, you may relocate an unattached Item you control in your Domain to his location.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.king.dragItem', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'killmonger-rook',
    villain: 'killmonger', name: 'Rook', type: 'ally', cost: 2, strength: 2,
    text: "When one other Ally would be defeated at ROOK's location, you may remove ROOK instead.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.rook.bodyguard', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'killmonger-wkabi',
    villain: 'killmonger', name: "W'Kabi", type: 'ally', cost: 2, strength: 3,
    text: 'Your Power cost to use an Activated Ability is reduced by 1. W\'KABI cannot be played if KLAW is in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.wkabi.activateDiscount', payload: null }],
    tags: [], icons: [],
  },

  // ----- 9 Effects ---------------------------------------------------------
  ...copies('killmonger-fury', 4, {
    villain: 'killmonger', name: "Killmonger's Fury", type: 'effect', cost: 2,
    text: 'Defeat a character with a Strength of 4 or less in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.fury', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('killmonger-execute-plan', 2, {
    villain: 'killmonger', name: 'Execute Plan', type: 'effect', cost: 1,
    text: 'Perform an activate action.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.executePlan', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('killmonger-taunt', 2, {
    villain: 'killmonger', name: 'Taunt', type: 'effect', cost: 0,
    text: 'Relocate any character in your Domain to a different location in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.taunt', payload: null }],
    tags: [], icons: [],
  }),
  {
    id: 'killmonger-overpower',
    villain: 'killmonger', name: 'Overpower', type: 'effect', cost: 2,
    text: 'Place a +1 Strength token on all Allies in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.overpower', payload: null }],
    tags: [], icons: [],
  },

  // ----- 10 Items ----------------------------------------------------------
  ...copies('killmonger-weapons-cache', 4, {
    villain: 'killmonger', name: 'Weapons Cache', type: 'item', cost: 1,
    text: 'On your turn, you may pay up to 3 Power. For each Power you pay, reduce the Strength of any character at the same location as WEAPONS CACHE by 1 until the end of the turn.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.weaponsCache', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('killmonger-explosives', 3, {
    villain: 'killmonger', name: 'Explosives', type: 'item', cost: 2,
    text: 'Remove this Item to defeat up to two characters at this location. EXPLOSIVES cannot defeat characters with a Strength of 5 or more.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.explosives', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('killmonger-wound', 2, {
    villain: 'killmonger', name: 'Wound', type: 'item', cost: 1, strength: -2,
    text: 'When WOUND is played, attach it to a character you do not control in your Domain. That character loses 2 Strength.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.wound', payload: null }],
    tags: ['wound'], icons: [],
  }),
  {
    id: 'killmonger-hacking-rig',
    villain: 'killmonger', name: 'Hacking Rig', type: 'item', cost: 2,
    text: 'ACTIVATE: You cannot activate HACKING RIG if you have the most Power. Gain Power equal to half the amount held by the player with the most Power rounded up.',
    effects: [],
    activateEffects: [{ op: 'villainSpecific', key: 'killmonger.hackingRig', payload: null }],
    tags: [], icons: ['activate'],
  },

  // ----- 4 Specialties -----------------------------------------------------
  {
    id: 'killmonger-armored-rhino',
    villain: 'killmonger', name: 'Armored Rhino', type: 'specialty', cost: 0,
    text: "Heroes at Killmonger's location lose 1 Strength.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.armoredRhino', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'killmonger-heart-shaped-herb',
    villain: 'killmonger', name: 'Heart-Shaped Herb', type: 'specialty', cost: 3,
    text: 'Gain PLAY A CARD. HEART-SHAPED HERB cannot be played if KLAW is in your Domain.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.heartShapedHerb', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'killmonger-rage-of-kliluna',
    villain: 'killmonger', name: "Rage of K'liluna", type: 'specialty', cost: 1,
    text: "Before moving your Villain, you may discard a card from your hand to find KILLMONGER'S FURY, then add it to your hand.",
    effects: [{ op: 'villainSpecific', key: 'killmonger.rage', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'killmonger-stolen-wisdom',
    villain: 'killmonger', name: 'Stolen Wisdom', type: 'specialty', cost: 3,
    text: 'If you have three or fewer cards in your hand at the end of your turn, instead of drawing cards, you may reveal cards from your deck until you reveal two Items. Add those Items to your hand.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.stolenWisdom', payload: null }],
    tags: [], icons: [],
  },
];
