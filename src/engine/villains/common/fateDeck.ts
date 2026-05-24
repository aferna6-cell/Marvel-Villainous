// Common Fate deck — 15 cards shared by every game (rulebook Setup §3:
// "Shuffle together the Common Fate deck and the Fate decks from all Villains
// playing this game to create a single Fate deck.").
//
// Composition:
//   11 Heroes — Iron Man (3); Black Widow (2); Nick Fury (2); Hulk (5);
//               Falcon (2); Hawkeye (2); She-Hulk (4); Vision (4);
//               Thor (5); Captain Marvel (6); Captain America (3)
//   4 Events  — Avengers Assemble (10); Lockdown at the Raft (8);
//               Helicarrier Alert (6); Protected Vibranium (8)

import type { CardDef } from '../../types';

export const commonFateDeck: CardDef[] = [
  // ----- 11 Heroes ---------------------------------------------------------
  { id: 'fate-common-iron-man',      villain: 'fate-common', name: 'Iron Man', type: 'hero', cost: 0, strength: 3,
    text: 'Tony Stark in the Iron Man armor.',
    effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-black-widow',   villain: 'fate-common', name: 'Black Widow', type: 'hero', cost: 0, strength: 2,
    text: 'When BLACK WIDOW is played, the villain discards 1 card.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.blackWidow.discard', payload: null }],
    tags: ['avenger'], icons: [] },
  { id: 'fate-common-nick-fury',     villain: 'fate-common', name: 'Nick Fury', type: 'hero', cost: 0, strength: 2,
    text: 'When NICK FURY is played, the Fate-playing player draws 2 Fate cards and plays one.',
    effects: [{ op: 'lookAtFate', n: 2, choose: 1 }],
    tags: ['avenger'], icons: [] },
  { id: 'fate-common-hulk',          villain: 'fate-common', name: 'Hulk', type: 'hero', cost: 0, strength: 5,
    text: 'When HULK is defeated, the Hulk player rolls 1d6; on 4+ Hulk is moved instead of defeated.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.hulk.tenacious', payload: null }],
    tags: ['avenger'], icons: [] },
  { id: 'fate-common-falcon',        villain: 'fate-common', name: 'Falcon', type: 'hero', cost: 0, strength: 2,
    text: 'FALCON may be relocated to any location by Fate effects.',
    effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-hawkeye',       villain: 'fate-common', name: 'Hawkeye', type: 'hero', cost: 0, strength: 2,
    text: 'HAWKEYE covers the Fate icon at his location.',
    effects: [], tags: ['avenger'], icons: ['fate'] },
  { id: 'fate-common-she-hulk',      villain: 'fate-common', name: 'She-Hulk', type: 'hero', cost: 0, strength: 4,
    text: 'SHE-HULK gains +1 Strength while another Avenger Hero is in the same Domain.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.sheHulk.teamBoost', payload: null }],
    tags: ['avenger'], icons: [] },
  { id: 'fate-common-vision',        villain: 'fate-common', name: 'Vision', type: 'hero', cost: 0, strength: 4,
    text: 'VISION cannot be moved by any Villain card effect.',
    effects: [], tags: ['avenger'], icons: [] },
  { id: 'fate-common-thor',          villain: 'fate-common', name: 'Thor', type: 'hero', cost: 0, strength: 5,
    text: 'When THOR is played, the villain loses 2 Power.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.thor.zap', payload: null }],
    tags: ['avenger', 'asgard'], icons: [] },
  { id: 'fate-common-captain-marvel',villain: 'fate-common', name: 'Captain Marvel', type: 'hero', cost: 0, strength: 6,
    text: 'CAPTAIN MARVEL requires at least 3 Allies to Vanquish.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.captainMarvel.minAllies', payload: { min: 3 } }],
    tags: ['avenger'], icons: [] },
  { id: 'fate-common-captain-america', villain: 'fate-common', name: 'Captain America', type: 'hero', cost: 0, strength: 3,
    text: 'When CAPTAIN AMERICA is played, the villain discards 1 Item.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.captainAmerica.discardItem', payload: null }],
    tags: ['avenger'], icons: [] },

  // ----- 4 Events ----------------------------------------------------------
  { id: 'fate-common-avengers-assemble',   villain: 'fate-common', name: 'Avengers Assemble', type: 'event', cost: 0, strength: 10,
    text: 'All Avenger Heroes in the target Domain gain +1 Strength.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.avengersAssemble', payload: null }],
    tags: [], icons: [] },
  { id: 'fate-common-helicarrier-alert',   villain: 'fate-common', name: 'Helicarrier Alert', type: 'event', cost: 0, strength: 6,
    text: 'Reveal the top 2 cards of the Fate deck and play one without effect.',
    effects: [{ op: 'lookAtFate', n: 2, choose: 1 }],
    tags: [], icons: [] },
  { id: 'fate-common-lockdown-at-raft',    villain: 'fate-common', name: 'Lockdown at the Raft', type: 'event', cost: 0, strength: 8,
    text: 'While in play, the villain may not play Allies tagged "merc".',
    effects: [{ op: 'villainSpecific', key: 'fate.common.lockdown', payload: null }],
    tags: [], icons: [] },
  { id: 'fate-common-protected-vibranium', villain: 'fate-common', name: 'Protected Vibranium', type: 'event', cost: 0, strength: 8,
    text: 'While in play, Items in the target Domain cannot be played for free.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.protectedVibranium', payload: null }],
    tags: [], icons: [] },
];
