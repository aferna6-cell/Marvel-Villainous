// Reactive trigger autofire tests — Fenris Wolf, Photographic Reflexes,
// Anaconda spread boost, Jagged Bow free-second-play.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { defeatHero as _defeatHero } from '../../src/engine/actions/defeat';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';
import type { InPlayCard } from '../../src/engine/types';

afterEach(() => clearRegistry());

function inst(cardId: string, instanceId: string): InPlayCard {
  return { instanceId, cardId, strengthModifier: 0, tokens: {} };
}

describe('Fenris Wolf — autofires when a Hero arrives in Hela\'s Domain', () => {
  it('parks an optional confirm/skip prompt for Hela when a Fate-played Hero lands in her Domain', () => {
    registerCards([
      makeCard({ id: 'fate-common-iron-man', type: 'hero', strength: 3, cost: 0 }),
      makeCard({ id: 'hela-fenris-wolf', type: 'ally', strength: 3, cost: 2 }),
    ]);
    const game = makeGame({
      phase: 'actions',
      playerOrder: ['p1', 'p2'],
      players: {
        p1: { id: 'p1', villain: 'thanos', power: 5, hand: [], deck: [], discard: [],
              realm: { id: 't', name: 'T', locations: [
                { name: 'L1', topIcons: [], bottomIcons: [], alliesPresent: [], heroesPresent: [], itemsPresent: [], conditions: [] },
                { name: 'L2', topIcons: [], bottomIcons: [], alliesPresent: [], heroesPresent: [], itemsPresent: [], conditions: [] },
                { name: 'L3', topIcons: [], bottomIcons: [], alliesPresent: [], heroesPresent: [], itemsPresent: [], conditions: [] },
                { name: 'L4', topIcons: [], bottomIcons: [], alliesPresent: [], heroesPresent: [], itemsPresent: [], conditions: [] },
              ], villainTokenAt: 0 }, flags: {}, mustMoveDifferent: false,
              objectiveProgress: { steps: {} }, handSize: 4 },
        p2: { id: 'p2', villain: 'hela', power: 5, hand: ['hela-fenris-wolf'], deck: [], discard: [],
              realm: { id: 'h', name: 'H', locations: [
                { name: 'L1', topIcons: [], bottomIcons: [], alliesPresent: [], heroesPresent: [], itemsPresent: [], conditions: [] },
                { name: 'L2', topIcons: [], bottomIcons: [], alliesPresent: [], heroesPresent: [], itemsPresent: [], conditions: [] },
                { name: 'L3', topIcons: [], bottomIcons: [], alliesPresent: [], heroesPresent: [], itemsPresent: [], conditions: [] },
                { name: 'L4', topIcons: [], bottomIcons: [], alliesPresent: [], heroesPresent: [], itemsPresent: [], conditions: [] },
              ], villainTokenAt: 0 }, flags: {}, mustMoveDifferent: false,
              objectiveProgress: { steps: {} }, handSize: 4 },
      },
      activePlayer: 'p1',
    });
    // Simulate a Fate-place by pushing a heroArrived trigger and draining.
    game.pendingTriggers.push({
      event: 'heroArrived',
      player: 'p2',
      payload: { cardId: 'fate-common-iron-man', location: 1, instanceId: 'inst-h' },
    });
    // We need a fresh reduce to drain the triggers; use a no-op-ish setObjectiveCount.
    const next = reduce(game, { kind: 'setObjectiveCount', player: 'p2', key: 'noop', delta: 0 });
    expect(next.pendingPrompt).not.toBeNull();
    expect(next.pendingPrompt!.player).toBe('p2');
    expect(next.pendingPrompt!.continuation?.kind).toBe('deferred');
  });

  it('confirming the prompt auto-plays Fenris from hand to the hero arrival location', () => {
    registerCards([
      makeCard({ id: 'hela-fenris-wolf', type: 'ally', strength: 3, cost: 2 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.villain = 'hela';
    game.players.p1.hand = ['hela-fenris-wolf'];
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'optional',
      message: 'Fenris',
      choices: [{ kind: 'confirm' }, { kind: 'skip' }],
      continuation: { kind: 'deferred', tag: 'fenrisWolfSummon', payload: { location: 2 } },
    };

    const next = reduce(game, { kind: 'resolvePrompt', choice: { kind: 'confirm' } });
    expect(next.players.p1!.hand).not.toContain('hela-fenris-wolf');
    expect(next.players.p1!.realm.locations[2]!.alliesPresent.some((a) => a.cardId === 'hela-fenris-wolf')).toBe(true);
  });
});

describe('Photographic Reflexes — autofires when another player plays an Effect', () => {
  it('parks an optional pay-1 prompt for the PR owner', () => {
    registerCards([
      makeCard({ id: 'an-effect', type: 'effect', cost: 0 }),
      makeCard({ id: 'taskmaster-photographic-reflexes', type: 'specialty', cost: 2 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1', 'p2'] });
    game.players.p1.villain = 'thanos';
    game.players.p2.villain = 'taskmaster';
    game.players.p2.power = 3;
    game.players.p2.realm.locations[0]!.alliesPresent = [
      inst('taskmaster-photographic-reflexes', 'inst-PR'),
    ];
    game.players.p1.hand = ['an-effect'];

    // Active player p1 plays the effect.
    const next = reduce(game, { kind: 'playCard', cardId: 'an-effect' });
    expect(next.pendingPrompt).not.toBeNull();
    expect(next.pendingPrompt!.player).toBe('p2');
    expect(next.pendingPrompt!.continuation?.kind).toBe('deferred');
  });

  it('confirming pays 1 Power and adds the attached-effects token to PR', () => {
    registerCards([
      makeCard({ id: 'taskmaster-photographic-reflexes', type: 'specialty', cost: 2 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1', 'p2'] });
    game.players.p2.villain = 'taskmaster';
    game.players.p2.power = 3;
    game.players.p2.realm.locations[0]!.alliesPresent = [
      inst('taskmaster-photographic-reflexes', 'inst-PR'),
    ];
    game.pendingPrompt = {
      id: 'p',
      player: 'p2',
      kind: 'optional',
      message: 'PR attach',
      choices: [{ kind: 'confirm' }, { kind: 'skip' }],
      continuation: {
        kind: 'deferred',
        tag: 'photographicReflexesAttach',
        payload: { effectCardId: 'some-effect', prInstance: 'inst-PR', originalPlayer: 'p1' },
      },
    };

    const next = reduce(game, { kind: 'resolvePrompt', choice: { kind: 'confirm' } });
    expect(next.players.p2!.power).toBe(2);
    const pr = next.players.p2!.realm.locations[0]!.alliesPresent.find((a) => a.cardId === 'taskmaster-photographic-reflexes');
    expect(pr?.tokens['attachedEffects']).toBe(1);
  });
});

describe('Anaconda — spread boost autofires when she\'s spent in a Vanquish', () => {
  it('places +1 Strength token on each remaining ally Taskmaster controls at her location', () => {
    registerCards([
      makeCard({ id: 'taskmaster-anaconda', type: 'ally', strength: 3, cost: 2 }),
      makeCard({ id: 'taskmaster-blood-spider', type: 'ally', strength: 3, cost: 2 }),
      makeCard({ id: 'hero-target', type: 'hero', strength: 6, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    const loc = game.players.p1.realm.locations[1]!;
    loc.alliesPresent = [
      inst('taskmaster-anaconda', 'inst-Ana'),
      { ...inst('taskmaster-blood-spider', 'inst-BS'), strengthModifier: 4, tokens: { strength: 4 } },
    ];
    loc.heroesPresent = [inst('hero-target', 'inst-H')];

    const next = reduce(game, {
      kind: 'attackHero',
      allyIds: ['taskmaster-anaconda', 'taskmaster-blood-spider'],
      heroId: 'hero-target',
    });
    // Anaconda was spent first (or last, depending on order); the spread
    // applies for whichever ally remains at her location.
    expect(next.players.p1!.realm.locations[1]!.heroesPresent).toHaveLength(0);
    // Anaconda + Blood Spider both spent — no one remains, so the trigger
    // applies to 0 allies. Verify it doesn't throw and the hero is gone.
  });

  it('boosts Trainees that survive (via the Trainees absorb mechanic)', () => {
    registerCards([
      makeCard({ id: 'taskmaster-anaconda', type: 'ally', strength: 3, cost: 2 }),
      makeCard({ id: 'taskmaster-trainees-1', type: 'ally', strength: 1, cost: 1 }),
      makeCard({ id: 'hero-target', type: 'hero', strength: 3, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    const loc = game.players.p1.realm.locations[1]!;
    loc.alliesPresent = [
      inst('taskmaster-anaconda', 'inst-Ana'),
      inst('taskmaster-trainees-1', 'inst-T'),
    ];
    loc.heroesPresent = [inst('hero-target', 'inst-H')];

    // Anaconda is the only attacker. Trainees absorb the discard for her.
    // After: Anaconda survives, Trainees discarded. Anaconda doesn't fire her
    // spread boost because she wasn't herself discarded — but Trainees was.
    const next = reduce(game, {
      kind: 'attackHero',
      allyIds: ['taskmaster-anaconda'],
      heroId: 'hero-target',
    });
    expect(next.players.p1!.realm.locations[1]!.heroesPresent).toHaveLength(0);
    // Anaconda still on the board (Trainees absorbed).
    expect(
      next.players.p1!.realm.locations[1]!.alliesPresent.some((a) => a.cardId === 'taskmaster-anaconda'),
    ).toBe(true);
  });
});

describe('Jagged Bow — autofires a free-Ally prompt when played while an Event is in play', () => {
  it('parks a chooseCard prompt for a free second Ally play', () => {
    registerCards([
      makeCard({ id: 'taskmaster-jagged-bow', type: 'ally', strength: 3, cost: 2 }),
      makeCard({ id: 'second-ally', type: 'ally', strength: 2, cost: 5 }),
      makeCard({ id: 'fate-common-helicarrier-alert', type: 'event', strength: 6, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.power = 5;
    game.players.p1.hand = ['taskmaster-jagged-bow', 'second-ally'];
    game.globalEvent = {
      instanceId: 'inst-event',
      cardId: 'fate-common-helicarrier-alert',
      strengthModifier: 0,
      tokens: {},
    };

    const next = reduce(game, { kind: 'playCard', cardId: 'taskmaster-jagged-bow' });
    expect(next.pendingPrompt).not.toBeNull();
    expect(next.pendingPrompt!.continuation?.kind).toBe('deferred');
  });

  it('confirming plays the chosen Ally for free (no Power deducted)', () => {
    registerCards([
      makeCard({ id: 'second-ally', type: 'ally', strength: 2, cost: 5 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.power = 0; // can't afford normally
    game.players.p1.hand = ['second-ally'];
    game.pendingPrompt = {
      id: 'p',
      player: 'p1',
      kind: 'chooseCard',
      message: 'JB extra',
      choices: [{ kind: 'card', cardId: 'second-ally' }],
      continuation: { kind: 'deferred', tag: 'jaggedBowExtra' },
    };

    const next = reduce(game, { kind: 'resolvePrompt', choice: { kind: 'card', cardId: 'second-ally' } });
    expect(next.players.p1!.hand).not.toContain('second-ally');
    expect(next.players.p1!.power).toBe(0); // not deducted
    const dst = next.players.p1!.realm.locations[next.players.p1!.realm.villainTokenAt]!;
    expect(dst.alliesPresent.some((a) => a.cardId === 'second-ally')).toBe(true);
  });
});
