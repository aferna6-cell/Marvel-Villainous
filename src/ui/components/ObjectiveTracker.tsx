// ObjectiveTracker — per-villain progress display + +/- controls.
//
// Each villain's printed objective is tallied here. Once the engine sees
// the count reach its target it auto-detects victory (via checkWin in
// state.ts) and the WinScreen overlay takes over. Until per-card ability
// auto-wiring lands, the player adjusts these counts by hand to reflect
// what their cards/triggers would have produced.

import { useEngine, useGameState } from '../hooks/useGameEngine';
import type { PlayerId, VillainKey } from '../../engine/types';

interface ObjectiveDef {
  key: string;
  label: string;
  target: number;
}

const OBJECTIVES: Record<VillainKey, ObjectiveDef[]> = {
  thanos:     [{ key: 'stones',    label: 'Infinity Stones', target: 6 }],
  hela:       [{ key: 'asgard',    label: 'Allies + Soul Marks at Odin\'s Vault', target: 8 }],
  killmonger: [{ key: 'bosses',    label: 'Wakanda objective steps', target: 4 }],
  taskmaster: [{ key: 'contracts', label: 'Contracts completed', target: 4 }],
  ultron:     [
    { key: 'upgrades', label: 'Upgrades completed', target: 4 },
    { key: 'finalForm', label: 'Final form built + key Hero defeated (toggle)', target: 1 },
  ],
};

export function ObjectiveTracker(): JSX.Element {
  const engine = useEngine();
  const state = useGameState();

  const tryBump = (player: PlayerId, key: string, delta: number): void => {
    try {
      engine.dispatch({ kind: 'setObjectiveCount', player, key, delta });
    } catch {
      /* illegal — ignored */
    }
  };

  return (
    <section className="objective-tracker">
      <h3 className="objective-tracker__title">Objective progress</h3>
      {state.playerOrder.map((id) => {
        const p = state.players[id];
        if (!p) return null;
        const defs = OBJECTIVES[p.villain];
        return (
          <div key={id} className="objective-tracker__row">
            <span className="objective-tracker__player">
              <strong>{id}</strong> · {p.villain}
            </span>
            {defs.map((def) => {
              const current = (p.objectiveProgress.steps[def.key] as number | undefined) ?? 0;
              const met = current >= def.target;
              return (
                <span
                  key={def.key}
                  className={`objective-tracker__step ${met ? 'objective-tracker__step--met' : ''}`}
                >
                  {def.label}: <strong>{current}</strong> / {def.target}
                  <button
                    className="objective-tracker__bump"
                    onClick={() => tryBump(id, def.key, -1)}
                    aria-label={`decrement ${def.label}`}
                  >
                    −
                  </button>
                  <button
                    className="objective-tracker__bump"
                    onClick={() => tryBump(id, def.key, 1)}
                    aria-label={`increment ${def.label}`}
                  >
                    +
                  </button>
                </span>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
