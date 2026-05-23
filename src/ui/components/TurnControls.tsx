import { useEngine, useGameState } from '../hooks/useGameEngine';

/**
 * Phase indicator and turn-control buttons. The "End move phase" button is
 * informational — the engine auto-advances from the Move phase to Actions
 * the moment the villain has moved.
 */
export function TurnControls(): JSX.Element {
  const engine = useEngine();
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('TurnControls: active player missing');

  const canEndTurn =
    state.phase === 'actions' || state.phase === 'fate' || state.phase === 'end';
  const canStartTurn = state.phase === 'start';
  const canFate = state.phase === 'actions' && state.pendingPrompt === null;
  const opponents = state.playerOrder.filter((id) => id !== state.activePlayer);

  const tryDispatch = (fn: () => void): void => {
    try {
      fn();
    } catch {
      // illegal — ignored.
    }
  };

  return (
    <section className="turn-controls">
      <div className="turn-controls__status">
        <span>
          Active: <strong>{state.activePlayer}</strong> ({active.villain})
        </span>
        <span>
          Phase: <strong>{state.phase}</strong>
        </span>
        <span>
          Power: <strong>{active.power}</strong>
        </span>
        <span>
          Turn: <strong>{state.turn}</strong>
        </span>
      </div>
      <div className="turn-controls__buttons">
        {canStartTurn ? (
          <button
            className="button button--primary"
            onClick={() => tryDispatch(() => engine.dispatch({ kind: 'startTurn' }))}
          >
            Start turn
          </button>
        ) : null}
        <button
          className="button"
          disabled
          title="The engine auto-advances when the villain has moved."
        >
          End move phase
        </button>
        {opponents.map((opp) => (
          <button
            key={`fate-${opp}`}
            className="button"
            disabled={!canFate}
            onClick={() =>
              tryDispatch(() => engine.dispatch({ kind: 'fateOpponent', opponent: opp }))
            }
            title={`Reveal one card from the shared Fate deck and play it against ${opp}.`}
          >
            Fate {opp}
          </button>
        ))}
        <button
          className="button"
          disabled={!canEndTurn}
          onClick={() => tryDispatch(() => engine.dispatch({ kind: 'endTurn' }))}
        >
          End turn
        </button>
      </div>
    </section>
  );
}
