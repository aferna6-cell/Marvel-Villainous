// FatePanel — UI for resolving the Fate prompt.
//
// When `state.pendingPrompt.continuation?.kind === 'fatePlay'`, the active
// player just revealed one card from the shared Fate deck (rulebook Setup §3:
// reveal-1). They now choose, AFTER seeing the card, which opponent to play
// it against (rulebook: "Reveal one card from the top of the Fate deck, then
// choose which player to target."), or discard with no effect.

import { useEngine, useGameState } from '../hooks/useGameEngine';
import { Card } from './Card';
import type { PlayerId } from '../../engine/types';

export function FatePanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const prompt = state.pendingPrompt;
  if (!prompt || prompt.continuation?.kind !== 'fatePlay') return null;

  const { eligibleTargets, revealed } = prompt.continuation;
  const cardId = revealed[0];
  if (cardId === undefined) return null;

  const onTarget = (player: PlayerId): void => {
    try {
      engine.dispatch({
        kind: 'resolvePrompt',
        choice: { kind: 'target', target: { kind: 'player', player } },
      });
    } catch {
      // illegal — ignored.
    }
  };
  const onDiscard = (): void => {
    try {
      engine.dispatch({ kind: 'resolvePrompt', choice: { kind: 'skip' } });
    } catch {
      // illegal — ignored.
    }
  };

  return (
    <section className="fate-panel" role="dialog" aria-label="Fate decision">
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
