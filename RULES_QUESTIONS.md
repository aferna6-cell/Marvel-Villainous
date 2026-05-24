# RULES_QUESTIONS

Open rule clarifications needed from the user.

When the printed rulebook is ambiguous, add the question here and pause that
thread of work until the user answers. Never guess.

Each item notes how the code currently behaves so nothing is silently wrong —
placeholders are marked `PLACEHOLDER` in the source.

## Open questions (raised in CHUNK 3)

### Q1 — Power gained per `gainPower` icon (RESOLVED)

User: *"don't understand this — clarification follows"*. The rulebook
prints the exact Power amount on each `gainPower` coin. Q12 transcription
of every villain board confirmed this: every board uses
`gainPower2` (2 Power) or `gainPower3` (3 Power); there is no generic
"1 Power per icon". The engine encodes the amount in the icon variant.
The `POWER_PER_GAIN_ICON` constant is no longer load-bearing; the
`gainPower` handler reads `n` from the icon type itself (`actions/gain.ts`).

### Q2 — Icon → action coupling (RESOLVED)

User: *"You can only take actions during a turn if its present in your
location."*

Implemented as an opt-in `strictIconMode` toggle on `GameState` (off by
default, so the engine still works as a relaxed state tracker for the
hotseat group's own enforcement). When ON:

* `playCard` requires an unused `play` icon at the active player's
  current location and consumes it.
* `attackHero` requires `vanquish`.
* `fate` requires `fate`.
* `discardCards` requires `discard`.
* `relocateAlly` requires `move`.

Bottom-row icons remain covered while a hero is present at that location
(Q3); used icons are tracked in `state.usedIcons` so each icon resolves
at most one of these gated actions per turn (Q4).

Files: `engine/actions/strict.ts`, `engine/validate.ts`, `engine/state.ts`.
UI toggle: `ui/components/TurnControls.tsx` ("Strict icons" checkbox).
Tests: `tests/engine/strict-mode.spec.ts`.

### Q3 — Hero coverage granularity (CLARIFIED)

User: *"don't understand this — clarification follows"*. Per the
rulebook's "Hero" section, a hero covers the entire row of action icons
*below* it (the Fate-side row, which is the player-side bottom row on
the wiki convention). This is what the engine already does: if any hero
is present at a location, the entire bottom row of icons is treated as
covered for both `useIcon` and the strict-mode lookup (`validate.ts`,
`engine/actions/strict.ts`). No code change needed.

### Q4 — Each icon usable once per turn (CLARIFIED)

User: *"don't understand this — clarification follows"*. Q2 resolution
above implies it: an icon, once spent on its gated follow-up action, is
not available again that turn. The engine already tracks `usedIcons`
per turn and clears it on `endTurn`. No code change needed.

### Q5 — Where allies/items/conditions are played (RESOLVED)

User: *"Allies can be played to any location in the heros domain as
well as events."*

`applyPlayCard` now accepts an optional `target: { kind: 'location',
player, location }` and places the card at that location when the
player chooses one in their own realm. Without a target it still falls
back to the villain's current location.

Drag-and-drop in `ui/components/Location.tsx` now allows dropping a
card on any of the 4 locations in the active player's realm.

Files: `engine/actions/playCard.ts`, `ui/components/Location.tsx`.

### Q6 — Vanquish strength comparison (RESOLVED)

Confirmed from the rulebook example: Vanquish sums the strength of the
*named* allies at the hero's location and discards every spent ally along
with the hero. Quote: "two of the Allies have a combined Strength of 5 (4+1)
… Discard the Hero and the two Allies. The third Ally remains at the
location." The `attackHero` action now takes `allyIds: CardId[]`, the
reducer sums effective strengths, and on success discards the spent allies
(`engine/actions/attack.ts`).

### Q7 — Turn-scoped strength boosts (RESOLVED)

User: *"Strenght boosts are permanent unless stateed otherwise."*

Every strength boost in the printed cards is permanent unless the card
text explicitly limits it. Since the repo intentionally does not encode
card text (§0), boost duration on a card metadata level is always
permanent in practice. The `duration: 'turn'` branch of `boostStrength`
remains so a future card with an explicit turn-scoped clause can opt in
when it lands; it is not exercised by any current card data.

### Q8 — Per-villain numeric exceptions (RESOLVED)

User: *"4 is hand size."*

Hand size is a uniform 4 for every villain (matches the rulebook "draw
back up to four cards" wording). `DEFAULT_HAND_SIZE = 4` in
`engine/util.ts` is the canonical value; `PlayerState.handSize` is no
longer needed as a per-villain override slot (kept as the override
mechanism in case a future card or villain-specific effect mutates it
mid-game). Starting Power is per-seat (1st 0, 2nd 1, 3rd 2, 4th 2)
already (see Q13). Deck composition is per-villain card data (see
Q14 and the per-villain `deck.ts` files).

## Open questions (raised in CHUNK 4)

### Q9 — Fate card placement location (RESOLVED)

User: *"Player who drew the fate card chooses its location."*

The Fate resolution now uses a two-step prompt: first the active player
picks the target opponent (`fatePlay` continuation), then they pick the
destination location in that opponent's realm (`fatePlaceLocation`
continuation). The `PromptContinuation` union gained the
`fatePlaceLocation` variant, `resolveFatePlay` parks the
second-step prompt for hero/condition cards, and `resolveFatePlaceLocation`
performs the actual placement.

UI: `ui/components/FatePanel.tsx` renders both steps in sequence.
Files: `engine/types.ts`, `engine/cards/effects.ts`,
`ui/components/FatePanel.tsx`. Tests: `tests/engine/fate.spec.ts`.

### Q10 — Can the player return to the Actions phase after Fate? (RESOLVED)

User: *"Players can take actions in any order."*

Fate is just another action in the Actions phase, not a phase change.
`applyFate` no longer transitions `s.phase = 'fate'`; the `fate` action
parks its target-and-location prompt and the phase stays `'actions'` for
the rest of the turn. The `'fate'` phase value remains in the union for
backwards compatibility but is never entered by the action handlers.

Files: `engine/actions/fate.ts`. Tests: `tests/engine/phases.spec.ts`,
`tests/engine/fate.spec.ts`.

### Q11 — Coupling of `fate` to a Fate icon (RESOLVED)

User: *"don't understand this — clarification follows"*. Subsumed by
Q2: in `strictIconMode`, the `fate` action requires (and consumes) an
unused `fate` icon at the active player's current location, exactly
matching the rulebook. In the default relaxed mode the engine does not
enforce the prerequisite — the hotseat group handles it themselves.

## Open questions (raised in CHUNK 5 — Thanos)

Resolved-or-narrowed in CHUNK 5 follow-up via the Ravensburger rulebook PDF.

### Q12 — Per-location icons for all 5 villains (RESOLVED)

All 5 villain boards' icon layouts transcribed directly from the wiki Domain
section per villain. Wiki convention: line 1 = Fate-side (covered);
line 2 = player-side (always usable). Engine `topIcons` arrays are the
player-side (uncovered) entries; `bottomIcons` are the Fate-side (covered)
entries. See `engine/villains/<v>/realm.ts` for each layout.

The `gainPower` icon variants (`gainPower2`, `gainPower3`) encode the
per-icon Power amount printed inside each coin.

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

### Q19 — Dynamic-cost cards (RESOLVED)

User: *"As long as the cost is correct."*

Confirmation that the engine doesn't need to invent a separate
"dynamic cost" cost type — it only needs to charge the correct number
of Power at play time. For The Mad Titan, the correct cost is the
defeated target character's Strength, which a `villainSpecific` effect
(`thanos.madTitan`) will compute and deduct from `power` when the
handler lands in CHUNK 7+. The base `cost: 0` on the card definition
exists so the legality check doesn't reject the play before the
dynamic charge runs.

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
