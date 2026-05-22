// Thanos's realm: 4 locations on his printed board
// (marvel-villainous-plan.md §5.1).
//
// The icon set per location depends on the printed board, which the assistant
// cannot reproduce without the user's rulebook. See RULES_QUESTIONS.md Q12.
// Until Q12 is answered the placeholder uses the generic `gainPower / play`
// top row and `move / fate` bottom row from CHUNK 4's stub setup.

import type { ActionIcon, Location, Realm } from '../../types';

/** PLACEHOLDER top-row icons (Q12). */
const TOP_PLACEHOLDER: ActionIcon[] = ['gainPower', 'play'];
/** PLACEHOLDER bottom-row icons (Q12). */
const BOTTOM_PLACEHOLDER: ActionIcon[] = ['move', 'fate'];

function thanosLocation(idx: number): Location {
  return {
    id: `thanos-loc-${idx}`,
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
