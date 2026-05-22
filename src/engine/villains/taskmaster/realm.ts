// Taskmaster's realm. CHUNK 6 fills in per-board icons.

import type { ActionIcon, Location, Realm } from '../../types';

const TOP_PLACEHOLDER: ActionIcon[] = ['gainPower', 'play'];
const BOTTOM_PLACEHOLDER: ActionIcon[] = ['move', 'fate'];

function taskmasterLocation(idx: number): Location {
  return {
    id: `taskmaster-loc-${idx}`,
    name: '',
    topIcons: [...TOP_PLACEHOLDER],
    bottomIcons: [...BOTTOM_PLACEHOLDER],
    heroesPresent: [],
    alliesPresent: [],
    itemsPresent: [],
    conditions: [],
  };
}

export function taskmasterRealm(): Realm {
  return {
    villain: 'taskmaster',
    locations: [
      taskmasterLocation(0),
      taskmasterLocation(1),
      taskmasterLocation(2),
      taskmasterLocation(3),
    ],
    villainTokenAt: 0,
  };
}
