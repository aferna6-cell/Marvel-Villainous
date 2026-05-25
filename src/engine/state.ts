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
import { applySetObjectiveCount, checkWin } from './actions/objective';
import { applyRelocateAlly } from './actions/relocate';
import { applySetStrictIconMode, findUnusedIcon, consumeIcon } from './actions/strict';
import { applyRemoveFromPlay } from './actions/removeFromPlay';
import { applyAdjustPower, applyDrawCards } from './actions/manual';
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

    // --- turnStart: fire any in-play Event-card start-of-turn ticks. --------
    if (trigger.event === 'turnStart') {
      const player = s.players[trigger.player];
      if (!player) continue;
      // Sacrifices Must Be Made (Thanos Fate): "Before moving, for each
      // Ally, either pay 1 Power, discard a card, or remove the Ally."
      // Engine-modelled as: lose min(allyCount, power) Power; log the rest
      // so the players resolve the partial-pay manually.
      if (s.globalEvent?.cardId === 'fate-thanos-sacrifices-must-be-made') {
        let allies = 0;
        for (const loc of player.realm.locations) allies += loc.alliesPresent.length;
        const lost = Math.min(allies, player.power);
        if (lost > 0) {
          player.power -= lost;
          s.log.push({
            turn: s.turn,
            player: trigger.player,
            message: `Sacrifices Must Be Made — lost ${lost} Power for ${allies} Ally/Allies (auto-paid; pay-or-remove the remainder manually)`,
          });
        }
      }
      // Invasion of Stark Enterprises (Ultron Fate): "When gaining Power,
      // Ultron gains 1 fewer Power" — modelled as a passive flag read by
      // the gainPower handler; nothing to do at start-of-turn beyond log.
      if (s.globalEvent?.cardId === 'fate-ultron-invasion-stark') {
        s.log.push({
          turn: s.turn,
          player: trigger.player,
          message: 'Invasion of Stark Enterprises — Ultron gains 1 fewer Power this turn.',
        });
      }
      // Avengers Assemble: each villain draws a Fate on themselves at the
      // start of their turn. Auto-revealing here would loop infinitely
      // because revealing parks a Fate prompt; the engine logs the
      // reminder and the player triggers it themselves.
      if (s.globalEvent?.cardId === 'fate-common-avengers-assemble') {
        s.log.push({
          turn: s.turn,
          player: trigger.player,
          message: 'Avengers Assemble — at start of turn, draw a Fate card and play it on yourself.',
        });
      }
    }
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
const HISTORY_CAP = 12;

/** Push a snapshot of `state` (minus its own history) onto `next.history`. */
function pushHistory(next: GameState, state: GameState): void {
  const snapshot: GameState = { ...cloneState(state), history: [] };
  next.history = [...next.history, snapshot];
  if (next.history.length > HISTORY_CAP) next.history.shift();
}

export function reduce(state: GameState, action: Action): GameState {
  const legal = isLegal(state, action);
  if (legal !== true) {
    throw new Error(`illegal action "${action.kind}": ${legal.reason}`);
  }

  // Undo short-circuits: pop the previous snapshot back into place and
  // skip the rest of the reducer pipeline (no auto-advance, no triggers,
  // so the rewind is exact).
  if (action.kind === 'undo') {
    const prior = state.history[state.history.length - 1];
    if (!prior) throw new Error('undo: no history (validate.ts should have caught this)');
    const restored = cloneState(prior);
    restored.history = state.history.slice(0, -1);
    restored.log = [
      ...restored.log,
      { turn: restored.turn, player: state.activePlayer, message: 'undo: rewound one step' },
    ];
    return restored;
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
    case 'setObjectiveCount':
      next = applySetObjectiveCount(state, action.player, action.key, action.delta);
      break;
    case 'setStrictIconMode':
      next = applySetStrictIconMode(state, action.value);
      break;
    case 'removeFromPlay':
      next = applyRemoveFromPlay(state, action.owner, action.instanceId);
      break;
    case 'adjustPower':
      next = applyAdjustPower(state, action.player, action.delta);
      break;
    case 'drawCards':
      next = applyDrawCards(state, action.player, action.n);
      break;
    default:
      return assertNever(action);
  }

  // Snapshot the *prior* state into `next.history` so a subsequent `undo`
  // rewinds to it. Don't snapshot for `undo` itself (handled above) or for
  // the no-op `setStrictIconMode` toggle (rewinding the toggle alone is
  // pointless and would pollute history with one-bit flips).
  if (action.kind !== 'setStrictIconMode') {
    pushHistory(next, state);
  } else {
    next.history = state.history;
  }

  // Q2: in strict-icon mode, the gated actions consume a matching icon at
  // the active player's current location. The validator above already
  // verified one is available; here we mark it used so the player can't
  // double-spend it within the same turn.
  if (state.strictIconMode) {
    const iconType =
      action.kind === 'playCard' ? 'play' :
      action.kind === 'attackHero' ? 'vanquish' :
      action.kind === 'fate' ? 'fate' :
      action.kind === 'discardCards' ? 'discard' :
      action.kind === 'relocateAlly' ? 'move' :
      null;
    if (iconType !== null) {
      const idx = findUnusedIcon(state, iconType);
      if (idx !== null) {
        const cloned = cloneState(next);
        consumeIcon(cloned, idx);
        next = cloned;
      }
    }
  }
  next = drainTriggers(next);
  next = autoAdvance(next);
  // Auto-detect a per-villain win from the player's objective counts.
  if (next.winner === null) {
    const winner = checkWin(next);
    if (winner) {
      const s = cloneState(next);
      s.winner = winner;
      const villain = s.players[winner]?.villain ?? '?';
      s.log.push({
        turn: s.turn,
        player: winner,
        message: `${winner} (${villain}) reached the objective — VICTORY`,
      });
      next = s;
    }
  }
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
