// Tests for the deferred-action prompt resolver — the bridge between
// villainSpecific handlers that park a prompt and the engine state
// mutations that fire once the player picks one of the offered choices.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';
import { applyVillainSpecific as thanosSpecific } from '../../src/engine/villains/thanos/specific';
import type { InPlayCard, EffectContext } from '../../src/engine/types';

afterEach(() => clearRegistry());

function makeInPlay(cardId: string, instanceId: string): InPlayCard {
  return { instanceId, cardId, strengthModifier: 0, tokens: {} };
}

describe('deferred prompt resolver — defeatCharacter', () => {
  it('removes the chosen ally and discards its card', () => {
    registerCards([
      makeCard({ id: 'p1-ally-1', type: 'ally', cost: 0, strength: 2 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    const loc = game.players.p1.realm.locations[0]!;
    loc.alliesPresent = [makeInPlay('p1-ally-1', 'inst-1')];
    const ctx: EffectContext = { player: 'p1' };

    // Stage a deferred-defeat prompt directly.
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseCard',
      message: 'defeat',
      choices: [{ kind: 'card', cardId: 'inst-1' }],
      continuation: { kind: 'deferred', tag: 'defeatCharacter' },
    };
    void ctx; // referenced only for the makeInPlay helper / ctx symmetry

    const next = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-1' },
    });
    expect(next.players.p1!.realm.locations[0]!.alliesPresent).toHaveLength(0);
    expect(next.players.p1!.discard).toContain('p1-ally-1');
    expect(next.pendingPrompt).toBeNull();
  });
});

describe('deferred prompt resolver — boostAlly / debuffHero', () => {
  it('places +N Strength token on the chosen ally', () => {
    registerCards([
      makeCard({ id: 'a1', type: 'ally', cost: 0, strength: 2 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm.locations[0]!.alliesPresent = [
      makeInPlay('a1', 'inst-A'),
    ];
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseCard',
      message: '+2 token',
      choices: [{ kind: 'card', cardId: 'inst-A' }],
      continuation: { kind: 'deferred', tag: 'boostAlly', payload: { n: 2 } },
    };
    const next = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-A' },
    });
    const ally = next.players.p1!.realm.locations[0]!.alliesPresent[0]!;
    expect(ally.strengthModifier).toBe(2);
    expect(ally.tokens['strength']).toBe(2);
  });

  it('places -N Strength token on the chosen hero', () => {
    registerCards([makeCard({ id: 'h1', type: 'hero', strength: 4, cost: 0 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm.locations[1]!.heroesPresent = [
      makeInPlay('h1', 'inst-H'),
    ];
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseCard',
      message: '-1 token',
      choices: [{ kind: 'card', cardId: 'inst-H' }],
      continuation: { kind: 'deferred', tag: 'debuffHero', payload: { n: 1 } },
    };
    const next = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-H' },
    });
    const hero = next.players.p1!.realm.locations[1]!.heroesPresent[0]!;
    expect(hero.strengthModifier).toBe(-1);
    expect(hero.tokens['strength']).toBe(-1);
  });
});

describe('deferred prompt resolver — soulMarkHero', () => {
  it('attaches a Soul Mark and advances the Asgard counter', () => {
    registerCards([makeCard({ id: 'h1', type: 'hero', strength: 3, cost: 0 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm.locations[0]!.heroesPresent = [
      makeInPlay('h1', 'inst-H'),
    ];
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseCard',
      message: 'mark',
      choices: [{ kind: 'card', cardId: 'inst-H' }],
      continuation: { kind: 'deferred', tag: 'soulMarkHero' },
    };
    const next = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-H' },
    });
    const hero = next.players.p1!.realm.locations[0]!.heroesPresent[0]!;
    expect(hero.soulMark).toBe(true);
    expect(next.players.p1!.objectiveProgress.steps['asgard']).toBe(1);
  });

  it('refuses to mark Valkyrior / Angela / Balder', () => {
    registerCards([
      makeCard({ id: 'fate-hela-valkyrior-1', type: 'hero', strength: 3, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm.locations[0]!.heroesPresent = [
      makeInPlay('fate-hela-valkyrior-1', 'inst-V'),
    ];
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseCard',
      message: 'mark',
      choices: [{ kind: 'card', cardId: 'inst-V' }],
      continuation: { kind: 'deferred', tag: 'soulMarkHero' },
    };
    const next = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-V' },
    });
    const hero = next.players.p1!.realm.locations[0]!.heroesPresent[0]!;
    expect(hero.soulMark).toBeFalsy();
  });
});

describe('deferred prompt resolver — discardFromHand', () => {
  it('moves the chosen card from hand to discard', () => {
    registerCards([makeCard({ id: 'x1', type: 'effect', cost: 0 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['x1'];
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseCard',
      message: 'discard one',
      choices: [{ kind: 'card', cardId: 'x1' }],
      continuation: { kind: 'deferred', tag: 'discardFromHand', payload: { remaining: 1 } },
    };
    const next = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'x1' },
    });
    expect(next.players.p1!.hand).not.toContain('x1');
    expect(next.players.p1!.discard).toContain('x1');
    expect(next.pendingPrompt).toBeNull();
  });

  it('re-parks the prompt when more discards remain', () => {
    registerCards([
      makeCard({ id: 'x1', type: 'effect', cost: 0 }),
      makeCard({ id: 'x2', type: 'effect', cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['x1', 'x2'];
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseCard',
      message: 'discard two',
      choices: [
        { kind: 'card', cardId: 'x1' },
        { kind: 'card', cardId: 'x2' },
      ],
      continuation: { kind: 'deferred', tag: 'discardFromHand', payload: { remaining: 2 } },
    };
    const next = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'x1' },
    });
    expect(next.players.p1!.hand).toEqual(['x2']);
    expect(next.pendingPrompt).not.toBeNull();
  });
});

describe('deferred prompt resolver — giveStoneToOpponent', () => {
  it('credits the targeted opponent with an Infinity Stone', () => {
    const game = makeGame({ phase: 'actions' });
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseTarget',
      message: 'give stone',
      choices: [{ kind: 'target', target: { kind: 'player', player: 'p2' } }],
      continuation: { kind: 'deferred', tag: 'giveStoneToOpponent' },
    };
    const next = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    expect(next.players.p2!.objectiveProgress.steps['stones']).toBe(1);
    expect((next.players.p2!.flags['stones'] as string[]).length).toBe(1);
  });
});

describe("Thanos's Proxima Midnight parks a deferred defeatCharacter prompt", () => {
  it('the parked prompt is resolvable in the engine', () => {
    registerCards([
      makeCard({ id: 'thanos-proxima-midnight', type: 'ally', cost: 2, strength: 3 }),
      makeCard({ id: 'h1', type: 'hero', strength: 2, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.realm.locations[0]!.alliesPresent = [
      { instanceId: 'inst-P', cardId: 'thanos-proxima-midnight', strengthModifier: 0, tokens: {} },
    ];
    game.players.p1.realm.locations[0]!.heroesPresent = [
      { instanceId: 'inst-h', cardId: 'h1', strengthModifier: 0, tokens: {} },
    ];

    const ctx: EffectContext = { player: 'p1' };
    const parked = thanosSpecific(game, ctx, 'thanos.proxima.snipe', null);
    expect(parked.pendingPrompt).not.toBeNull();
    expect(parked.pendingPrompt!.continuation?.kind).toBe('deferred');

    // Now resolve the parked prompt — should defeat the chosen hero.
    const next = reduce(parked, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-h' },
    });
    expect(next.players.p1!.realm.locations[0]!.heroesPresent).toHaveLength(0);
  });
});
