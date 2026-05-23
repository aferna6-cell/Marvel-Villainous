// Taskmaster's realm — 4 locations from the printed board, transcribed from
// the Marvel Villainous Wiki Domain section.
//
// Wiki convention: line 1 = Fate-side (covered); line 2 = player-side
// (always usable). Engine `topIcons` are uncovered, `bottomIcons` covered.

import type { ActionIcon, Location, Realm } from '../../types';

export const TASKMASTER_LOCATION_IDS = [
  'taskmaster-loc-solomon-institute',
  'taskmaster-loc-training-room',
  'taskmaster-loc-armory',
  'taskmaster-loc-camp-hammond',
] as const;

const TASKMASTER_LOCATION_ICONS: readonly { top: ActionIcon[]; bottom: ActionIcon[] }[] = [
  // Solomon Institute — wiki: line1 [Play,Gain2] / line2 [Activate,Relocate]
  { top: ['activate', 'move'], bottom: ['play', 'gainPower2'] },
  // Training Room — wiki: line1 [Discard,Play] / line2 [Play,Gain3]
  { top: ['play', 'gainPower3'], bottom: ['discard', 'play'] },
  // Armory — wiki: line1 [Gain1,Fate] / line2 [Play,Vanquish]
  { top: ['play', 'vanquish'], bottom: ['gainPower', 'fate'] },
  // Camp Hammond — wiki: line1 [Play,Activate] / line2 [Discard,Fate]
  { top: ['discard', 'fate'], bottom: ['play', 'activate'] },
];

function taskmasterLocation(idx: number): Location {
  const icons = TASKMASTER_LOCATION_ICONS[idx];
  return {
    id: TASKMASTER_LOCATION_IDS[idx] ?? `taskmaster-loc-${idx}`,
    name: '',
    topIcons: [...(icons?.top ?? [])],
    bottomIcons: [...(icons?.bottom ?? [])],
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
