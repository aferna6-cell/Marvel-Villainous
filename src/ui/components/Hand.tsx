import { useEngine, useGameState } from '../hooks/useGameEngine';
import { Card } from './Card';
import { getCard } from '../../engine/cards/registry';

/**
 * The active player's hand. Two ways to play a card:
 *
 *  1. Drag a card onto any location in your Domain.
 *  2. Click a card to play it at your villain's current location (the
 *     most-used place, and the only place Items can land per the
 *     rulebook). If the card can't be played there (insufficient Power,
 *     wrong phase, no `play` icon in strict mode) the engine refuses
 *     and the card stays in hand — an alert explains why.
 */
export function Hand(): JSX.Element {
  const engine = useEngine();
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('Hand: active player missing');

  const onCardClick = (cardId: string): void => {
    if (state.phase !== 'actions') return;
    const def = getCard(cardId);
    if (!def) return;
    try {
      engine.dispatch({
        kind: 'playCard',
        cardId,
        target: {
          kind: 'location',
          player: state.activePlayer,
          location: active.realm.villainTokenAt,
        },
      });
    } catch (e) {
      alert(`Can't play ${def.name || cardId}: ${String(e).replace('Error: ', '')}`);
    }
  };

  return (
    <section className="hand">
      <h3 className="hand__title">
        Hand · {active.hand.length} card{active.hand.length === 1 ? '' : 's'}
      </h3>
      <div className="hand__cards">
        {active.hand.map((cardId, i) => (
          <div
            key={`${cardId}-${i}`}
            className="hand__card-slot"
            onClick={() => onCardClick(cardId)}
            title="Click to play at your current location, or drag to any location"
            role="button"
          >
            <Card cardId={cardId} draggable />
          </div>
        ))}
      </div>
      <p className="hand__hint">
        Click a card to play it at your current location, or drag it onto any location.
      </p>
    </section>
  );
}
