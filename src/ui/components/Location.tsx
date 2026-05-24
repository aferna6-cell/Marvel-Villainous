import type { DragEvent, MouseEvent } from 'react';
import { useEngine, useGameState } from '../hooks/useGameEngine';
import type { Location as LocationT, LocationIndex } from '../../engine/types';

interface LocationProps {
  location: LocationT;
  index: LocationIndex;
  /** Display-only mode for opponents' realms (no interaction). */
  readOnly?: boolean;
}

/** A single location strip: top row, in-play zones, bottom row covered by heroes. */
export function Location({ location, index, readOnly = false }: LocationProps): JSX.Element {
  const engine = useEngine();
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('Location: active player missing');
  const isCurrent = !readOnly && active.realm.villainTokenAt === index;
  const heroesCovering = location.heroesPresent.length > 0;

  const tryDispatch = (fn: () => void): void => {
    try {
      fn();
    } catch {
      // illegal action — silently ignored. CHUNK 6+ surfaces a UI toast.
    }
  };

  const onClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (readOnly) return;
    if (e.target !== e.currentTarget) return; // ignore clicks on children
    if (state.phase === 'move') {
      tryDispatch(() => engine.dispatch({ kind: 'moveVillain', to: index }));
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>): void => {
    if (!readOnly && isCurrent && state.phase === 'actions') e.preventDefault();
  };
  const onDrop = (e: DragEvent<HTMLDivElement>): void => {
    if (readOnly) return;
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/cardid');
    if (cardId && isCurrent) {
      tryDispatch(() => engine.dispatch({ kind: 'playCard', cardId }));
    }
  };

  const onUseIcon = (iconIndex: number): void => {
    if (readOnly || state.phase !== 'actions' || !isCurrent) return;
    tryDispatch(() => engine.dispatch({ kind: 'useIcon', location: index, iconIndex }));
  };

  const classes = [
    'location',
    isCurrent ? 'location--current' : '',
    !readOnly && state.phase === 'move' ? 'location--movable' : '',
    readOnly ? 'location--readonly' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} onDragOver={onDragOver} onDrop={onDrop}>
      <div className="location__name">{location.name || `Location ${index + 1}`}</div>
      {isCurrent ? <div className="location__token">⛧ Villain here</div> : null}

      <div className="location__icons location__icons--top">
        {location.topIcons.map((icon, i) => {
          const used = state.usedIcons.some(
            (u) => u.location === index && u.iconIndex === i,
          );
          return (
            <button
              key={`top-${i}`}
              className={`icon ${used ? 'icon--used' : ''}`}
              disabled={used || state.phase !== 'actions' || !isCurrent}
              onClick={(e) => {
                e.stopPropagation();
                onUseIcon(i);
              }}
            >
              {icon}
            </button>
          );
        })}
      </div>

      <div className="location__heroes">
        {location.heroesPresent.map((h) => (
          <span key={h.instanceId} className="card-mini card-mini--hero">
            ⚔ {h.cardId}
          </span>
        ))}
      </div>
      <div className="location__allies">
        {location.alliesPresent.map((a) => (
          <span key={a.instanceId} className="card-mini card-mini--ally">
            ⚒ {a.cardId}
          </span>
        ))}
      </div>
      <div className="location__items">
        {location.itemsPresent.map((it) => (
          <span key={it.instanceId} className="card-mini card-mini--item">
            ◆ {it.cardId}
          </span>
        ))}
      </div>
      <div className="location__conditions">
        {location.conditions.map((c) => (
          <span key={c.instanceId} className="card-mini card-mini--condition">
            ⚠ {c.cardId}
          </span>
        ))}
      </div>

      <div
        className={`location__icons location__icons--bottom ${
          heroesCovering ? 'location__icons--covered' : ''
        }`}
      >
        {location.bottomIcons.map((icon, i) => {
          const iconIndex = location.topIcons.length + i;
          const used = state.usedIcons.some(
            (u) => u.location === index && u.iconIndex === iconIndex,
          );
          return (
            <button
              key={`bot-${i}`}
              className={`icon ${used ? 'icon--used' : ''}`}
              disabled={
                heroesCovering || used || state.phase !== 'actions' || !isCurrent
              }
              title={heroesCovering ? 'covered by a hero' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                onUseIcon(iconIndex);
              }}
            >
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
