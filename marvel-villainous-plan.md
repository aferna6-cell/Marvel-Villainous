# Marvel Villainous: Infinite Power — Digital Implementation Plan

A complete, hand-to-Claude-Code build plan for a desktop, local hotseat version of *Marvel Villainous: Infinite Power* (base set, 5 villains).

---

## 0. Ground rules for the assistant building this

**You are building a personal-use digital clone of a board game that the user owns.** That has implications you must respect throughout the build:

- **Do not commit any card art, card text, or rulebook text to the repo.** All proprietary content (art, names, ability text) must live in a separate `assets/` directory that the user populates from their own physical copy. The repo should ship with placeholder JSON, placeholder PNGs, and a `README` instructing the user to scan/transcribe their own cards.
- **Game mechanics themselves are not copyrightable** — you may freely encode the rules system. But the data files in version control should contain only mechanical metadata (cost, type, strength, effect codes), not the flavor names or art paths until the user fills them in.
- The repo should be private, never published, never distributed.

If at any point you would be checking in a `.png` of a card or the verbatim text of an ability, stop and instead emit a placeholder + an entry in `assets/CONTENT_TODO.md` describing what the user needs to fill in.

### 0.1 Absolute faithfulness to the physical game — non-negotiable

This is a **digital faithful reproduction**, not a reimagining. Every rule, edge case, and number must match the printed rulebook and physical cards exactly.

The assistant building this MUST:

- **Treat the official rulebook as the single source of truth.** When the rulebook and "what would feel better in software" disagree, the rulebook wins, every time.
- **Never invent, rebalance, or "improve" mechanics.** No house rules. No quality-of-life shortcuts that change outcomes. No "this seems redundant so I'll drop it." If it's in the printed rules, it's in the code.
- **Match exact numerical values:** starting hand size, hand-size limit, starting power, starting deck composition, draw counts, costs, strengths, Fate count (reveal 2, play 1 / discard 1), location count per realm (4), action icon counts and positions per location, villain mover rules ("must move to a different location"), and per-villain exceptions to any of the above.
- **Match exact ordering** of game phases and of resolution within an action (e.g. "before/after" triggers, mandatory vs. optional effects, the order in which simultaneous triggers resolve).
- **Match every villain's unique mechanic precisely** as printed, including all special action symbols, restrictions, and win-condition clauses. Do not summarize; encode the literal rule.
- **When the rulebook is ambiguous, stop and ask the user.** Do not guess. Add the question to `RULES_QUESTIONS.md` and pause that piece of work until resolved.
- **Maintain a `RULES_TRACE.md`** in the repo: every implemented rule cross-references the rulebook page/section it came from. A reviewer should be able to walk the doc and verify the code matches the book.

This faithfulness requirement supersedes any other design preference in this plan. If a later section conflicts with the rulebook, follow the rulebook.

---

## 1. Tech stack

**Recommended: Electron + TypeScript + React + Zustand + Vite.**

Reasoning:

- Card games are UI-heavy (drag/drop, hover previews, animated reveals). React is the path of least resistance.
- Electron makes it a real desktop app the user can launch like any other program. No browser required at game time.
- TypeScript is non-negotiable for a game with this many discriminated unions (card types, effect types, villain-specific abilities).
- Zustand for state — simpler than Redux, more disciplined than `useState` sprawl.
- Vite for dev server speed.

Tooling:

- **pnpm** as package manager.
- **Vitest** for unit tests on game-logic modules.
- **Playwright** (optional, later) for end-to-end smoke tests of full turns.
- **ESLint + Prettier** with strict TS config (`"strict": true`, `"noUncheckedIndexedAccess": true`).
- **electron-builder** for packaging to `.dmg` / `.exe` / AppImage when done.

Folder layout:

```
marvel-villainous/
  package.json
  pnpm-lock.yaml
  electron/
    main.ts                 # Electron main process
    preload.ts
  src/
    main.tsx                # React entry
    app/
      App.tsx
      routes.tsx            # main menu, setup, game, post-game
    engine/                 # PURE game logic, no React imports
      types.ts              # all shared types
      state.ts              # GameState shape + Zustand store
      actions/              # one file per player action
        move.ts
        playCard.ts
        gain.ts
        attack.ts
        defeat.ts
        discard.ts
        activate.ts
      phases/
        startOfTurn.ts
        mainPhase.ts
        endOfTurn.ts
        fatePhase.ts
      cards/
        registry.ts         # cardId -> implementation
        effects.ts          # reusable effect primitives
      villains/
        thanos/
          objective.ts
          realm.ts          # board layout & location rules
          deck.ts           # villain-deck card list (mechanical only)
          fateDeck.ts
        hela/
        killmonger/
        taskmaster/
        ultron/
      rng.ts                # seedable RNG for reproducible tests
      validate.ts            # legal-action checker
    ui/
      components/
        Board.tsx
        Realm.tsx
        Location.tsx
        Hand.tsx
        Card.tsx
        FatePanel.tsx
        TurnControls.tsx
        Log.tsx
        VillainPicker.tsx
      hooks/
      theme.css
    assets/                  # gitignored except README + placeholders
      cards/
        thanos/
        hela/
        ...
      icons/
      board/
  tests/
    engine/
      thanos.spec.ts
      hela.spec.ts
      ...
      fullGame.spec.ts
  assets/CONTENT_TODO.md     # checklist of what user must transcribe
  README.md
```

---

## 2. The core game model

The engine must be a **pure reducer**: `(state, action) => newState`. No randomness inside reducers — RNG is consulted at action-creation time and the result is passed in. This makes the whole thing replay-testable.

### 2.1 Type definitions (write these first, in `engine/types.ts`)

```ts
type PlayerId = 'p1' | 'p2' | 'p3' | 'p4';
type VillainKey = 'thanos' | 'hela' | 'killmonger' | 'taskmaster' | 'ultron';
type CardType =
  | 'ally'        // creatures you control
  | 'item'        // equipment / objects
  | 'effect'      // one-shot
  | 'condition'   // ongoing on a location
  | 'hero'        // fate deck: heroes
  | 'fateEffect'; // fate deck: one-shot
interface CardDef {
  id: string;              // stable id, e.g. "thanos-ally-007"
  villain: VillainKey | 'fate-' + VillainKey;
  name: string;            // USER FILLS — left blank in repo
  type: CardType;
  cost: number;            // power cost
  strength?: number;       // for allies/heroes
  text?: string;           // USER FILLS
  effects: EffectSpec[];   // mechanical encoding (see §2.3)
  icons: ActionIcon[];     // if hero, which icons it COVERS at a location
  tags?: string[];         // 'avenger', 'asgard', etc. for conditional effects
}
type ActionIcon =
  | 'gainPower'
  | 'move'
  | 'play'
  | 'fate'
  | 'discard'
  | 'vanquish'
  | 'activate'        // some villains have unique icons
  | 'villainSpecific1'
  | 'villainSpecific2';
interface Location {
  id: string;
  name: string;
  topIcons: ActionIcon[];      // 2 icons usually
  bottomIcons: ActionIcon[];   // covered by hero cards
  heroesPresent: InPlayCard[];
  alliesPresent: InPlayCard[];
  itemsPresent: InPlayCard[];
  conditions: InPlayCard[];
}
interface Realm {
  villain: VillainKey;
  locations: [Location, Location, Location, Location]; // always 4
  villainTokenAt: 0 | 1 | 2 | 3;
}
interface PlayerState {
  id: PlayerId;
  villain: VillainKey;
  power: number;
  hand: CardId[];
  deck: CardId[];        // draw pile (order matters)
  discard: CardId[];
  fateDeck: CardId[];
  fateDiscard: CardId[];
  realm: Realm;
  flags: Record<string, unknown>;  // villain-specific state
                                    // e.g. thanos.infinityStones: Set<StoneId>
                                    //      hela.asgardConquered: boolean
                                    //      ultron.upgradeLevel: number
  objectiveProgress: ObjectiveProgress;
}
interface GameState {
  seed: number;
  rngCursor: number;
  turn: number;
  activePlayer: PlayerId;
  phase: 'start' | 'move' | 'actions' | 'fate' | 'end';
  players: Record<PlayerId, PlayerState>;
  playerOrder: PlayerId[];
  log: LogEntry[];
  winner: PlayerId | null;
  pendingPrompt: Prompt | null;   // for cards that need a choice
}
```

### 2.2 Action shape

```ts
type Action =
  | { kind: 'startTurn' }
  | { kind: 'moveVillain'; to: 0|1|2|3 }
  | { kind: 'useIcon'; location: 0|1|2|3; iconIndex: number }
  | { kind: 'playCard'; cardId: CardId; target?: TargetSpec }
  | { kind: 'attackHero'; allyId: CardId; heroId: CardId }
  | { kind: 'discardCards'; cardIds: CardId[] }
  | { kind: 'drawToHandSize' }
  | { kind: 'fateOpponent'; opponent: PlayerId }
  | { kind: 'resolvePrompt'; choice: PromptChoice }
  | { kind: 'endTurn' };
```

`validate.ts` exports `isLegal(state, action): true | { reason: string }`. The UI greys out anything illegal; tests assert illegal actions are rejected.

### 2.3 Effect primitives

Cards don't run arbitrary code. Instead each card lists `EffectSpec[]`, and `engine/cards/effects.ts` interprets them. Keep this list small and composable.

```ts
type EffectSpec =
  | { op: 'gainPower'; n: number }
  | { op: 'drawCards'; n: number }
  | { op: 'discardSelf' }
  | { op: 'moveAlly'; from: 'any'|'thisLocation'; to: 'anyLocation' }
  | { op: 'boostStrength'; allyFilter: AllyFilter; n: number; duration: 'turn'|'permanent' }
  | { op: 'defeatHero'; whereFilter: LocationFilter }
  | { op: 'moveHero'; from: 'thisLocation'; to: 'anyLocation' }
  | { op: 'lookAtFate'; n: number; choose: number }
  | { op: 'searchDeck'; filter: CardFilter; into: 'hand'|'play' }
  | { op: 'forceDiscard'; player: 'opponent'; n: number }
  | { op: 'placeToken'; tokenKind: string; on: 'self'|'card' }
  | { op: 'villainSpecific'; key: string; payload: unknown }; // escape hatch
```

The `villainSpecific` op is the escape hatch for unique abilities (e.g., Thanos collecting Infinity Stones, Ultron's upgrade chain). Implement them in `engine/villains/<name>/specific.ts`.

---

## 3. The turn structure

Implement these phases in order in `engine/phases/`. Each phase exposes a `canAdvance(state): boolean` and a `runAutomatic(state): state` for steps the engine does without prompting.

1. **Start of turn**
   - Trigger any "at start of turn" abilities.
   - Resolve any conditions on the villain's locations.
2. **Move**
   - Player must move their villain token to a different location (cannot stay unless a card says so).
3. **Actions phase**
   - Player may use any number of *available* (uncovered) action icons at the current location, in any order.
   - Icons covered by heroes (bottom row) cannot be used until those heroes are defeated.
   - Each icon use is a separate `Action`. Cards played mid-phase can unlock new options.
4. **Fate phase (optional)** — only entered if `gainPower 2` was traded for it via the `Fate` icon, OR the villain's icon row contains a `fate` symbol and they activate it.
   - Reveal top 2 cards of a chosen opponent's fate deck.
   - Play one (placing heroes/items on their realm), discard the other.
5. **End of turn**
   - Draw back up to hand size (default 4, villain-dependent).
   - Pass to next player in `playerOrder`.

The `fate` action is THE central tension of the game — make sure it works perfectly before adding villain-specific complexity.

---

## 4. The Fate deck mechanic (build this second, after core loop)

Each villain has their own Fate deck used by opponents to harass them. Heroes placed by a Fate action **cover the bottom icons** of the location they land on, blocking those actions.

To defeat a hero, the villain plays allies into that location and uses the `vanquish` icon, comparing summed ally strength to hero strength (some villains use different rules — see §6).

Conditions placed by Fate cards sit on a location and apply ongoing penalties (cannot use icon X, must discard on entering, etc.). They are removed by vanquishing or specific effects.

---

## 5. Objectives (one per villain, must all be implemented)

Each villain wins by completing their unique objective. Each objective is a state predicate `checkWin(playerState, gameState): boolean` called at end of every action. Below is the **mechanical** structure — fill in exact wording from the rulebook in `villain/<name>/README.md` for your own reference.

### 5.1 Thanos

- Multi-step gauntlet: collect six Infinity Stones (Power, Space, Reality, Soul, Mind, Time), each obtained by a different qualifying action at a specific location. Then perform a final "Snap" action.
- State: `flags.thanos.stones: Set<StoneId>`, `flags.thanos.snapAvailable: boolean`.
- Each stone has its own acquisition rule encoded as a `villainSpecific` effect.

### 5.2 Hela

- Conquer Asgard: have a specified ally type present at a key location AND defeat a specified hero. Then move her token to that location.
- State: `flags.hela.asgardControlled: boolean`, `flags.hela.requiredHeroDefeated: boolean`.

### 5.3 Killmonger

- Defeat a sequence of specific heroes from his fate deck, then control Wakanda.
- State: `flags.killmonger.bossesDefeated: HeroId[]`.

### 5.4 Taskmaster

- Complete a series of "contracts" (specific objectives drawn from a dedicated pile). Each contract = small objective. Complete N to win.
- State: `flags.taskmaster.contractsCompleted: number`, `flags.taskmaster.activeContract: ContractId | null`.

### 5.5 Ultron

- Upgrade through a tech track, build a final ally, then defeat a specific hero with it.
- State: `flags.ultron.upgradeLevel: number`, `flags.ultron.finalFormBuilt: boolean`.

For each villain, also implement:

- Their unique action icon (the `villainSpecific1` slot).
- Their starting hand size and starting deck composition.
- Any rulebook exceptions (Thanos uses Infinity Gauntlet costs; Ultron has Drones; etc.).

---

## 6. Card data — how the user fills it in

Ship `engine/villains/<name>/deck.ts` with the **mechanical skeleton** of every card: `id`, `type`, `cost`, `strength`, `effects[]`, `tags[]`. Leave `name` and `text` as `""` and add a comment with the card's ordinal in the rulebook so the user can identify it.

```ts
// thanos/deck.ts
export const thanosDeck: CardDef[] = [
  {
    id: 'thanos-ally-001',
    villain: 'thanos',
    name: '',            // USER FILLS from card #1 of Thanos deck
    type: 'ally',
    cost: 3,
    strength: 4,
    effects: [],
    tags: ['blackOrder'],
  },
  // ... one entry per card in the deck
];
```

`assets/CONTENT_TODO.md` should auto-generate a checklist: every card id with a blank `name` / `text` / `art` field gets a row. The user works through this once and the game is fully populated.

For the **board art** of each realm and the **action icons**, ship vector SVG placeholders in `src/ui/assets/placeholders/` that the user can swap with photographed/scanned versions.

---

## 7. UI: building the table

Build screens in this order so you always have something playable:

1. **Villain picker** (menu) — choose 2-4 villains, assign to seats.
2. **Game board layout** — 2x2 or 1x4 grid of realms depending on player count. Each realm shows its 4 locations horizontally, villain token, heroes, allies, items.
3. **Active player panel** — hand (face-up for the active seat only — it's hotseat, so a "pass device" curtain between turns is nice), power total, deck/discard counts.
4. **Turn controls** — phase indicator, "End move phase", "End turn", "Fate an opponent" buttons.
5. **Card detail modal** — hover/click a card to see full text & current modifiers.
6. **Action overlay** — when an icon is clicked, highlight legal targets, dim everything else.
7. **Log panel** — every action appended, scrollable, expandable.
8. **Win screen** — confetti, objective summary, "play again."

### Hotseat-specific UX

- Between turns, show a full-screen "Pass to <next player>" curtain that the next player taps through. Hides the previous player's hand.
- Card backs visible to all; card fronts only when held by active player or face-up in a realm.

### Animations (do these last)

- Card draw flips from deck to hand.
- Power tokens fly to/from the pool.
- Heroes "shake" before being defeated.
- Fate reveal has a 2-card flip with a "play this / discard this" choice.

Don't gold-plate. The game must be playable before any animation lands.

---

## 8. AI move advisor (per-turn recommendation)

Every player, on their own turn, gets a **"Suggest a move"** button that produces an AI-generated recommendation for what to do this turn. The recommendation must:

- Be **legal** under the current rules engine (pipe every suggested action through `validate.isLegal`).
- Be **faithful to the printed game** — it never proposes a move the physical rules wouldn't permit, even if the move would be "interesting."
- Be **informative** — it shows the proposed action sequence for the whole turn (move, then which icons in which order, then end-turn), the expected board state after, and a short rationale.
- Be **non-binding** — it is a suggestion only. The player can accept it (auto-execute), accept-and-edit, or ignore it.

### 8.1 Architecture

Put it in `engine/advisor/` so it stays decoupled from UI:

```
engine/advisor/
  index.ts                 # recommendMove(state, playerId): Recommendation
  search.ts                # turn-sequence enumeration + pruning
  score.ts                 # general state-value heuristic
  villains/
    thanos.ts              # per-villain scoring weights & objective hooks
    hela.ts
    killmonger.ts
    taskmaster.ts
    ultron.ts
  explain.ts               # turns a chosen sequence into a human rationale
```

Recommended algorithm: **bounded depth-first enumeration with per-villain scoring**, in three layers.

1. **Enumerate legal turn sequences.** For the active player, generate every legal sequence of `Action`s from start-of-turn through end-of-turn. Because the action phase is open-ended, cap it: at most `K` actions per turn (8 is a safe upper bound — real turns rarely exceed it), and prune any branch where the same icon is used twice with no state change.
2. **Simulate each sequence** through the pure reducer with a copy of state. The reducer must be a pure function (you already built it that way), so the advisor reuses it.
3. **Score the resulting end-of-turn state** with a weighted sum of per-villain features (see §8.2). Pick the top scoring sequence. Return the top 3 with scores for transparency.

Because the engine is pure and deterministic, the advisor is also deterministic. Same state in, same recommendation out. This is essential for testing.

If a sequence requires resolving a `pendingPrompt` (target choice), the advisor enumerates plausible targets too. To keep search tractable, prune target choices using simple per-effect heuristics (e.g. for "discard 1 opponent card," prefer discarding the highest-cost card).

### 8.2 Per-villain scoring features

The global state score is `sum(featureWeight[villain][feature] * featureValue(state))`. Features stay villain-agnostic; only the **weights** change per villain.

Common features (compute once, reuse everywhere):

- `progressTowardObjective` — % distance to win condition, villain-specific subfunction.
- `powerInBank` — current power total.
- `handQuality` — sum of expected value of cards in hand vs. their cost.
- `boardControl` — own allies' total strength minus heroes' total strength across own realm.
- `iconAccess` — number of currently usable (uncovered) icons on own realm.
- `opponentThreat` — for each opponent, their `progressTowardObjective`. Heavily negative weight.
- `fateLeverage` — number of heroes already in opponents' fate discard you could re-Fate; positive only when their objective is near.

Per-villain weight examples (numbers are starting points — tune empirically):

| Feature                  | Thanos | Hela | Killmonger | Taskmaster | Ultron |
|--------------------------|--------|------|------------|------------|--------|
| progressTowardObjective  | 10     | 10   | 10         | 10         | 10     |
| powerInBank              | 1      | 1.5  | 1          | 1          | 2      |
| handQuality              | 1      | 1    | 1          | 1.5        | 1      |
| boardControl             | 1.5    | 2    | 2.5        | 1.5        | 2      |
| iconAccess               | 1      | 1    | 1          | 1          | 1.5    |
| opponentThreat           | -3     | -3   | -3         | -3         | -3     |
| fateLeverage             | 2      | 2    | 2          | 2          | 2      |

Each villain also gets an **objective-specific bonus**: a function that adds large positive value when the move directly advances the win path (Thanos collecting a stone, Ultron upgrading, Taskmaster completing a contract, etc.).

### 8.3 Explanations

`explain.ts` takes the chosen sequence and produces 2-4 short bullets like:

- "Move to Sanctum to gain power (3 power available, you need 7)."
- "Play Ebony Maw — you can afford him (5 power) and he unlocks the Soul Stone next turn."
- "Use Fate on Hela — she's one objective step from winning."

Generate explanations from action types and feature deltas, not from an LLM. This keeps the advisor offline, deterministic, free, and instant. (If you want a richer natural-language layer later, see §8.6.)

### 8.4 UI for the advisor

- A `Suggest a move` button in the turn-controls panel, always visible on your own turn.
- Clicking it opens a side panel showing the top recommendation as a step-by-step list, plus expected end-of-turn power, hand size, and objective progress.
- Two buttons: **`Auto-play this turn`** (executes the full sequence one action at a time with a 600ms delay so you can watch), and **`Use as guide`** (closes the panel; the recommended actions are subtly highlighted on the board, but you play manually).
- A **`Why?`** expander shows the bullet rationale.
- A **`Other options`** expander shows the #2 and #3 sequences with their scores.

The advisor must **never act without an explicit click**. It is opt-in, every turn.

### 8.5 Faithfulness guarantees for the advisor

- The advisor calls the same reducer the human plays through. It cannot bypass rules.
- The advisor only sees information the active player would legally see in the physical game: their own hand, all face-up cards on all realms, the contents of all discards, deck counts (not deck order), opponents' power totals, opponents' realm states. It does **not** peek at opponents' hands or the order of any deck.
- Enforce this with a `view(state, asPlayer)` projection function in `engine/view.ts`. The advisor takes a `PlayerView`, not the raw `GameState`. Tests assert the advisor produces identical recommendations from the view and from a state where hidden zones are scrubbed.

### 8.6 Optional: LLM-backed natural-language commentary

If the user later wants chattier advice ("Why is this better than playing Proxima Midnight?"), wire an optional adapter in `engine/advisor/llm.ts` that takes the deterministic recommendation and asks an LLM to rephrase the rationale. Keep it strictly **post-hoc commentary** — the LLM never picks the move, only explains the move the heuristic chose. This preserves determinism and faithfulness.

Default this off. Behind a settings toggle. Personal use only.

### 8.7 Testing the advisor

- **Determinism:** same seed, same state → same recommendation. Snapshot test.
- **Legality:** for 1,000 random reachable states, the recommended sequence is fully legal end-to-end.
- **Information hiding:** for any state, `recommendMove(view(state, p), p) === recommendMove(state, p)` after scrubbing hidden zones.
- **Sanity:** at a state one action away from winning, the advisor picks the winning action.
- **Per-villain regression:** scripted mid-game states where the "obviously right" move is known; advisor must pick it.

---

## 9. Testing strategy

Write tests as you go in `tests/engine/`. The engine is pure, so tests are fast and deterministic.

Test taxonomy:

- **Phase tests** — given state X, action Y produces state Z. One per phase transition.
- **Card tests** — for every non-trivial effect, a test that sets up the situation and asserts the post-effect state. Especially: anything with `villainSpecific`.
- **Villain win tests** — for each villain, a scripted sequence of actions that walks them to a win. Asserts `winner === thatVillain` at the end. This is the single most valuable test per villain.
- **Illegal action tests** — every rule ("must move to a different location", "can't use a covered icon", "can't play a card you can't pay for") gets a test.
- **Seeded full-game test** — a long-running test that plays a full 4-player game with a fixed seed and snapshots the final state, so refactors don't silently change behavior.

Aim for 80%+ coverage on `engine/`. UI coverage is less important; rely on manual play-testing.

---

## 10. Milestones (the order to actually build this)

Each milestone ends with something demoable. Don't skip ahead.

**M1 — Skeleton (1-2 days of focused work)**

- Project boots, Electron window opens, React renders "Hello Villain".
- Types defined, Zustand store wired, empty reducer.
- `vitest` running on a trivial test.

**M2 — One villain, no Fate, no objective (3-5 days)**

- Pick Thanos. Implement his realm, 4 locations, action icons.
- Implement: move villain, gain power, play ally, vanquish hero (with a hand-placed dummy hero).
- UI: board renders, you can click icons, hand updates.
- Test: scripted "play 3 allies, vanquish a hero" sequence.

**M3 — Fate deck (2-3 days)**

- Implement Fate action: reveal 2, play 1, discard 1.
- Heroes covering icons actually block them.
- Conditions sit on locations and apply effects.
- Test: opponent Fates Thanos, hero lands, Thanos can't use covered icons until vanquish.

**M4 — Thanos full objective (3-5 days)**

- Infinity Stones collection logic.
- Snap action.
- `checkWin` triggers at all six stones + snap.
- Scripted-win test passes.

**M5 — Hela end-to-end (2-3 days)**

- Copy Thanos's structure, swap deck and objective.
- Should expose any places where you accidentally hardcoded Thanos-isms — fix them.

**M6 — Killmonger, Taskmaster, Ultron (2-3 days each)**

- By now, adding a villain is mostly: deck data + objective predicate + one or two `villainSpecific` ops.
- Taskmaster's contract system needs its own subsystem — budget extra time.
- Ultron's upgrade tree needs its own subsystem — budget extra time.

**M7 — AI move advisor (4-6 days)**

- Build `engine/advisor/` per section 8.
- Implement the `view(state, asPlayer)` projection and route the advisor through it.
- Implement turn-sequence enumeration with the action cap and pruning rules.
- Implement the shared state-value features and per-villain weight tables.
- Implement `explain.ts` deterministic rationale generator.
- Wire the `Suggest a move` button, `Auto-play this turn`, `Use as guide`, `Why?`, and `Other options` UI per §8.4.
- Pass all advisor tests in §8.7 — especially the "one action from a win → picks the win" sanity check for every villain.
- Confirm advisor is opt-in only and never moves without an explicit click.

**M8 — Hotseat polish (2-3 days)**

- Pass-device curtain.
- Per-player hand visibility rules.
- 2/3/4 player board layouts.
- Log panel.

**M9 — Asset wiring (variable)**

- User photographs/scans their own cards.
- Drop into `assets/cards/<villain>/<cardId>.png`.
- Fill `name` and `text` fields in deck.ts files.
- Run the game with full art.

**M10 — Package & ship to yourself**

- `electron-builder` config.
- Build `.dmg` / `.exe` / AppImage.
- Install on your machine, play with friends locally.

Realistic total: **4-7 weeks of evenings/weekends** for one focused developer using an AI assistant. Most of the time goes to per-card effect implementation and advisor tuning, not engine architecture.

---

## 11. Things that will bite you (read before starting)

- **Triggered abilities and timing windows.** "When a hero is defeated, do X" needs an event bus inside the reducer. Build this in M2 — retrofitting is painful.
- **Optional effects.** Many cards say "you *may* do X." The reducer must support a "skip" branch via `pendingPrompt`.
- **Targeting prompts.** Half the cards make the player choose a target. The reducer pauses, the UI shows a picker, the player resolves the prompt. Don't model these as nested function calls — make them first-class state with a `pendingPrompt` field.
- **Replacement effects.** "Instead of drawing, do X." Rare but exist. Have a hook in the draw step.
- **Out-of-turn effects.** Some Fate cards trigger during the active player's actions. Make sure your phase machine can re-enter resolution loops.
- **Reshuffles.** When a deck runs out, shuffle discard into deck. Trivial but easy to forget. Same for Fate decks.
- **Hand size enforcement.** Some effects let you draw extra; you don't discard down. Other effects say "discard to N." Encode the default correctly.
- **Villain-specific deck size and starting power.** Don't assume uniformity. Each villain has different starting numbers.

---

## 12. Stretch goals (only after M10)

- Full AI opponents that play entire turns themselves (reuse the advisor; just remove the "wait for human click" gate and let it run for non-human seats).
- LLM-backed natural-language commentary layer on top of the advisor (see §8.6).
- Online play via a relay server (WebSocket + room codes).
- Expansion villains (Mischief & Malice, Evil Assembled).
- Undo last action (since it's hotseat, very welcome).
- Replay file export/import.

---

## 13. Day-1 starter prompt to hand to Claude Code

> Read `marvel-villainous-plan.md` end to end before writing any code. Pay particular attention to section 0.1 (absolute faithfulness to the printed rulebook is non-negotiable — no house rules, no "improvements," no shortcuts) and section 8 (every player gets an AI move advisor that is opt-in, deterministic, and routed through the same rules engine the human uses). These two constraints govern every later decision.
>
> Initialize a new TypeScript Electron + React + Vite project named `marvel-villainous` using pnpm. Use Zustand for state and Vitest for tests. Set up the folder structure exactly as described in section 1 — including the `engine/advisor/` tree from section 8. Configure strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Add ESLint and Prettier with reasonable defaults. Create stub files in every directory described in the plan — empty exports are fine. Add a `vitest` script and one trivial passing test in `tests/engine/sanity.spec.ts`. Create empty `RULES_TRACE.md` and `RULES_QUESTIONS.md` files at the repo root with a one-line header explaining their purpose.
>
> Then implement Milestone M1 from the plan: Electron window opens, renders the game title with a "New Game" button that routes to a villain picker stub. Stop after M1 and ask me to review before starting M2.
>
> Throughout the build: when the rulebook is ambiguous, append the question to `RULES_QUESTIONS.md` and stop that thread of work until I answer. When you implement a rule, add an entry to `RULES_TRACE.md` pointing to the rulebook section it came from. Never invent rules to fill gaps.

After M1 lands, hand it sections 2 + 3 of this doc plus the M2 description and let it cook. When you reach M7, re-read section 8 carefully before starting — the advisor is the most failure-prone piece of the project and the easiest place to accidentally diverge from the printed rules.

---

*End of plan. Hand this file to Claude Code along with your physical rulebook when you're ready to start.*
