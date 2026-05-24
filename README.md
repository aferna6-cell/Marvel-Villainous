# Marvel Villainous: Infinite Power — Digital Clone

A personal-use, local hotseat desktop implementation of *Marvel Villainous:
Infinite Power* (base set, 5 villains), built for a single user who owns the
physical game.

## Status

The app is **playable** end-to-end as a hotseat state-tracker:

- All 5 villains (Thanos, Hela, Killmonger, Ultron, Taskmaster) — full decks
  (30 cards) + Fate decks (11 cards) + boards encoded from the rulebook and
  the Marvel Villainous Wiki.
- Common Fate deck (15 cards) shuffled with the participating villains' Fate
  decks into the shared Fate deck per rulebook §3.
- Per-seat starting Power (0 / 1 / 2 / 2), 4-card starting hand, 4-card
  hand-size limit.
- Full turn flow: Start → Move (must change location) → Actions → End.
  Auto-advance handles transitions. Fate is a regular action in the
  Actions phase (reveal-1, target chosen after the reveal, then place
  hero/condition at the location of the active player's choice in the
  fated opponent's realm), with a discard-with-no-effect escape clause.
- Action UI: Move villain (click a location), Play card (drag from hand to
  any location in your realm), Vanquish (multi-ally summed strength),
  Discard cards, Fate an opponent (pick target → pick location), End turn,
  Claim victory.
- Hotseat **pass-device curtain** between turns hides the previous player's
  hand from the next player.
- Opt-in **Strict icons** toggle (top of the turn-controls bar): when ON,
  playing a card / vanquishing / fating / discarding / relocating each
  require an unused matching icon at the active villain's current location
  and consume it. OFF (default) treats the engine as a relaxed state
  tracker — the group handles icon spending themselves, as the rulebook
  describes.
- **Undo button** — rewinds the engine one action (bounded 12-deep history)
  for misclick recovery.
- **Manual escape hatches** for resolving card text the engine doesn't
  auto-apply (because §0 forbids card text in the repo):
  - Right-click any in-play card → remove it from play to the right
    discard pile (resolves "defeat X" / "discard this Ally" effects).
  - `−Pow` / `+Pow` / `+Draw` buttons next to the turn controls for
    ad-hoc Power adjustments and out-of-phase draws.
  - `+/-` widgets on the Objective tracker for the per-villain
    objective counters (Stones, Soul Marks, bosses, contracts, etc.).
- **Per-villain `villainSpecific` handlers** wire the mechanical
  primitives each villain needs (place a Stone, complete a contract,
  install an Upgrade, place a Soul Mark, defeat a boss, claim Wakanda,
  Snap, control Asgard). Cards declare these via `effects: [{ op:
  'villainSpecific', key: '<key>', payload: ... }]` — no card text in
  the repo; the keys are mechanical metadata.
- **Targeted Event constraint**: Fate Events with a `targetedVillain`
  field land only on the named villain's realm; others are discarded
  with no effect (rulebook §I).
- **AI move advisor** (plan §8 full): "Suggest a move" button runs
  both a single-action top-3 search and a bounded whole-turn DFS
  (K=8 actions per turn) via the pure reducer. Per-villain weighted
  feature set scores each candidate (objective progress, power, hand
  quality, board control, icon access, opponent threat, fate
  leverage). The panel surfaces:
  - **Top recommendation** with deterministic feature-delta rationale
    behind a "Why?" expander.
  - **Other options** (the next two single-action picks).
  - **Whole-turn plans** with a one-click **Auto-play this turn**
    (executes the sequence step-by-step with a 600ms gap).
  - **Use as guide** — closes the panel; the recommended action stays
    highlighted (dashed outline) on the matching location/icon so you
    can play manually with the hint visible.
  Strictly opt-in — the advisor never moves the game state without an
  explicit click.

### What the engine does NOT yet enforce

Per-card ability behavior — the "what does this card actually do when
played" wiring — is intentionally not auto-applied for most cards
because §0 of `marvel-villainous-plan.md` forbids encoding card text /
names / art in this repo. The mechanical numbers are right (costs,
strengths, copy counts, types) so the game tracks correctly, and the
engine supplies the escape hatches above (remove-from-play,
adjust-power, draw-cards, objective ± widgets) so the group can
mechanize any card's text in one or two clicks. For abilities a card
*does* encode mechanically (via `effects: EffectSpec[]`), the
interpreter in `engine/cards/effects.ts` runs them automatically:
`gainPower`, `drawCards`, `discardSelf`, `boostStrength`, `placeToken`,
`defeatHero`, and every per-villain `villainSpecific` key listed above.

The **Claim victory** button is how a player ends the game: when your
printed objective is met (Thanos's six Infinity Stones, Hela's eight Allies
+ Soul Marks at Odin's Vault, etc.), click it and the engine ratifies the
win. Full per-villain win-condition auto-detection is the next milestone.

## Card content

§0 of the original plan ("no card names, text, or art in repo") has
been overridden by the user. Every card now carries its printed name
and a reconstructed copy of its ability text alongside the mechanical
`effects[]` array. The mechanical numbers (cost, strength, copies)
remain the load-bearing data; the `text` field is the player-facing
description. Spot-check against your physical cards before relying on
its exact wording — see `RULES_QUESTIONS.md` for the source-and-
confidence notes.

**Full catalog** — `CARDS.md` (auto-generated) lists every card with
its name, type, cost, strength, printed text, and the mechanical
effect the engine actually executes. Regenerate after edits with
`pnpm cards`. The fix for a wrong row is a one-line edit in the
matching `src/engine/villains/<v>/deck.ts` (or `fateDeck.ts`) for
numbers/text, or in `specific.ts` for behavior.

This is a private, personal-use project. Do not publish or distribute it.

## Development

```sh
pnpm install            # install dependencies
pnpm dev                # start Vite + Electron in dev mode
pnpm test               # run the Vitest engine + UI tests
pnpm lint               # run ESLint
pnpm format             # run Prettier
pnpm build              # build renderer + Electron main
pnpm electron:build     # package the desktop app (DMG / NSIS / AppImage)
```

`pnpm electron:build` reads `electron-builder.yml` and produces an
installable bundle in `out/` for the host platform. The build is unsigned
(personal use only).

## Rule fidelity

This is a faithful reproduction of the printed game's mechanics. See
[`RULES_TRACE.md`](RULES_TRACE.md) for the mapping of implemented rules to
the rulebook, and [`RULES_QUESTIONS.md`](RULES_QUESTIONS.md) for the open
items (per-card ability subsystem, dynamic-cost handling, etc.).
