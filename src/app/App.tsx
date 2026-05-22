import { useCallback, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { EngineContext, type EngineCtxValue } from '../ui/hooks/useGameEngine';
import type { GameEngine } from '../engine/state';

export function App(): JSX.Element {
  const [engine, setEngineState] = useState<GameEngine | null>(null);

  const setEngine = useCallback((next: GameEngine) => setEngineState(next), []);
  const clear = useCallback(() => setEngineState(null), []);

  const value: EngineCtxValue = { engine, setEngine, clear };
  return (
    <EngineContext.Provider value={value}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </EngineContext.Provider>
  );
}
