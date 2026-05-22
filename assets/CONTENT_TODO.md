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

Pending CHUNK 6.

## Other villains (Hela, Killmonger, Taskmaster, Ultron)

Per-villain transcription pages will be added with each villain's chunk
(CHUNK 6+). For now they share the same generic stub structure as Thanos.

## Art to supply

- Realm board art: `assets/board/<villain>.png`
- Action icon art: `assets/icons/<icon>.svg`
- Card art: `assets/cards/<villain>/<cardId>.png` (gitignored)

Vector SVG placeholders ship in `src/ui/assets/placeholders/` and can be
swapped for photographed/scanned versions.
