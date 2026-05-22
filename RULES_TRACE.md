# RULES_TRACE

Maps implemented rules to the printed rulebook.

Each entry should cite the rulebook section/page it came from so a reviewer can
verify the code matches the book. The **Rulebook §** and **Page** columns are
left blank for the user to fill in from their own physical copy.

## Numeric defaults & structural rules

| Rule                                    | Value / shape                          | Code location                                 | Rulebook § | Page |
| --------------------------------------- | -------------------------------------- | ---------------------------------------------- | ---------- | ---- |
| Locations per realm                     | exactly 4                              | `engine/types.ts` — `Realm.locations` 4-tuple  |            |      |
| Villain token occupies one location     | index 0–3                              | `engine/types.ts` — `Realm.villainTokenAt`     |            |      |
| Game phase order                        | start → move → actions → fate → end    | `engine/types.ts` — `Phase`                    |            |      |
| Players per game                        | 2–4                                    | `engine/types.ts` — `PlayerId`, `playerOrder`  |            |      |
| Default hand size (draw-up target)      | 4 (villain-dependent)                  | _pending — enforced in `phases/endOfTurn` (M2+)_ |          |      |
| Fate action: reveal / play / discard    | reveal 2, play 1, discard 1            | _pending — `phases/fatePhase` (M3+)_           |            |      |
| Villain must move to a *different* location | mandatory move                      | _pending — `actions/move` (M2+)_               |            |      |
| Per-villain starting power / deck size  | villain-specific (not uniform)         | _pending — `villains/<name>/deck.ts` (M4+)_    |            |      |

Notes:

- Values above are mechanical defaults asserted by the plan
  (`marvel-villainous-plan.md` §0.1, §2.1, §3). Rows marked _pending_ are typed
  but not yet enforced by logic; they will gain code-location citations as the
  corresponding milestones land.
- No rule has been *implemented in logic* yet (CHUNK 2 lays down types only).
  This table records the structural commitments the type system already makes.
