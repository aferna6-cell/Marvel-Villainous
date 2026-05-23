// FatePanel — UI for resolving the Fate prompt.
//
// When `state.pendingPrompt.continuation?.kind === 'fatePlay'`, the active
// player just revealed one card from the shared Fate deck (rulebook Setup §3:
// reveal-1). This panel shows the revealed card and two buttons:
//
//   * "Play this" — play the card onto the targeted opponent's realm
//   * "Discard"   — rulebook: "If you draw a Fate card and cannot play it
//                   for whatever reason, discard it with no effect."
//
// The panel renders nothing when no Fate prompt is pending.

import { useEngine, useGameState } from '../hooks/useGameEngine';
import { Card } from './Card';

export function FatePanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const prompt = state.pendingPrompt;
  if (!prompt || prompt.continuation?.kind !== 'fatePlay') return null;

  const { opponent, revealed } = prompt.continuation;
  const cardId = revealed[0];
  if (cardId === undefined) return null;

  const onPlay = (): void => {
    try {
      engine.dispatch({ kind: 'resolvePrompt', choice: { kind: 'card', cardId } });
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
      <p className="fate-panel__target">
        Playing against <strong>{opponent}</strong>
      </p>
      <div className="fate-panel__card">
        <Card cardId={cardId} />
      </div>
      <div className="fate-panel__actions">
        <button className="button button--primary" onClick={onPlay}>
          Play this
        </button>
        <button className="button" onClick={onDiscard}>
          Discard (no effect)
        </button>
      </div>
    </section>
  );
}
