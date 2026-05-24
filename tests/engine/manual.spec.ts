// Manual hotseat adjustments: free-form Power tick + out-of-phase draw.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry } from '../../src/engine/cards/registry';
import { makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('adjustPower action', () => {
  it('adds to the named player\'s power', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.power = 3;
    const next = reduce(game, { kind: 'adjustPower', player: 'p1', delta: 2 });
    expect(next.players.p1.power).toBe(5);
  });

  it('floors at 0 (rulebook §11: Power cannot go negative)', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.power = 1;
    const next = reduce(game, { kind: 'adjustPower', player: 'p1', delta: -5 });
    expect(next.players.p1.power).toBe(0);
  });

  it('rejects an unknown player', () => {
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    expect(() =>
      reduce(game, { kind: 'adjustPower', player: 'p2', delta: 1 }),
    ).toThrow('not in this game');
  });

  it('is undoable', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.power = 3;
    const after = reduce(game, { kind: 'adjustPower', player: 'p1', delta: 2 });
    expect(after.players.p1.power).toBe(5);
    const undone = reduce(after, { kind: 'undo' });
    expect(undone.players.p1.power).toBe(3);
  });
});

describe('drawCards action', () => {
  it('moves the top of the deck into the player\'s hand', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.deck = ['c1', 'c2', 'c3'];
    const next = reduce(game, { kind: 'drawCards', player: 'p1', n: 2 });
    expect(next.players.p1.hand).toEqual(['c1', 'c2']);
    expect(next.players.p1.deck).toEqual(['c3']);
  });

  it('reshuffles the discard pile when the deck runs out', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.deck = [];
    game.players.p1.discard = ['a', 'b', 'c'];
    const next = reduce(game, { kind: 'drawCards', player: 'p1', n: 1 });
    expect(next.players.p1.hand.length).toBe(1);
    expect(next.players.p1.discard).toEqual([]);
  });

  it('rejects n <= 0', () => {
    const game = makeGame({ phase: 'actions' });
    expect(() => reduce(game, { kind: 'drawCards', player: 'p1', n: 0 })).toThrow('positive');
  });

  it('stops gracefully when both deck and discard are empty', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.deck = [];
    game.players.p1.discard = [];
    const next = reduce(game, { kind: 'drawCards', player: 'p1', n: 3 });
    expect(next.players.p1.hand).toEqual([]);
  });
});
