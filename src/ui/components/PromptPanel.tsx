// PromptPanel — generic resolver for any `pendingPrompt` that isn't a
// Fate-specific continuation (Fate is handled by FatePanel). Surfaces the
// prompt's choices as clickable buttons; clicking dispatches a
// `resolvePrompt` action with the chosen PromptChoice.
//
// Choice labels are humanized: for `kind: 'card'` the panel resolves the
// instance id (or raw card id) into the printed card name by looking up
// the in-play instance across every player's realm + hand + discard,
// then asking the card registry for the printed name.

import { useEngine, useGameState } from '../hooks/useGameEngine';
import { getCard } from '../../engine/cards/registry';
import type { GameState, PromptChoice } from '../../engine/types';

export function PromptPanel(): JSX.Element | null {
  const engine = useEngine();
  const state = useGameState();
  const prompt = state.pendingPrompt;
  if (!prompt) return null;
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
            {describeChoice(choice, state)}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Best-effort lookup: instance id → printed card name. */
function nameFor(idOrInstance: string, state: GameState): string {
  // Direct CardId? (i.e. it appears in a player's hand/deck/discard verbatim)
  // Try the registry first.
  const direct = getCard(idOrInstance);
  if (direct?.name) return `${direct.name} [${idOrInstance}]`;

  // Otherwise treat it as an instanceId — find which in-play card it is.
  for (const playerId of state.playerOrder) {
    const p = state.players[playerId];
    if (!p) continue;
    for (const loc of p.realm.locations) {
      const all = [
        ...loc.alliesPresent,
        ...loc.heroesPresent,
        ...loc.itemsPresent,
        ...loc.conditions,
      ];
      const hit = all.find((c) => c.instanceId === idOrInstance);
      if (hit) {
        const def = getCard(hit.cardId);
        return `${def?.name ?? hit.cardId} @ ${playerId} loc${loc.name ? ` ${loc.name}` : ''}`;
      }
    }
  }
  if (state.globalEvent?.instanceId === idOrInstance) {
    const def = getCard(state.globalEvent.cardId);
    return `${def?.name ?? state.globalEvent.cardId} (Event)`;
  }
  return idOrInstance;
}

function describeChoice(c: PromptChoice, state: GameState): string {
  switch (c.kind) {
    case 'card':
      return nameFor(c.cardId, state);
    case 'target':
      switch (c.target.kind) {
        case 'player':
          return c.target.player;
        case 'location':
          return `${c.target.player} loc ${c.target.location + 1}`;
        case 'card':
          return nameFor(c.target.instanceId, state);
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
