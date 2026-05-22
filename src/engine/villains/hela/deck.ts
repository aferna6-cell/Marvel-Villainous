// STUB DECK — Hela villain deck. Mechanical metadata only (see thanos/deck.ts).

import type { CardDef } from '../../types';

export const helaDeck: CardDef[] = [
  { id: 'hela-stub-ally-1', villain: 'hela', name: '', type: 'ally', cost: 1, strength: 2, effects: [], icons: [] },
  { id: 'hela-stub-ally-2', villain: 'hela', name: '', type: 'ally', cost: 2, strength: 3, effects: [], icons: [] },
  { id: 'hela-stub-ally-3', villain: 'hela', name: '', type: 'ally', cost: 3, strength: 4, effects: [], icons: [] },
  { id: 'hela-stub-ally-4', villain: 'hela', name: '', type: 'ally', cost: 1, strength: 1, effects: [], icons: [] },
  { id: 'hela-stub-eff-1',  villain: 'hela', name: '', type: 'effect', cost: 1, effects: [{ op: 'gainPower', n: 2 }], icons: [] },
  { id: 'hela-stub-eff-2',  villain: 'hela', name: '', type: 'effect', cost: 0, effects: [{ op: 'drawCards', n: 1 }], icons: [] },
  { id: 'hela-stub-item-1', villain: 'hela', name: '', type: 'item',   cost: 2, effects: [], icons: [] },
  { id: 'hela-stub-item-2', villain: 'hela', name: '', type: 'item',   cost: 1, effects: [], icons: [] },
];
