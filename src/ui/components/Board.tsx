import { useGameState } from '../hooks/useGameEngine';
import { Realm } from './Realm';

/**
 * The active player's realm. A small banner above shows the central play
 * area (Global Event slot, rulebook §I).
 */
export function Board(): JSX.Element {
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('Board: active player missing');
  return (
    <section className="board">
      {state.globalEvent ? (
        <div className="board__global-event" role="status">
          <span className="board__global-event-label">Global Event in play:</span>{' '}
          <strong>{state.globalEvent.cardId}</strong>
        </div>
      ) : null}
      <Realm realm={active.realm} />
    </section>
  );
}
