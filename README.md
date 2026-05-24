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

### What the engine does NOT yet enforce

Per-card ability behavior — the "what does this card actually do when
played" wiring — is not implemented for most cards. The mechanical numbers
are right (costs, strengths, copy counts, types) so the game tracks
correctly, but card-text effects are honor-system: players who know the
rulebook can play their card and **manually** adjust state if the engine
doesn't auto-apply the effect.

The **Claim victory** button is how a player ends the game: when your
printed objective is met (Thanos's six Infinity Stones, Hela's eight Allies
+ Soul Marks at Odin's Vault, etc.), click it and the engine ratifies the
win. Full per-villain win-condition auto-detection is the next milestone.

## Important: proprietary content

This repository contains **mechanical metadata only** (costs, strengths,
effect codes, icon types). Card names, card text, and art are **not**
committed. The wiki was scraped to verify the mechanical numbers; the names
and ability text live only on your physical cards and the public wiki —
they are intentionally absent from this repo per the project's §0 ground
rules.

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
