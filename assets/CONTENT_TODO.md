# CONTENT_TODO

Proprietary content the user must transcribe.

This repo ships with mechanical metadata only (costs, strengths, effect codes).
Card names, card text, and art are not committed. Fill them in from your own
physical copy of the game.

## How to use this checklist

For every row marked TODO below, transcribe the field from your copy. The
engine reads only the mechanical fields — names and text are purely for the
UI and your own reference.

---

## Thanos — main board (`engine/villains/thanos/realm.ts`)

Pending Q12 in `RULES_QUESTIONS.md`. Once you provide the printed icon set per
location, the assistant fills in `topIcons` / `bottomIcons` for each.

| Location | Printed name | Top icons | Bottom icons |
| -------- | ------------ | --------- | ------------ |
| 0        | TODO         | TODO      | TODO         |
| 1        | TODO         | TODO      | TODO         |
| 2        | TODO         | TODO      | TODO         |
| 3        | TODO         | TODO      | TODO         |

## Thanos — starting numbers (`engine/setup.ts`, `villains/thanos/`)

Pending Q13 in `RULES_QUESTIONS.md`.

| Field                       | Current placeholder | Rulebook value |
| --------------------------- | -------------------- | -------------- |
| Starting Power              | 0                    | TODO           |
| Hand size (`handSize`)      | default = 4          | TODO           |
| Deck size                   | stub deck of 8 cards | TODO           |

## Thanos — villain deck (`engine/villains/thanos/deck.ts`)

Pending Q14 in `RULES_QUESTIONS.md`. The current stub holds 8 placeholder
entries (`thanos-stub-ally-1` ... `thanos-stub-item-2`). When you transcribe,
replace the stub array with one row per card from the printed deck:

```ts
{
  id: 'thanos-N',                  // sequential, matching card # in deck
  villain: 'thanos',
  name: '',                        // user-only reference; leave '' in repo
  type: 'ally' | 'item' | 'effect' | 'condition',
  cost: <number>,
  strength: <number>,              // omit for non-allies
  effects: [...],                  // §2.3 EffectSpec primitives
  tags: [...],
  icons: [],                       // empty for villain-deck cards
}
// card #N in Thanos deck
```

Per-card worksheet (fill one row per card in the printed deck):

| #   | type | cost | strength | tags | effects (mechanical) |
| --- | ---- | ---- | -------- | ---- | -------------------- |
|     |      |      |          |      |                      |

## Thanos — Fate deck (`engine/villains/thanos/fateDeck.ts`)

11-card structure confirmed from the rulebook + components page:

| #   | Type      | Identifier (for your reference; `name` stays '' in code) | strength | effects (mechanical) | icons covered |
| --- | --------- | -------------------------------------------------------- | -------- | -------------------- | -------------- |
| 1   | hero      | Adam Warlock                                             | TODO     | TODO (rulebook: blocks Thanos's win while in Domain) | TODO |
| 2   | hero      | Drax the Destroyer                                       | TODO     | TODO (rulebook: requires ≥ 2 Allies to vanquish)      | TODO |
| 3   | hero      | Gamora                                                   | TODO     | TODO (rulebook: can target Allies/Heroes/Rivals)     | TODO |
| 4   | hero      | Nebula                                                   | TODO     | TODO (rulebook: gains +1 Strength tokens per Stone)  | TODO |
| 5   | effect    | A Stone Is Found (copy 1 of N)                            | —        | TODO (rulebook: targeted Villain takes a random Stone) | — |
| 6   | effect    | A Stone Is Found (copy 2 of N)                            | —        | TODO                                                  | — |
| 7   | effect    | A Stone Is Found (copy 3 of N)                            | —        | TODO                                                  | — |
| 8   | effect    | What Did It Cost? (copy 1 of N)                           | —        | TODO                                                  | — |
| 9   | effect    | What Did It Cost? (copy 2 of N)                           | —        | TODO                                                  | — |
| 10  | effect    | What Did It Cost? (copy 3 of N)                           | —        | TODO                                                  | — |
| 11  | event     | Sacrifices Must Be Made                                   | —        | TODO (event subsystem pending Q17)                    | — |

The 6 Effects total split between "A Stone Is Found" and "What Did It Cost?";
the exact copy count of each is TBD. Update the per-card `type` (`hero` /
`fateEffect`), `strength`, and `effects[]` in `villains/thanos/fateDeck.ts`
once you transcribe.

## Common Fate deck (15 cards) — pending RULES_QUESTIONS Q15

Per the rulebook the Common Fate deck (shuffled into the shared Fate deck
alongside every villain's Fate deck) holds 11 Heroes + 4 Events. Engine file
will be added at `engine/villains/common/fateDeck.ts` once transcribed.

## Other villains (Hela, Killmonger, Taskmaster, Ultron)

Per-villain transcription pages will be added with each villain's chunk
(CHUNK 6+). For now they share the same generic stub structure as Thanos.

## Art to supply

- Realm board art: `assets/board/<villain>.png`
- Action icon art: `assets/icons/<icon>.svg`
- Card art: `assets/cards/<villain>/<cardId>.png` (gitignored)

Vector SVG placeholders ship in `src/ui/assets/placeholders/` and can be
swapped for photographed/scanned versions.
