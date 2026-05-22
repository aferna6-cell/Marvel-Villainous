import { useGameState } from '../hooks/useGameEngine';
import { Realm } from './Realm';

/**
 * The active player's realm. CHUNK 5 only shows one realm (Thanos in M2);
 * multi-realm layouts arrive when more villains land.
 */
export function Board(): JSX.Element {
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('Board: active player missing');
  return (
    <section className="board">
      <Realm realm={active.realm} />
    </section>
  );
}
