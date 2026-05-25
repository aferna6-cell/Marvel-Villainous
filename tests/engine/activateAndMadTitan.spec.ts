// ACTIVATE icon + Mad Titan dynamic cost.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { applyActivate } from '../../src/engine/actions/activate';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';
import { applyVillainSpecific as thanosSpecific } from '../../src/engine/villains/thanos/specific';
import type { EffectContext, InPlayCard } from '../../src/engine/types';

afterEach(() => clearRegistry());

function inst(cardId: string, instanceId: string): InPlayCard {
  return { instanceId, cardId, strengthModifier: 0, tokens: {} };
}

describe('ACTIVATE icon flow', () => {
  it('parks a prompt offering every activatable Item/Specialty at the location', () => {
    registerCards([
      {
        id: 'activatable-item',
        villain: 'taskmaster',
        name: 'Test Item',
        type: 'item',
        cost: 0,
        effects: [],
        activateEffects: [{ op: 'gainPower', n: 3 }],
        tags: [],
        icons: [],
      },
      {
        id: 'inert-item',
        villain: 'taskmaster',
        name: 'Inert',
        type: 'item',
        cost: 0,
        effects: [],
        tags: [],
        icons: [],
      },
    ]);
    const game = makeGame({ phase: 'actions' });
    const loc = game.players.p1.realm.locations[game.players.p1.realm.villainTokenAt]!;
    loc.itemsPresent = [
      inst('activatable-item', 'inst-A'),
      inst('inert-item', 'inst-B'),
    ];

    const parked = applyActivate(game, 'p1', 'activate');
    expect(parked.pendingPrompt).not.toBeNull();
    // Only the activatable item should be offered (plus a skip).
    const cardChoices = parked.pendingPrompt!.choices.filter((c) => c.kind === 'card');
    expect(cardChoices.length).toBe(1);
    expect(cardChoices[0]).toEqual({ kind: 'card', cardId: 'inst-A' });
  });

  it('resolving the prompt runs the chosen card\'s activateEffects', () => {
    registerCards([
      {
        id: 'gain3',
        villain: 'taskmaster',
        name: 'Gain 3',
        type: 'item',
        cost: 0,
        effects: [],
        activateEffects: [{ op: 'gainPower', n: 3 }],
        tags: [],
        icons: [],
      },
    ]);
    const game = makeGame({ phase: 'actions' });
    const loc = game.players.p1.realm.locations[game.players.p1.realm.villainTokenAt]!;
    loc.itemsPresent = [inst('gain3', 'inst-G')];
    const startPower = game.players.p1.power;

    const parked = applyActivate(game, 'p1', 'activate');
    const next = reduce(parked, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-G' },
    });
    expect(next.players.p1!.power).toBe(startPower + 3);
  });

  it('no activatable cards at this location logs a no-op without parking a prompt', () => {
    const game = makeGame({ phase: 'actions' });
    const next = applyActivate(game, 'p1', 'activate');
    expect(next.pendingPrompt).toBeNull();
  });
});

describe('Mad Titan dynamic cost', () => {
  it('charges Power equal to the defeated character\'s Strength', () => {
    registerCards([
      makeCard({
        id: 'thanos-mad-titan-1',
        type: 'effect',
        cost: 0,
        effects: [{ op: 'villainSpecific', key: 'thanos.madTitan', payload: null }],
      }),
      makeCard({ id: 'thanos-ally', type: 'ally', strength: 2, cost: 1 }),
      makeCard({ id: 'big-hero', type: 'hero', strength: 4, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.power = 6;
    const loc0 = game.players.p1.realm.locations[0]!;
    loc0.alliesPresent = [inst('thanos-ally', 'inst-A')];
    loc0.heroesPresent = [inst('big-hero', 'inst-H')];

    const ctx: EffectContext = { player: 'p1' };
    const parked = thanosSpecific(game, ctx, 'thanos.madTitan', null);
    expect(parked.pendingPrompt).not.toBeNull();
    expect(parked.pendingPrompt!.continuation?.kind).toBe('deferred');

    const after = reduce(parked, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-H' },
    });
    // Power deducted by 4 (the hero's strength).
    expect(after.players.p1!.power).toBe(6 - 4);
    // Hero gone.
    expect(after.players.p1!.realm.locations[0]!.heroesPresent).toHaveLength(0);
  });

  it('refuses to defeat when Power is insufficient', () => {
    registerCards([
      makeCard({ id: 'ally', type: 'ally', strength: 2, cost: 1 }),
      makeCard({ id: 'big-hero', type: 'hero', strength: 5, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.power = 2; // not enough
    const loc0 = game.players.p1.realm.locations[0]!;
    loc0.alliesPresent = [inst('ally', 'inst-A')];
    loc0.heroesPresent = [inst('big-hero', 'inst-H')];

    const ctx: EffectContext = { player: 'p1' };
    const parked = thanosSpecific(game, ctx, 'thanos.madTitan', null);

    const after = reduce(parked, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'inst-H' },
    });
    // No Power change, hero still there.
    expect(after.players.p1!.power).toBe(2);
    expect(after.players.p1!.realm.locations[0]!.heroesPresent).toHaveLength(1);
  });
});
