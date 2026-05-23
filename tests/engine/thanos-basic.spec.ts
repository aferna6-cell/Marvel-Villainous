import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame, makeInPlay, makeLocation, makeRealm } from './fixtures';

afterEach(() => clearRegistry());

// Thanos M2: a single-villain experience with no Fate deck and no objective.
// The cards below are local dummies — the real Thanos deck arrives once the
// user transcribes Q14 in RULES_QUESTIONS.md.

function setupThanosWithHero(): {
  game: ReturnType<typeof makeGame>;
} {
  registerCards([
    makeCard({
      id: 'test-thanos-ally',
      villain: 'thanos',
      type: 'ally',
      cost: 1,
      strength: 5,
    }),
    makeCard({
      id: 'test-dummy-hero',
      villain: 'fate-thanos',
      type: 'hero',
      cost: 0,
      strength: 3,
    }),
  ]);

  const realm = makeRealm('thanos', [
    makeLocation(0, { heroesPresent: [makeInPlay('test-dummy-hero')] }),
    makeLocation(1),
    makeLocation(2),
    makeLocation(3),
  ]);
  const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
  game.players.p1.realm = realm;
  game.players.p1.hand = ['test-thanos-ally'];
  game.players.p1.power = 0;
  return { game };
}

describe('Thanos M2 — gain power, play ally, vanquish a dummy hero', () => {
  it('the gainPower icon adds power and is marked used', () => {
    const { game } = setupThanosWithHero();
    const next = reduce(game, { kind: 'useIcon', location: 0, iconIndex: 0 });
    expect(next.players.p1.power).toBe(1);
    expect(next.usedIcons).toEqual([{ location: 0, iconIndex: 0 }]);
  });

  it('reusing the same icon the same turn is illegal', () => {
    const { game } = setupThanosWithHero();
    const after = reduce(game, { kind: 'useIcon', location: 0, iconIndex: 0 });
    expect(() => reduce(after, { kind: 'useIcon', location: 0, iconIndex: 0 })).toThrow(
      'already been used',
    );
  });

  it('a bottom-row icon is covered while a hero is present', () => {
    const { game } = setupThanosWithHero();
    // iconIndex 2 = first bottom-row icon (topIcons has length 2).
    expect(() => reduce(game, { kind: 'useIcon', location: 0, iconIndex: 2 })).toThrow(
      'covered',
    );
  });

  it('plays an ally for its printed Power cost', () => {
    const { game } = setupThanosWithHero();
    const gained = reduce(game, { kind: 'useIcon', location: 0, iconIndex: 0 });
    const played = reduce(gained, { kind: 'playCard', cardId: 'test-thanos-ally' });
    expect(played.players.p1.power).toBe(0);
    expect(played.players.p1.hand).not.toContain('test-thanos-ally');
    const allies = played.players.p1.realm.locations[0]?.alliesPresent ?? [];
    expect(allies.map((a) => a.cardId)).toEqual(['test-thanos-ally']);
  });

  it('vanquishes a hero with an ally of sufficient strength', () => {
    const { game } = setupThanosWithHero();
    let s = reduce(game, { kind: 'useIcon', location: 0, iconIndex: 0 });
    s = reduce(s, { kind: 'playCard', cardId: 'test-thanos-ally' });
    s = reduce(s, {
      kind: 'attackHero',
      allyIds: ['test-thanos-ally'],
      heroId: 'test-dummy-hero',
    });
    expect(s.players.p1.realm.locations[0]?.heroesPresent).toHaveLength(0);
    // Hero goes to the SHARED Fate discard (rulebook Setup §3).
    expect(s.fateDiscard).toContain('test-dummy-hero');
    // Rulebook Vanquish: the spent ally is discarded along with the hero.
    expect(s.players.p1.realm.locations[0]?.alliesPresent).toHaveLength(0);
    expect(s.players.p1.discard).toContain('test-thanos-ally');
    // With the hero gone the bottom-row icons are no longer covered.
    expect(() => reduce(s, { kind: 'useIcon', location: 0, iconIndex: 2 })).not.toThrow();
  });

  it('cannot afford an ally without spending the gainPower icon first', () => {
    const { game } = setupThanosWithHero();
    expect(() => reduce(game, { kind: 'playCard', cardId: 'test-thanos-ally' })).toThrow(
      'power',
    );
  });
});

describe('Thanos M2 — a full turn flow', () => {
  it('walks start → move → actions → end and rotates back to the same player when solo', () => {
    registerCards([
      makeCard({ id: 'test-thanos-card', villain: 'thanos', type: 'effect', cost: 0 }),
    ]);
    const game = makeGame({ phase: 'start', playerOrder: ['p1'] });
    game.players.p1.realm = makeRealm('thanos');
    game.players.p1.deck = ['test-thanos-card'];

    // start → move
    let s = reduce(game, { kind: 'startTurn' });
    expect(s.phase).toBe('move');

    // move → actions
    s = reduce(s, { kind: 'moveVillain', to: 2 });
    expect(s.phase).toBe('actions');
    expect(s.players.p1.realm.villainTokenAt).toBe(2);

    // actions → endTurn cascades through end → next player's start → move
    s = reduce(s, { kind: 'endTurn' });
    // Solo game: the active player stays p1 (wrap to seat 0).
    expect(s.activePlayer).toBe('p1');
    expect(s.phase).toBe('move');
    expect(s.turn).toBe(2);
    expect(s.players.p1.hand).toContain('test-thanos-card'); // drew up to hand size
  });
});
