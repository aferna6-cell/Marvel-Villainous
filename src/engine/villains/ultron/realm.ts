// Ultron's realm. CHUNK 6 fills in per-board icons.

import type { ActionIcon, Location, Realm } from '../../types';

const TOP_PLACEHOLDER: ActionIcon[] = ['gainPower', 'play'];
const BOTTOM_PLACEHOLDER: ActionIcon[] = ['move', 'fate'];

function ultronLocation(idx: number): Location {
  return {
    id: `ultron-loc-${idx}`,
    name: '',
    topIcons: [...TOP_PLACEHOLDER],
    bottomIcons: [...BOTTOM_PLACEHOLDER],
    heroesPresent: [],
    alliesPresent: [],
    itemsPresent: [],
    conditions: [],
  };
}

export function ultronRealm(): Realm {
  return {
    villain: 'ultron',
    locations: [ultronLocation(0), ultronLocation(1), ultronLocation(2), ultronLocation(3)],
    villainTokenAt: 0,
  };
}
