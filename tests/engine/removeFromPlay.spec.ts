// removeFromPlay action — escape hatch for "defeat X" / "discard this Ally"
// effects the engine doesn't auto-resolve (§0 forbids card text).

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame, makeInPlay, makeLocation, makeRealm } from './fixtures';

afterEach(() => clearRegistry());

describe('removeFromPlay action', () => {
  it('removes an ally from its location and adds it to the owner\'s discard', () => {
    registerCards([makeCard({ id: 'a1', type: 'ally', strength: 2 })]);
    const ally = makeInPlay('a1', 'inst-a');
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = makeRealm('thanos', [
      makeLocation(0, { alliesPresent: [ally] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const next = reduce(game, { kind: 'removeFromPlay', owner: 'p1', instanceId: 'inst-a' });
    expect(next.players.p1.realm.locations[0]?.alliesPresent).toEqual([]);
    expect(next.players.p1.discard).toContain('a1');
    // The reducer drains the trigger bus before returning, so we check the
    // log to confirm the trigger was processed.
    expect(next.log.some((e) => e.message.includes('allyDefeated'))).toBe(true);
  });

  it('removes a hero from its location and sends it to the shared Fate discard', () => {
    registerCards([makeCard({ id: 'h1', type: 'hero', strength: 4 })]);
    const hero = makeInPlay('h1', 'inst-h');
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = makeRealm('thanos', [
      makeLocation(0, { heroesPresent: [hero] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const next = reduce(game, { kind: 'removeFromPlay', owner: 'p1', instanceId: 'inst-h' });
    expect(next.players.p1.realm.locations[0]?.heroesPresent).toEqual([]);
    expect(next.fateDiscard).toContain('h1');
    expect(next.log.some((e) => e.message.includes('heroDefeated'))).toBe(true);
  });

  it('removes a condition and sends it to the shared Fate discard', () => {
    registerCards([makeCard({ id: 'c1', type: 'condition' })]);
    const cond = makeInPlay('c1', 'inst-c');
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = makeRealm('thanos', [
      makeLocation(0, { conditions: [cond] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const next = reduce(game, { kind: 'removeFromPlay', owner: 'p1', instanceId: 'inst-c' });
    expect(next.players.p1.realm.locations[0]?.conditions).toEqual([]);
    expect(next.fateDiscard).toContain('c1');
  });

  it('removes the global event from the center play area', () => {
    registerCards([makeCard({ id: 'e1', type: 'event' })]);
    const game = makeGame({ phase: 'actions', globalEvent: makeInPlay('e1', 'inst-e') });
    const next = reduce(game, { kind: 'removeFromPlay', owner: 'p1', instanceId: 'inst-e' });
    expect(next.globalEvent).toBe(null);
    expect(next.fateDiscard).toContain('e1');
  });

  it('throws on an unknown instance', () => {
    const game = makeGame({ phase: 'actions' });
    expect(() => reduce(game, { kind: 'removeFromPlay', owner: 'p1', instanceId: 'inst-x' })).toThrow();
  });

  it('is undoable', () => {
    registerCards([makeCard({ id: 'a1', type: 'ally', strength: 2 })]);
    const ally = makeInPlay('a1', 'inst-a');
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = makeRealm('thanos', [
      makeLocation(0, { alliesPresent: [ally] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const removed = reduce(game, { kind: 'removeFromPlay', owner: 'p1', instanceId: 'inst-a' });
    expect(removed.players.p1.realm.locations[0]?.alliesPresent).toEqual([]);
    const undone = reduce(removed, { kind: 'undo' });
    expect(undone.players.p1.realm.locations[0]?.alliesPresent).toHaveLength(1);
  });
});
