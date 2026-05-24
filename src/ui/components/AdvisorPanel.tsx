// AdvisorPanel — full plan §8.4 implementation.
//
// Shows the top single-action recommendation with Why? and Other options
// expanders. Also fetches the top-3 whole-turn sequences (plan §8.1
// bounded DFS) so the player can pick one and press "Auto-play this turn"
// (executes step-by-step with a 600ms gap) or "Use as guide" (closes
// the panel; you play manually with the recommended action highlighted
// via the highlightedAction context).

import { useState, useRef } from 'react';
import { useEngine, useGameState } from '../hooks/useGameEngine';
import {
  suggestTopK,
  suggestTurnSequences,
  type Recommendation,
  type SequenceRecommendation,
} from '../../engine/advisor/index';
import type { Action } from '../../engine/types';
import { useAdvisorGuide } from '../hooks/useAdvisorGuide';

const AUTO_PLAY_DELAY_MS = 600;

export function AdvisorPanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const guide = useAdvisorGuide();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [sequences, setSequences] = useState<SequenceRecommendation[]>([]);
  const [showWhy, setShowWhy] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [showSequences, setShowSequences] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const cancelAutoPlayRef = useRef(false);

  // Bail-out if the engine handed us a Won state mid-render.
  if (state.winner !== null) return null;

  const generate = (): void => {
    setRecs(suggestTopK(state, state.activePlayer, 3));
    setSequences(suggestTurnSequences(state, state.activePlayer, 3));
    setShowWhy(true);
    setShowOthers(false);
    setShowSequences(false);
  };
  const apply = (action: Action): void => {
    try {
      engine.dispatch(action);
    } catch (e) {
      alert(String(e));
    } finally {
      reset();
    }
  };
  const reset = (): void => {
    setRecs([]);
    setSequences([]);
    setShowWhy(false);
    setShowOthers(false);
    setShowSequences(false);
    guide.clear();
  };
  const adoptAsGuide = (action: Action): void => {
    guide.highlight(action);
    setRecs([]);
    setSequences([]);
    setShowWhy(false);
    setShowOthers(false);
    setShowSequences(false);
  };
  const autoPlay = async (seq: SequenceRecommendation): Promise<void> => {
    cancelAutoPlayRef.current = false;
    setAutoPlaying(true);
    for (const step of seq.steps) {
      if (cancelAutoPlayRef.current) break;
      try {
        engine.dispatch(step.action);
      } catch {
        break; // engine threw — bail out of the script
      }
      await new Promise((r) => setTimeout(r, AUTO_PLAY_DELAY_MS));
    }
    setAutoPlaying(false);
    reset();
  };
  const cancelAuto = (): void => {
    cancelAutoPlayRef.current = true;
  };

  const [top, ...others] = recs;

  return (
    <section className="advisor">
      <button className="button" onClick={generate} disabled={autoPlaying} title="Plan §8 — opt-in, every turn">
        Suggest a move
      </button>
      {autoPlaying ? (
        <div className="advisor__suggestion">
          <strong>Auto-playing…</strong>
          <button className="button" onClick={cancelAuto}>
            Cancel
          </button>
        </div>
      ) : null}
      {top && !autoPlaying ? (
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
                        <button className="button button--mini" onClick={() => apply(r.action)}>
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

          {sequences.length > 0 ? (
            <>
              <button
                className="advisor__toggle"
                onClick={() => setShowSequences((v) => !v)}
                aria-expanded={showSequences}
              >
                {showSequences ? '▾' : '▸'} Whole-turn plans ({sequences.length})
              </button>
              {showSequences ? (
                <ul className="advisor__sequences">
                  {sequences.map((seq, i) => (
                    <li key={i} className="advisor__sequence">
                      <div className="advisor__sequence-header">
                        <span>
                          <strong>Plan #{i + 1}</strong>{' '}
                          <span className="advisor__score">
                            score {seq.score.toFixed(1)} · {seq.steps.length} step(s)
                            {seq.turnEnded ? ' · ends turn' : ''}
                          </span>
                        </span>
                        <button
                          className="button button--mini"
                          onClick={() => autoPlay(seq)}
                          disabled={autoPlaying}
                          title="Dispatch each action in sequence with a 600ms gap"
                        >
                          Auto-play this turn
                        </button>
                      </div>
                      <ol className="advisor__sequence-steps">
                        {seq.steps.map((step, j) => (
                          <li key={j}>{step.description}</li>
                        ))}
                      </ol>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          <div className="advisor__actions">
            <button className="button button--primary" onClick={() => apply(top.action)}>
              Use this
            </button>
            <button
              className="button"
              onClick={() => adoptAsGuide(top.action)}
              title="Close the panel — the suggested action stays highlighted on the board"
            >
              Use as guide
            </button>
            <button className="button" onClick={reset}>
              Ignore
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
