import { useGameState } from '../hooks/useGameEngine';

/** Scrollable game log. Newest entries at the bottom. */
export function Log(): JSX.Element {
  const state = useGameState();
  const tail = state.log.slice(-30);
  return (
    <section className="log">
      <h3 className="log__title">Log</h3>
      <ol className="log__entries">
        {tail.map((entry, i) => (
          <li key={i} className="log__entry">
            <span className="log__turn">T{entry.turn}</span>
            <span className="log__player">{entry.player}</span>
            <span className="log__message">{entry.message}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
