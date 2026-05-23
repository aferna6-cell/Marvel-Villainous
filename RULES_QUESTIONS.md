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

### Q12 — Thanos's realm: per-location icons (PARTIAL — CHUNK 6 follow-up)

Thanos's four locations from the rulebook are: **Sanctuary II, Titan, The
Infinity Well, Knowhere** (encoded as location ids; `name` stays `''` in repo
per §0). Icon layouts transcribed by inspecting the high-resolution
components page of the rulebook PDF:

| # | Location | Top (uncovered)             | Bottom (Fate-side, covered)    | Confidence |
| - | --------- | --------------------------- | ------------------------------- | ---------- |
| 0 | Sanctuary II | `discard`, `move`        | `gainPower2`, `play`            | **read directly** |
| 1 | Titan        | `gainPower`, `move`      | `discard`, `vanquish`           | **read directly** |
| 2 | The Infinity Well | `play`, `gainPower3` | `discard`, `move`               | best-effort |
| 3 | Knowhere     | `vanquish`, `discard`, `move` | `move`                     | best-effort (1+3 split) |

The `gainPower` icon variants (`gainPower2`, `gainPower3`) were added to the
`ActionIcon` union in CHUNK 6 follow-up to encode the per-icon Power amount
printed inside each coin.

**Still needed:** physical-board confirmation of Infinity Well and Knowhere
layouts. Confirmation that Knowhere's icons are genuinely a 1+3 split rather
than a 2+2 arrangement I misread.

### Q13 — Thanos's starting numbers (RESOLVED)

From the rulebook setup:
1. Starting Power: **1st player 0, 2nd 1, 3rd 2, 4th 2** (encoded in
   `engine/setup.ts` — `startingPower`).
2. Starting hand size: **4 cards** ("Draw a starting hand of four cards";
   "draw back up to four cards"). Default in `engine/util.ts`.
3. Deck size: **30 cards per villain deck** ("5 Villain Decks (30 cards in
   each deck)"). Currently stubbed at 8 in `villains/thanos/deck.ts`.
4. No Thanos-specific movement exception confirmed.

### Q14 — Thanos's villain deck composition (RESOLVED)

All 30 cards transcribed from the Marvel Villainous Wiki via a Playwright
scrape (using full Chromium under Xvfb to pass Cloudflare). See
`engine/villains/thanos/deck.ts`:

* 10 Allies — The Legions of Thanos ×5; Black Dwarf, Black Swan, Corvus
  Glaive, Ebony Maw, Proxima Midnight (each ×1)
* 16 Effects — Consult the Well ×4; A Small Price to Pay, Taste of Cosmic
  Power (each ×3); Deliver Judgment, The Mad Titan, Warp Reality (each ×2)
* 4 Items — Death's Favor ×3; Space Throne ×1

Costs and strengths are encoded; the ability-text mechanics that don't map
cleanly to a §2.3 primitive are stubbed as `villainSpecific` entries (Mad
Titan), or as empty `effects[]` placeholders pending CHUNK 7+ behavior
wiring.

## Open questions (raised in CHUNK 6 — Fate)

### Q15 — Common Fate deck (15 cards) composition (RESOLVED)

All 15 cards transcribed via the same Playwright scrape. See
`engine/villains/common/fateDeck.ts`:

* 11 Heroes — Iron Man (str 3); Black Widow (2); Nick Fury (2); Hulk (5);
  Falcon (2); Hawkeye (2); She-Hulk (4); Vision (4); Thor (5); Captain
  Marvel (6); Captain America (3)
* 4 Events — Avengers Assemble (str 10); Lockdown at the Raft (8);
  Helicarrier Alert (6); Protected Vibranium (8)

`setup.ts` now merges the Common Fate deck with every participating
villain's Fate deck into the shared `state.fateDeck`. The Event subsystem
(Q17) routes drawn Events to `state.globalEvent`.

### Q19 — Dynamic-cost cards

The Mad Titan's printed cost is "?" (the actual Power cost equals the
Strength of the defeated target character). The engine's `cost: number`
field can't express this directly; the card is encoded with `cost: 0` plus
a `villainSpecific` effect (`thanos.madTitan`) that will collect the
deferred cost when the handler lands in CHUNK 7+.

### Q16 — Fate decision order (RESOLVED — CHUNK 6 follow-up)

Refactored to match the rulebook: reveal-1, then choose target. The `Action`
union dropped `fateOpponent { opponent }` in favour of `fate` (no args). The
resolution prompt's choices list one `{ kind: 'target', target: { kind:
'player', player } }` entry per eligible opponent plus a `skip` choice. The
target is validated at resolution time (`resolveFatePlay` in
`engine/cards/effects.ts`).

### Q17 — Event card type (RESOLVED — CHUNK 6 follow-up)

Added `'event'` to `CardType`. `GameState` gained a `globalEvent: InPlayCard
| null` slot for the center play area; `resolveFatePlay` routes an event
card there, and a second Event drawn while one is in play is discarded per
rulebook §I. The Event subsystem is now structurally in place; the
full-blown "play Allies to an Event," activated abilities, and resolution
rules are CHUNK 7+ work as Event cards land in real card data.

### Q18 — Targeted vs Global Fate cards (CLARIFIED)

Confirmed: there are NO targeting constraints on Targeted Fate cards. The
villain icon on a Targeted card is informational — that villain is "more
affected" by it but the active player may still play it on any opponent
(rulebook: "some situations may lead you to target a Villain other than the
one indicated on the Fate card; it's your choice"). The lone exception is
Targeted Events, which MUST be played on the indicated villain — that
constraint will land when the Event subsystem grows into card data.

**Current code:** any opponent is eligible to receive any Fate card.
Targeted-Event placement constraint is open until Event-card metadata adds
a `targetedVillain` field.
