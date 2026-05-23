import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEngineCtx } from '../ui/hooks/useGameEngine';
import { createGameEngine } from '../engine/state';
import { newGame } from '../engine/setup';
import { Board } from '../ui/components/Board';
import { Hand } from '../ui/components/Hand';
import { TurnControls } from '../ui/components/TurnControls';
import { Log } from '../ui/components/Log';
import { FatePanel } from '../ui/components/FatePanel';

function MainMenu(): JSX.Element {
  return (
    <main className="screen screen--menu">
      <h1 className="title">Marvel Villainous</h1>
      <p className="subtitle">Infinite Power</p>
      <Link className="button button--primary" to="/setup">
        New Game
      </Link>
    </main>
  );
}

const ALL_VILLAINS = ['thanos', 'hela', 'killmonger', 'taskmaster', 'ultron'] as const;

function VillainPicker(): JSX.Element {
  const { setEngine } = useEngineCtx();
  const navigate = useNavigate();
  const start = (villains: ('thanos' | 'hela' | 'killmonger' | 'taskmaster' | 'ultron')[]): void => {
    setEngine(createGameEngine(newGame({ villains: [...villains], seed: 1 })));
    navigate('/game');
  };
  return (
    <main className="screen screen--setup">
      <h2 className="title title--small">Choose your villain</h2>
      <p className="hint">Solo (single villain, no Fate):</p>
      {ALL_VILLAINS.map((v) => (
        <button key={v} className="button" onClick={() => start([v])}>
          Solo · {v}
        </button>
      ))}
      <p className="hint">Multi-player (Fate testing):</p>
      <button className="button button--primary" onClick={() => start(['thanos', 'hela'])}>
        2-Player · Thanos vs Hela
      </button>
      <button className="button" onClick={() => start(['thanos', 'hela', 'killmonger', 'ultron'])}>
        4-Player · Thanos / Hela / Killmonger / Ultron
      </button>
      <p className="hint">
        Per-card ability behavior is still being wired in — see
        <code> RULES_QUESTIONS.md</code> for the open items.
      </p>
      <Link className="button" to="/">
        Back
      </Link>
    </main>
  );
}

function GameScreen(): JSX.Element {
  const { engine, clear } = useEngineCtx();
  if (!engine) return <Navigate to="/" replace />;
  return (
    <main className="screen screen--game">
      <header className="game-header">
        <h2 className="title title--small">Marvel Villainous</h2>
        <button
          className="button"
          onClick={() => {
            clear();
          }}
        >
          Quit
        </button>
      </header>
      <Board />
      <TurnControls />
      <Hand />
      <FatePanel />
      <Log />
    </main>
  );
}

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/setup" element={<VillainPicker />} />
      <Route path="/game" element={<GameScreen />} />
    </Routes>
  );
}
