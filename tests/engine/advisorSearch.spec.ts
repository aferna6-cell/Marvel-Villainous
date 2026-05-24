// Plan §8.7 advisor tests for the search-based recommender.

import { afterEach, describe, expect, it } from 'vitest';
import { suggestMove, suggestTopK } from '../../src/engine/advisor/index';
import { isLegal } from '../../src/engine/validate';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame, makePlayer } from './fixtures';

afterEach(() => clearRegistry());

describe('Advisor — determinism', () => {
  it('returns the same recommendation for the same state (no hidden randomness)', () => {
    registerCards([makeCard({ id: 'a', type: 'ally', cost: 1, strength: 3 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['a'];
    game.players.p1.power = 3;
    const r1 = suggestMove(game, 'p1');
    const r2 = suggestMove(game, 'p1');
    expect(r1?.action).toEqual(r2?.action);
    expect(r1?.score).toBe(r2?.score);
  });
});

describe('Advisor — legality (plan §8.5 faithfulness guarantee)', () => {
  it('every top-K candidate is legal in the source state', () => {
    registerCards([
      makeCard({ id: 'a', type: 'ally', cost: 1, strength: 2 }),
      makeCard({ id: 'b', type: 'effect', cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['a', 'b'];
    game.players.p1.power = 5;
    const recs = suggestTopK(game, 'p1', 5);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(isLegal(game, r.action)).toBe(true);
    }
  });
});

describe('Advisor — one-from-a-win sanity (plan §8.7)', () => {
  it('Thanos: picks the action that triggers Snap when 5 stones are collected and the card is "place one stone + snap"', () => {
    // A card whose effects (a) bump stones to 6 and (b) snap → guaranteed win.
    registerCards([
      makeCard({
        id: 'stonecard',
        type: 'effect',
        cost: 0,
        effects: [
          { op: 'villainSpecific', key: 'placeStone', payload: { stone: 'Reality' } },
          { op: 'villainSpecific', key: 'snap', payload: null },
        ],
      }),
      makeCard({ id: 'plainally', type: 'ally', cost: 0, strength: 3 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['stonecard', 'plainally'];
    game.players.p1.power = 3;
    game.players.p1.objectiveProgress.steps['stones'] = 5;
    const rec = suggestMove(game, 'p1');
    expect(rec).not.toBeNull();
    expect(rec?.action).toEqual({ kind: 'playCard', cardId: 'stonecard' });
  });
});

describe('Advisor — top-K shape', () => {
  it('returns up to K distinct recommendations sorted by descending score', () => {
    registerCards([
      makeCard({ id: 'x', type: 'ally', cost: 1, strength: 2 }),
      makeCard({ id: 'y', type: 'ally', cost: 1, strength: 1 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['x', 'y'];
    game.players.p1.power = 5;
    const recs = suggestTopK(game, 'p1', 3);
    expect(recs.length).toBeGreaterThan(0);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i]!.score).toBeLessThanOrEqual(recs[i - 1]!.score);
    }
  });

  it('an empty hand + no power surfaces endTurn as a candidate', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = [];
    game.players.p1.power = 0;
    const recs = suggestTopK(game, 'p1', 5);
    expect(recs.some((r) => r.action.kind === 'endTurn')).toBe(true);
  });
});

describe('Advisor — Killmonger objective bonus drives a winning sequence', () => {
  it('Killmonger picks claimWakanda when 4 bosses are already defeated', () => {
    registerCards([
      makeCard({
        id: 'claim',
        type: 'effect',
        cost: 0,
        effects: [{ op: 'villainSpecific', key: 'claimWakanda', payload: null }],
      }),
      makeCard({ id: 'filler', type: 'ally', cost: 0, strength: 1 }),
    ]);
    let game = makeGame({
      phase: 'actions',
      activePlayer: 'p4',
      playerOrder: ['p4'],
      players: {
        p1: makePlayer('p1', 'thanos'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
    });
    game.players.p4.hand = ['claim', 'filler'];
    game.players.p4.power = 2;
    game.players.p4.objectiveProgress.steps['bosses'] = 4;
    const rec = suggestMove(game, 'p4');
    expect(rec?.action).toEqual({ kind: 'playCard', cardId: 'claim' });
    // Sanity: applying the recommendation actually wins the game.
    game = reduce(game, rec!.action);
    expect(game.winner).toBe('p4');
  });
});
