import type { DragEvent, MouseEvent } from 'react';
import { useContext } from 'react';
import { useEngine, useGameState } from '../hooks/useGameEngine';
import { AdvisorGuideContext } from '../hooks/useAdvisorGuide';
import type { InstanceId, Location as LocationT, LocationIndex, PlayerId } from '../../engine/types';

interface LocationProps {
  location: LocationT;
  index: LocationIndex;
  /** Which player owns this realm. */
  owner: PlayerId;
  /** Display-only mode for opponents' realms (no interaction). */
  readOnly?: boolean;
}

/** A single location strip: top row, in-play zones, bottom row covered by heroes. */
function Tokens({ t }: { t: Record<string, number> }): JSX.Element | null {
  const entries = Object.entries(t).filter(([k, v]) => v !== 0 && k !== 'mark');
  if (entries.length === 0) return null;
  return (
    <span className="card-mini__tokens">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className={`card-mini__token card-mini__token--${k}`}
          title={`${k}: ${v}`}
        >
          {k === 'strength' ? (v > 0 ? `+${v}` : `${v}`) : `${k}:${v}`}
        </span>
      ))}
    </span>
  );
}

export function Location({ location, index, owner, readOnly = false }: LocationProps): JSX.Element {
  const engine = useEngine();
  const state = useGameState();
  const guide = useContext(AdvisorGuideContext);
  const hl = guide?.highlighted ?? null;
  const isHlMove = hl?.kind === 'moveVillain' && hl.to === index;
  const isHlPlay = hl?.kind === 'playCard'; // any location
  const isHlIcon = (iconIndex: number): boolean =>
    hl?.kind === 'useIcon' && hl.location === index && hl.iconIndex === iconIndex;
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
    // Q5: allies can be played to ANY location in your Domain — allow drop
    // on any of your locations during the actions phase.
    if (!readOnly && state.phase === 'actions') e.preventDefault();
  };
  const onDrop = (e: DragEvent<HTMLDivElement>): void => {
    if (readOnly) return;
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/cardid');
    if (cardId) {
      tryDispatch(() =>
        engine.dispatch({
          kind: 'playCard',
          cardId,
          target: { kind: 'location', player: state.activePlayer, location: index },
        }),
      );
    }
  };

  const onUseIcon = (iconIndex: number): void => {
    if (readOnly || state.phase !== 'actions' || !isCurrent) return;
    tryDispatch(() => engine.dispatch({ kind: 'useIcon', location: index, iconIndex }));
  };

  // Right-click an in-play card to discard it (any zone). Players use this
  // to resolve card-text effects the engine doesn't auto-apply (§0): "defeat
  // this Hero", "discard this Ally", etc. Only enabled on the active
  // player's own realm — opponent realms are read-only display.
  const onRemove = (e: MouseEvent<HTMLElement>, instanceId: InstanceId): void => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Remove this card from play?')) return;
    tryDispatch(() => engine.dispatch({ kind: 'removeFromPlay', owner, instanceId }));
  };

  const classes = [
    'location',
    isCurrent ? 'location--current' : '',
    !readOnly && state.phase === 'move' ? 'location--movable' : '',
    readOnly ? 'location--readonly' : '',
    !readOnly && (isHlMove || isHlPlay) ? 'location--advisor-hint' : '',
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
              className={`icon ${used ? 'icon--used' : ''} ${isHlIcon(i) ? 'icon--advisor-hint' : ''}`}
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
          <span
            key={h.instanceId}
            className="card-mini card-mini--hero"
            onContextMenu={(e) => onRemove(e, h.instanceId)}
            title="right-click to remove from play"
          >
            ⚔ {h.cardId}
            {h.soulMark ? <span className="card-mini__mark" title="Soul Mark">☥</span> : null}
            <Tokens t={h.tokens} />
          </span>
        ))}
      </div>
      <div className="location__allies">
        {location.alliesPresent.map((a) => (
          <span
            key={a.instanceId}
            className="card-mini card-mini--ally"
            onContextMenu={(e) => onRemove(e, a.instanceId)}
            title="right-click to remove from play"
          >
            ⚒ {a.cardId}
            <Tokens t={a.tokens} />
          </span>
        ))}
      </div>
      <div className="location__items">
        {location.itemsPresent.map((it) => (
          <span
            key={it.instanceId}
            className="card-mini card-mini--item"
            onContextMenu={(e) => onRemove(e, it.instanceId)}
            title={
              it.attachedTo
                ? `right-click to remove · attached to ${it.attachedTo}`
                : 'right-click to remove from play'
            }
          >
            ◆ {it.cardId}
            {it.attachedTo ? <span className="card-mini__attach" title="attached">⤴</span> : null}
            <Tokens t={it.tokens} />
          </span>
        ))}
      </div>
      <div className="location__conditions">
        {location.conditions.map((c) => (
          <span
            key={c.instanceId}
            className="card-mini card-mini--condition"
            onContextMenu={(e) => onRemove(e, c.instanceId)}
            title="right-click to remove from play"
          >
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
              className={`icon ${used ? 'icon--used' : ''} ${isHlIcon(iconIndex) ? 'icon--advisor-hint' : ''}`}
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
