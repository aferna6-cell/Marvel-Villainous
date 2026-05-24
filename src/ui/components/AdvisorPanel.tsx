// AdvisorPanel — "Suggest a move" (plan §8.4).
//
// Top recommendation + collapsible Why? rationale + collapsible Other
// options (the next two candidates). The advisor never acts on its own:
// the player must press a button to apply a recommendation.

import { useState } from 'react';
import { useEngine, useGameState } from '../hooks/useGameEngine';
import { suggestTopK, type Recommendation } from '../../engine/advisor/index';

export function AdvisorPanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [showWhy, setShowWhy] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

  if (state.winner !== null) return null;

  const generate = (): void => {
    setRecs(suggestTopK(state, state.activePlayer, 3));
    setShowWhy(true);
    setShowOthers(false);
  };
  const apply = (rec: Recommendation): void => {
    try {
      engine.dispatch(rec.action);
    } catch (e) {
      alert(String(e));
    } finally {
      setRecs([]);
    }
  };
  const dismiss = (): void => {
    setRecs([]);
    setShowWhy(false);
    setShowOthers(false);
  };

  const [top, ...others] = recs;

  return (
    <section className="advisor">
      <button className="button" onClick={generate} title="Plan §8 — opt-in, every turn">
        Suggest a move
      </button>
      {top ? (
        <div className="advisor__suggestion" role="dialog" aria-label="Advisor suggestion">
          <div className="advisor__header">
            <strong>Suggested: {top.action.kind}</strong>
            <span className="advisor__score">score {top.score.toFixed(1)}</span>
          </div>

          <button
            className="advisor__toggle"
            onClick={() => setShowWhy((v) => !v)}
            aria-expanded={showWhy}
          >
            {showWhy ? '▾' : '▸'} Why?
          </button>
          {showWhy ? (
            <ul className="advisor__rationale">
              {top.rationale.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}

          {others.length > 0 ? (
            <>
              <button
                className="advisor__toggle"
                onClick={() => setShowOthers((v) => !v)}
                aria-expanded={showOthers}
              >
                {showOthers ? '▾' : '▸'} Other options ({others.length})
              </button>
              {showOthers ? (
                <ul className="advisor__others">
                  {others.map((r, i) => (
                    <li key={i}>
                      <div className="advisor__other-header">
                        <span>
                          <strong>{r.action.kind}</strong>{' '}
                          <span className="advisor__score">score {r.score.toFixed(1)}</span>
                        </span>
                        <button className="button button--mini" onClick={() => apply(r)}>
                          Use
                        </button>
                      </div>
                      <ul className="advisor__rationale">
                        {r.rationale.slice(0, 2).map((line, j) => (
                          <li key={j}>{line}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          <div className="advisor__actions">
            <button className="button button--primary" onClick={() => apply(top)}>
              Use this
            </button>
            <button className="button" onClick={dismiss}>
              Ignore
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
