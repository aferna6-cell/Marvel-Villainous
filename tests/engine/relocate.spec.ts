import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry } from '../../src/engine/cards/registry';
import { makeGame, makeInPlay, makeLocation, makeRealm } from './fixtures';

afterEach(() => clearRegistry());

describe('relocateAlly action', () => {
  it('moves an ally between two of the active player\'s locations', () => {
    const realm = makeRealm('thanos', [
      makeLocation(0, { alliesPresent: [makeInPlay('a1')] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = realm;
    const next = reduce(game, {
      kind: 'relocateAlly',
      fromLocation: 0,
      instanceId: 'inst-a1',
      toLocation: 2,
    });
    expect(next.players.p1.realm.locations[0]?.alliesPresent).toHaveLength(0);
    expect(next.players.p1.realm.locations[2]?.alliesPresent).toHaveLength(1);
    expect(next.players.p1.realm.locations[2]?.alliesPresent[0]?.cardId).toBe('a1');
  });

  it('rejects relocating to the same location', () => {
    const realm = makeRealm('thanos', [
      makeLocation(0, { alliesPresent: [makeInPlay('a1')] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = realm;
    expect(() =>
      reduce(game, {
        kind: 'relocateAlly',
        fromLocation: 0,
        instanceId: 'inst-a1',
        toLocation: 0,
      }),
    ).toThrow('different location');
  });

  it('rejects relocating an ally that is not at the source', () => {
    const game = makeGame({ phase: 'actions' });
    expect(() =>
      reduce(game, {
        kind: 'relocateAlly',
        fromLocation: 0,
        instanceId: 'inst-ghost',
        toLocation: 1,
      }),
    ).toThrow('not at the source');
  });

  it('rejects relocate outside the actions phase', () => {
    const game = makeGame({ phase: 'move' });
    expect(() =>
      reduce(game, {
        kind: 'relocateAlly',
        fromLocation: 0,
        instanceId: 'inst-anything',
        toLocation: 1,
      }),
    ).toThrow('actions phase');
  });
});
