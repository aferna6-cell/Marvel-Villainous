import { useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEngineCtx } from '../ui/hooks/useGameEngine';
import { createGameEngine } from '../engine/state';
import { newGame } from '../engine/setup';
import { Board } from '../ui/components/Board';
import { Hand } from '../ui/components/Hand';
import { TurnControls } from '../ui/components/TurnControls';
import { Log } from '../ui/components/Log';
import { FatePanel } from '../ui/components/FatePanel';
import { PromptPanel } from '../ui/components/PromptPanel';
import { WinScreen } from '../ui/components/WinScreen';
import { PassDeviceCurtain } from '../ui/components/PassDeviceCurtain';
import { ActionMenu } from '../ui/components/ActionMenu';
import { ObjectiveTracker } from '../ui/components/ObjectiveTracker';
import { AdvisorPanel } from '../ui/components/AdvisorPanel';
import { AdvisorGuideContext, useAdvisorGuideState } from '../ui/hooks/useAdvisorGuide';

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
type Villain = typeof ALL_VILLAINS[number];

const VILLAIN_LABEL: Record<Villain, string> = {
  thanos: 'Thanos',
  hela: 'Hela',
  killmonger: 'Killmonger',
  taskmaster: 'Taskmaster',
  ultron: 'Ultron',
};

const VILLAIN_GOAL: Record<Villain, string> = {
  thanos: 'Collect all 6 Infinity Stones.',
  hela: "Build to 8 Allies + Soul Marks at Odin's Vault.",
  killmonger: 'Defeat Klaw + Black Panther, plant 2 Explosives.',
  taskmaster: '4 Allies at 4 different locations, each Strength 5+.',
  ultron: 'Reveal the Age of Ultron upgrade.',
};

function VillainPicker(): JSX.Element {
  const { setEngine } = useEngineCtx();
  const navigate = useNavigate();
  const [seats, setSeats] = useState<(Villain | null)[]>([null, null]);

  const start = (villains: Villain[]): void => {
    setEngine(createGameEngine(newGame({ villains: [...villains], seed: Date.now() % 1_000_000 })));
    navigate('/game');
  };

  const pickSeat = (idx: number, v: Villain | null): void => {
    const next = [...seats];
    next[idx] = v;
    setSeats(next);
  };

  const addSeat = (): void => {
    if (seats.length < 4) setSeats([...seats, null]);
  };
  const removeSeat = (): void => {
    if (seats.length > 2) setSeats(seats.slice(0, -1));
  };

  const chosen = seats.filter((s): s is Villain => s !== null);
  const allFilled = chosen.length === seats.length;
  const duplicates = chosen.length !== new Set(chosen).size;
  const canStart = allFilled && !duplicates;

  return (
    <main className="screen screen--setup">
      <h2 className="title title--small">Choose your villains</h2>

      <section className="picker-section">
        <p className="hint">Solo — try any villain on their own:</p>
        <div className="picker-row">
          {ALL_VILLAINS.map((v) => (
            <button key={v} className="button" onClick={() => start([v])}>
              Solo · {VILLAIN_LABEL[v]}
            </button>
          ))}
        </div>
      </section>

      <section className="picker-section">
        <p className="hint">
          Multi-player — pick a villain for each seat (2–4 players):
        </p>
        <div className="picker-seats">
          {seats.map((sel, idx) => (
            <div className="picker-seat" key={`seat-${idx}`}>
              <div className="picker-seat__label">Seat {idx + 1}</div>
              <div className="picker-seat__choices">
                {ALL_VILLAINS.map((v) => {
                  const takenByAnotherSeat = seats.some((s, i) => i !== idx && s === v);
                  const isMine = sel === v;
                  return (
                    <button
                      key={v}
                      className={`button button--mini ${isMine ? 'button--primary' : ''}`}
                      disabled={takenByAnotherSeat && !isMine}
                      onClick={() => pickSeat(idx, isMine ? null : v)}
                      title={VILLAIN_GOAL[v]}
                    >
                      {VILLAIN_LABEL[v]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="picker-controls">
          <button className="button button--mini" onClick={removeSeat} disabled={seats.length <= 2}>
            − Seat
          </button>
          <button className="button button--mini" onClick={addSeat} disabled={seats.length >= 4}>
            + Seat
          </button>
          <button
            className="button button--primary"
            onClick={() => start(chosen)}
            disabled={!canStart}
          >
            Start {seats.length}-Player Game
          </button>
        </div>
        {duplicates ? (
          <p className="picker-warning">Each seat must be a different villain.</p>
        ) : null}
      </section>

      <p className="hint" style={{ marginTop: '1rem' }}>
        Hover any villain button to see their printed objective.
      </p>
      <Link className="button" to="/">
        Back
      </Link>
    </main>
  );
}

function GameScreen(): JSX.Element {
  const { engine, clear } = useEngineCtx();
  const guide = useAdvisorGuideState();
  if (!engine) return <Navigate to="/" replace />;
  return (
    <AdvisorGuideContext.Provider value={guide}>
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
        <ActionMenu />
        <AdvisorPanel />
        <ObjectiveTracker />
        <Hand />
        <FatePanel />
        <PromptPanel />
        <Log />
        <PassDeviceCurtain />
        <WinScreen />
      </main>
    </AdvisorGuideContext.Provider>
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
