// Auto-detection of per-villain win conditions via `checkWin`.
// Players adjust their objective counts with the `setObjectiveCount` action;
// the reducer runs `checkWin` after every action and ratifies victory by
// setting `state.winner`.

import { describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { makeGame } from './fixtures';

describe('per-villain win-condition auto-detection', () => {
  it('Thanos wins at 6 Infinity Stones', () => {
    const game = makeGame({ phase: 'actions' });
    let s = game;
    for (let i = 0; i < 6; i++) {
      s = reduce(s, { kind: 'setObjectiveCount', player: 'p1', key: 'stones', delta: 1 });
    }
    expect(s.winner).toBe('p1');
  });

  it('a 5-stone Thanos has not won yet', () => {
    const game = makeGame({ phase: 'actions' });
    let s = game;
    for (let i = 0; i < 5; i++) {
      s = reduce(s, { kind: 'setObjectiveCount', player: 'p1', key: 'stones', delta: 1 });
    }
    expect(s.winner).toBeNull();
  });

  it('Hela wins when asgard reaches 8', () => {
    const game = makeGame({ phase: 'actions', activePlayer: 'p2' });
    let s = game;
    for (let i = 0; i < 8; i++) {
      s = reduce(s, { kind: 'setObjectiveCount', player: 'p2', key: 'asgard', delta: 1 });
    }
    expect(s.winner).toBe('p2');
  });

  it('Ultron needs both upgrades >= 4 AND finalForm flag', () => {
    const game = makeGame({
      phase: 'actions',
      players: {
        p1: { ...makeGame().players.p1, villain: 'ultron' },
        p2: makeGame().players.p2,
        p3: makeGame().players.p3,
        p4: makeGame().players.p4,
      },
    });
    let s = game;
    for (let i = 0; i < 4; i++) {
      s = reduce(s, { kind: 'setObjectiveCount', player: 'p1', key: 'upgrades', delta: 1 });
    }
    // 4 upgrades alone: not yet
    expect(s.winner).toBeNull();
    s = reduce(s, { kind: 'setObjectiveCount', player: 'p1', key: 'finalForm', delta: 1 });
    expect(s.winner).toBe('p1');
  });

  it('setObjectiveCount cannot drop a count below zero', () => {
    const game = makeGame({ phase: 'actions' });
    const next = reduce(game, {
      kind: 'setObjectiveCount',
      player: 'p1',
      key: 'stones',
      delta: -5,
    });
    expect(next.players.p1.objectiveProgress.steps['stones']).toBe(0);
  });
});
