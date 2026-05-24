// Undo action — rewind the engine one step. Important for hotseat misclicks.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('undo action', () => {
  it('rewinds the most recent dispatch', () => {
    registerCards([makeCard({ id: 'c1', cost: 0 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['c1'];
    const played = reduce(game, { kind: 'playCard', cardId: 'c1' });
    expect(played.players.p1.hand).not.toContain('c1');
    expect(played.history.length).toBe(1);
    const rewound = reduce(played, { kind: 'undo' });
    expect(rewound.players.p1.hand).toContain('c1');
    expect(rewound.history.length).toBe(0);
  });

  it('rejects undo when there is no history', () => {
    const game = makeGame({ phase: 'actions' });
    expect(() => reduce(game, { kind: 'undo' })).toThrow('nothing to undo');
  });

  it('supports multiple successive undos until history is empty', () => {
    registerCards([
      makeCard({ id: 'c1', cost: 0 }),
      makeCard({ id: 'c2', cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['c1', 'c2'];
    const a = reduce(game, { kind: 'playCard', cardId: 'c1' });
    const b = reduce(a, { kind: 'playCard', cardId: 'c2' });
    expect(b.players.p1.hand).toEqual([]);
    const u1 = reduce(b, { kind: 'undo' });
    expect(u1.players.p1.hand).toEqual(['c2']);
    const u2 = reduce(u1, { kind: 'undo' });
    expect(u2.players.p1.hand).toEqual(['c1', 'c2']);
    expect(() => reduce(u2, { kind: 'undo' })).toThrow('nothing to undo');
  });

  it('caps history at 12 snapshots', () => {
    registerCards([makeCard({ id: 'x', cost: 0 })]);
    let game = makeGame({ phase: 'actions' });
    game.players.p1.power = 100; // plenty
    for (let i = 0; i < 20; i++) {
      game.players.p1.hand = ['x'];
      game = reduce(game, { kind: 'playCard', cardId: 'x' });
      // Move the just-played card back into hand so we have something to play
      // next iteration. (cloneState gives us a fresh object.)
    }
    expect(game.history.length).toBeLessThanOrEqual(12);
  });
});
