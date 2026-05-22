import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEngineCtx } from '../ui/hooks/useGameEngine';
import { createGameEngine } from '../engine/state';
import { newGame } from '../engine/setup';
import { Board } from '../ui/components/Board';
import { Hand } from '../ui/components/Hand';
import { TurnControls } from '../ui/components/TurnControls';
import { Log } from '../ui/components/Log';

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

function VillainPicker(): JSX.Element {
  const { setEngine } = useEngineCtx();
  const navigate = useNavigate();
  const startThanos = (): void => {
    setEngine(createGameEngine(newGame({ villains: ['thanos'], seed: 1 })));
    navigate('/game');
  };
  return (
    <main className="screen screen--setup">
      <h2 className="title title--small">Choose your villain</h2>
      <button className="button button--primary" onClick={startThanos}>
        Thanos
      </button>
      <p className="hint">
        Other villains arrive in later chunks. Card and board data are stubs
        until you transcribe your physical copy — see
        <code> assets/CONTENT_TODO.md</code>.
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
