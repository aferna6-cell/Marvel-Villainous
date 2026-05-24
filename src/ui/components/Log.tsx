import { useEffect, useRef } from 'react';
import { useGameState } from '../hooks/useGameEngine';

/** Scrollable game log. Newest entries at the bottom; auto-scrolls into view. */
export function Log(): JSX.Element {
  const state = useGameState();
  const tail = state.log.slice(-50);
  const endRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
  }, [state.log.length]);

  return (
    <section className="log">
      <h3 className="log__title">Log</h3>
      <ol className="log__entries">
        {tail.map((entry, i) => (
          <li
            key={i}
            className="log__entry"
            ref={i === tail.length - 1 ? endRef : undefined}
          >
            <span className="log__turn">T{entry.turn}</span>
            <span className="log__player">{entry.player}</span>
            <span className="log__message">{entry.message}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
