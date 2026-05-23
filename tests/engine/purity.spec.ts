import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import {
  deepFreeze,
  makeCard,
  makeGame,
  makeInPlay,
  makeLocation,
  makeRealm,
} from './fixtures';
import type { Action, GameState } from '../../src/engine/types';

afterEach(() => clearRegistry());

// A deeply frozen input would throw on any in-place write, so a clean run
// proves the reducer never mutates its argument (acceptance for CHUNK 3).
function expectPure(state: GameState, action: Action): void {
  const frozen = deepFreeze(structuredClone(state));
  const snapshot = JSON.stringify(frozen);
  expect(() => reduce(frozen, action)).not.toThrow();
  expect(JSON.stringify(frozen)).toBe(snapshot);
}

describe('purity — no action mutates state in place', () => {
  it('startTurn', () => {
    expectPure(makeGame({ phase: 'start' }), { kind: 'startTurn' });
  });

  it('moveVillain', () => {
    expectPure(makeGame({ phase: 'move' }), { kind: 'moveVillain', to: 2 });
  });

  it('useIcon', () => {
    expectPure(makeGame({ phase: 'actions' }), { kind: 'useIcon', location: 0, iconIndex: 0 });
  });

  it('discardCards', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['h1'];
    expectPure(game, { kind: 'discardCards', cardIds: ['h1'] });
  });

  it('drawToHandSize', () => {
    const game = makeGame({ phase: 'end' });
    game.players.p1.deck = ['d1', 'd2'];
    expectPure(game, { kind: 'drawToHandSize' });
  });

  it('fateOpponent', () => {
    expectPure(makeGame({ phase: 'actions' }), { kind: 'fateOpponent', opponent: 'p2' });
  });

  it('endTurn', () => {
    expectPure(makeGame({ phase: 'actions' }), { kind: 'endTurn' });
  });

  it('playCard', () => {
    registerCards([makeCard({ id: 'c1', type: 'ally', cost: 0, strength: 2 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['c1'];
    expectPure(game, { kind: 'playCard', cardId: 'c1' });
  });

  it('attackHero', () => {
    registerCards([
      makeCard({ id: 'ally-1', type: 'ally', strength: 5 }),
      makeCard({ id: 'hero-1', type: 'hero', strength: 3 }),
    ]);
    const realm = makeRealm('thanos', [
      makeLocation(0, {
        alliesPresent: [makeInPlay('ally-1')],
        heroesPresent: [makeInPlay('hero-1')],
      }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = realm;
    expectPure(game, { kind: 'attackHero', allyIds: ['ally-1'], heroId: 'hero-1' });
  });

  it('resolvePrompt', () => {
    const game = makeGame({
      phase: 'actions',
      pendingPrompt: {
        id: 'p',
        player: 'p1',
        kind: 'optional',
        message: 'm',
        choices: [{ kind: 'skip' }],
      },
    });
    expectPure(game, { kind: 'resolvePrompt', choice: { kind: 'skip' } });
  });
});
