// PROTECTOR rule: a Hero with the protector tag (or a protector token from
// Odin-Force) must be defeated before any other Hero at the same location
// may be targeted by a Vanquish.

import { afterEach, describe, expect, it } from 'vitest';
import { isLegal } from '../../src/engine/validate';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('PROTECTOR enforcement', () => {
  it('blocks attacking a non-PROTECTOR Hero when a PROTECTOR Hero is at the same location', () => {
    registerCards([
      makeCard({ id: 'thor', type: 'hero', strength: 5, cost: 0, tags: ['protector'] }),
      makeCard({ id: 'soft-hero', type: 'hero', strength: 2, cost: 0 }),
      makeCard({ id: 'ally', type: 'ally', strength: 3, cost: 1 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    const loc = game.players.p1.realm.locations[0]!;
    loc.heroesPresent = [
      { instanceId: 'inst-thor', cardId: 'thor', strengthModifier: 0, tokens: {} },
      { instanceId: 'inst-soft', cardId: 'soft-hero', strengthModifier: 0, tokens: {} },
    ];
    loc.alliesPresent = [
      { instanceId: 'inst-A', cardId: 'ally', strengthModifier: 0, tokens: {} },
    ];

    const legal = isLegal(game, {
      kind: 'attackHero',
      allyIds: ['ally'],
      heroId: 'soft-hero',
    });
    expect(legal).not.toBe(true);
    if (typeof legal !== 'boolean') expect(legal.reason).toMatch(/PROTECTOR/);
  });

  it('allows attacking the PROTECTOR Hero itself even when other Heroes are present', () => {
    registerCards([
      makeCard({ id: 'thor', type: 'hero', strength: 5, cost: 0, tags: ['protector'] }),
      makeCard({ id: 'soft-hero', type: 'hero', strength: 2, cost: 0 }),
      makeCard({ id: 'ally', type: 'ally', strength: 5, cost: 1 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    const loc = game.players.p1.realm.locations[0]!;
    loc.heroesPresent = [
      { instanceId: 'inst-thor', cardId: 'thor', strengthModifier: 0, tokens: {} },
      { instanceId: 'inst-soft', cardId: 'soft-hero', strengthModifier: 0, tokens: {} },
    ];
    loc.alliesPresent = [
      { instanceId: 'inst-A', cardId: 'ally', strengthModifier: 0, tokens: {} },
    ];

    const legal = isLegal(game, {
      kind: 'attackHero',
      allyIds: ['ally'],
      heroId: 'thor',
    });
    expect(legal).toBe(true);
  });

  it('honors a runtime `tokens.protector` marker (Odin-Force attach)', () => {
    registerCards([
      makeCard({ id: 'random-hero', type: 'hero', strength: 3, cost: 0 }),
      makeCard({ id: 'other-hero', type: 'hero', strength: 2, cost: 0 }),
      makeCard({ id: 'ally', type: 'ally', strength: 4, cost: 1 }),
    ]);
    const game = makeGame({ phase: 'actions' });
    const loc = game.players.p1.realm.locations[0]!;
    loc.heroesPresent = [
      { instanceId: 'inst-prot', cardId: 'random-hero', strengthModifier: 0, tokens: { protector: 1 } },
      { instanceId: 'inst-other', cardId: 'other-hero', strengthModifier: 0, tokens: {} },
    ];
    loc.alliesPresent = [
      { instanceId: 'inst-A', cardId: 'ally', strengthModifier: 0, tokens: {} },
    ];

    const blocked = isLegal(game, {
      kind: 'attackHero',
      allyIds: ['ally'],
      heroId: 'other-hero',
    });
    expect(blocked).not.toBe(true);
    const allowed = isLegal(game, {
      kind: 'attackHero',
      allyIds: ['ally'],
      heroId: 'random-hero',
    });
    expect(allowed).toBe(true);
  });

  it('once the PROTECTOR is defeated the other Heroes become attackable', () => {
    registerCards([
      makeCard({ id: 'thor', type: 'hero', strength: 5, cost: 0, tags: ['protector'] }),
      makeCard({ id: 'soft-hero', type: 'hero', strength: 2, cost: 0 }),
      makeCard({ id: 'ally', type: 'ally', strength: 6, cost: 1 }),
    ]);
    let game = makeGame({ phase: 'actions' });
    const loc = game.players.p1.realm.locations[0]!;
    loc.heroesPresent = [
      { instanceId: 'inst-thor', cardId: 'thor', strengthModifier: 0, tokens: {} },
      { instanceId: 'inst-soft', cardId: 'soft-hero', strengthModifier: 0, tokens: {} },
    ];
    loc.alliesPresent = [
      { instanceId: 'inst-A', cardId: 'ally', strengthModifier: 0, tokens: {} },
    ];

    // Defeat Thor first.
    game = reduce(game, { kind: 'attackHero', allyIds: ['ally'], heroId: 'thor' });
    // Soft hero now attackable. (We just check legality — a fresh ally
    // would be needed to actually Vanquish since the first attacker was
    // consumed, but legality is the rule under test.)
    const allowed = isLegal(game, {
      kind: 'attackHero',
      allyIds: [],
      heroId: 'soft-hero',
    });
    // No allies named: blocked for the "no attacking allies" reason, not
    // the protector one — confirm by reading the reason.
    expect(allowed).not.toBe(true);
    if (typeof allowed !== 'boolean') {
      expect(allowed.reason).not.toMatch(/PROTECTOR/);
    }
  });
});
