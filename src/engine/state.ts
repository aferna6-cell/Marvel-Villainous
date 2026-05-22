// The pure game store. Holds a single GameState and applies actions through a
// pure reducer (marvel-villainous-plan.md §2). The reducer is intentionally
// unimplemented here — CHUNK 3 fills it. For now every action kind throws
// "not implemented" so callers fail loudly rather than silently no-op.

import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Action, GameState } from './types';

function assertNever(value: never): never {
  throw new Error(`reduce: unhandled action ${JSON.stringify(value)}`);
}

/**
 * Pure reducer: `(state, action) => newState`. No randomness inside — RNG is
 * consulted at action-creation time and threaded through `GameState.rngCursor`.
 */
export function reduce(_state: GameState, action: Action): GameState {
  switch (action.kind) {
    case 'startTurn':
    case 'moveVillain':
    case 'useIcon':
    case 'playCard':
    case 'attackHero':
    case 'discardCards':
    case 'drawToHandSize':
    case 'fateOpponent':
    case 'resolvePrompt':
    case 'endTurn':
      throw new Error(`reduce: action "${action.kind}" not implemented`);
    default:
      return assertNever(action);
  }
}

interface EngineState {
  game: GameState;
}

/** Listener called after each successful dispatch. */
export type EngineListener = (state: GameState, previous: GameState) => void;

/** A thin, framework-agnostic handle over the Zustand vanilla store. */
export interface GameEngine {
  getState: () => GameState;
  dispatch: (action: Action) => void;
  subscribe: (listener: EngineListener) => () => void;
}

/** Create a game engine seeded with an initial GameState. */
export function createGameEngine(initialState: GameState): GameEngine {
  const store: StoreApi<EngineState> = createStore<EngineState>(() => ({
    game: initialState,
  }));

  return {
    getState: () => store.getState().game,
    dispatch: (action) => {
      store.setState((s) => ({ game: reduce(s.game, action) }));
    },
    subscribe: (listener) =>
      store.subscribe((s, prev) => {
        listener(s.game, prev.game);
      }),
  };
}
