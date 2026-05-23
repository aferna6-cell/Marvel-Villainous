// Ultron's realm — 4 locations from the printed board, transcribed from the
// Marvel Villainous Wiki Domain section.
//
// Wiki convention: line 1 = Fate-side (covered); line 2 = player-side
// (always usable). Engine `topIcons` are uncovered, `bottomIcons` covered.

import type { ActionIcon, Location, Realm } from '../../types';

export const ULTRON_LOCATION_IDS = [
  'ultron-loc-research-lab',
  'ultron-loc-manufacturing-array',
  'ultron-loc-reconfiguration-base',
  'ultron-loc-stark-industries',
] as const;

const ULTRON_LOCATION_ICONS: readonly { top: ActionIcon[]; bottom: ActionIcon[] }[] = [
  // Research Lab — wiki: line1 [Relocate,Gain1] / line2 [Fate,Play]
  { top: ['fate', 'play'], bottom: ['move', 'gainPower'] },
  // Manufacturing Array — wiki: line1 [Play,Fate] / line2 [Gain3,Activate]
  { top: ['gainPower3', 'activate'], bottom: ['play', 'fate'] },
  // Reconfiguration Base — wiki: line1 [Play,Gain2] / line2 [Discard,Vanquish]
  { top: ['discard', 'vanquish'], bottom: ['play', 'gainPower2'] },
  // Stark Industries Industrial Complex — wiki: line1 [Discard,Play] / line2 [Play,Gain1]
  { top: ['play', 'gainPower'], bottom: ['discard', 'play'] },
];

function ultronLocation(idx: number): Location {
  const icons = ULTRON_LOCATION_ICONS[idx];
  return {
    id: ULTRON_LOCATION_IDS[idx] ?? `ultron-loc-${idx}`,
    name: '',
    topIcons: [...(icons?.top ?? [])],
    bottomIcons: [...(icons?.bottom ?? [])],
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
