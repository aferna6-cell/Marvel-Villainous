// PromptPanel — generic resolver for any `pendingPrompt` that isn't a
// Fate-specific continuation (Fate is handled by FatePanel). Surfaces the
// prompt's choices as clickable buttons; clicking dispatches a
// `resolvePrompt` action with the chosen PromptChoice. The reducer's
// `applyResolvePrompt` then runs the matching `deferred` tag or just
// closes the prompt with a log entry.

import { useEngine, useGameState } from '../hooks/useGameEngine';
import type { PromptChoice } from '../../engine/types';

export function PromptPanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const prompt = state.pendingPrompt;
  if (!prompt) return null;
  // FatePanel handles its own continuations.
  if (
    prompt.continuation?.kind === 'fatePlay' ||
    prompt.continuation?.kind === 'fatePlaceLocation'
  ) {
    return null;
  }

  const tryDispatch = (choice: PromptChoice): void => {
    try {
      engine.dispatch({ kind: 'resolvePrompt', choice });
    } catch (e) {
      alert(String(e));
    }
  };

  return (
    <section className="prompt-panel" role="dialog" aria-label="Resolve prompt">
      <h3 className="prompt-panel__title">{prompt.message}</h3>
      <p className="prompt-panel__player">
        For <strong>{prompt.player}</strong>
      </p>
      <div className="prompt-panel__choices">
        {prompt.choices.map((choice, i) => (
          <button
            key={`choice-${i}`}
            className={`button ${choice.kind === 'skip' ? '' : 'button--primary'}`}
            onClick={() => tryDispatch(choice)}
          >
            {describeChoice(choice)}
          </button>
        ))}
      </div>
    </section>
  );
}

function describeChoice(c: PromptChoice): string {
  switch (c.kind) {
    case 'card':
      return c.cardId;
    case 'target':
      switch (c.target.kind) {
        case 'player':
          return c.target.player;
        case 'location':
          return `${c.target.player} loc ${c.target.location + 1}`;
        case 'card':
          return c.target.instanceId;
        default:
          return JSON.stringify(c.target);
      }
    case 'location':
      return `Location ${c.location + 1}`;
    case 'skip':
      return 'Skip / no effect';
    case 'confirm':
      return 'Confirm';
    default: {
      const _exh: never = c;
      void _exh;
      return '?';
    }
  }
}
