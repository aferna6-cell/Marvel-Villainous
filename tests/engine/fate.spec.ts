// Fate mechanic — engine-level tests (CHUNK 6 / rulebook §4).
//
// Rulebook: a Fate action reveals ONE card from the SHARED Fate deck, then
// the active player chooses a target opponent and either plays the revealed
// card on that opponent or discards it with no effect. Heroes land on the
// opponent's realm and cover the bottom-row icons of their location until
// the hero is vanquished. Conditions sit on a location and (eventually) tick
// at start-of-turn.

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
  it('rejects fating yourself', () => {
    const game = setupThanosVsThanos(['fate-hero-a']);
    expect(() => reduce(game, { kind: 'fateOpponent', opponent: 'p1' })).toThrow(
      'cannot Fate yourself',
    );
  });

  it('reveals one card and enters the fate phase with a fatePlay continuation', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    const game = setupThanosVsThanos(['fate-hero-a', 'fate-hero-b']);
    const next = reduce(game, { kind: 'fateOpponent', opponent: 'p2' });
    expect(next.phase).toBe('fate');
    expect(next.pendingPrompt?.continuation?.kind).toBe('fatePlay');
    if (next.pendingPrompt?.continuation?.kind === 'fatePlay') {
      // Reveal-1, not reveal-2.
      expect(next.pendingPrompt.continuation.revealed).toEqual(['fate-hero-a']);
      expect(next.pendingPrompt.continuation.opponent).toBe('p2');
    }
    // Choices: "play this card" and "discard with no effect".
    expect(next.pendingPrompt?.choices).toHaveLength(2);
  });
});

describe('Fate — hero lands on opponent realm and covers bottom-row icons', () => {
  it('playing a Hero from a Fate prompt places it on the opponent realm', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    const game = setupThanosVsThanos(['fate-hero-a']);
    const fated = reduce(game, { kind: 'fateOpponent', opponent: 'p2' });
    const resolved = reduce(fated, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'fate-hero-a' },
    });
    expect(resolved.pendingPrompt).toBeNull();
    const heroes = resolved.players.p2.realm.locations[0]?.heroesPresent ?? [];
    expect(heroes.map((h) => h.cardId)).toEqual(['fate-hero-a']);
  });

  it('the covered location\'s bottom-row icons become unusable for the fated player', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    // Hand-craft a state where p2 is the active player about to use an icon
    // at the location where the hero just landed.
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
    // Hero lands in the SHARED Fate discard, not a per-player pile.
    expect(after.fateDiscard).toContain('fate-hero-a');
    // Icons are now usable again at that location.
    expect(() => reduce(after, { kind: 'useIcon', location: 0, iconIndex: 2 })).not.toThrow();
  });
});

describe('Fate — Condition cards', () => {
  it('a played Condition sits on the targeted opponent\'s realm', () => {
    registerCards([
      makeCard({ id: 'fate-cond-1', villain: 'fate-thanos', type: 'condition' }),
    ]);
    const game = setupThanosVsThanos(['fate-cond-1']);
    const fated = reduce(game, { kind: 'fateOpponent', opponent: 'p2' });
    const resolved = reduce(fated, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'fate-cond-1' },
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
    // The event bus is drained inside the reducer; observe via the log.
    const conditionTickLogs = after.log.filter((e) =>
      e.message.includes('trigger: conditionTick'),
    );
    expect(conditionTickLogs).toHaveLength(2);
  });
});

describe('Fate — discard with no effect (rulebook escape clause)', () => {
  it('resolving with `skip` discards the revealed card without playing it', () => {
    registerCards([
      makeCard({ id: 'fate-hero-a', villain: 'fate-thanos', type: 'hero', strength: 3 }),
    ]);
    const game = setupThanosVsThanos(['fate-hero-a']);
    const fated = reduce(game, { kind: 'fateOpponent', opponent: 'p2' });
    const resolved = reduce(fated, { kind: 'resolvePrompt', choice: { kind: 'skip' } });
    expect(resolved.pendingPrompt).toBeNull();
    // Card moved from deck to discard with no realm-side placement.
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
    const next = reduce(game, { kind: 'fateOpponent', opponent: 'p2' });
    // After reshuffle, the deck holds the discard contents minus the
    // revealed card; the discard is empty.
    expect(next.fateDiscard).toHaveLength(0);
    expect(next.fateDeck.length + (next.pendingPrompt ? 1 : 0)).toBeGreaterThanOrEqual(3);
    // One card was revealed; the continuation knows about it.
    if (next.pendingPrompt?.continuation?.kind === 'fatePlay') {
      expect(next.pendingPrompt.continuation.revealed).toHaveLength(1);
    }
  });

  it('an empty Fate deck and an empty discard skip the prompt cleanly', () => {
    const game = setupThanosVsThanos([], []);
    const next = reduce(game, { kind: 'fateOpponent', opponent: 'p2' });
    // No card to reveal — no prompt is parked. The auto-advance loop carries
    // the phase machine forward from Fate into End and on to the next turn.
    expect(next.pendingPrompt).toBeNull();
    expect(next.players.p2.realm.locations[0]?.heroesPresent).toHaveLength(0);
  });
});
