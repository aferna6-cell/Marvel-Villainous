// Q2: rulebook-strict icon enforcement — icon-gated actions (playCard,
// attackHero, fate, discardCards, relocateAlly) require an unused matching
// icon at the active player's current location and consume it.
//
// Off by default (the engine is a relaxed state tracker); on when the user
// dispatches `setStrictIconMode { value: true }`.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame, makeLocation, makeRealm } from './fixtures';
import type { ActionIcon } from '../../src/engine/types';

afterEach(() => clearRegistry());

describe('strictIconMode toggle (Q2)', () => {
  it('is off by default', () => {
    expect(makeGame().strictIconMode).toBe(false);
  });

  it('toggles via setStrictIconMode action', () => {
    const game = makeGame({ phase: 'actions' });
    const on = reduce(game, { kind: 'setStrictIconMode', value: true });
    expect(on.strictIconMode).toBe(true);
    const off = reduce(on, { kind: 'setStrictIconMode', value: false });
    expect(off.strictIconMode).toBe(false);
  });
});

describe('strict-mode icon enforcement', () => {
  function realmWith(icons: ActionIcon[]) {
    return makeRealm('thanos', [
      makeLocation(0, { topIcons: icons, bottomIcons: [] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
  }

  it('strict mode blocks playCard without a `play` icon at current location', () => {
    registerCards([makeCard({ id: 'c1', cost: 0 })]);
    const game = makeGame({ phase: 'actions', strictIconMode: true });
    game.players.p1.realm = realmWith(['gainPower']); // no 'play' icon
    game.players.p1.hand = ['c1'];
    expect(() => reduce(game, { kind: 'playCard', cardId: 'c1' })).toThrow('play');
  });

  it('strict mode lets playCard through when a `play` icon is present', () => {
    registerCards([makeCard({ id: 'c1', cost: 0 })]);
    const game = makeGame({ phase: 'actions', strictIconMode: true });
    game.players.p1.realm = realmWith(['play']);
    game.players.p1.hand = ['c1'];
    const next = reduce(game, { kind: 'playCard', cardId: 'c1' });
    // The play icon was consumed.
    expect(next.usedIcons.some((u) => u.location === 0 && u.iconIndex === 0)).toBe(true);
  });

  it('strict mode rejects a second playCard after the only play icon was spent', () => {
    registerCards([
      makeCard({ id: 'c1', cost: 0 }),
      makeCard({ id: 'c2', cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', strictIconMode: true });
    game.players.p1.realm = realmWith(['play']);
    game.players.p1.hand = ['c1', 'c2'];
    const after = reduce(game, { kind: 'playCard', cardId: 'c1' });
    expect(() => reduce(after, { kind: 'playCard', cardId: 'c2' })).toThrow('play');
  });

  it('relaxed mode (default) lets you play without any icon at all', () => {
    registerCards([makeCard({ id: 'c1', cost: 0 })]);
    const game = makeGame({ phase: 'actions' }); // strictIconMode: false
    game.players.p1.realm = realmWith([]); // no icons at all
    game.players.p1.hand = ['c1'];
    const next = reduce(game, { kind: 'playCard', cardId: 'c1' });
    expect(next.players.p1.hand).not.toContain('c1');
  });

  it('strict mode requires a `fate` icon to Fate', () => {
    const game = makeGame({ phase: 'actions', strictIconMode: true });
    game.players.p1.realm = realmWith(['gainPower']);
    expect(() => reduce(game, { kind: 'fate' })).toThrow('fate');
  });

  it('strict mode requires a `discard` icon to discard', () => {
    const game = makeGame({ phase: 'actions', strictIconMode: true });
    game.players.p1.realm = realmWith(['gainPower']);
    game.players.p1.hand = ['x'];
    expect(() => reduce(game, { kind: 'discardCards', cardIds: ['x'] })).toThrow('discard');
  });
});
