// Thanos's realm: 4 locations on his printed board.
//
// Rulebook (Ravensburger Marvel Villainous: Infinite Power) confirms Thanos's
// four locations in left-to-right order: Sanctuary II, Titan, The Infinity
// Well, Knowhere. Per the project's §0 ground rules the `name` field stays
// empty in the repo; the location is identified by its id only.
//
// The icon sets per location were transcribed by inspecting the high-res
// components page of the rulebook PDF. Convention: in the engine's
// `Location` model `topIcons` are the always-usable (player-side) icons and
// `bottomIcons` are the Fate-side icons covered by an opposing hero
// (rulebook: "to the top of your Domain"). The components diagram is
// oriented with the player-side at the visual bottom of each location card
// and the Fate-side at the visual top, so the engine's `bottomIcons` array
// corresponds to the visually-top icons in the rulebook image.
//
// Confidence note: Sanctuary II and Titan icons are read clearly from the
// rulebook image. The Infinity Well and Knowhere icon assignments are a
// best-effort interpretation pending physical-board confirmation
// (RULES_QUESTIONS.md Q12).

import type { ActionIcon, Location, Realm } from '../../types';

/** Stable per-Thanos-location ids matching the rulebook left→right order. */
export const THANOS_LOCATION_IDS = [
  'thanos-loc-sanctuary-ii',
  'thanos-loc-titan',
  'thanos-loc-infinity-well',
  'thanos-loc-knowhere',
] as const;

/**
 * Icon layout per location, transcribed from the printed components diagram.
 * `top` = always usable (player-side); `bottom` = Fate-side (covered by heroes).
 */
const THANOS_LOCATION_ICONS: readonly { top: ActionIcon[]; bottom: ActionIcon[] }[] = [
  // 0 — Sanctuary II (CONFIRMED from rulebook image)
  { top: ['discard', 'move'], bottom: ['gainPower2', 'play'] },
  // 1 — Titan (CONFIRMED from rulebook image)
  { top: ['gainPower', 'move'], bottom: ['discard', 'vanquish'] },
  // 2 — The Infinity Well (BEST-EFFORT — pending Q12 physical confirmation)
  { top: ['play', 'gainPower3'], bottom: ['discard', 'move'] },
  // 3 — Knowhere (BEST-EFFORT — the printed board appears to use a 1+3
  // arrangement rather than 2+2; pending Q12 physical confirmation)
  { top: ['vanquish', 'discard', 'move'], bottom: ['move'] },
];

function thanosLocation(idx: number): Location {
  const icons = THANOS_LOCATION_ICONS[idx];
  return {
    id: THANOS_LOCATION_IDS[idx] ?? `thanos-loc-${idx}`,
    name: '', // user fills from the physical board — see assets/CONTENT_TODO.md
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
