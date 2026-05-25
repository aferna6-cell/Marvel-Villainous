// Common Fate deck — 15 cards (authoritative card data from the user's
// spreadsheet).
//
// Per rulebook Setup §3: shuffled together with each participating
// Villain's Fate deck into the single shared Fate deck.
//
// Composition:
//   11 Heroes — Iron Man (3); Black Widow (2); Nick Fury (2); Hulk (5);
//               Falcon (2); Hawkeye (2); She-Hulk (4); Vision (4);
//               Thor (5); Captain Marvel (6); Captain America (3)
//   4 Events  — Protected Vibranium (8); Lockdown at the Raft (8);
//               Helicarrier Alert (6); Avengers Assemble (10)

import type { CardDef } from '../../types';

export const commonFateDeck: CardDef[] = [
  // ----- 11 Heroes ---------------------------------------------------------
  {
    id: 'fate-common-iron-man',
    villain: 'fate-common', name: 'Iron Man', type: 'hero', cost: 0, strength: 3,
    text: "If IRON MAN is in your Domain, whenever you perform an activate action, you must pay 1 Power in addition to the Activated Ability's cost.",
    effects: [{ op: 'villainSpecific', key: 'fate.common.ironMan', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-black-widow',
    villain: 'fate-common', name: 'Black Widow', type: 'hero', cost: 0, strength: 2,
    text: 'When BLACK WIDOW is played, you may defeat an Ally at her location.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.blackWidow', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-nick-fury',
    villain: 'fate-common', name: 'Nick Fury', type: 'hero', cost: 0, strength: 2,
    text: 'When NICK FURY is played, the targeted player loses half of their Power rounded up.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.nickFury', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-hulk',
    villain: 'fate-common', name: 'Hulk', type: 'hero', cost: 0, strength: 5,
    text: "When HULK is defeated, instead of discarding him, place a +1 Strength token on him and relocate him to another player's Domain. Nothing can be attached to the HULK.",
    effects: [{ op: 'villainSpecific', key: 'fate.common.hulk', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-falcon',
    villain: 'fate-common', name: 'Falcon', type: 'hero', cost: 0, strength: 2,
    text: 'When FALCON is played, you may relocate a Hero with a Strength of 3 or less from any Domain to his location.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.falcon', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-hawkeye',
    villain: 'fate-common', name: 'Hawkeye', type: 'hero', cost: 0, strength: 2,
    text: "When HAWKEYE is played, you may defeat one of the targeted player's Allies at an Event.",
    effects: [{ op: 'villainSpecific', key: 'fate.common.hawkeye', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-she-hulk',
    villain: 'fate-common', name: 'She-Hulk', type: 'hero', cost: 0, strength: 4,
    text: 'If SHE-HULK is in your Domain, you cannot relocate or play to Events.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.sheHulk', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-vision',
    villain: 'fate-common', name: 'Vision', type: 'hero', cost: 0, strength: 4,
    text: 'If VISION is in your Domain, whenever you gain Power, you gain 1 less Power.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.vision', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-thor',
    villain: 'fate-common', name: 'Thor', type: 'hero', cost: 0, strength: 5,
    text: 'PROTECTOR.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.thor.protector', payload: null }],
    tags: ['avenger', 'asgard', 'protector'], icons: [],
  },
  {
    id: 'fate-common-captain-marvel',
    villain: 'fate-common', name: 'Captain Marvel', type: 'hero', cost: 0, strength: 6,
    text: "When CAPTAIN MARVEL is played, relocate all Allies in the targeted player's Domain to her location.",
    effects: [{ op: 'villainSpecific', key: 'fate.common.captainMarvel', payload: null }],
    tags: ['avenger'], icons: [],
  },
  {
    id: 'fate-common-captain-america',
    villain: 'fate-common', name: 'Captain America', type: 'hero', cost: 0, strength: 3,
    text: "When CAPTAIN AMERICA is played, place a +1 Strength token on CAPTAIN AMERICA and each other Hero in the targeted player's Domain.",
    effects: [{ op: 'villainSpecific', key: 'fate.common.captainAmerica', payload: null }],
    tags: ['avenger'], icons: [],
  },

  // ----- 4 Events ----------------------------------------------------------
  {
    id: 'fate-common-protected-vibranium',
    villain: 'fate-common', name: 'Protected Vibranium', type: 'event', cost: 0, strength: 8,
    text: 'When you play an Item, pay 1 additional Power. Reward: You may find any Item from your deck or discard pile and put it into your hand.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.protectedVibranium', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'fate-common-lockdown-at-raft',
    villain: 'fate-common', name: 'Lockdown at the Raft', type: 'event', cost: 0, strength: 8,
    text: 'When you play an Ally, pay 1 additional Power. Reward: You may find any Ally from your deck or discard pile and put it into your hand.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.lockdown', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'fate-common-helicarrier-alert',
    villain: 'fate-common', name: 'Helicarrier Alert', type: 'event', cost: 0, strength: 6,
    text: 'Only draw up to 3 cards at the end of your turn. Reward: Draw 3 cards.',
    effects: [{ op: 'villainSpecific', key: 'fate.common.helicarrier', payload: null }],
    tags: [], icons: [],
  },
  {
    id: 'fate-common-avengers-assemble',
    villain: 'fate-common', name: 'Avengers Assemble', type: 'event', cost: 0, strength: 10,
    text: "When this Event is revealed, the current Villain must draw a card from the Fate deck and play it on themselves. At the start of each Villain's turn, they draw a Fate card and play it on themselves. Reward: Defeat all Heroes in your Domain.",
    effects: [{ op: 'villainSpecific', key: 'fate.common.avengersAssemble', payload: null }],
    tags: [], icons: [],
  },
];
