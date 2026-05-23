// Common Fate deck — 15 cards shared by every game (rulebook Setup §3:
// "Shuffle together the Common Fate deck and the Fate decks from all Villains
// playing this game to create a single Fate deck.").
//
// Composition (Marvel Villainous Wiki + per-card infoboxes):
//   11 Heroes — Iron Man (str 3); Black Widow (str 2); Nick Fury (str 2);
//               Hulk (str 5); Falcon (str 2); Hawkeye (str 2);
//               She-Hulk (str 4); Vision (str 4); Thor (str 5);
//               Captain Marvel (str 6); Captain America (str 3)
//   4 Events  — Avengers Assemble (str 10); Lockdown at the Raft (str 8);
//               Helicarrier Alert (str 6); Protected Vibranium (str 8)
//
// Per the project's §0 ground rules `name` and `text` stay blank in the
// repo — mechanical metadata only.

import type { CardDef } from '../../types';

export const commonFateDeck: CardDef[] = [
  // ----- 11 Heroes ---------------------------------------------------------
  { id: 'fate-common-iron-man',      villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 3, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-black-widow',   villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 2, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-nick-fury',     villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 2, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-hulk',          villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 5, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-falcon',        villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 2, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-hawkeye',       villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 2, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-she-hulk',      villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 4, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-vision',        villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 4, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-thor',          villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 5, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-captain-marvel',villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 6, effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-captain-america', villain: 'fate-common', name: '', type: 'hero', cost: 0, strength: 3, effects: [], tags: ['avenger'], icons: [] },

  // ----- 4 Events ----------------------------------------------------------
  // Event strength is the "difficulty" the active player(s) must overcome.
  { id: 'fate-common-avengers-assemble',   villain: 'fate-common', name: '', type: 'event', cost: 0, strength: 10, effects: [], tags: [], icons: [] },
  { id: 'fate-common-helicarrier-alert',   villain: 'fate-common', name: '', type: 'event', cost: 0, strength: 6,  effects: [], tags: [], icons: [] },
  { id: 'fate-common-lockdown-at-raft',    villain: 'fate-common', name: '', type: 'event', cost: 0, strength: 8,  effects: [], tags: [], icons: [] },
  { id: 'fate-common-protected-vibranium', villain: 'fate-common', name: '', type: 'event', cost: 0, strength: 8,  effects: [], tags: [], icons: [] },
];
