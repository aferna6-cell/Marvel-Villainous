// FatePanel — UI for resolving the Fate prompt.
//
// Two-step flow (Q9 + Q10):
//   1. Active player reveals one card from the shared Fate deck (rulebook
//      Setup §3) — chooses target opponent OR discards.
//   2. If the card is a Hero or Condition, a follow-up prompt lets the
//      active player pick the destination location on the opponent's realm.

import { useEngine, useGameState } from '../hooks/useGameEngine';
import { Card } from './Card';
import type { LocationIndex, PlayerId } from '../../engine/types';

export function FatePanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const prompt = state.pendingPrompt;
  if (!prompt) return null;
  if (
    prompt.continuation?.kind !== 'fatePlay' &&
    prompt.continuation?.kind !== 'fatePlaceLocation'
  ) {
    return null;
  }

  const tryDispatch = (fn: () => void): void => {
    try { fn(); } catch (e) { alert(String(e)); }
  };

  if (prompt.continuation.kind === 'fatePlay') {
    const { eligibleTargets, revealed } = prompt.continuation;
    const cardId = revealed[0];
    if (cardId === undefined) return null;
    const onTarget = (player: PlayerId): void =>
      tryDispatch(() =>
        engine.dispatch({
          kind: 'resolvePrompt',
          choice: { kind: 'target', target: { kind: 'player', player } },
        }),
      );
    const onDiscard = (): void =>
      tryDispatch(() => engine.dispatch({ kind: 'resolvePrompt', choice: { kind: 'skip' } }));
    return (
      <section className="fate-panel" role="dialog" aria-label="Fate target choice">
        <h3 className="fate-panel__title">Fate revealed</h3>
        <div className="fate-panel__card">
          <Card cardId={cardId} />
        </div>
        <p className="fate-panel__target">Play this against …</p>
        <div className="fate-panel__actions">
          {eligibleTargets.map((opp) => (
            <button
              key={`fate-target-${opp}`}
              className="button button--primary"
              onClick={() => onTarget(opp)}
            >
              {opp}
            </button>
          ))}
          <button className="button" onClick={onDiscard}>
            Discard (no effect)
          </button>
        </div>
      </section>
    );
  }

  // fatePlaceLocation — step 2: pick the location.
  const { opponent, cardId } = prompt.continuation;
  const onLocation = (location: LocationIndex): void =>
    tryDispatch(() =>
      engine.dispatch({
        kind: 'resolvePrompt',
        choice: { kind: 'location', location },
      }),
    );
  return (
    <section className="fate-panel" role="dialog" aria-label="Fate location choice">
      <h3 className="fate-panel__title">Place on {opponent}&apos;s realm</h3>
      <div className="fate-panel__card">
        <Card cardId={cardId} />
      </div>
      <p className="fate-panel__target">Which location?</p>
      <div className="fate-panel__actions">
        {([0, 1, 2, 3] as LocationIndex[]).map((i) => (
          <button
            key={`loc-${i}`}
            className="button button--primary"
            onClick={() => onLocation(i)}
          >
            Location {i + 1}
          </button>
        ))}
      </div>
    </section>
  );
}
