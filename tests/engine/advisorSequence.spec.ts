// Whole-turn sequence search (plan §8.1).

import { afterEach, describe, expect, it } from 'vitest';
import { searchSequences } from '../../src/engine/advisor/sequenceSearch';
import { suggestTurnSequences } from '../../src/engine/advisor/index';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('searchSequences (plan §8.1 whole-turn DFS)', () => {
  it('returns at least one terminating sequence in an actions-phase state', () => {
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    const seqs = searchSequences(game, 'p1', { maxDepth: 4, topK: 3 });
    expect(seqs.length).toBeGreaterThan(0);
    // At minimum: endTurn rotates to the (only) next player which is p1
    // again — terminating immediately. The plan caps DFS not on the rotation
    // but on the active-player switch; with a single seat the simulator
    // still hits maxDepth.
  });

  it('top sequences are sorted by score descending', () => {
    registerCards([
      makeCard({ id: 'big', type: 'ally', cost: 1, strength: 5 }),
      makeCard({ id: 'small', type: 'ally', cost: 1, strength: 1 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.hand = ['big', 'small'];
    game.players.p1.power = 5;
    const seqs = searchSequences(game, 'p1', { maxDepth: 3, topK: 3 });
    for (let i = 1; i < seqs.length; i++) {
      expect(seqs[i]!.score).toBeLessThanOrEqual(seqs[i - 1]!.score);
    }
  });

  it('every step in the top sequence is dispatchable in order from the start state', () => {
    registerCards([
      makeCard({ id: 'a', type: 'ally', cost: 1, strength: 3 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.hand = ['a'];
    game.players.p1.power = 5;
    const seqs = searchSequences(game, 'p1', { maxDepth: 4, topK: 1 });
    expect(seqs.length).toBe(1);
    // Replay the sequence from the original state — every action should be
    // legal in turn (the search itself simulated this, so it's a sanity
    // check that the recommendation transfers to a real dispatch).
    let replay = game;
    for (const step of seqs[0]!.steps) {
      replay = reduce(replay, step.action);
    }
    expect(replay).toBeDefined();
  });

  it('respects the maxDepth cap', () => {
    registerCards([makeCard({ id: 'x', type: 'ally', cost: 0, strength: 1 })]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.hand = ['x', 'x', 'x', 'x', 'x'];
    game.players.p1.power = 0;
    const seqs = searchSequences(game, 'p1', { maxDepth: 2, topK: 1 });
    expect(seqs[0]!.steps.length).toBeLessThanOrEqual(2);
  });
});

describe('suggestTurnSequences (public API)', () => {
  it('returns nothing for a non-active player', () => {
    const game = makeGame({ phase: 'actions', activePlayer: 'p1' });
    expect(suggestTurnSequences(game, 'p2')).toEqual([]);
  });

  it('returns nothing after a winner is set', () => {
    const game = makeGame({ phase: 'actions', winner: 'p1' });
    expect(suggestTurnSequences(game, 'p1')).toEqual([]);
  });

  it('returns top-K sequences with a step-by-step description', () => {
    registerCards([makeCard({ id: 'a', type: 'ally', cost: 0, strength: 2 })]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.hand = ['a'];
    const out = suggestTurnSequences(game, 'p1', 2);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]!.steps[0]!.description).toBeTruthy();
  });
});

describe('Advisor sequence — one-from-a-win plans the winning sequence', () => {
  it('Thanos sequence plays the stone-collecting card when 5 stones already collected', () => {
    registerCards([
      makeCard({
        id: 'finisher',
        type: 'effect',
        cost: 0,
        effects: [
          { op: 'villainSpecific', key: 'placeStone', payload: { stone: 'Final' } },
          { op: 'villainSpecific', key: 'snap', payload: null },
        ],
      }),
      makeCard({ id: 'distractor', type: 'ally', cost: 0, strength: 1 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.hand = ['finisher', 'distractor'];
    game.players.p1.power = 2;
    game.players.p1.objectiveProgress.steps['stones'] = 5;
    const seqs = suggestTurnSequences(game, 'p1', 1);
    expect(seqs.length).toBe(1);
    // The first step of the best sequence should be playing the finisher.
    const first = seqs[0]!.steps[0];
    expect(first?.action).toEqual({ kind: 'playCard', cardId: 'finisher' });
  });
});
