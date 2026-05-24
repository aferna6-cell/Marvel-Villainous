// Per-villain `villainSpecific` handler tests. The plan defines mechanical
// keys (Snap, Soul Mark, etc.) that cards reference via the `villainSpecific`
// effect op; the handlers bump objective progress so the engine's auto-win
// detector (checkWin in objective.ts) can ratify victory.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { applyEffect } from '../../src/engine/cards/effects';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame, makePlayer } from './fixtures';

afterEach(() => clearRegistry());

describe('Thanos: placeStone / snap', () => {
  it('placeStone bumps the stones counter and records the named stone', () => {
    const game = makeGame({ phase: 'actions' });
    const next = applyEffect(
      game,
      { op: 'villainSpecific', key: 'placeStone', payload: { stone: 'Power' } },
      { player: 'p1' },
    );
    expect(next.players.p1.objectiveProgress.steps['stones']).toBe(1);
    expect((next.players.p1.flags['stones'] as string[]).includes('Power')).toBe(true);
  });

  it('snap with 6 stones wins; snap with fewer is a no-op', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.objectiveProgress.steps['stones'] = 5;
    const noWin = applyEffect(
      game,
      { op: 'villainSpecific', key: 'snap', payload: null },
      { player: 'p1' },
    );
    expect(noWin.winner).toBe(null);
    game.players.p1.objectiveProgress.steps['stones'] = 6;
    const win = applyEffect(
      game,
      { op: 'villainSpecific', key: 'snap', payload: null },
      { player: 'p1' },
    );
    expect(win.winner).toBe('p1');
  });

  it('six placeStone effects auto-detect victory via checkWin in the reducer', () => {
    registerCards([
      makeCard({
        id: 'stone-c',
        cost: 0,
        type: 'effect',
        effects: [{ op: 'villainSpecific', key: 'placeStone', payload: { stone: 'X' } }],
      }),
    ]);
    let game = makeGame({ phase: 'actions' });
    game.players.p1.objectiveProgress.steps['stones'] = 5;
    game.players.p1.hand = ['stone-c'];
    game = reduce(game, { kind: 'playCard', cardId: 'stone-c' });
    expect(game.winner).toBe('p1');
  });
});

describe('Hela: placeSoulMark / controlAsgard', () => {
  it('placeSoulMark bumps the asgard counter', () => {
    const game = makeGame({
      phase: 'actions',
      activePlayer: 'p2',
      players: {
        p1: makePlayer('p1', 'thanos'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
    });
    const next = applyEffect(
      game,
      { op: 'villainSpecific', key: 'placeSoulMark', payload: null },
      { player: 'p2' },
    );
    expect(next.players.p2.objectiveProgress.steps['asgard']).toBe(1);
  });

  it('controlAsgard sets winner when asgard >= 8', () => {
    const game = makeGame({
      phase: 'actions',
      activePlayer: 'p2',
      players: {
        p1: makePlayer('p1', 'thanos'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
    });
    game.players.p2.objectiveProgress.steps['asgard'] = 8;
    const next = applyEffect(
      game,
      { op: 'villainSpecific', key: 'controlAsgard', payload: null },
      { player: 'p2' },
    );
    expect(next.winner).toBe('p2');
  });
});

describe('Killmonger / Taskmaster / Ultron', () => {
  it('Killmonger defeatBoss bumps bosses; claimWakanda requires 4', () => {
    const game = makeGame({
      phase: 'actions',
      activePlayer: 'p4',
      players: {
        p1: makePlayer('p1', 'thanos'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
    });
    let s = game;
    for (let i = 0; i < 4; i++) {
      s = applyEffect(
        s,
        { op: 'villainSpecific', key: 'defeatBoss', payload: null },
        { player: 'p4' },
      );
    }
    expect(s.players.p4.objectiveProgress.steps['bosses']).toBe(4);
    const win = applyEffect(
      s,
      { op: 'villainSpecific', key: 'claimWakanda', payload: null },
      { player: 'p4' },
    );
    expect(win.winner).toBe('p4');
  });

  it('Taskmaster completeContract records id + bumps counter', () => {
    const game = makeGame({
      phase: 'actions',
      players: {
        p1: makePlayer('p1', 'taskmaster'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
    });
    const next = applyEffect(
      game,
      { op: 'villainSpecific', key: 'completeContract', payload: { contractId: 'k01' } },
      { player: 'p1' },
    );
    expect(next.players.p1.objectiveProgress.steps['contracts']).toBe(1);
    expect((next.players.p1.flags['contracts'] as string[])[0]).toBe('k01');
  });

  it('Ultron installUpgrade bumps upgrades; markFinalForm sets flag; four upgrades + final = win', () => {
    let game = makeGame({
      phase: 'actions',
      activePlayer: 'p3',
      playerOrder: ['p3'], // checkWin only iterates playerOrder
      players: {
        p1: makePlayer('p1', 'thanos'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
    });
    for (let i = 0; i < 4; i++) {
      game = applyEffect(
        game,
        { op: 'villainSpecific', key: 'installUpgrade', payload: { slot: `s${i}` } },
        { player: 'p3' },
      );
    }
    expect(game.players.p3.objectiveProgress.steps['upgrades']).toBe(4);
    game = applyEffect(
      game,
      { op: 'villainSpecific', key: 'markFinalForm', payload: null },
      { player: 'p3' },
    );
    // checkWin reads finalForm flag truthiness — apply via reducer to trigger it.
    registerCards([
      makeCard({
        id: 'noop',
        cost: 0,
        type: 'effect',
        effects: [],
      }),
    ]);
    game.players.p3.hand = ['noop'];
    game = reduce(game, { kind: 'playCard', cardId: 'noop' });
    expect(game.winner).toBe('p3');
  });
});
