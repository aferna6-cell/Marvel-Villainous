import { useGameState } from '../hooks/useGameEngine';
import { Realm } from './Realm';

/**
 * Render every seated player's realm — active player's first (full-size,
 * fully interactive), opponents below (display-only, so the active player
 * can see where their Fate plays land). A small banner above shows the
 * central play area (Global Event slot, rulebook §I).
 */
export function Board(): JSX.Element {
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('Board: active player missing');

  const opponents = state.playerOrder
    .filter((id) => id !== state.activePlayer)
    .map((id) => state.players[id])
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <section className="board">
      {state.globalEvent ? (
        <div className="board__global-event" role="status">
          <span className="board__global-event-label">Global Event in play:</span>{' '}
          <strong>{state.globalEvent.cardId}</strong>
        </div>
      ) : null}
      <Realm realm={active.realm} />
      {opponents.length > 0 ? (
        <div className="board__opponents">
          <h4 className="board__opponents-title">Opponents</h4>
          {opponents.map((p) => (
            <div key={p.id} className="board__opponent">
              <div className="board__opponent-header">
                <strong>{p.id}</strong> · {p.villain} · power {p.power}
              </div>
              <Realm realm={p.realm} readOnly />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
