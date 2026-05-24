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
  const opponents = state.playerOrder.filter((id) => id !== state.activePlayer);
  const canFate =
    state.phase === 'actions' && state.pendingPrompt === null && opponents.length > 0;

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
          Hand: <strong>{active.hand.length}</strong> · Deck:{' '}
          <strong>{active.deck.length}</strong>
        </span>
        <span>
          Fate deck: <strong>{state.fateDeck.length}</strong> (discard{' '}
          {state.fateDiscard.length})
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
        <button
          className="button"
          disabled={!canFate}
          onClick={() => tryDispatch(() => engine.dispatch({ kind: 'fate' }))}
          title="Reveal the top card of the Fate deck. After seeing it you choose which opponent to play it against (or discard it)."
        >
          Fate
        </button>
        <button
          className="button"
          disabled={!canEndTurn}
          onClick={() => tryDispatch(() => engine.dispatch({ kind: 'endTurn' }))}
        >
          End turn
        </button>
        <button
          className="button"
          disabled={state.history.length === 0}
          onClick={() => tryDispatch(() => engine.dispatch({ kind: 'undo' }))}
          title="Rewind the engine one action. Useful for misclicks."
        >
          Undo ({state.history.length})
        </button>
        <span className="turn-controls__manual" title="Hand-resolve card text the engine doesn't auto-apply.">
          <button
            className="button button--mini"
            onClick={() => tryDispatch(() => engine.dispatch({ kind: 'adjustPower', player: state.activePlayer, delta: -1 }))}
            aria-label="lose 1 power"
          >
            −Pow
          </button>
          <button
            className="button button--mini"
            onClick={() => tryDispatch(() => engine.dispatch({ kind: 'adjustPower', player: state.activePlayer, delta: +1 }))}
            aria-label="gain 1 power"
          >
            +Pow
          </button>
          <button
            className="button button--mini"
            onClick={() => tryDispatch(() => engine.dispatch({ kind: 'drawCards', player: state.activePlayer, n: 1 }))}
            aria-label="draw 1 card"
          >
            +Draw
          </button>
        </span>
        <label
          className="turn-controls__strict"
          title="Q2: when ON, playing a card / attacking / fating / discarding / relocating each require an unused matching icon at your villain's current location and consume it. Off = relaxed state tracker (you handle the rule yourselves)."
        >
          <input
            type="checkbox"
            checked={state.strictIconMode}
            onChange={(e) =>
              tryDispatch(() =>
                engine.dispatch({ kind: 'setStrictIconMode', value: e.target.checked }),
              )
            }
          />
          Strict icons
        </label>
      </div>
    </section>
  );
}
