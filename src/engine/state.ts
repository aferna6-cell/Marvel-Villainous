// The pure game store and reducer (marvel-villainous-plan.md §2, §3).
//
// `reduce(state, action)` is a pure function: it gates the action through
// `isLegal`, routes to the matching action handler, drains the triggered-
// ability event bus, and then runs the auto-advance loop so phase transitions
// the engine can make on its own (start-of-turn processing, end-of-turn
// rotation, leaving Fate after resolution) happen in a single dispatch.

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
import { applyClaimVictory } from './actions/claim';
import { applyRelocateAlly } from './actions/relocate';
import * as startOfTurn from './phases/startOfTurn';
import * as mainPhase from './phases/mainPhase';
import * as fatePhase from './phases/fatePhase';
import * as endOfTurn from './phases/endOfTurn';
import { applyResolvePrompt } from './cards/effects';
import type { Action, GameState, Phase } from './types';

// --- Triggered-ability event bus ------------------------------------------

/**
 * Drain the triggered-ability event bus (marvel-villainous-plan.md §11). Each
 * queued `TriggerSpec` is processed FIFO; handlers added in CHUNK 5+ may
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
    // CHUNK 5+: dispatch `trigger` to registered card/villain handlers here.
  }
  return s;
}

// --- Phase machine --------------------------------------------------------

interface PhaseHandler {
  canAdvance: (state: GameState) => boolean;
  runAutomatic: (state: GameState) => GameState;
}

const phaseRegistry: Record<Phase, PhaseHandler> = {
  start: startOfTurn,
  move: mainPhase,
  actions: mainPhase,
  fate: fatePhase,
  end: endOfTurn,
};

/**
 * Run every phase transition the engine can make on its own. After each
 * automatic phase step the trigger bus is drained, so triggered abilities
 * fire in lock-step with phase changes. Stops at the first phase whose
 * `canAdvance` is false, at a pending prompt, or once a winner is set.
 */
export function autoAdvance(state: GameState): GameState {
  let s = state;
  let guard = 0;
  while (s.pendingPrompt === null && s.winner === null) {
    if (++guard > 100) throw new Error('autoAdvance: phase loop exceeded');
    const handler = phaseRegistry[s.phase];
    if (!handler.canAdvance(s)) break;
    const advanced = handler.runAutomatic(s);
    if (advanced === s) break; // no progress
    s = drainTriggers(advanced);
  }
  return s;
}

// --- Reducer --------------------------------------------------------------

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
      next = startOfTurn.applyStartTurn(state);
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
      next = applyAttack(state, action.allyIds, action.heroId);
      break;
    case 'discardCards':
      next = applyDiscard(state, action.cardIds);
      break;
    case 'drawToHandSize':
      next = applyDraw(state, state.activePlayer);
      break;
    case 'fate':
      next = applyFate(state);
      break;
    case 'resolvePrompt':
      next = applyResolvePrompt(state, action.choice);
      break;
    case 'endTurn':
      next = applyEndTurn(state);
      break;
    case 'claimVictory':
      next = applyClaimVictory(state);
      break;
    case 'relocateAlly':
      next = applyRelocateAlly(
        state,
        action.fromLocation,
        action.instanceId,
        action.toLocation,
      );
      break;
    default:
      return assertNever(action);
  }

  next = drainTriggers(next);
  next = autoAdvance(next);
  return next;
}

// --- Store ----------------------------------------------------------------

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
