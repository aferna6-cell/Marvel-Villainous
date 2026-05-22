// STUB DECK — Killmonger villain deck. Mechanical metadata only.

import type { CardDef } from '../../types';

export const killmongerDeck: CardDef[] = [
  { id: 'killmonger-stub-ally-1', villain: 'killmonger', name: '', type: 'ally', cost: 1, strength: 2, effects: [], icons: [] },
  { id: 'killmonger-stub-ally-2', villain: 'killmonger', name: '', type: 'ally', cost: 2, strength: 3, effects: [], icons: [] },
  { id: 'killmonger-stub-ally-3', villain: 'killmonger', name: '', type: 'ally', cost: 3, strength: 4, effects: [], icons: [] },
  { id: 'killmonger-stub-ally-4', villain: 'killmonger', name: '', type: 'ally', cost: 1, strength: 1, effects: [], icons: [] },
  { id: 'killmonger-stub-eff-1',  villain: 'killmonger', name: '', type: 'effect', cost: 1, effects: [{ op: 'gainPower', n: 2 }], icons: [] },
  { id: 'killmonger-stub-eff-2',  villain: 'killmonger', name: '', type: 'effect', cost: 0, effects: [{ op: 'drawCards', n: 1 }], icons: [] },
  { id: 'killmonger-stub-item-1', villain: 'killmonger', name: '', type: 'item',   cost: 2, effects: [], icons: [] },
  { id: 'killmonger-stub-item-2', villain: 'killmonger', name: '', type: 'item',   cost: 1, effects: [], icons: [] },
];
