import { useGameState } from '../hooks/useGameEngine';
import { Card } from './Card';

/** The active player's hand, with cards draggable onto a location. */
export function Hand(): JSX.Element {
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('Hand: active player missing');
  return (
    <section className="hand">
      <h3 className="hand__title">
        Hand · {active.hand.length} card{active.hand.length === 1 ? '' : 's'}
      </h3>
      <div className="hand__cards">
        {active.hand.map((cardId, i) => (
          <Card key={`${cardId}-${i}`} cardId={cardId} draggable />
        ))}
      </div>
      <p className="hand__hint">
        Drag a card onto your current location to play it (Actions phase).
      </p>
    </section>
  );
}
