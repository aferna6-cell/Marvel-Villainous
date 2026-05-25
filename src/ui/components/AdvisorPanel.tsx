// AdvisorPanel — directive, single-plan view (plan §8.4 simplified UX).
//
// The advisor now gives ONE clear multi-step Game Plan: "Move to X, play
// Y, use Z icon, end turn." Whole-turn sequence search runs on click of
// "Suggest my next move." The player can Auto-play the plan (each step
// dispatched with a 600ms gap), Use as guide (close panel, the first
// step is highlighted on the board), or Ignore.
//
// If the engine's planner returns a non-terminating plan (didn't reach
// endTurn within depth K), we still surface it — the player can extend
// manually after the listed steps.

import { useState, useRef, useEffect } from 'react';
import { useEngine, useGameState } from '../hooks/useGameEngine';
import {
  suggestTurnSequences,
  type SequenceRecommendation,
} from '../../engine/advisor/index';
import { useAdvisorGuide } from '../hooks/useAdvisorGuide';

const AUTO_PLAY_DELAY_MS = 600;

export function AdvisorPanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const guide = useAdvisorGuide();
  const [plan, setPlan] = useState<SequenceRecommendation | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const cancelAutoPlayRef = useRef(false);
  const lastSeenPlayer = useRef(state.activePlayer);

  // Clear stale plans on player rotation so the next player isn't shown
  // someone else's strategy.
  useEffect(() => {
    if (lastSeenPlayer.current !== state.activePlayer) {
      lastSeenPlayer.current = state.activePlayer;
      setPlan(null);
    }
  }, [state.activePlayer]);

  if (state.winner !== null) return null;

  const generate = (): void => {
    const sequences = suggestTurnSequences(state, state.activePlayer, 1);
    setPlan(sequences[0] ?? null);
  };

  const reset = (): void => {
    setPlan(null);
    guide.clear();
  };

  const useAsGuide = (): void => {
    if (plan && plan.steps.length > 0) {
      guide.highlight(plan.steps[0]!.action);
    }
    setPlan(null);
  };

  const autoPlay = async (): Promise<void> => {
    if (!plan) return;
    cancelAutoPlayRef.current = false;
    setAutoPlaying(true);
    for (const step of plan.steps) {
      if (cancelAutoPlayRef.current) break;
      try {
        engine.dispatch(step.action);
      } catch {
        break;
      }
      await new Promise((r) => setTimeout(r, AUTO_PLAY_DELAY_MS));
    }
    setAutoPlaying(false);
    reset();
  };

  const cancelAuto = (): void => {
    cancelAutoPlayRef.current = true;
  };

  return (
    <section className="advisor">
      <button
        className="button"
        onClick={generate}
        disabled={autoPlaying}
        title="Plan your whole turn — the advisor proposes a directive multi-step game plan"
      >
        Suggest my next move
      </button>
      {autoPlaying ? (
        <div className="advisor__suggestion">
          <strong>Auto-playing…</strong>
          <button className="button" onClick={cancelAuto}>
            Cancel
          </button>
        </div>
      ) : null}
      {plan && !autoPlaying ? (
        <div className="advisor__suggestion" role="dialog" aria-label="Game plan">
          <div className="advisor__header">
            <strong>Game Plan</strong>
            <span className="advisor__score">
              {plan.steps.length} step{plan.steps.length === 1 ? '' : 's'}
              {plan.turnEnded ? ' · ends turn' : ''} · score {plan.score.toFixed(1)}
            </span>
          </div>
          {plan.steps.length === 0 ? (
            <p className="advisor__rationale">
              The advisor has no legal action — end your turn or undo.
            </p>
          ) : (
            <ol className="advisor__sequence-steps">
              {plan.steps.map((step, j) => (
                <li key={j}>{step.description}</li>
              ))}
            </ol>
          )}
          <div className="advisor__actions">
            <button
              className="button button--primary"
              onClick={autoPlay}
              disabled={plan.steps.length === 0}
              title="Dispatch each step in sequence with a 600ms gap"
            >
              Auto-play this turn
            </button>
            <button
              className="button"
              onClick={useAsGuide}
              disabled={plan.steps.length === 0}
              title="Close the panel — the first step stays highlighted on the board"
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
