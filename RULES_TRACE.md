# RULES_TRACE

Maps implemented rules to the printed rulebook.

Each entry should cite the rulebook section/page it came from so a reviewer can
verify the code matches the book. The **Rulebook §** and **Page** columns are
left blank for the user to fill in from their own physical copy.

## Structural rules & numeric defaults

| Rule                                          | Value / shape                       | Code location                                  | Rulebook § | Page |
| ---------------------------------------------- | ------------------------------------ | ----------------------------------------------- | ---------- | ---- |
| Locations per realm                            | exactly 4                            | `engine/types.ts` — `Realm.locations` 4-tuple   |            |      |
| Villain token occupies one location            | index 0–3                            | `engine/types.ts` — `Realm.villainTokenAt`      |            |      |
| Game phase order                               | start → move → actions → fate → end  | `engine/types.ts` — `Phase`                     |            |      |
| Players per game                                | 2–4                                  | `engine/types.ts` — `PlayerId`, `playerOrder`   |            |      |
| Default end-of-turn hand size                   | 4 (villain exceptions pending)       | `engine/util.ts` — `DEFAULT_HAND_SIZE`          |            |      |
| Fate action: reveal / play / discard            | reveal 2, play 1, discard 1          | `engine/actions/fate.ts` — `FATE_REVEAL_COUNT`  |            |      |

## Legality rules enforced by `engine/validate.ts` (CHUNK 3)

| Rule                                            | Code location                          | Rulebook § | Page |
| ------------------------------------------------ | ---------------------------------------- | ---------- | ---- |
| Villain must move to a *different* location      | `validate.ts` — `moveVillain` case       |            |      |
| Icons may only be used at the villain's location | `validate.ts` — `useIcon` case           |            |      |
| Bottom-row icons covered by a hero are unusable  | `validate.ts` — `useIcon` case           |            |      |
| Each icon may be used once per turn              | `validate.ts` — `useIcon` case           |            |      |
| Cannot play a card you cannot pay for            | `validate.ts` — `playCard` case          |            |      |
| An ally may only attack a hero at its location   | `validate.ts` — `attackHero` case        |            |      |
| Cannot Fate yourself                             | `validate.ts` — `fateOpponent` case      |            |      |
| Drawing respects the hand-size limit             | `validate.ts` — `drawToHandSize` case    |            |      |
| Can only discard cards held in hand              | `validate.ts` — `discardCards` case      |            |      |
| A pending prompt blocks all other actions        | `validate.ts` — top of `isLegal`         |            |      |
| No actions once the game has a winner            | `validate.ts` — top of `isLegal`         |            |      |

## Phase machine (CHUNK 4)

| Rule                                                   | Code location                                    | Rulebook § | Page |
| ------------------------------------------------------- | ------------------------------------------------- | ---------- | ---- |
| Phase order: start → move → actions → (fate) → end      | `engine/state.ts` — `phaseRegistry`, `autoAdvance` |          |      |
| Start of turn enters the Move phase and fires triggers  | `engine/phases/startOfTurn.ts` — `applyStartTurn` |            |      |
| Start of turn resets per-turn `usedIcons`               | `engine/phases/startOfTurn.ts` — `applyStartTurn` |            |      |
| Start of turn resets `mustMoveDifferent` to `true`      | `engine/phases/startOfTurn.ts` — `applyStartTurn` |            |      |
| Move + Actions are player-driven (no auto-advance)      | `engine/phases/mainPhase.ts` — `canAdvance` false |            |      |
| Villain MUST move to a different location               | `engine/validate.ts` — `moveVillain` case         |            |      |
| Movement override: card effects may flip the flag       | `engine/types.ts` — `PlayerState.mustMoveDifferent`|           |      |
| Fate reveals 2, plays 1, discards 1                     | `engine/actions/fate.ts` — `applyFate` + `resolveFatePlay` |  |    |
| Fate phase exits to End phase once the prompt resolves  | `engine/phases/fatePhase.ts` — `runAutomatic`     |            |      |
| End of turn draws back up to the player's hand size     | `engine/phases/endOfTurn.ts` — `runAutomatic`     |            |      |
| Per-player hand size override                           | `engine/types.ts` — `PlayerState.handSize`        |            |      |
| Turn passes in `playerOrder`; turn++ on wrap            | `engine/phases/endOfTurn.ts` — `runAutomatic`     |            |      |

## Engine mechanics

| Rule                                            | Code location                          | Rulebook § | Page |
| ------------------------------------------------ | ---------------------------------------- | ---------- | ---- |
| Empty draw pile reshuffles the discard pile      | `engine/cards/effects.ts` — `reshuffleDeck` |          |      |
| Empty Fate deck reshuffles the Fate discard      | `engine/actions/fate.ts` — `applyFate`   |            |      |
| A pending prompt halts the auto-advance loop     | `engine/state.ts` — `autoAdvance`         |            |      |

## Not yet enforced (pending later milestones)

| Rule                                            | Reason / target milestone               |
| ------------------------------------------------ | ----------------------------------------- |
| Per-villain starting power / deck composition    | needs card data — M4+                     |
| Per-villain hand-size exceptions                 | needs rulebook — see RULES_QUESTIONS.md    |
| Exact icon → action coupling                     | needs rulebook — see RULES_QUESTIONS.md    |
| Power gained per `gainPower` icon                | PLACEHOLDER = 1 — see RULES_QUESTIONS.md   |
| Turn-scoped strength-boost expiry                | needs rulebook — see RULES_QUESTIONS.md    |
| Vanquish via summed ally strength                | needs rulebook — see RULES_QUESTIONS.md    |

Notes:

- The values in the first table are mechanical commitments asserted by the plan
  (`marvel-villainous-plan.md` §0.1, §2.1, §3, §4).
- Anything implemented with a placeholder is marked `PLACEHOLDER` in the code
  and listed in RULES_QUESTIONS.md; it must be confirmed against the rulebook.
