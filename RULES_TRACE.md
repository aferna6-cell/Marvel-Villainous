# RULES_TRACE

Maps implemented rules to the printed rulebook.

Primary source: the official Ravensburger Marvel Villainous: Infinite Power
instruction booklet
(`ravensburger.org/spielanleitungen/.../26844 anl 2155250.pdf`). Page numbers
below cite the booklet's printed pagination as parsed from the PDF.

## Structural rules & numeric defaults

| Rule                                          | Value / shape                       | Code location                                  | Rulebook citation               |
| ---------------------------------------------- | ------------------------------------ | ----------------------------------------------- | -------------------------------- |
| Locations per realm                            | exactly 4                            | `engine/types.ts` — `Realm.locations` 4-tuple   | Setup §2 / Game Overview         |
| Villain token occupies one location            | index 0–3                            | `engine/types.ts` — `Realm.villainTokenAt`      | Setup, Move Your Villain         |
| Game phase order                               | start → move → actions → fate → end  | `engine/types.ts` — `Phase`                     | On Your Turn                     |
| Players per game                               | 2–4 (engine permits 1 for solo M2)   | `engine/types.ts` — `PlayerId`, `playerOrder`   | Cover (2-4 Players)              |
| Default end-of-turn hand size                  | 4                                    | `engine/util.ts` — `DEFAULT_HAND_SIZE`          | Discard Cards: "draw back up to four cards" |
| Per-seat starting Power                        | 1st: 0, 2nd: 1, 3rd: 2, 4th: 2       | `engine/setup.ts` — `startingPower`             | Setup §6                         |
| Each villain deck size                         | 30 cards                             | _PLACEHOLDER (stubbed at 8) — pending Q14_      | Components: "5 Villain Decks (30 cards in each)" |
| Fate action: reveal                             | reveal **1** card from the shared deck | `engine/actions/fate.ts` — `FATE_REVEAL_COUNT`  | Fate Action: "Reveal **one** card from the top of the Fate deck" |
| Fate deck structure                             | single shared deck (Common + all villains' Fate decks shuffled together) | `engine/types.ts` — `GameState.fateDeck` / `fateDiscard` | Setup §3: "Shuffle together the Common Fate deck and the Fate decks from all Villains playing this game to create a single Fate deck" |
| Each villain Fate deck size                     | 11 cards                             | `engine/villains/thanos/fateDeck.ts` (11-row stub) | Components: "5 Villain Fate decks with 11 cards each" |
| Common Fate deck size                           | 15 cards (pending real card data)    | _PLACEHOLDER — see Q15_                          | Components: "1 Common Fate deck with 15 cards" |
| Starting hand                                  | 4 cards                              | `engine/setup.ts` — `STARTING_HAND_SIZE`        | Setup §6: "Draw a starting hand of four cards" |

## Legality rules enforced by `engine/validate.ts`

| Rule                                            | Code location                          | Rulebook citation               |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| Villain MUST move to a *different* location      | `validate.ts` — `moveVillain` case       | Move Your Villain: "may not stay in your previous location" |
| Icons may only be used at the villain's location | `validate.ts` — `useIcon` case           | Perform Actions                  |
| Bottom-row (Fate-side) icons covered by a hero   | `validate.ts` — `useIcon` case           | Blocking Actions                 |
| Each icon may be used once per turn              | `validate.ts` — `useIcon` case           | Perform Actions: "performed once for each icon that appears" |
| Cannot play a card you cannot pay for            | `validate.ts` — `playCard` case          | Play a Card                      |
| Every attacking ally must be at the hero's location | `validate.ts` — `attackHero` case     | Vanquish                         |
| Cannot Fate yourself                             | `validate.ts` — `fateOpponent` case      | Fate Action: "choose which player to target" (not self) |
| Drawing respects the hand-size limit             | `validate.ts` — `drawToHandSize` case    | Discard Cards (end of turn)      |
| Can only discard cards held in hand              | `validate.ts` — `discardCards` case      | Discard Cards                    |
| A pending prompt blocks all other actions        | `validate.ts` — top of `isLegal`         | Game flow                        |
| No actions once the game has a winner            | `validate.ts` — top of `isLegal`         | Game end                         |

## Combat (Vanquish)

| Rule                                            | Code location                          | Rulebook citation               |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| Vanquish requires summed ally strength ≥ hero    | `engine/actions/attack.ts` — `applyAttack` | Vanquish: "two of the Allies have a combined Strength of 5 (4+1)" |
| Spent allies are discarded with the defeated hero | `engine/actions/attack.ts` — `applyAttack` | Vanquish: "Discard the Hero and the two Allies" |
| Unspent allies remain at the location            | `engine/actions/attack.ts` — `applyAttack` | Vanquish: "The third Ally remains at the location" |

## Phase machine (CHUNK 4)

| Rule                                                   | Code location                                    | Rulebook citation               |
| ------------------------------------------------------- | ------------------------------------------------- | -------------------------------- |
| Phase order: start → move → actions → (fate) → end      | `engine/state.ts` — `phaseRegistry`, `autoAdvance` | On Your Turn                    |
| Start of turn fires triggers                            | `engine/phases/startOfTurn.ts` — `applyStartTurn` | (timing window)                  |
| Start of turn resets per-turn `usedIcons`               | `engine/phases/startOfTurn.ts` — `applyStartTurn` | Perform Actions (per turn)       |
| Start of turn resets `mustMoveDifferent` to `true`      | `engine/phases/startOfTurn.ts` — `applyStartTurn` | Move Your Villain                |
| Move + Actions are player-driven (no auto-advance)      | `engine/phases/mainPhase.ts` — `canAdvance` false | On Your Turn                     |
| Movement override: card effects may flip the flag       | `engine/types.ts` — `PlayerState.mustMoveDifferent`| (card-driven exceptions)        |
| Fate reveals exactly **1** card (rulebook divergence from the plan) | `engine/actions/fate.ts` — `FATE_REVEAL_COUNT = 1` | Fate Action: "Reveal one card from the top of the Fate deck" |
| Fate phase exits to End phase once the prompt resolves  | `engine/phases/fatePhase.ts` — `runAutomatic`     | On Your Turn                     |
| End of turn draws back up to the player's hand size     | `engine/phases/endOfTurn.ts` — `runAutomatic`     | On Your Turn (end)               |
| Per-player hand size override                           | `engine/types.ts` — `PlayerState.handSize`        | (villain-specific exceptions)    |
| Turn passes in `playerOrder`; turn++ on wrap            | `engine/phases/endOfTurn.ts` — `runAutomatic`     | On Your Turn                     |

## Thanos (CHUNK 5 — M2)

| Rule / data                                     | Code location                                | Rulebook citation               |
| ------------------------------------------------ | --------------------------------------------- | -------------------------------- |
| Thanos's 4 locations exist on the realm          | `villains/thanos/realm.ts` — `thanosRealm`    | Components                       |
| Confirmed location identifiers                   | Sanctuary II, Titan, The Infinity Well, Knowhere — encoded as ids | Components (board image) |
| Per-location icon set on Thanos's board          | `villains/thanos/realm.ts` — `THANOS_LOCATION_ICONS` (Sanctuary II + Titan confirmed; Infinity Well + Knowhere best-effort, see Q12) | Components (board image) |
| Per-icon Power amount (1/2/3)                    | `engine/actions/useIcon.ts` — gainPower / gainPower2 / gainPower3 | Gain Power: "Collect Power... equal to the number in the icon" |
| Thanos's starting Power (by seat)                | 0 / 1 / 2 / 2 (seat 1 / 2 / 3 / 4)            | Setup §6                         |
| Thanos's starting hand size                      | 4                                             | Setup §6                         |
| Thanos's deck size                               | _PLACEHOLDER (8 stub cards) — should be 30_    | Components                       |
| Per-villain realm factory wired to setup         | `villains/index.ts` — `villains[v].makeRealm` |                                  |
| Thanos-only New Game from the menu                | `app/routes.tsx` — `VillainPicker`            |                                  |

## Fate (CHUNK 6 — M3)

| Rule                                            | Code location                          | Rulebook citation               |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| Fate action reveals 1 card from the shared deck  | `engine/actions/fate.ts` — `applyFate`   | Fate Action                      |
| Fate target is chosen AFTER reveal               | `engine/actions/fate.ts` — `applyFate` + `resolveFatePlay` | Fate Action: "Reveal one card from the top of the Fate deck, **then** choose which player to target" |
| Targeted Fate cards have NO placement constraint | (no validation) | Fate Cards: "it's your choice" to play a Targeted card on a different villain |
| Events go to a single Global Event slot in the center play area | `engine/cards/effects.ts` — `resolveFatePlay` event branch | §I, §J: "Events are placed at the center of the playing area as a new and unique location" |
| Only one Global Event in play at a time          | `engine/cards/effects.ts` — `resolveFatePlay` event branch | §I: "If a Global Event is in play and you draw a new one from the Fate deck, place the newly drawn Global Event on the discard pile" |
| Cannot Fate yourself                             | `engine/validate.ts` — `fateOpponent` case | Fate Action (implicit: target an *opponent*) |
| Unplayable Fate cards are discarded with no effect | `engine/cards/effects.ts` — `resolveFatePlay` skip branch | Fate Action: "If you draw a Fate card and cannot play it for whatever reason, discard it with no effect" |
| Heroes from Fate land on the targeted opponent's realm | `engine/cards/effects.ts` — `resolveFatePlay` | Fate Cards section |
| Heroes cover bottom-row icons (rulebook: top of Domain) | `engine/validate.ts` — `useIcon` case   | Blocking Actions                 |
| Hero defeat sends the card to the SHARED Fate discard | `engine/actions/defeat.ts` — `defeatHero` | Vanquish + Setup §3              |
| Empty Fate deck reshuffles from the Fate discard | `engine/actions/fate.ts` — `applyFate`   | (deck-exhaust convention)        |
| Fate is triggered only via the Fate icon (no alternate trigger e.g. pay-to-Fate) | `engine/validate.ts` — `fateOpponent` case | Types of Actions — no alternate path listed |

## Engine mechanics

| Rule                                            | Code location                          | Rulebook citation               |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| Empty Villain deck reshuffles its discard pile   | `engine/cards/effects.ts` — `reshuffleDeck` | Draw Cards: "If you need to draw from your Villain deck when it is empty, shuffle your Villain discard pile to form a new deck" |
| Empty Fate deck reshuffles the Fate discard      | `engine/actions/fate.ts` — `applyFate`   | (deck-exhaust convention; parallel rule) |
| A pending prompt halts the auto-advance loop     | `engine/state.ts` — `autoAdvance`         |                                  |

## Not yet enforced (pending later milestones)

| Rule                                            | Reason / target milestone               |
| ------------------------------------------------ | ----------------------------------------- |
| Per-villain hand-size exceptions                 | needs rulebook — see RULES_QUESTIONS Q13   |
| Exact icon → action coupling                     | needs rulebook — see RULES_QUESTIONS Q2    |
| Power gained per `gainPower` icon                | PLACEHOLDER = 1 — see RULES_QUESTIONS Q1   |
| Turn-scoped strength-boost expiry                | needs rulebook — see RULES_QUESTIONS Q7    |
| Thanos's printed realm icons (full mapping)      | needs rulebook — see RULES_QUESTIONS Q12   |
| Thanos's full 30-card deck composition           | needs rulebook — see RULES_QUESTIONS Q14   |
