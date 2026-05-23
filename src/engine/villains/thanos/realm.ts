// Thanos's realm: 4 locations on his printed board.
//
// Rulebook (Ravensburger Marvel Villainous: Infinite Power) confirms Thanos's
// four locations in left-to-right order: Sanctuary II, Titan, The Infinity
// Well, Knowhere. Per the project's §0 ground rules the `name` field stays
// empty in the repo; the location is identified by its id only.
//
// The exact icon set in each location's top/bottom row is the remaining
// blocker — see RULES_QUESTIONS.md Q12. Until we have a clean transcription
// the icon arrays use the generic placeholder set from CHUNK 4.

import type { ActionIcon, Location, Realm } from '../../types';

/** PLACEHOLDER top-row (always-usable, player-side) icons — pending Q12. */
const TOP_PLACEHOLDER: ActionIcon[] = ['gainPower', 'play'];
/** PLACEHOLDER bottom-row (Fate-side, covered by heroes) icons — pending Q12. */
const BOTTOM_PLACEHOLDER: ActionIcon[] = ['move', 'fate'];

/** Stable per-Thanos-location ids matching the rulebook left→right order. */
export const THANOS_LOCATION_IDS = [
  'thanos-loc-sanctuary-ii',
  'thanos-loc-titan',
  'thanos-loc-infinity-well',
  'thanos-loc-knowhere',
] as const;

function thanosLocation(idx: number): Location {
  return {
    id: THANOS_LOCATION_IDS[idx] ?? `thanos-loc-${idx}`,
    name: '', // user fills from the physical board — see assets/CONTENT_TODO.md
    topIcons: [...TOP_PLACEHOLDER],
    bottomIcons: [...BOTTOM_PLACEHOLDER],
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
