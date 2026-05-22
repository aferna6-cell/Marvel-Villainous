// Killmonger's realm. CHUNK 6 fills in per-board icons.

import type { ActionIcon, Location, Realm } from '../../types';

const TOP_PLACEHOLDER: ActionIcon[] = ['gainPower', 'play'];
const BOTTOM_PLACEHOLDER: ActionIcon[] = ['move', 'fate'];

function killmongerLocation(idx: number): Location {
  return {
    id: `killmonger-loc-${idx}`,
    name: '',
    topIcons: [...TOP_PLACEHOLDER],
    bottomIcons: [...BOTTOM_PLACEHOLDER],
    heroesPresent: [],
    alliesPresent: [],
    itemsPresent: [],
    conditions: [],
  };
}

export function killmongerRealm(): Realm {
  return {
    villain: 'killmonger',
    locations: [
      killmongerLocation(0),
      killmongerLocation(1),
      killmongerLocation(2),
      killmongerLocation(3),
    ],
    villainTokenAt: 0,
  };
}
