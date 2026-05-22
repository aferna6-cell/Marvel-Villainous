# RULES_QUESTIONS

Open rule clarifications needed from the user.

When the printed rulebook is ambiguous, add the question here and pause that
thread of work until the user answers. Never guess.

Each item notes how the code currently behaves so nothing is silently wrong —
placeholders are marked `PLACEHOLDER` in the source.

## Open questions (raised in CHUNK 3)

### Q1 — Power gained per `gainPower` icon

How much Power does a single `gainPower` action icon grant?
**Current code:** `POWER_PER_GAIN_ICON = 1` (PLACEHOLDER in `actions/gain.ts`).

### Q2 — Icon → action coupling

What is the exact relationship between action icons and the `playCard`,
`attackHero`, `fateOpponent`, `discardCards` actions? Specifically: does the
player have to spend a `play` icon to play a card, a `vanquish` icon to attack,
a `fate` icon to Fate, etc. — and may an icon be used to perform that action
more than once?
**Current code:** `playCard` / `attackHero` / `fateOpponent` / `discardCards`
are independently legal during the actions phase; using a `play`/`vanquish`/
`fate`/`discard` icon is recorded but not yet required for the follow-up
(`actions/useIcon.ts`).

### Q3 — Hero coverage granularity

When a hero is at a location, does it cover the entire bottom icon row, or only
specific bottom icons?
**Current code:** if any hero is present, the whole bottom row is treated as
covered (`validate.ts`, per the plan's "bottom row" wording in §3/§4).

### Q4 — Each icon usable once per turn

Confirm that each action icon at the villain's current location may be used at
most once per turn.
**Current code:** an icon already in `usedIcons` is rejected (`validate.ts`).

### Q5 — Where allies/items/conditions are played

When a player plays an ally, item, or condition, is it placed at the villain's
current location, or may the player choose any location?
**Current code:** placed at the villain's current location (`actions/playCard.ts`).

### Q6 — Vanquish strength comparison

Does Vanquish compare the summed strength of *all* allies at the hero's
location against the hero, or one named ally at a time?
**Current code:** one named ally vs. one hero; ally strength ≥ hero strength
defeats it (`actions/attack.ts`).

### Q7 — Turn-scoped strength boosts

When does a `duration: 'turn'` strength boost expire (end of the current turn,
start of the next, etc.)?
**Current code:** turn-scoped boosts are applied identically to permanent ones;
expiry is not yet implemented (`cards/effects.ts` — `boostStrength`).

### Q8 — Per-villain numeric exceptions

What are each villain's starting hand size, starting Power, and starting deck
composition? The plan (§5, §11) states these are villain-specific and not
uniform.
**Current code:** only the generic default hand size (4) exists; per-villain
values are unencoded and will be filled in M4+.
