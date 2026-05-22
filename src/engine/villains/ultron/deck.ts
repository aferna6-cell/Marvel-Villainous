// STUB DECK — Ultron villain deck. Mechanical metadata only.

import type { CardDef } from '../../types';

export const ultronDeck: CardDef[] = [
  { id: 'ultron-stub-ally-1', villain: 'ultron', name: '', type: 'ally', cost: 1, strength: 2, effects: [], icons: [] },
  { id: 'ultron-stub-ally-2', villain: 'ultron', name: '', type: 'ally', cost: 2, strength: 3, effects: [], icons: [] },
  { id: 'ultron-stub-ally-3', villain: 'ultron', name: '', type: 'ally', cost: 3, strength: 4, effects: [], icons: [] },
  { id: 'ultron-stub-ally-4', villain: 'ultron', name: '', type: 'ally', cost: 1, strength: 1, effects: [], icons: [] },
  { id: 'ultron-stub-eff-1',  villain: 'ultron', name: '', type: 'effect', cost: 1, effects: [{ op: 'gainPower', n: 2 }], icons: [] },
  { id: 'ultron-stub-eff-2',  villain: 'ultron', name: '', type: 'effect', cost: 0, effects: [{ op: 'drawCards', n: 1 }], icons: [] },
  { id: 'ultron-stub-item-1', villain: 'ultron', name: '', type: 'item',   cost: 2, effects: [], icons: [] },
  { id: 'ultron-stub-item-2', villain: 'ultron', name: '', type: 'item',   cost: 1, effects: [], icons: [] },
];
