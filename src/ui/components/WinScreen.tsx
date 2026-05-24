// Win screen overlay — shows when `state.winner` is set.

import { useEngineCtx } from '../hooks/useGameEngine';
import { useGameState } from '../hooks/useGameEngine';
import { useNavigate } from 'react-router-dom';

export function WinScreen(): JSX.Element | null {
  const state = useGameState();
  const { clear } = useEngineCtx();
  const navigate = useNavigate();
  if (!state.winner) return null;
  const winner = state.players[state.winner];
  return (
    <section className="win-screen" role="dialog" aria-label="Game over">
      <h2 className="win-screen__title">VICTORY</h2>
      <p className="win-screen__body">
        <strong>{state.winner}</strong> playing <strong>{winner?.villain ?? '?'}</strong>{' '}
        completed their objective on turn {state.turn}.
      </p>
      <div className="win-screen__actions">
        <button
          className="button button--primary"
          onClick={() => {
            clear();
            navigate('/');
          }}
        >
          Main menu
        </button>
      </div>
    </section>
  );
}
