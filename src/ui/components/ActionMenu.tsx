// Action menu — extra buttons for the player-driven actions beyond move/play:
// Vanquish a hero (multi-ally), Discard cards, Activate icon (villain
// specific), Claim victory.

import { useState } from 'react';
import { useEngine, useGameState } from '../hooks/useGameEngine';
import { getCard } from '../../engine/cards/registry';
import type { CardId, LocationIndex } from '../../engine/types';

type Mode = 'closed' | 'vanquish' | 'discard';

export function ActionMenu(): JSX.Element {
  const engine = useEngine();
  const state = useGameState();
  const [mode, setMode] = useState<Mode>('closed');

  const active = state.players[state.activePlayer];
  if (!active) throw new Error('ActionMenu: active player missing');

  const canAct = state.phase === 'actions' && state.pendingPrompt === null && state.winner === null;
  const tryDispatch = (fn: () => void): void => {
    try { fn(); } catch { /* illegal — ignored */ }
  };

  return (
    <section className="action-menu">
      <div className="action-menu__buttons">
        <button
          className="button"
          disabled={!canAct}
          onClick={() => setMode(mode === 'vanquish' ? 'closed' : 'vanquish')}
        >
          Vanquish
        </button>
        <button
          className="button"
          disabled={!canAct || active.hand.length === 0}
          onClick={() => setMode(mode === 'discard' ? 'closed' : 'discard')}
        >
          Discard
        </button>
        <button
          className="button button--danger"
          disabled={state.winner !== null}
          onClick={() => {
            if (confirm(`Claim victory for ${state.activePlayer} (${active.villain})?`)) {
              tryDispatch(() => engine.dispatch({ kind: 'claimVictory' }));
            }
          }}
          title="Self-attest your printed objective is met — the engine ratifies by ending the game."
        >
          Claim victory
        </button>
      </div>
      {mode === 'vanquish' ? <VanquishPanel onClose={() => setMode('closed')} /> : null}
      {mode === 'discard' ? <DiscardPanel onClose={() => setMode('closed')} /> : null}
    </section>
  );
}

/** Pick a hero in your own realm, then pick allies at the same location. */
function VanquishPanel({ onClose }: { onClose: () => void }): JSX.Element {
  const engine = useEngine();
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('VanquishPanel: active player missing');

  const heroes: { cardId: CardId; loc: LocationIndex; strength: number }[] = [];
  active.realm.locations.forEach((loc, i) => {
    for (const h of loc.heroesPresent) {
      heroes.push({
        cardId: h.cardId,
        loc: i as LocationIndex,
        strength: getCard(h.cardId)?.strength ?? 0,
      });
    }
  });

  const [heroChoice, setHeroChoice] = useState<{ cardId: CardId; loc: LocationIndex } | null>(null);
  const [selectedAllies, setSelectedAllies] = useState<Set<CardId>>(new Set());

  const allies = heroChoice
    ? active.realm.locations[heroChoice.loc]?.alliesPresent.map((a) => ({
        cardId: a.cardId,
        strength: (getCard(a.cardId)?.strength ?? 0) + a.strengthModifier,
      })) ?? []
    : [];

  const summed = allies.reduce(
    (acc, a) => acc + (selectedAllies.has(a.cardId) ? a.strength : 0),
    0,
  );
  const heroStrength = heroChoice
    ? heroes.find((h) => h.cardId === heroChoice.cardId)?.strength ?? 0
    : 0;

  const submit = (): void => {
    if (!heroChoice) return;
    try {
      engine.dispatch({
        kind: 'attackHero',
        allyIds: [...selectedAllies],
        heroId: heroChoice.cardId,
      });
      onClose();
    } catch (e) {
      alert(String(e));
    }
  };

  return (
    <div className="action-panel" role="dialog" aria-label="Vanquish">
      <h4>Vanquish a hero</h4>
      {heroes.length === 0 ? (
        <p>No heroes in your realm.</p>
      ) : !heroChoice ? (
        <>
          <p>Select the hero to vanquish:</p>
          {heroes.map((h) => (
            <button
              key={`${h.loc}-${h.cardId}`}
              className="button"
              onClick={() => {
                setHeroChoice({ cardId: h.cardId, loc: h.loc });
                setSelectedAllies(new Set());
              }}
            >
              {h.cardId} (str {h.strength}) at loc {h.loc + 1}
            </button>
          ))}
        </>
      ) : (
        <>
          <p>
            Hero: <strong>{heroChoice.cardId}</strong> (str {heroStrength}). Select allies at the
            same location whose summed Strength ≥ {heroStrength}.
          </p>
          {allies.length === 0 ? <p>No allies at that location.</p> : null}
          {allies.map((a) => (
            <label key={a.cardId} className="action-panel__choice">
              <input
                type="checkbox"
                checked={selectedAllies.has(a.cardId)}
                onChange={(e) => {
                  const next = new Set(selectedAllies);
                  if (e.target.checked) next.add(a.cardId);
                  else next.delete(a.cardId);
                  setSelectedAllies(next);
                }}
              />
              {a.cardId} (str {a.strength})
            </label>
          ))}
          <p>
            Summed strength: <strong>{summed}</strong> / {heroStrength}
          </p>
          <button
            className="button button--primary"
            disabled={summed < heroStrength}
            onClick={submit}
          >
            Vanquish
          </button>
        </>
      )}
      <button className="button" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}

/** Pick cards to discard from hand. */
function DiscardPanel({ onClose }: { onClose: () => void }): JSX.Element {
  const engine = useEngine();
  const state = useGameState();
  const active = state.players[state.activePlayer];
  if (!active) throw new Error('DiscardPanel: active player missing');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const submit = (): void => {
    const cardIds = [...selected].map((i) => active.hand[i]).filter((x): x is string => !!x);
    if (cardIds.length === 0) return onClose();
    try {
      engine.dispatch({ kind: 'discardCards', cardIds });
      onClose();
    } catch (e) {
      alert(String(e));
    }
  };

  return (
    <div className="action-panel" role="dialog" aria-label="Discard">
      <h4>Discard cards from your hand</h4>
      {active.hand.map((cardId, i) => (
        <label key={`${cardId}-${i}`} className="action-panel__choice">
          <input
            type="checkbox"
            checked={selected.has(i)}
            onChange={(e) => {
              const next = new Set(selected);
              if (e.target.checked) next.add(i);
              else next.delete(i);
              setSelected(next);
            }}
          />
          {cardId}
        </label>
      ))}
      <button
        className="button button--primary"
        disabled={selected.size === 0}
        onClick={submit}
      >
        Discard {selected.size > 0 ? `${selected.size} card(s)` : ''}
      </button>
      <button className="button" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
