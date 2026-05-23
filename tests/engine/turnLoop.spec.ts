import { afterEach, describe, expect, it } from 'vitest';
import { createGameEngine } from '../../src/engine/state';
import { clearRegistry } from '../../src/engine/cards/registry';
import { newGame } from '../../src/engine/setup';
import { makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('scripted 4-turn 2-player loop', () => {
  it('rotates the active player, increments turn on wrap, and respects per-player hand size', () => {
    const initial = makeGame({ phase: 'start' });
    initial.players.p1.deck = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'];
    initial.players.p2.deck = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'];
    // p2 plays with a custom (smaller) hand size to exercise the override.
    initial.players.p2.handSize = 2;

    const engine = createGameEngine(initial);
    engine.dispatch({ kind: 'startTurn' });
    expect(engine.getState().activePlayer).toBe('p1');
    expect(engine.getState().phase).toBe('move');
    expect(engine.getState().turn).toBe(1);

    // p1's turn 1
    engine.dispatch({ kind: 'moveVillain', to: 1 });
    engine.dispatch({ kind: 'endTurn' });
    let s = engine.getState();
    expect(s.activePlayer).toBe('p2');
    expect(s.phase).toBe('move');
    expect(s.players.p1.hand).toHaveLength(4); // drew up to default hand size

    // p2's turn 1
    engine.dispatch({ kind: 'moveVillain', to: 2 });
    engine.dispatch({ kind: 'endTurn' });
    s = engine.getState();
    expect(s.activePlayer).toBe('p1');
    expect(s.phase).toBe('move');
    expect(s.turn).toBe(2); // wrapped to first seat → turn increments
    expect(s.players.p2.hand).toHaveLength(2); // honored handSize=2

    // p1's turn 2
    engine.dispatch({ kind: 'moveVillain', to: 0 });
    engine.dispatch({ kind: 'endTurn' });
    s = engine.getState();
    expect(s.activePlayer).toBe('p2');
    expect(s.turn).toBe(2);
    expect(s.players.p1.hand).toHaveLength(4);

    // p2's turn 2
    engine.dispatch({ kind: 'moveVillain', to: 3 });
    engine.dispatch({ kind: 'endTurn' });
    s = engine.getState();
    expect(s.activePlayer).toBe('p1');
    expect(s.turn).toBe(3); // wrapped again
    expect(s.players.p2.hand).toHaveLength(2);
  });

  it('produces a new state object after every dispatch (identity check)', () => {
    const initial = makeGame({ phase: 'start' });
    initial.players.p1.deck = ['d1', 'd2', 'd3', 'd4'];
    const engine = createGameEngine(initial);

    let prev = engine.getState();
    const actions = [
      { kind: 'startTurn' as const },
      { kind: 'moveVillain' as const, to: 1 as const },
      { kind: 'endTurn' as const },
    ];
    for (const action of actions) {
      engine.dispatch(action);
      const current = engine.getState();
      expect(current).not.toBe(prev);
      prev = current;
    }
  });

  it('newGame boots a 2-player game ready for the first move', () => {
    const game = newGame({ villains: ['thanos', 'hela'], seed: 42 });
    expect(game.activePlayer).toBe('p1');
    expect(game.phase).toBe('move'); // auto-advanced past the start phase
    expect(game.playerOrder).toEqual(['p1', 'p2']);
    expect(game.players.p1.villain).toBe('thanos');
    expect(game.players.p2.villain).toBe('hela');
    expect(game.players.p1.hand).toHaveLength(4);
    expect(game.players.p2.hand).toHaveLength(4);
    // Decks were shuffled — same seed should be reproducible.
    const same = newGame({ villains: ['thanos', 'hela'], seed: 42 });
    expect(same.players.p1.hand).toEqual(game.players.p1.hand);
  });

  it('newGame assigns starting Power per seat per the rulebook (0 / 1 / 2 / 2)', () => {
    const game = newGame({ villains: ['thanos', 'hela', 'ultron', 'killmonger'], seed: 7 });
    expect(game.players.p1.power).toBe(0);
    expect(game.players.p2.power).toBe(1);
    expect(game.players.p3.power).toBe(2);
    expect(game.players.p4.power).toBe(2);
  });

  it('starting hand size is 4 per the rulebook', () => {
    const game = newGame({ villains: ['thanos'], seed: 11 });
    expect(game.players.p1.hand).toHaveLength(4);
  });
});
