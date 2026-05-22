import type { DragEvent } from 'react';
import { getCard } from '../../engine/cards/registry';
import type { CardId } from '../../engine/types';

interface CardProps {
  cardId: CardId;
  /** When true, the card supports HTML5 drag for playing from hand. */
  draggable?: boolean;
}

const TYPE_COLOR: Record<string, string> = {
  ally: '#7a3e9d',
  item: '#3e7a9d',
  effect: '#9d6e3e',
  condition: '#9d3e3e',
  hero: '#3e9d63',
  fateEffect: '#5a5a8a',
};

/** Placeholder card art: a coloured rectangle showing the card id + stats. */
export function Card({ cardId, draggable = false }: CardProps): JSX.Element {
  const def = getCard(cardId);
  const color = (def && TYPE_COLOR[def.type]) ?? '#444';

  const onDragStart = (e: DragEvent<HTMLDivElement>): void => {
    e.dataTransfer.setData('text/cardid', cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="card"
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      style={{ background: color }}
      title={cardId}
    >
      <div className="card__cost">{def?.cost ?? '?'}</div>
      <div className="card__id">{cardId}</div>
      <div className="card__type">{def?.type ?? '—'}</div>
      {def?.strength !== undefined ? (
        <div className="card__strength">{def.strength}</div>
      ) : null}
    </div>
  );
}
