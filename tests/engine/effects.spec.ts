import { afterEach, describe, expect, it } from 'vitest';
import { applyEffect } from '../../src/engine/cards/effects';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { deepFreeze, makeCard, makeGame, makeInPlay, makeLocation, makeRealm } from './fixtures';
import type { EffectContext } from '../../src/engine/types';

afterEach(() => clearRegistry());

const ctx: EffectContext = { player: 'p1' };

describe('applyEffect — every EffectSpec variant (§2.3)', () => {
  it('gainPower adds power and enqueues a powerGained trigger', () => {
    const game = makeGame();
    const next = applyEffect(game, { op: 'gainPower', n: 4 }, ctx);
    expect(next.players.p1.power).toBe(4);
    expect(next.pendingTriggers.some((t) => t.event === 'powerGained')).toBe(true);
  });

  it('drawCards moves cards from deck to hand', () => {
    const game = makeGame();
    game.players.p1.deck = ['d1', 'd2', 'd3'];
    const next = applyEffect(game, { op: 'drawCards', n: 2 }, ctx);
    expect(next.players.p1.hand).toEqual(['d1', 'd2']);
    expect(next.players.p1.deck).toEqual(['d3']);
  });

  it('drawCards reshuffles the discard pile when the deck is empty', () => {
    const game = makeGame();
    game.players.p1.deck = [];
    game.players.p1.discard = ['x', 'y', 'z'];
    const next = applyEffect(game, { op: 'drawCards', n: 2 }, ctx);
    expect(next.players.p1.hand).toHaveLength(2);
    expect(next.players.p1.deck).toHaveLength(1);
    expect(next.players.p1.discard).toHaveLength(0);
  });

  it('discardSelf moves the source card from hand to discard', () => {
    const game = makeGame();
    game.players.p1.hand = ['self-card'];
    const next = applyEffect(game, { op: 'discardSelf' }, { player: 'p1', sourceCardId: 'self-card' });
    expect(next.players.p1.hand).not.toContain('self-card');
    expect(next.players.p1.discard).toContain('self-card');
  });

  it('boostStrength raises the modifier of allies matching the filter', () => {
    registerCards([
      makeCard({ id: 'ally-tag', type: 'ally', strength: 3, tags: ['order'] }),
      makeCard({ id: 'ally-plain', type: 'ally', strength: 3 }),
    ]);
    const realm = makeRealm('thanos', [
      makeLocation(0, { alliesPresent: [makeInPlay('ally-tag'), makeInPlay('ally-plain')] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const game = makeGame();
    game.players.p1.realm = realm;
    const next = applyEffect(
      game,
      { op: 'boostStrength', allyFilter: { tags: ['order'] }, n: 2, duration: 'permanent' },
      ctx,
    );
    const allies = next.players.p1.realm.locations[0]?.alliesPresent ?? [];
    expect(allies.find((a) => a.cardId === 'ally-tag')?.strengthModifier).toBe(2);
    expect(allies.find((a) => a.cardId === 'ally-plain')?.strengthModifier).toBe(0);
  });

  it('placeToken on self records a token in the player flags', () => {
    const game = makeGame();
    const next = applyEffect(game, { op: 'placeToken', tokenKind: 'stone', on: 'self' }, ctx);
    const tokens = next.players.p1.flags['tokens'] as Record<string, number>;
    expect(tokens['stone']).toBe(1);
  });

  it('defeatHero removes a uniquely matching hero and enqueues heroDefeated', () => {
    const realm = makeRealm('thanos', [
      makeLocation(0, { heroesPresent: [makeInPlay('hero-1')] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const game = makeGame();
    game.players.p1.realm = realm;
    const next = applyEffect(game, { op: 'defeatHero', whereFilter: {} }, ctx);
    expect(next.players.p1.realm.locations[0]?.heroesPresent).toHaveLength(0);
    expect(next.players.p1.fateDiscard).toContain('hero-1');
    expect(next.pendingTriggers.some((t) => t.event === 'heroDefeated')).toBe(true);
  });

  it('defeatHero prompts a choice when several heroes match', () => {
    const realm = makeRealm('thanos', [
      makeLocation(0, { heroesPresent: [makeInPlay('hero-1'), makeInPlay('hero-2')] }),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ]);
    const game = makeGame();
    game.players.p1.realm = realm;
    const next = applyEffect(game, { op: 'defeatHero', whereFilter: {} }, ctx);
    expect(next.pendingPrompt).not.toBeNull();
    expect(next.pendingPrompt?.choices).toHaveLength(2);
  });

  it('moveAlly sets a pending prompt (resolution deferred)', () => {
    const next = applyEffect(makeGame(), { op: 'moveAlly', from: 'any', to: 'anyLocation' }, ctx);
    expect(next.pendingPrompt).not.toBeNull();
  });

  it('moveHero sets a pending prompt (resolution deferred)', () => {
    const next = applyEffect(
      makeGame(),
      { op: 'moveHero', from: 'thisLocation', to: 'anyLocation' },
      ctx,
    );
    expect(next.pendingPrompt).not.toBeNull();
  });

  it('lookAtFate sets a pending prompt (resolution deferred)', () => {
    const next = applyEffect(makeGame(), { op: 'lookAtFate', n: 2, choose: 1 }, ctx);
    expect(next.pendingPrompt).not.toBeNull();
  });

  it('searchDeck sets a pending prompt (resolution deferred)', () => {
    const next = applyEffect(makeGame(), { op: 'searchDeck', filter: {}, into: 'hand' }, ctx);
    expect(next.pendingPrompt).not.toBeNull();
  });

  it('forceDiscard prompts the targeted opponent', () => {
    const game = makeGame();
    game.players.p2.hand = ['p2-a', 'p2-b'];
    const next = applyEffect(game, { op: 'forceDiscard', player: 'opponent', n: 1 }, ctx);
    expect(next.pendingPrompt?.player).toBe('p2');
    expect(next.pendingPrompt?.choices).toHaveLength(2);
  });

  it('villainSpecific routes to the active villain handler', () => {
    const game = makeGame();
    const next = applyEffect(
      game,
      { op: 'villainSpecific', key: 'collectStone', payload: { stone: 'mind' } },
      ctx,
    );
    expect(next.log.some((e) => e.message.includes('thanos villainSpecific'))).toBe(true);
  });

  it('does not mutate the input state', () => {
    const game = deepFreeze(makeGame());
    expect(() => applyEffect(game, { op: 'gainPower', n: 1 }, ctx)).not.toThrow();
    expect(game.players.p1.power).toBe(0);
  });
});
