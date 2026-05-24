import { afterEach, describe, expect, it } from 'vitest';
import { createGameEngine, reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('phase progression — single dispatch transitions', () => {
  it('startTurn advances start → move', () => {
    const next = reduce(makeGame({ phase: 'start' }), { kind: 'startTurn' });
    expect(next.phase).toBe('move');
  });

  it('moveVillain advances move → actions', () => {
    const next = reduce(makeGame({ phase: 'move' }), { kind: 'moveVillain', to: 1 });
    expect(next.phase).toBe('actions');
    expect(next.players.p1.realm.villainTokenAt).toBe(1);
  });

  it('endTurn cascades end → next-player start → next-player move', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.deck = ['d1', 'd2', 'd3'];
    const next = reduce(game, { kind: 'endTurn' });
    expect(next.activePlayer).toBe('p2');
    expect(next.phase).toBe('move'); // auto-advanced past 'end' and 'start'
    expect(next.players.p1.hand).toHaveLength(3); // drew up to handSize=4 (only 3 in deck)
  });

  it('startTurn resets usedIcons and `mustMoveDifferent`', () => {
    const game = makeGame({
      phase: 'start',
      usedIcons: [{ location: 0, iconIndex: 0 }],
    });
    game.players.p1.mustMoveDifferent = false;
    const next = reduce(game, { kind: 'startTurn' });
    expect(next.usedIcons).toEqual([]);
    expect(next.players.p1.mustMoveDifferent).toBe(true);
  });
});

describe('mustMoveDifferent flag', () => {
  it('blocks moving to the same location by default', () => {
    const game = makeGame({ phase: 'move' });
    expect(() => reduce(game, { kind: 'moveVillain', to: 0 })).toThrow('different location');
  });

  it('allows moving to the same location when the flag is flipped off', () => {
    const game = makeGame({ phase: 'move' });
    game.players.p1.mustMoveDifferent = false;
    const next = reduce(game, { kind: 'moveVillain', to: 0 });
    expect(next.phase).toBe('actions');
    expect(next.players.p1.realm.villainTokenAt).toBe(0);
  });
});

describe('Fate phase', () => {
  it('the fate action enters the fate phase and parks a fatePlay continuation', () => {
    registerCards([
      makeCard({ id: 'fc1', villain: 'fate-hela', type: 'hero', strength: 2 }),
    ]);
    // Single shared Fate deck (rulebook Setup §3).
    const game = makeGame({ phase: 'actions', fateDeck: ['fc1'] });
    const next = reduce(game, { kind: 'fate' });
    // Q10: Fate stays in the actions phase — it's just another action.
    expect(next.phase).toBe('actions');
    expect(next.pendingPrompt?.continuation?.kind).toBe('fatePlay');
    // Rulebook reveal-then-target: 1 choice per eligible opponent + skip.
    expect(next.pendingPrompt?.choices).toHaveLength(2);
  });

  it('resolving a fate prompt places a hero and cascades all the way to next player', () => {
    registerCards([
      makeCard({ id: 'fc1', villain: 'fate-hela', type: 'hero', strength: 2 }),
    ]);
    const game = makeGame({ phase: 'actions', fateDeck: ['fc1'] });
    game.players.p1.deck = ['p1-d1', 'p1-d2', 'p1-d3'];
    const fated = reduce(game, { kind: 'fate' });
    const targetPicked = reduce(fated, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    const resolved = reduce(targetPicked, {
      kind: 'resolvePrompt',
      choice: { kind: 'location', location: 0 },
    });
    expect(resolved.pendingPrompt).toBeNull();
    expect(resolved.players.p2.realm.locations[0]?.heroesPresent).toHaveLength(1);
    expect(resolved.players.p2.realm.locations[0]?.heroesPresent[0]?.cardId).toBe('fc1');
    // Q10: Fate stays in actions phase — does NOT auto-rotate to next player.
    expect(resolved.activePlayer).toBe('p1');
    expect(resolved.phase).toBe('actions');
  });
});

describe('out-of-phase actions are rejected with a clear reason', () => {
  it('moveVillain during the actions phase', () => {
    expect(() =>
      reduce(makeGame({ phase: 'actions' }), { kind: 'moveVillain', to: 1 }),
    ).toThrow('move phase');
  });

  it('useIcon during the move phase', () => {
    expect(() =>
      reduce(makeGame({ phase: 'move' }), { kind: 'useIcon', location: 0, iconIndex: 0 }),
    ).toThrow('actions phase');
  });

  it('endTurn during the move phase', () => {
    expect(() => reduce(makeGame({ phase: 'move' }), { kind: 'endTurn' })).toThrow(
      'actions phase',
    );
  });

  it('startTurn outside the start phase', () => {
    expect(() => reduce(makeGame({ phase: 'actions' }), { kind: 'startTurn' })).toThrow(
      'start phase',
    );
  });
});

describe('reducer purity — state identity changes after every dispatch', () => {
  it('startTurn yields a new state object (and a new active player record)', () => {
    const engine = createGameEngine(makeGame({ phase: 'start' }));
    const before = engine.getState();
    const beforeP1 = before.players.p1;
    engine.dispatch({ kind: 'startTurn' });
    const after = engine.getState();
    expect(after).not.toBe(before);
    expect(after.players.p1).not.toBe(beforeP1);
  });
});
