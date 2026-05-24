// KILLMONGER villain deck — 30 cards.
//
// Composition:
//   7 Allies     — Dog of War ×3; Knight, King, Rook, W'Kabi (each ×1)
//   9 Effects    — Killmonger's Fury ×4; Execute the Plan, Taunt (each ×2);
//                  Overpower ×1
//   10 Items     — Weapons Cache ×4; Explosives ×3; Wound ×2; Hacking Rig ×1
//   4 Specialties — Armored Rhino, Heart-Shaped Herb, Rage of K'liluna,
//                   Stolen Wisdom (each ×1)

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const killmongerDeck: CardDef[] = [
  // ----- 7 Allies ----------------------------------------------------------
  ...copies('killmonger-dog-of-war', 3, {
    villain: 'killmonger', name: 'Dog of War', type: 'ally', cost: 1, strength: 2,
    text: "Killmonger's loyal mercenary.",
    effects: [], tags: ['merc'], icons: [],
  }),
  { id: 'killmonger-knight', villain: 'killmonger', name: 'Knight', type: 'ally', cost: 3, strength: 5,
    text: 'Heavily armed enforcer.',
    effects: [], tags: [], icons: [] },
  { id: 'killmonger-king',   villain: 'killmonger', name: 'King of Wakanda', type: 'ally', cost: 2, strength: 4,
    text: 'When KING OF WAKANDA is played, advance the boss sequence by 1.',
    effects: [{ op: 'villainSpecific', key: 'defeatBoss', payload: null }],
    tags: [], icons: [] },
  { id: 'killmonger-rook',   villain: 'killmonger', name: 'Rook', type: 'ally', cost: 2, strength: 2,
    text: 'When ROOK is at a location, allies there gain +1 Strength.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.rook.buffLocation', payload: null }],
    tags: [], icons: [] },
  { id: 'killmonger-wkabi',  villain: 'killmonger', name: "W'Kabi", type: 'ally', cost: 2, strength: 3,
    text: 'W\'KABI ignores the Rhino tag restriction (relocate freely).',
    effects: [], tags: [], icons: [] },

  // ----- 9 Effects ---------------------------------------------------------
  ...copies('killmonger-fury', 4, {
    villain: 'killmonger', name: "Killmonger's Fury", type: 'effect', cost: 2,
    text: 'An Ally gains +3 Strength this turn.',
    effects: [{ op: 'boostStrength', allyFilter: {}, n: 3, duration: 'turn' }],
    tags: [], icons: [],
  }),
  ...copies('killmonger-execute-plan', 2, {
    villain: 'killmonger', name: 'Execute the Plan', type: 'effect', cost: 1,
    text: 'Vanquish a Hero of Strength 3 or less without paying Power.',
    effects: [{ op: 'defeatHero', whereFilter: {} }],
    tags: [], icons: [],
  }),
  ...copies('killmonger-taunt', 2, {
    villain: 'killmonger', name: 'Taunt', type: 'effect', cost: 0,
    text: 'Move a Hero from any location to the location of your villain.',
    effects: [{ op: 'moveHero', from: 'thisLocation', to: 'anyLocation' }],
    tags: [], icons: [],
  }),
  { id: 'killmonger-overpower', villain: 'killmonger', name: 'Overpower', type: 'effect', cost: 2,
    text: 'Defeat any Hero — your Allies are not discarded for this Vanquish.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.overpower', payload: null }],
    tags: [], icons: [] },

  // ----- 10 Items ----------------------------------------------------------
  ...copies('killmonger-weapons-cache', 4, {
    villain: 'killmonger', name: 'Weapons Cache', type: 'item', cost: 1,
    text: 'Allies at this location gain +1 Strength.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.weaponsCache', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('killmonger-explosives', 3, {
    villain: 'killmonger', name: 'Explosives', type: 'item', cost: 2,
    text: 'Discard EXPLOSIVES to defeat a Hero of Strength 4 or less.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.explosives', payload: null }],
    tags: [], icons: [],
  }),
  ...copies('killmonger-wound', 2, {
    villain: 'killmonger', name: 'Wound', type: 'item', cost: 1, strength: -2,
    text: 'Attach to a Hero — that Hero\'s Strength is reduced by 2.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.wound', payload: null }],
    tags: ['wound'], icons: [],
  }),
  { id: 'killmonger-hacking-rig', villain: 'killmonger', name: 'Hacking Rig', type: 'item', cost: 2,
    text: 'Once per turn, peek at the top card of any Fate deck.',
    effects: [{ op: 'lookAtFate', n: 1, choose: 0 }],
    tags: [], icons: [] },

  // ----- 4 Specialties -----------------------------------------------------
  { id: 'killmonger-armored-rhino',     villain: 'killmonger', name: 'Armored Rhino', type: 'specialty', cost: 0,
    text: 'A Rhino Ally is placed at the first available location with this token.',
    effects: [{ op: 'villainSpecific', key: 'killmonger.armoredRhino', payload: null }],
    tags: [], icons: [] },
  { id: 'killmonger-heart-shaped-herb', villain: 'killmonger', name: 'Heart-Shaped Herb', type: 'specialty', cost: 3,
    text: "Killmonger gains 1 strength permanently — boost an Ally by 1.",
    effects: [{ op: 'boostStrength', allyFilter: {}, n: 1, duration: 'permanent' }],
    tags: [], icons: [] },
  { id: 'killmonger-rage-of-kliluna',   villain: 'killmonger', name: "Rage of K'liluna", type: 'specialty', cost: 1,
    text: "Killmonger's player draws 2 cards.",
    effects: [{ op: 'drawCards', n: 2 }],
    tags: [], icons: [] },
  { id: 'killmonger-stolen-wisdom',     villain: 'killmonger', name: 'Stolen Wisdom', type: 'specialty', cost: 3,
    text: 'Advance the Wakanda boss sequence by 1.',
    effects: [{ op: 'villainSpecific', key: 'defeatBoss', payload: null }],
    tags: [], icons: [] },
];
