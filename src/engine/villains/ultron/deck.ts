// ULTRON villain deck — 30 cards transcribed from the Marvel Villainous Wiki.
//
// Composition:
//   13 Allies   — Duplicate Sentry ×4; Flying Sentry, Heavy Attack Sentry
//                 (each ×3); Alkhema, Giant Sentry, Jocasta (each ×1)
//   11 Effects  — Reconfigure ×3; Assimilate Knowledge, Encephalo-Ray,
//                 Every Contingency Covered, Technoforming (each ×2)
//   6 Items     — Impervious Alloy ×4; Assembly Line ×2
//                 (Impervious Alloy is the only Item with a printed Strength.)
//
// Sentries (Duplicate, Flying, Heavy Attack, Giant) are tagged so future
// villainSpecific handlers can find them for Ultron's Upgrade objectives.
// Per §0: `name` and `text` stay blank in the repo.

import type { CardDef } from '../../types';

function copies(prefix: string, n: number, base: Omit<CardDef, 'id'>): CardDef[] {
  return Array.from({ length: n }, (_, i) => ({ ...base, id: `${prefix}-${i + 1}` }));
}

export const ultronDeck: CardDef[] = [
  // ----- 13 Allies ---------------------------------------------------------
  ...copies('ultron-duplicate-sentry', 4, {
    villain: 'ultron', name: '', type: 'ally', cost: 1, strength: 2,
    effects: [], tags: ['sentry'], icons: [],
  }),
  ...copies('ultron-flying-sentry', 3, {
    villain: 'ultron', name: '', type: 'ally', cost: 2, strength: 3,
    effects: [], tags: ['sentry'], icons: [],
  }),
  ...copies('ultron-heavy-attack-sentry', 3, {
    villain: 'ultron', name: '', type: 'ally', cost: 2, strength: 3,
    effects: [], tags: ['sentry'], icons: [],
  }),
  { id: 'ultron-alkhema',      villain: 'ultron', name: '', type: 'ally', cost: 3, strength: 3, effects: [], tags: [], icons: [] },
  { id: 'ultron-giant-sentry', villain: 'ultron', name: '', type: 'ally', cost: 6, strength: 6, effects: [], tags: ['sentry'], icons: [] },
  { id: 'ultron-jocasta',      villain: 'ultron', name: '', type: 'ally', cost: 4, strength: 3, effects: [], tags: [], icons: [] },

  // ----- 11 Effects --------------------------------------------------------
  ...copies('ultron-reconfigure', 3, {
    villain: 'ultron', name: '', type: 'effect', cost: 0, effects: [], tags: [], icons: [],
  }),
  ...copies('ultron-assimilate-knowledge', 2, {
    villain: 'ultron', name: '', type: 'effect', cost: 1, effects: [], tags: [], icons: [],
  }),
  ...copies('ultron-encephalo-ray', 2, {
    villain: 'ultron', name: '', type: 'effect', cost: 2, effects: [], tags: [], icons: [],
  }),
  ...copies('ultron-every-contingency-covered', 2, {
    villain: 'ultron', name: '', type: 'effect', cost: 1, effects: [], tags: [], icons: [],
  }),
  ...copies('ultron-technoforming', 2, {
    villain: 'ultron', name: '', type: 'effect', cost: 1, effects: [], tags: [], icons: [],
  }),

  // ----- 6 Items -----------------------------------------------------------
  // Impervious Alloy — Item with printed Strength +2 (attaches to an Ally to boost their strength).
  ...copies('ultron-impervious-alloy', 4, {
    villain: 'ultron', name: '', type: 'item', cost: 2, strength: 2,
    effects: [], tags: [], icons: [],
  }),
  ...copies('ultron-assembly-line', 2, {
    villain: 'ultron', name: '', type: 'item', cost: 1, effects: [], tags: [], icons: [],
  }),
];
