// Hela's realm — 4 locations from the printed board, transcribed from the
// Marvel Villainous Wiki Domain section.
//
// Wiki convention (per the Hela page): line 1 = Fate-side (covered); line 2
// = player-side (always usable). The engine's `topIcons` / `bottomIcons`
// arrays are the SWAPPED-from-wiki view (top = uncovered).

import type { ActionIcon, Location, Realm } from '../../types';

export const HELA_LOCATION_IDS = [
  'hela-loc-niflheim',
  'hela-loc-hel',
  'hela-loc-gjoll',
  'hela-loc-odins-vault',
] as const;

const HELA_LOCATION_ICONS: readonly { top: ActionIcon[]; bottom: ActionIcon[] }[] = [
  // Niflheim — wiki: line1 [Play] / line2 [Vanquish,Relocate,Fate]
  { top: ['vanquish', 'move', 'fate'], bottom: ['play'] },
  // Hel — wiki: line1 [Gain2,Vanquish] / line2 [Play,Discard]
  { top: ['play', 'discard'], bottom: ['gainPower2', 'vanquish'] },
  // Gjoll — wiki: line1 [Fate,Gain1] / line2 [Activate,Play]
  { top: ['activate', 'play'], bottom: ['fate', 'gainPower'] },
  // Odin's Vault — wiki: line1 [Discard,Play] / line2 [Play,Gain3]
  { top: ['play', 'gainPower3'], bottom: ['discard', 'play'] },
];

function helaLocation(idx: number): Location {
  const icons = HELA_LOCATION_ICONS[idx];
  return {
    id: HELA_LOCATION_IDS[idx] ?? `hela-loc-${idx}`,
    name: '',
    topIcons: [...(icons?.top ?? [])],
    bottomIcons: [...(icons?.bottom ?? [])],
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
