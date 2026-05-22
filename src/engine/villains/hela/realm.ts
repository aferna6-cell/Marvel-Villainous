// Hela's realm. CHUNK 6 fills in per-board icons; for now the same generic
// 4-location stub used by setup.ts.

import type { ActionIcon, Location, Realm } from '../../types';

const TOP_PLACEHOLDER: ActionIcon[] = ['gainPower', 'play'];
const BOTTOM_PLACEHOLDER: ActionIcon[] = ['move', 'fate'];

function helaLocation(idx: number): Location {
  return {
    id: `hela-loc-${idx}`,
    name: '',
    topIcons: [...TOP_PLACEHOLDER],
    bottomIcons: [...BOTTOM_PLACEHOLDER],
    heroesPresent: [],
    alliesPresent: [],
    itemsPresent: [],
    conditions: [],
  };
}

export function helaRealm(): Realm {
  return {
    villain: 'hela',
    locations: [helaLocation(0), helaLocation(1), helaLocation(2), helaLocation(3)],
    villainTokenAt: 0,
  };
}
