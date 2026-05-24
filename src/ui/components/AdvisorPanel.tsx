// AdvisorPanel — "Suggest a move" button per plan §8 (MINIMAL VERSION).
//
// Shows the heuristic recommendation for the current state with a "Use
// this" button. The advisor never acts without an explicit click and only
// suggests for the active player.

import { useState } from 'react';
import { useEngine, useGameState } from '../hooks/useGameEngine';
import { suggestMove, type Recommendation } from '../../engine/advisor/index';

export function AdvisorPanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  if (state.winner !== null) return null;

  const generate = (): void => {
    setRecommendation(suggestMove(state, state.activePlayer));
  };
  const apply = (): void => {
    if (!recommendation) return;
    try {
      engine.dispatch(recommendation.action);
    } catch (e) {
      alert(String(e));
    } finally {
      setRecommendation(null);
    }
  };

  return (
    <section className="advisor">
      <button className="button" onClick={generate}>
        Suggest a move
      </button>
      {recommendation ? (
        <div className="advisor__suggestion" role="dialog" aria-label="Advisor suggestion">
          <strong>Suggested: {recommendation.action.kind}</strong>
          <ul>
            {recommendation.rationale.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <div className="advisor__actions">
            <button className="button button--primary" onClick={apply}>
              Use this
            </button>
            <button className="button" onClick={() => setRecommendation(null)}>
              Ignore
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
