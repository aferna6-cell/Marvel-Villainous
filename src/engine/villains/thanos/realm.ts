// Thanos's realm — 4 locations from the printed board, transcribed from the
// Marvel Villainous Wiki Domain section. Convention: wiki line 1 = Fate-side
// (covered by heroes); wiki line 2 = player-side (always usable). In our
// engine `topIcons` are always-usable and `bottomIcons` are covered, so the
// arrays below are SWAPPED from the wiki's visual order.
//
// `name` stays '' in the repo per §0.

import type { ActionIcon, Location, Realm } from '../../types';

export const THANOS_LOCATION_IDS = [
  'thanos-loc-sanctuary-ii',
  'thanos-loc-titan',
  'thanos-loc-infinity-well',
  'thanos-loc-knowhere',
] as const;

/** Icon layouts per location. `top` = always usable; `bottom` = covered. */
const THANOS_LOCATION_ICONS: readonly { top: ActionIcon[]; bottom: ActionIcon[] }[] = [
  // Sanctuary II — wiki: line1 [Gain2,Activate] / line2 [Play,Discard]
  { top: ['play', 'discard'], bottom: ['gainPower2', 'activate'] },
  // Titan — wiki: line1 [Play,Fate] / line2 [Gain1,Relocate]
  { top: ['gainPower', 'move'], bottom: ['play', 'fate'] },
  // The Infinity Well — wiki: line1 [Play,Discard] / line2 [Play,Gain3]
  { top: ['play', 'gainPower3'], bottom: ['play', 'discard'] },
  // Knowhere — wiki: line1 [Relocate] / line2 [Fate,Play,Vanquish]
  { top: ['fate', 'play', 'vanquish'], bottom: ['move'] },
];

function thanosLocation(idx: number): Location {
  const icons = THANOS_LOCATION_ICONS[idx];
  return {
    id: THANOS_LOCATION_IDS[idx] ?? `thanos-loc-${idx}`,
    name: '',
    topIcons: [...(icons?.top ?? [])],
    bottomIcons: [...(icons?.bottom ?? [])],
    heroesPresent: [],
    alliesPresent: [],
    itemsPresent: [],
    conditions: [],
  };
}

export function thanosRealm(): Realm {
  return {
    villain: 'thanos',
    locations: [thanosLocation(0), thanosLocation(1), thanosLocation(2), thanosLocation(3)],
    villainTokenAt: 0,
  };
}
