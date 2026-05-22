import { describe, expect, it } from 'vitest';
import { createGameEngine } from '../../src/engine/state';
import type { GameState, Location, Realm } from '../../src/engine/types';

function makeRealm(): Realm {
  const loc = (i: number): Location => ({
    id: `loc-${i}`,
    name: `Location ${i}`,
    topIcons: [],
    bottomIcons: [],
    heroesPresent: [],
    alliesPresent: [],
    itemsPresent: [],
    conditions: [],
  });
  return { villain: 'thanos', locations: [loc(0), loc(1), loc(2), loc(3)], villainTokenAt: 0 };
}

function makeState(): GameState {
  const player = {
    id: 'p1' as const,
    villain: 'thanos' as const,
    power: 0,
    hand: [],
    deck: [],
    discard: [],
    fateDeck: [],
    fateDiscard: [],
    realm: makeRealm(),
    flags: {},
    objectiveProgress: { completed: false, steps: {} },
  };
  return {
    seed: 1,
    rngCursor: 0,
    turn: 1,
    activePlayer: 'p1',
    phase: 'start',
    players: { p1: player, p2: player, p3: player, p4: player },
    playerOrder: ['p1'],
    log: [],
    winner: null,
    pendingPrompt: null,
    pendingTriggers: [],
    usedIcons: [],
    instanceCounter: 0,
  };
}

describe('createGameEngine()', () => {
  it('exposes the initial state via getState()', () => {
    const engine = createGameEngine(makeState());
    expect(engine.getState().turn).toBe(1);
  });

  it('applies a legal action and advances state', () => {
    const engine = createGameEngine(makeState());
    engine.dispatch({ kind: 'startTurn' });
    expect(engine.getState().phase).toBe('move');
  });

  it('throws on an illegal action rather than mutating state', () => {
    const engine = createGameEngine(makeState());
    // endTurn is illegal from the start phase.
    expect(() => engine.dispatch({ kind: 'endTurn' })).toThrow('illegal action');
    expect(engine.getState().phase).toBe('start');
  });

  it('notifies subscribers after a successful dispatch', () => {
    const engine = createGameEngine(makeState());
    let calls = 0;
    const unsubscribe = engine.subscribe(() => {
      calls += 1;
    });
    engine.dispatch({ kind: 'startTurn' });
    unsubscribe();
    expect(calls).toBe(1);
  });
});
