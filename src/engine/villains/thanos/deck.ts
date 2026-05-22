// STUB DECK — Thanos villain deck.
// Mechanical metadata only. `name` and `text` are intentionally blank; the
// user fills them in from their physical copy (see assets/CONTENT_TODO.md).
// CHUNK 5+ (M4) replaces these placeholders with the printed card list.

import type { CardDef } from '../../types';

export const thanosDeck: CardDef[] = [
  { id: 'thanos-stub-ally-1', villain: 'thanos', name: '', type: 'ally', cost: 1, strength: 2, effects: [], icons: [] },
  { id: 'thanos-stub-ally-2', villain: 'thanos', name: '', type: 'ally', cost: 2, strength: 3, effects: [], icons: [] },
  { id: 'thanos-stub-ally-3', villain: 'thanos', name: '', type: 'ally', cost: 3, strength: 4, effects: [], icons: [] },
  { id: 'thanos-stub-ally-4', villain: 'thanos', name: '', type: 'ally', cost: 1, strength: 1, effects: [], icons: [] },
  { id: 'thanos-stub-eff-1',  villain: 'thanos', name: '', type: 'effect', cost: 1, effects: [{ op: 'gainPower', n: 2 }], icons: [] },
  { id: 'thanos-stub-eff-2',  villain: 'thanos', name: '', type: 'effect', cost: 0, effects: [{ op: 'drawCards', n: 1 }], icons: [] },
  { id: 'thanos-stub-item-1', villain: 'thanos', name: '', type: 'item',   cost: 2, effects: [], icons: [] },
  { id: 'thanos-stub-item-2', villain: 'thanos', name: '', type: 'item',   cost: 1, effects: [], icons: [] },
];
