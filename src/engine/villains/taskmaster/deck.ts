// STUB DECK — Taskmaster villain deck. Mechanical metadata only.

import type { CardDef } from '../../types';

export const taskmasterDeck: CardDef[] = [
  { id: 'taskmaster-stub-ally-1', villain: 'taskmaster', name: '', type: 'ally', cost: 1, strength: 2, effects: [], icons: [] },
  { id: 'taskmaster-stub-ally-2', villain: 'taskmaster', name: '', type: 'ally', cost: 2, strength: 3, effects: [], icons: [] },
  { id: 'taskmaster-stub-ally-3', villain: 'taskmaster', name: '', type: 'ally', cost: 3, strength: 4, effects: [], icons: [] },
  { id: 'taskmaster-stub-ally-4', villain: 'taskmaster', name: '', type: 'ally', cost: 1, strength: 1, effects: [], icons: [] },
  { id: 'taskmaster-stub-eff-1',  villain: 'taskmaster', name: '', type: 'effect', cost: 1, effects: [{ op: 'gainPower', n: 2 }], icons: [] },
  { id: 'taskmaster-stub-eff-2',  villain: 'taskmaster', name: '', type: 'effect', cost: 0, effects: [{ op: 'drawCards', n: 1 }], icons: [] },
  { id: 'taskmaster-stub-item-1', villain: 'taskmaster', name: '', type: 'item',   cost: 2, effects: [], icons: [] },
  { id: 'taskmaster-stub-item-2', villain: 'taskmaster', name: '', type: 'item',   cost: 1, effects: [], icons: [] },
];
