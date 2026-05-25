// Bodyguard substitution mechanics: Trainees, Taskmaster's Shield, and Rook
// each have a "when another character would be defeated, remove me instead"
// clause. The Vanquish path checks for them and absorbs one discard each.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';
import type { InPlayCard } from '../../src/engine/types';

afterEach(() => clearRegistry());

function inst(cardId: string, instanceId: string): InPlayCard {
  return { instanceId, cardId, strengthModifier: 0, tokens: {} };
}

describe('Trainees absorb the Vanquish discard', () => {
  it('Trainees are discarded in place of the other ally used to Vanquish', () => {
    registerCards([
      makeCard({ id: 'taskmaster-trainees-1', type: 'ally', cost: 1, strength: 1 }),
      makeCard({ id: 'tm-attacker', type: 'ally', cost: 2, strength: 4 }),
      makeCard({ id: 'h1', type: 'hero', strength: 3, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    const loc = game.players.p1.realm.locations[0]!;
    loc.alliesPresent = [inst('taskmaster-trainees-1', 'inst-T'), inst('tm-attacker', 'inst-A')];
    loc.heroesPresent = [inst('h1', 'inst-H')];

    const after = reduce(game, {
      kind: 'attackHero',
      allyIds: ['tm-attacker'],
      heroId: 'h1',
    });
    // Hero gone, Trainees absorbed, attacker survives.
    expect(after.players.p1!.realm.locations[0]!.heroesPresent).toHaveLength(0);
    const ids = after.players.p1!.realm.locations[0]!.alliesPresent.map((a) => a.cardId);
    expect(ids).toContain('tm-attacker');
    expect(ids).not.toContain('taskmaster-trainees-1');
    expect(after.players.p1!.discard).toContain('taskmaster-trainees-1');
    expect(after.players.p1!.discard).not.toContain('tm-attacker');
  });
});

describe("Taskmaster's Shield absorbs the Vanquish discard", () => {
  it('Shield is discarded in place of the attacking ally', () => {
    registerCards([
      makeCard({ id: 'taskmaster-shield', type: 'item', cost: 0 }),
      makeCard({ id: 'tm-attacker', type: 'ally', cost: 2, strength: 4 }),
      makeCard({ id: 'h1', type: 'hero', strength: 3, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    const loc = game.players.p1.realm.locations[0]!;
    loc.alliesPresent = [inst('tm-attacker', 'inst-A')];
    loc.itemsPresent = [inst('taskmaster-shield', 'inst-S')];
    loc.heroesPresent = [inst('h1', 'inst-H')];

    const after = reduce(game, {
      kind: 'attackHero',
      allyIds: ['tm-attacker'],
      heroId: 'h1',
    });
    expect(after.players.p1!.realm.locations[0]!.itemsPresent).toHaveLength(0);
    expect(after.players.p1!.realm.locations[0]!.alliesPresent.map((a) => a.cardId)).toContain('tm-attacker');
    expect(after.players.p1!.discard).toContain('taskmaster-shield');
  });
});

describe('Rook absorbs the Vanquish discard', () => {
  it('Rook is discarded in place of another ally; Rook himself cannot save himself', () => {
    registerCards([
      makeCard({ id: 'killmonger-rook', type: 'ally', cost: 2, strength: 2 }),
      makeCard({ id: 'km-attacker', type: 'ally', cost: 2, strength: 4 }),
      makeCard({ id: 'h1', type: 'hero', strength: 3, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    const loc = game.players.p1.realm.locations[0]!;
    loc.alliesPresent = [inst('killmonger-rook', 'inst-R'), inst('km-attacker', 'inst-A')];
    loc.heroesPresent = [inst('h1', 'inst-H')];

    const after = reduce(game, {
      kind: 'attackHero',
      allyIds: ['km-attacker'],
      heroId: 'h1',
    });
    expect(after.players.p1!.realm.locations[0]!.alliesPresent.map((a) => a.cardId)).toContain('km-attacker');
    expect(after.players.p1!.discard).toContain('killmonger-rook');
  });
});

describe('Attached items cascade on Vanquish', () => {
  it('an item attached to a spent Ally is discarded with it', () => {
    registerCards([
      makeCard({ id: 'ultron-impervious-alloy-1', type: 'item', cost: 2, strength: 2 }),
      makeCard({ id: 'ultron-attacker', type: 'ally', cost: 2, strength: 4 }),
      makeCard({ id: 'h1', type: 'hero', strength: 3, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    const loc = game.players.p1.realm.locations[0]!;
    const attacker = inst('ultron-attacker', 'inst-A');
    loc.alliesPresent = [attacker];
    loc.itemsPresent = [
      { ...inst('ultron-impervious-alloy-1', 'inst-IA'), attachedTo: 'inst-A' },
    ];
    loc.heroesPresent = [inst('h1', 'inst-H')];

    const after = reduce(game, {
      kind: 'attackHero',
      allyIds: ['ultron-attacker'],
      heroId: 'h1',
    });
    expect(after.players.p1!.realm.locations[0]!.alliesPresent).toHaveLength(0);
    expect(after.players.p1!.realm.locations[0]!.itemsPresent).toHaveLength(0);
    expect(after.players.p1!.discard).toContain('ultron-impervious-alloy-1');
  });
});
