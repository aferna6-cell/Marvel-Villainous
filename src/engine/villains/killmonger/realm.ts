// Killmonger's realm — 4 locations from the printed board, transcribed from
// the Marvel Villainous Wiki Domain section.
//
// Wiki convention: line 1 = Fate-side (covered); line 2 = player-side
// (always usable). Engine `topIcons` are uncovered, `bottomIcons` covered.

import type { ActionIcon, Location, Realm } from '../../types';

export const KILLMONGER_LOCATION_IDS = [
  'killmonger-loc-warrior-falls',
  'killmonger-loc-institute',
  'killmonger-loc-great-mound',
  'killmonger-loc-golden-city',
] as const;

const KILLMONGER_LOCATION_ICONS: readonly { top: ActionIcon[]; bottom: ActionIcon[] }[] = [
  // Warrior Falls — wiki: line1 [Relocate,Fate] / line2 [Play,Vanquish]
  { top: ['play', 'vanquish'], bottom: ['move', 'fate'] },
  // Institute of Technology — wiki: line1 [Play,Discard] / line2 [Play,Gain3]
  { top: ['play', 'gainPower3'], bottom: ['play', 'discard'] },
  // The Great Mound — wiki: line1 [Gain1,Play] / line2 [Activate,Discard]
  { top: ['activate', 'discard'], bottom: ['gainPower', 'play'] },
  // The Golden City — wiki: line1 [Activate,Play] / line2 [Gain2,Fate]
  { top: ['gainPower2', 'fate'], bottom: ['activate', 'play'] },
];

function killmongerLocation(idx: number): Location {
  const icons = KILLMONGER_LOCATION_ICONS[idx];
  return {
    id: KILLMONGER_LOCATION_IDS[idx] ?? `killmonger-loc-${idx}`,
    name: '',
    topIcons: [...(icons?.top ?? [])],
    bottomIcons: [...(icons?.bottom ?? [])],
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
