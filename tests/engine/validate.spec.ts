import { afterEach, describe, expect, it } from 'vitest';
import { isLegal } from '../../src/engine/validate';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame, makeInPlay, makeLocation, makeRealm } from './fixtures';
import type { Legality } from '../../src/engine/validate';

afterEach(() => clearRegistry());

function reason(result: Legality): string {
  return result === true ? '<legal>' : result.reason;
}

describe('isLegal — move phase (§3)', () => {
  it('rejects moving the villain to its current location', () => {
    const game = makeGame({ phase: 'move' });
    const result = isLegal(game, { kind: 'moveVillain', to: 0 });
    expect(result).not.toBe(true);
    expect(reason(result)).toContain('different location');
  });

  it('allows moving the villain to a different location', () => {
    const game = makeGame({ phase: 'move' });
    expect(isLegal(game, { kind: 'moveVillain', to: 2 })).toBe(true);
  });

  it('rejects moving outside the move phase', () => {
    const game = makeGame({ phase: 'actions' });
    expect(isLegal(game, { kind: 'moveVillain', to: 2 })).not.toBe(true);
  });
});

describe('isLegal — using icons (§3, §4)', () => {
  it("rejects using an icon away from the villain's current location", () => {
    const game = makeGame({ phase: 'actions' });
    const result = isLegal(game, { kind: 'useIcon', location: 1, iconIndex: 0 });
    expect(reason(result)).toContain('current location');
  });

  it('rejects an icon covered by a hero', () => {
    const covered = makeLocation(0, { heroesPresent: [makeInPlay('hero-x')] });
    const realm = makeRealm('thanos', [
      covered,
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = realm;
    // topIcons has 2 entries, so iconIndex 2 is the first bottom-row icon.
    const result = isLegal(game, { kind: 'useIcon', location: 0, iconIndex: 2 });
    expect(reason(result)).toContain('covered');
  });

  it('rejects an icon already used this turn', () => {
    const game = makeGame({ phase: 'actions', usedIcons: [{ location: 0, iconIndex: 0 }] });
    const result = isLegal(game, { kind: 'useIcon', location: 0, iconIndex: 0 });
    expect(reason(result)).toContain('already been used');
  });

  it('allows an uncovered, unused top-row icon at the current location', () => {
    const game = makeGame({ phase: 'actions' });
    expect(isLegal(game, { kind: 'useIcon', location: 0, iconIndex: 0 })).toBe(true);
  });
});

describe('isLegal — playing cards (§3, §11)', () => {
  it('rejects a card not in hand', () => {
    registerCards([makeCard({ id: 'c1', cost: 0 })]);
    const game = makeGame({ phase: 'actions' });
    expect(isLegal(game, { kind: 'playCard', cardId: 'c1' })).not.toBe(true);
  });

  it('rejects an unknown card', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['ghost'];
    expect(reason(isLegal(game, { kind: 'playCard', cardId: 'ghost' }))).toContain('unknown');
  });

  it('rejects a card the player cannot pay for', () => {
    registerCards([makeCard({ id: 'pricey', cost: 5 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['pricey'];
    game.players.p1.power = 4;
    expect(reason(isLegal(game, { kind: 'playCard', cardId: 'pricey' }))).toContain('power');
  });

  it('allows a card the player can afford', () => {
    registerCards([makeCard({ id: 'cheap', cost: 3 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['cheap'];
    game.players.p1.power = 3;
    expect(isLegal(game, { kind: 'playCard', cardId: 'cheap' })).toBe(true);
  });
});

describe('isLegal — attacking heroes (§4)', () => {
  it('rejects attacking with an ally not in play', () => {
    const game = makeGame({ phase: 'actions' });
    const result = isLegal(game, { kind: 'attackHero', allyId: 'ally-1', heroId: 'hero-1' });
    expect(reason(result)).toContain('not in play');
  });

  it('rejects attacking a hero at a different location than the ally', () => {
    const realm = makeRealm('thanos', [
      makeLocation(0, { alliesPresent: [makeInPlay('ally-1')] }),
      makeLocation(1, { heroesPresent: [makeInPlay('hero-1')] }),
      makeLocation(2),
      makeLocation(3),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm = realm;
    const result = isLegal(game, { kind: 'attackHero', allyId: 'ally-1', heroId: 'hero-1' });
    expect(reason(result)).toContain('same location');
  });

  it('allows attacking a hero sharing the ally’s location', () => {
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
    expect(isLegal(game, { kind: 'attackHero', allyId: 'ally-1', heroId: 'hero-1' })).toBe(true);
  });
});

describe('isLegal — Fate (§3, §11)', () => {
  it('rejects Fating yourself', () => {
    const game = makeGame({ phase: 'actions' });
    const result = isLegal(game, { kind: 'fateOpponent', opponent: 'p1' });
    expect(reason(result)).toContain('cannot Fate yourself');
  });

  it('rejects Fating a player not in the game', () => {
    const game = makeGame({ phase: 'actions' });
    expect(isLegal(game, { kind: 'fateOpponent', opponent: 'p3' })).not.toBe(true);
  });

  it('allows Fating a real opponent', () => {
    const game = makeGame({ phase: 'actions' });
    expect(isLegal(game, { kind: 'fateOpponent', opponent: 'p2' })).toBe(true);
  });
});

describe('isLegal — drawing & hand size (§3, §11)', () => {
  it('rejects drawing when the hand is already at the limit', () => {
    const game = makeGame({ phase: 'end' });
    game.players.p1.hand = ['a', 'b', 'c', 'd'];
    const result = isLegal(game, { kind: 'drawToHandSize' });
    expect(reason(result)).toContain('hand-size limit');
  });

  it('allows drawing when below the hand-size limit in the end phase', () => {
    const game = makeGame({ phase: 'end' });
    game.players.p1.hand = ['a'];
    expect(isLegal(game, { kind: 'drawToHandSize' })).toBe(true);
  });

  it('rejects drawing outside the end phase', () => {
    const game = makeGame({ phase: 'actions' });
    expect(isLegal(game, { kind: 'drawToHandSize' })).not.toBe(true);
  });
});

describe('isLegal — discarding (§3)', () => {
  it('rejects discarding a card not in hand', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['a'];
    const result = isLegal(game, { kind: 'discardCards', cardIds: ['b'] });
    expect(reason(result)).toContain('not in hand');
  });

  it('rejects discarding the same card twice when only one copy is held', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['a'];
    expect(isLegal(game, { kind: 'discardCards', cardIds: ['a', 'a'] })).not.toBe(true);
  });
});

describe('isLegal — turn structure & global guards', () => {
  it('rejects starting a turn outside the start phase', () => {
    const game = makeGame({ phase: 'actions' });
    expect(isLegal(game, { kind: 'startTurn' })).not.toBe(true);
  });

  it('rejects ending the turn before the actions phase', () => {
    const game = makeGame({ phase: 'move' });
    expect(isLegal(game, { kind: 'endTurn' })).not.toBe(true);
  });

  it('rejects every action once the game has a winner', () => {
    const game = makeGame({ phase: 'actions', winner: 'p1' });
    expect(reason(isLegal(game, { kind: 'endTurn' }))).toContain('over');
  });

  it('rejects non-resolvePrompt actions while a prompt is pending', () => {
    const game = makeGame({
      phase: 'actions',
      pendingPrompt: { id: 'x', player: 'p1', kind: 'optional', message: 'm', choices: [] },
    });
    const result = isLegal(game, { kind: 'endTurn' });
    expect(reason(result)).toContain('pending prompt');
  });

  it('rejects resolvePrompt when there is no pending prompt', () => {
    const game = makeGame({ phase: 'actions' });
    const result = isLegal(game, { kind: 'resolvePrompt', choice: { kind: 'skip' } });
    expect(reason(result)).toContain('no pending prompt');
  });
});
