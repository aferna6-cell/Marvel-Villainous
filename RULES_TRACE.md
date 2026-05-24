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
| Fate stays in the Actions phase (Q10 — players can take actions in any order; Fate is just another action) | `engine/actions/fate.ts` — `applyFate` (no phase change) | On Your Turn / Types of Actions |
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
| Thanos's deck size                               | 30 cards (10 Allies + 16 Effects + 4 Items)   | `villains/thanos/deck.ts` — Components + per-card wiki infoboxes |
| Thanos's Fate-deck composition                   | 11 cards (4 Heroes + 6 Effects + 1 Event)     | `villains/thanos/fateDeck.ts` — per-card wiki infoboxes |
| Hela's deck size                                 | 30 cards (11 Allies + 14 Effects + 2 Items + 3 Specialties) | `villains/hela/deck.ts` — wiki infoboxes |
| Hela's Fate-deck composition                     | 11 cards (5 Heroes + 4 Effects + 1 Event + 1 Item) | `villains/hela/fateDeck.ts` |
| Killmonger's deck size                           | 30 cards (7 Allies + 9 Effects + 10 Items + 4 Specialties) | `villains/killmonger/deck.ts` |
| Killmonger's Fate-deck composition               | 11 cards (8 Heroes + 2 Effects + 1 Event)     | `villains/killmonger/fateDeck.ts` |
| Ultron's deck size                               | 30 cards (13 Allies + 11 Effects + 6 Items)   | `villains/ultron/deck.ts` |
| Ultron's Fate-deck composition                   | 11 cards (5 Heroes + 3 Effects + 2 Items + 1 Event) | `villains/ultron/fateDeck.ts` |
| Taskmaster's deck size                           | 30 cards (10 Allies + 10 Effects + 8 Items + 2 Specialties) | `villains/taskmaster/deck.ts` |
| Taskmaster's Fate-deck composition               | 11 cards (6 Heroes + 4 Effects + 1 Event)     | `villains/taskmaster/fateDeck.ts` |
| Common Fate deck composition                     | 15 cards (11 Heroes + 4 Events)               | `villains/common/fateDeck.ts` — per-card wiki infoboxes |
| Per-board icon layout (all 5 villains)           | wiki Domain section per villain               | `villains/<v>/realm.ts` |
| Specialty cards (right side of Domain)           | new `'specialty'` CardType                    | `engine/types.ts` — rulebook §J |
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

## Victory conditions (per-villain auto-detect)

| Rule                                            | Code location                          | Rulebook citation               |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| Thanos wins by collecting 6 Infinity Stones      | `engine/actions/objective.ts` — `checkWin` thanos branch | Thanos Objective |
| Hela wins at 8 Allies+Soul Marks at Odin's Vault | `engine/actions/objective.ts` — `checkWin` hela branch   | Hela Objective   |
| Killmonger wins by completing his boss sequence  | `engine/actions/objective.ts` — `checkWin` killmonger branch | Killmonger Objective |
| Taskmaster wins by completing 4 contracts        | `engine/actions/objective.ts` — `checkWin` taskmaster branch | Taskmaster Objective |
| Ultron wins at 4 upgrades + finalForm flag       | `engine/actions/objective.ts` — `checkWin` ultron branch | Ultron Objective |
| `claimVictory` action lets a player ratify a win | `engine/actions/claim.ts` — `applyClaimVictory` | (escape hatch) |
| `setObjectiveCount` action tallies progress      | `engine/actions/objective.ts` — `applySetObjectiveCount` | (player-tally) |

## AI advisor (plan §8 stub)

| Rule                                            | Code location                          | Notes                            |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| `suggestMove` returns a heuristic recommendation | `engine/advisor/index.ts`              | minimal version; full enumeration + scoring per plan §8 is future work |
| Advisor only suggests for the active player      | `engine/advisor/index.ts`              | per plan §8 — opt-in, every turn |
| Every suggested action is checked against `isLegal` | `engine/advisor/index.ts`           | faithfulness guarantee per plan §8.5 |

## Engine mechanics

| Rule                                            | Code location                          | Rulebook citation               |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| Empty Villain deck reshuffles its discard pile   | `engine/cards/effects.ts` — `reshuffleDeck` | Draw Cards: "If you need to draw from your Villain deck when it is empty, shuffle your Villain discard pile to form a new deck" |
| Empty Fate deck reshuffles the Fate discard      | `engine/actions/fate.ts` — `applyFate`   | (deck-exhaust convention; parallel rule) |
| A pending prompt halts the auto-advance loop     | `engine/state.ts` — `autoAdvance`         |                                  |

## Per-villain mechanical handlers (M4–M6)

| Rule                                            | Code location                          | Rulebook citation               |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| Thanos: `placeStone` bumps `stones`, records the named stone in `flags.stones` | `villains/thanos/specific.ts` | Thanos Objective (Infinity Stones) |
| Thanos: `snap` sets winner iff 6 stones collected | `villains/thanos/specific.ts` | Thanos Objective (the Snap) |
| Hela: `placeSoulMark` bumps `asgard`             | `villains/hela/specific.ts` | Hela Objective (Soul Marks at Odin's Vault) |
| Hela: `controlAsgard` sets winner iff asgard >= 8 | `villains/hela/specific.ts` | Hela Objective |
| Killmonger: `defeatBoss` bumps `bosses`          | `villains/killmonger/specific.ts` | Killmonger Objective |
| Killmonger: `claimWakanda` sets winner iff 4 bosses defeated | `villains/killmonger/specific.ts` | Killmonger Objective |
| Taskmaster: `completeContract` bumps `contracts`, records the id | `villains/taskmaster/specific.ts` | Taskmaster Objective (contracts) |
| Ultron: `installUpgrade` bumps `upgrades`, records the slot | `villains/ultron/specific.ts` | Ultron Objective (tech track) |
| Ultron: `markFinalForm` sets the `finalForm` flag | `villains/ultron/specific.ts` | Ultron Objective (final form) |
| Targeted Event placement constraint              | `engine/cards/effects.ts` — `resolveFatePlay` event branch (checks `def.targetedVillain`) | §I: Targeted Events must be played on the indicated villain |

## Engine escape hatches (hotseat ergonomics)

| Rule                                            | Code location                          | Why                              |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| `removeFromPlay` removes a single in-play card from any zone → appropriate discard pile | `engine/actions/removeFromPlay.ts` | Resolves "defeat X" / "discard this Ally" effects the engine doesn't auto-apply (§0) |
| `undo` rewinds the engine one action (bounded 12-deep snapshot ring) | `engine/state.ts` — `pushHistory` + early-return on `undo` | Misclick recovery for hotseat (stretch goal §12) |
| `adjustPower` ticks the named player's power ±n, floored at 0 | `engine/actions/manual.ts` — `applyAdjustPower` | Resolves "gain N Power" / "lose N Power" card text |
| `drawCards` lets any player draw N cards out of phase | `engine/actions/manual.ts` — `applyDrawCards` | Resolves "draw N cards" card text mid-turn |

## Q-resolved rule clarifications (most recent batch)

| Rule                                            | Code location                          | RULES_QUESTIONS link              |
| ------------------------------------------------ | ---------------------------------------- | ---------------------------------- |
| Hand size is a uniform 4 for every villain       | `engine/util.ts` — `DEFAULT_HAND_SIZE = 4` | Q8                                  |
| Strength boosts are permanent unless the card text limits them | `engine/cards/effects.ts` — `boostStrength` permanent default | Q7 |
| Allies / Items / Conditions / Events may be played to any location in the active player's realm | `engine/actions/playCard.ts` (target.location), `ui/components/Location.tsx` drop on any location | Q5 |
| Player who Fated picks the placement location for a Fate hero/condition | `engine/cards/effects.ts` — `fatePlaceLocation` continuation; `ui/components/FatePanel.tsx` step 2 | Q9 |
| Fate is an action in the Actions phase, not a phase change | `engine/actions/fate.ts` — `applyFate` (no phase mutation) | Q10 |
| Opt-in strict icon enforcement: gated actions require + consume a matching icon at the active player's current location | `engine/actions/strict.ts`, `engine/validate.ts`, `engine/state.ts`; UI toggle in `ui/components/TurnControls.tsx` | Q2 / Q11 / Q3 / Q4 |
| Mad Titan-style dynamic cost: card has `cost: 0` and a `villainSpecific` effect deducts the actual Power at play time | `engine/cards/cards/thanos/madTitan.ts` (stub) — handler arrives with CHUNK 7+ | Q19 |

## Not yet enforced (pending later milestones)

| Rule                                            | Reason / target milestone               |
| ------------------------------------------------ | ----------------------------------------- |
| Per-card behavior wiring for ability text not expressible as a §2.3 primitive | CHUNK 7+ (`villainSpecific` handlers) |
| Targeted Events: must play on the indicated villain | needs `targetedVillain` metadata on Event cards — pending real Event data |
