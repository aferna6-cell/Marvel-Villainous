// React glue for the pure engine. The engine is a Zustand vanilla store; this
// hook wraps it with `useSyncExternalStore` so components re-render whenever
// the game state changes. The engine instance is shared via React Context so
// every screen sees the same game.

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import type { GameEngine } from '../../engine/state';
import type { GameState } from '../../engine/types';

export interface EngineCtxValue {
  engine: GameEngine | null;
  setEngine: (engine: GameEngine) => void;
  clear: () => void;
}

export const EngineContext = createContext<EngineCtxValue | null>(null);

export function useEngineCtx(): EngineCtxValue {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngineCtx: missing <EngineContext.Provider>');
  return ctx;
}

/** Get the active engine; throws if a game has not been started. */
export function useEngine(): GameEngine {
  const { engine } = useEngineCtx();
  if (!engine) throw new Error('useEngine: no engine — start a game first');
  return engine;
}

/** Subscribe to the current `GameState`. Re-renders on every state change. */
export function useGameState(): GameState {
  const engine = useEngine();
  const subscribe = useCallback(
    (cb: () => void) => engine.subscribe(() => cb()),
    [engine],
  );
  return useSyncExternalStore(subscribe, engine.getState);
}
