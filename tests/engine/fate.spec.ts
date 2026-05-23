// Fate mechanic — engine-level tests (CHUNK 6 / rulebook §4).
//
// Rulebook: a Fate action reveals ONE card from the SHARED Fate deck, THEN
// the active player chooses a target opponent and either plays the revealed
// card on that opponent or discards it with no effect. Heroes land on the
// opponent's realm and cover the bottom-row icons of their location until
// the hero is vanquished. Conditions sit on a location and tick at
// start-of-turn. Events (CHUNK 6 follow-up) land in the center play area.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame, makeInPlay, makeLocation, makeRealm } from './fixtures';
import type { GameState } from '../../src/engine/types';

afterEach(() => clearRegistry());

function setupThanosVsThanos(fateDeck: string[], fateDiscard: string[] = []): GameState {
  return makeGame({
    phase: 'actions',
    playerOrder: ['p1', 'p2'],
    fateDeck,
    fateDiscard,
  });
}

describe('Fate action — reveal-1 from the shared deck (rulebook §4)', () => {
  it('a Fate action with no opponents is illegal', () => {
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    expect(() => reduce(game, { kind: 'fate' })).toThrow('no opponents');
  });

  it('reveals one card and parks a fatePlay continuation listing every eligible target', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    const game = setupThanosVsThanos(['fate-hero-a', 'fate-hero-b']);
    const next = reduce(game, { kind: 'fate' });
    expect(next.phase).toBe('fate');
    expect(next.pendingPrompt?.continuation?.kind).toBe('fatePlay');
    if (next.pendingPrompt?.continuation?.kind === 'fatePlay') {
      // Reveal-1, not reveal-2.
      expect(next.pendingPrompt.continuation.revealed).toEqual(['fate-hero-a']);
      // Target is chosen at resolution, so eligibleTargets lists every opponent.
      expect(next.pendingPrompt.continuation.eligibleTargets).toEqual(['p2']);
    }
    // Choices: one per opponent + skip (rulebook escape clause).
    expect(next.pendingPrompt?.choices).toHaveLength(2);
  });

  it('rejects targeting yourself at resolution', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    const game = setupThanosVsThanos(['fate-hero-a']);
    const fated = reduce(game, { kind: 'fate' });
    expect(() =>
      reduce(fated, {
        kind: 'resolvePrompt',
        choice: { kind: 'target', target: { kind: 'player', player: 'p1' } },
      }),
    ).toThrow();
  });
});

describe('Fate — hero lands on the chosen opponent and covers bottom-row icons', () => {
  it('playing a Hero from a Fate prompt places it on the targeted opponent', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    const game = setupThanosVsThanos(['fate-hero-a']);
    const fated = reduce(game, { kind: 'fate' });
    const resolved = reduce(fated, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    expect(resolved.pendingPrompt).toBeNull();
    const heroes = resolved.players.p2.realm.locations[0]?.heroesPresent ?? [];
    expect(heroes.map((h) => h.cardId)).toEqual(['fate-hero-a']);
  });

  it("the covered location's bottom-row icons become unusable for the fated player", () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    const game = makeGame({
      phase: 'actions',
      activePlayer: 'p2',
      playerOrder: ['p1', 'p2'],
    });
    game.players.p2.realm = makeRealm('thanos', [
      makeLocation(0, { heroesPresent: [makeInPlay('fate-hero-a')] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    // iconIndex 2 = first bottom-row icon (topIcons length 2). Hero covers it.
    expect(() => reduce(game, { kind: 'useIcon', location: 0, iconIndex: 2 })).toThrow(
      'covered',
    );
  });

  it('vanquishing the hero uncovers its bottom-row icons and sends it to the SHARED fate discard', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
      makeCard({ id: 'ally-strong', villain: 'thanos', type: 'ally', cost: 0, strength: 5 }),
    ]);
    const game = makeGame({
      phase: 'actions',
      activePlayer: 'p2',
      playerOrder: ['p1', 'p2'],
    });
    game.players.p2.realm = makeRealm('thanos', [
      makeLocation(0, {
        heroesPresent: [makeInPlay('fate-hero-a')],
        alliesPresent: [makeInPlay('ally-strong')],
      }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);

    const after = reduce(game, {
      kind: 'attackHero',
      allyIds: ['ally-strong'],
      heroId: 'fate-hero-a',
    });
    expect(after.players.p2.realm.locations[0]?.heroesPresent).toHaveLength(0);
    expect(after.fateDiscard).toContain('fate-hero-a');
    expect(() => reduce(after, { kind: 'useIcon', location: 0, iconIndex: 2 })).not.toThrow();
  });
});

describe('Fate — Condition cards', () => {
  it("a played Condition sits on the targeted opponent's realm", () => {
    registerCards([
      makeCard({ id: 'fate-cond-1', villain: 'fate-thanos', type: 'condition' }),
    ]);
    const game = setupThanosVsThanos(['fate-cond-1']);
    const fated = reduce(game, { kind: 'fate' });
    const resolved = reduce(fated, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    const conditions = resolved.players.p2.realm.locations[0]?.conditions ?? [];
    expect(conditions.map((c) => c.cardId)).toEqual(['fate-cond-1']);
  });

  it('start-of-turn enqueues one conditionTick trigger per condition in play', () => {
    registerCards([
      makeCard({ id: 'fate-cond-1', villain: 'fate-thanos', type: 'condition' }),
      makeCard({ id: 'fate-cond-2', villain: 'fate-thanos', type: 'condition' }),
    ]);
    const game = makeGame({ phase: 'start', playerOrder: ['p1'] });
    game.players.p1.realm = makeRealm('thanos', [
      makeLocation(0, {
        conditions: [makeInPlay('fate-cond-1'), makeInPlay('fate-cond-2')],
      }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const after = reduce(game, { kind: 'startTurn' });
    const conditionTickLogs = after.log.filter((e) =>
      e.message.includes('trigger: conditionTick'),
    );
    expect(conditionTickLogs).toHaveLength(2);
  });
});

describe('Fate — Event cards (rulebook §I — Global Events)', () => {
  it('a played Event takes the single Global Event slot in the center play area', () => {
    registerCards([
      makeCard({ id: 'fate-event-1', villain: 'fate-thanos', type: 'event', cost: 0 }),
    ]);
    const game = setupThanosVsThanos(['fate-event-1']);
    const fated = reduce(game, { kind: 'fate' });
    const resolved = reduce(fated, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    expect(resolved.globalEvent?.cardId).toBe('fate-event-1');
    // Event does NOT land on the opponent's realm.
    expect(resolved.players.p2.realm.locations[0]?.heroesPresent).toHaveLength(0);
    expect(resolved.players.p2.realm.locations[0]?.conditions).toHaveLength(0);
  });

  it('only one Global Event may be in play at a time — a new draw is discarded', () => {
    registerCards([
      makeCard({ id: 'fate-event-1', villain: 'fate-thanos', type: 'event', cost: 0 }),
      makeCard({ id: 'fate-event-2', villain: 'fate-thanos', type: 'event', cost: 0 }),
    ]);
    // Hand-craft a state with the first Event already in play to test the
    // "no second Global Event" rule directly, without driving the engine
    // through two turns of the auto-advance cascade.
    const game = setupThanosVsThanos(['fate-event-2']);
    game.globalEvent = {
      instanceId: 'inst-event-1',
      cardId: 'fate-event-1',
      strengthModifier: 0,
      tokens: {},
    };
    const fated = reduce(game, { kind: 'fate' });
    const resolved = reduce(fated, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    // The original Event stays in play; the newly revealed Event is discarded.
    expect(resolved.globalEvent?.cardId).toBe('fate-event-1');
    expect(resolved.fateDiscard).toContain('fate-event-2');
  });
});

describe('Fate — discard with no effect (rulebook escape clause)', () => {
  it('resolving with `skip` discards the revealed card without playing it', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    const game = setupThanosVsThanos(['fate-hero-a']);
    const fated = reduce(game, { kind: 'fate' });
    const resolved = reduce(fated, { kind: 'resolvePrompt', choice: { kind: 'skip' } });
    expect(resolved.pendingPrompt).toBeNull();
    expect(resolved.fateDiscard).toContain('fate-hero-a');
    expect(resolved.fateDeck).not.toContain('fate-hero-a');
    expect(resolved.players.p2.realm.locations[0]?.heroesPresent).toHaveLength(0);
  });
});

describe('Fate — reshuffle when the deck runs low (rulebook §11)', () => {
  it('shuffles the Fate discard into the Fate deck when the deck is empty', () => {
    registerCards([
      makeCard({ id: 'recycle-1', villain: 'fate-thanos', type: 'hero', strength: 2 }),
      makeCard({ id: 'recycle-2', villain: 'fate-thanos', type: 'hero', strength: 3 }),
      makeCard({ id: 'recycle-3', villain: 'fate-thanos', type: 'hero', strength: 4 }),
    ]);
    const game = setupThanosVsThanos([], ['recycle-1', 'recycle-2', 'recycle-3']);
    const next = reduce(game, { kind: 'fate' });
    expect(next.fateDiscard).toHaveLength(0);
    expect(next.fateDeck.length + (next.pendingPrompt ? 1 : 0)).toBeGreaterThanOrEqual(3);
    if (next.pendingPrompt?.continuation?.kind === 'fatePlay') {
      expect(next.pendingPrompt.continuation.revealed).toHaveLength(1);
    }
  });

  it('an empty Fate deck and an empty discard skip the prompt cleanly', () => {
    const game = setupThanosVsThanos([], []);
    const next = reduce(game, { kind: 'fate' });
    expect(next.pendingPrompt).toBeNull();
    expect(next.players.p2.realm.locations[0]?.heroesPresent).toHaveLength(0);
  });
});
