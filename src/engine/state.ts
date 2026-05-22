// The pure game store and reducer (marvel-villainous-plan.md §2, §3).
//
// `reduce(state, action)` is a pure function: it gates the action through
// `isLegal`, routes to the matching action handler, then drains the triggered-
// ability event bus before returning. No action mutates its input — every
// handler clones first (see util.cloneState).

import { createStore, type StoreApi } from 'zustand/vanilla';
import { isLegal } from './validate';
import { assertNever, cloneState } from './util';
import { applyMove } from './actions/move';
import { applyUseIcon } from './actions/useIcon';
import { applyPlayCard } from './actions/playCard';
import { applyAttack } from './actions/attack';
import { applyDiscard } from './actions/discard';
import { applyFate } from './actions/fate';
import { applyDraw, applyEndTurn } from './actions/endTurn';
import { applyStartTurn } from './phases/startOfTurn';
import { applyResolvePrompt } from './cards/effects';
import type { Action, GameState } from './types';

/**
 * Drain the triggered-ability event bus (marvel-villainous-plan.md §11). Each
 * queued `TriggerSpec` is processed FIFO; handlers added in CHUNK 4+ may
 * enqueue further triggers, which are appended to the back and processed
 * after. A guard aborts a runaway loop.
 */
export function drainTriggers(state: GameState): GameState {
  if (state.pendingTriggers.length === 0) return state;
  const s = cloneState(state);
  let guard = 0;
  while (s.pendingTriggers.length > 0) {
    if (++guard > 10_000) throw new Error('drainTriggers: runaway trigger loop');
    const trigger = s.pendingTriggers.shift();
    if (!trigger) break;
    s.log.push({ turn: s.turn, player: trigger.player, message: `trigger: ${trigger.event}` });
    // CHUNK 4+: dispatch `trigger` to registered card/villain handlers here.
  }
  return s;
}

/**
 * Pure reducer: `(state, action) => newState`. Throws if the action is
 * illegal, so an illegal action can never produce a state.
 */
export function reduce(state: GameState, action: Action): GameState {
  const legal = isLegal(state, action);
  if (legal !== true) {
    throw new Error(`illegal action "${action.kind}": ${legal.reason}`);
  }

  let next: GameState;
  switch (action.kind) {
    case 'startTurn':
      next = applyStartTurn(state);
      break;
    case 'moveVillain':
      next = applyMove(state, action.to);
      break;
    case 'useIcon':
      next = applyUseIcon(state, action.location, action.iconIndex);
      break;
    case 'playCard':
      next = applyPlayCard(state, action.cardId, action.target);
      break;
    case 'attackHero':
      next = applyAttack(state, action.allyId, action.heroId);
      break;
    case 'discardCards':
      next = applyDiscard(state, action.cardIds);
      break;
    case 'drawToHandSize':
      next = applyDraw(state, state.activePlayer);
      break;
    case 'fateOpponent':
      next = applyFate(state, action.opponent);
      break;
    case 'resolvePrompt':
      next = applyResolvePrompt(state, action.choice);
      break;
    case 'endTurn':
      next = applyEndTurn(state);
      break;
    default:
      return assertNever(action);
  }

  return drainTriggers(next);
}

interface EngineState {
  game: GameState;
}

/** Listener called after each successful dispatch. */
export type EngineListener = (state: GameState, previous: GameState) => void;

/** A thin, framework-agnostic handle over the Zustand vanilla store. */
export interface GameEngine {
  getState: () => GameState;
  dispatch: (action: Action) => void;
  subscribe: (listener: EngineListener) => () => void;
}

/** Create a game engine seeded with an initial GameState. */
export function createGameEngine(initialState: GameState): GameEngine {
  const store: StoreApi<EngineState> = createStore<EngineState>(() => ({
    game: initialState,
  }));

  return {
    getState: () => store.getState().game,
    dispatch: (action) => {
      store.setState((s) => ({ game: reduce(s.game, action) }));
    },
    subscribe: (listener) =>
      store.subscribe((s, prev) => {
        listener(s.game, prev.game);
      }),
  };
}
