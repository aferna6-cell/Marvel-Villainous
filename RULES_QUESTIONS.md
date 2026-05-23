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

### Q6 — Vanquish strength comparison (RESOLVED)

Confirmed from the rulebook example: Vanquish sums the strength of the
*named* allies at the hero's location and discards every spent ally along
with the hero. Quote: "two of the Allies have a combined Strength of 5 (4+1)
… Discard the Hero and the two Allies. The third Ally remains at the
location." The `attackHero` action now takes `allyIds: CardId[]`, the
reducer sums effective strengths, and on success discards the spent allies
(`engine/actions/attack.ts`).

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
values are unencoded and will be filled in M4+. `PlayerState.handSize` is
the override slot — per-villain values plug in there.

## Open questions (raised in CHUNK 4)

### Q9 — Fate card placement location

When a Fate hero or condition is played onto the fated player's realm, which
of the 4 locations does it land on? Is the location fixed on the card, chosen
by the active player, chosen by the fated player, or determined by some other
rule?
**Current code:** placed at location 0 by default (`cards/effects.ts` —
`resolveFatePlay`).

### Q10 — Can the player return to the Actions phase after Fate?

The plan §3 lists phases in order `start → move → actions → fate → end`, which
suggests entering Fate exits Actions. Confirm whether using a Fate icon /
Fating an opponent forfeits any remaining Actions for the turn.
**Current code:** Fate transitions to the `'fate'` phase; once the Fate prompt
resolves, the phase machine advances to `'end'` (no return to actions).

### Q11 — Coupling of `fateOpponent` to a Fate icon (PARTIAL)

Rulebook confirms Fate is invoked via a Fate icon — there is NO alternate
"pay Power to Fate without an icon" path. What remains unresolved is whether
the engine should require the icon to actually be spent before
`fateOpponent` is legal (related to Q2).
**Current code:** `fateOpponent` is independently legal during the Actions
phase; no icon prerequisite enforced (icons are tracked separately).

## Open questions (raised in CHUNK 5 — Thanos)

Resolved-or-narrowed in CHUNK 5 follow-up via the Ravensburger rulebook PDF.

### Q12 — Thanos's realm: per-location icons (PARTIAL — still blocked)

Thanos's four locations from the rulebook are: **Sanctuary II, Titan, The
Infinity Well, Knowhere** (encoded as location ids; `name` stays `''` in repo
per §0). Partial info gathered from the Marvel Villainous Wiki: Sanctuary II's
covered row includes Activate; Titan's covered row includes Fate; Knowhere's
four icons are Relocate, Fate, Play a Card, Vanquish (covered row includes
Relocate). The Infinity Well's icons are not yet confirmed.

**Still needed:** the exact top/bottom icon split for every location.
**Current code:** `engine/villains/thanos/realm.ts` ships placeholder icons
(`top: [gainPower, play]`, `bottom: [move, fate]`) per location.

### Q13 — Thanos's starting numbers (RESOLVED)

From the rulebook setup:
1. Starting Power: **1st player 0, 2nd 1, 3rd 2, 4th 2** (encoded in
   `engine/setup.ts` — `startingPower`).
2. Starting hand size: **4 cards** ("Draw a starting hand of four cards";
   "draw back up to four cards"). Default in `engine/util.ts`.
3. Deck size: **30 cards per villain deck** ("5 Villain Decks (30 cards in
   each deck)"). Currently stubbed at 8 in `villains/thanos/deck.ts`.
4. No Thanos-specific movement exception confirmed.

### Q14 — Thanos's villain deck composition

What are the mechanical metadata for every card in Thanos's deck (one row per
card)? For each card the engine needs:
- `type` (`ally` / `item` / `effect` / `condition`)
- `cost` (Power cost to play)
- `strength` (for allies; integer)
- `effects[]` (mapped to the §2.3 `EffectSpec` primitives — gainPower,
  drawCards, discardSelf, moveAlly, boostStrength, defeatHero, moveHero,
  lookAtFate, searchDeck, forceDiscard, placeToken, or `villainSpecific`
  with a key the assistant adds to `villains/thanos/specific.ts`)
- `tags[]` (e.g. `'blackOrder'` — anything other cards filter on)
- `icons[]` (for heroes only — which icons the hero covers; per Q3 this is
  currently treated as the whole bottom row)

**Current code:** `engine/villains/thanos/deck.ts` ships 8 generic stub
entries (`thanos-stub-ally-N`, etc.) with placeholder `cost` and `strength`.
A full per-card transcription pass replaces them all — see
`assets/CONTENT_TODO.md` for the worksheet.

## Open questions (raised in CHUNK 6 — Fate)

### Q15 — Common Fate deck (15 cards) composition

The rulebook specifies a single shared Fate deck made by shuffling the
**Common Fate deck (15 cards)** together with every participating villain's
Fate deck. Per the wiki those 15 cards are 11 Heroes (Iron Man, Black Widow,
Nick Fury, Hulk, Falcon, Hawkeye, She-Hulk, Vision, Thor, Captain Marvel,
Captain America) and 4 Events (Protected Vibranium, Lockdown at the Raft,
Helicarrier Alert, Avengers Assemble). For each I need the mechanical
metadata: hero strength, event effect codes, which icons (if any) a hero
covers, and per-card placement target (location index or "owner's choice").

**Current code:** the Common Fate deck is not represented in `setup.ts` —
the shared `state.fateDeck` only holds the participating villains' Fate
decks. Stub `engine/villains/common/fateDeck.ts` will land alongside the
transcription.

### Q16 — Fate decision order (PLAN DIVERGENCE)

The rulebook reads: "Reveal one card from the top of the Fate deck, **then**
choose which player to target." The engine currently has the player choose
the target **first** (via `fateOpponent { opponent }`), then reveals the
card. Mechanically equivalent in the common case (the active player can
always retarget by choosing a different opponent the next turn), but the
information ordering differs: the rulebook lets the player see the card
before committing to the target.

**Current code:** target-then-reveal; a 2-step prompt (reveal-then-target)
is a follow-up refactor.

### Q17 — Event card type

Rulebook: "Events are placed at the center of the playing area as a new and
unique location. Events are not considered to be in any Domain." Marvel
Villainous Events are a genuinely separate card type with global state
(only one Global Event in play at a time). The engine's current `CardType`
union does not include `'event'` — Thanos's targeted event "Sacrifices
Must Be Made" is filed as `'fateEffect'` until the Event subsystem lands.

**Current code:** Events stubbed as `'fateEffect'` in
`engine/villains/thanos/fateDeck.ts`.

### Q18 — Targeted vs Global Fate cards

The rulebook distinguishes Targeted Fate cards (those bearing a specific
villain icon — preferred target, but the active player MAY choose another;
Targeted *Events*, however, MUST be played on the indicated villain) from
Global Events (played to the center play area regardless of which player
revealed them). The engine has no concept of a card's "targeted villain"
metadata.

**Current code:** the active player picks any opponent; targeting
constraints are not enforced.
