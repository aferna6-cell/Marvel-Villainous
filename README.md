# Marvel Villainous: Infinite Power — Digital Clone

A personal-use, local hotseat desktop implementation of *Marvel Villainous:
Infinite Power* (base set, 5 villains), built for a single user who owns the
physical game.

## Status

Milestone **M1** — project skeleton. Electron + TypeScript + React + Vite app
boots to a main menu with a "New Game" button.

## Important: proprietary content

This repository contains **mechanical metadata only** (costs, strengths, effect
codes). Card names, card text, and art are **not** committed. You must transcribe
them from your own physical copy — see [`assets/CONTENT_TODO.md`](assets/CONTENT_TODO.md).

This is a private, personal-use project. Do not publish or distribute it.

## Development

```sh
pnpm install      # install dependencies
pnpm dev          # start Vite + Electron in dev mode
pnpm test         # run the Vitest engine tests
pnpm lint         # run ESLint
pnpm format       # run Prettier
pnpm build        # build renderer + Electron main
pnpm electron:build  # package the desktop app
```

## Rule fidelity

This is a faithful reproduction of the printed game. See
[`RULES_TRACE.md`](RULES_TRACE.md) for the mapping of implemented rules to the
rulebook, and [`RULES_QUESTIONS.md`](RULES_QUESTIONS.md) for open clarifications.
