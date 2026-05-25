// Triggered-ability tests — start-of-turn fate Events, on-defeat hooks
// (Hulk relocate, Wonder Man find Vision, Hela Bidding 3-Power),
// and passive power-gain penalties (Vision, Invasion of Stark Enterprises).

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { defeatHero } from '../../src/engine/actions/defeat';
import { applyGain } from '../../src/engine/actions/gain';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('on-defeat: Hulk relocates instead of being discarded', () => {
  it('moves Hulk to another player\'s Domain with +1 Strength token', () => {
    registerCards([makeCard({ id: 'fate-common-hulk', type: 'hero', strength: 5, cost: 0 })]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1', 'p2'] });
    game.players.p1.realm.locations[0]!.heroesPresent = [
      { instanceId: 'inst-Hulk', cardId: 'fate-common-hulk', strengthModifier: 0, tokens: {} },
    ];

    const after = defeatHero(game, 'p1', 0, 'inst-Hulk');
    expect(after.players.p1!.realm.locations[0]!.heroesPresent).toHaveLength(0);
    // Hulk should be at p2's villainTokenAt location with +1 modifier.
    const p2Loc = after.players.p2!.realm.locations[after.players.p2!.realm.villainTokenAt];
    const hulk = p2Loc!.heroesPresent.find((h) => h.cardId === 'fate-common-hulk');
    expect(hulk).toBeDefined();
    expect(hulk!.strengthModifier).toBe(1);
    expect(hulk!.tokens['strength']).toBe(1);
    // Not added to the Fate discard.
    expect(after.fateDiscard).not.toContain('fate-common-hulk');
  });

  it('standard defeat applies when there are no other players (solo)', () => {
    registerCards([makeCard({ id: 'fate-common-hulk', type: 'hero', strength: 5, cost: 0 })]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.realm.locations[0]!.heroesPresent = [
      { instanceId: 'inst-Hulk', cardId: 'fate-common-hulk', strengthModifier: 0, tokens: {} },
    ];
    const after = defeatHero(game, 'p1', 0, 'inst-Hulk');
    expect(after.fateDiscard).toContain('fate-common-hulk');
  });
});

describe('on-defeat: Wonder Man summons Vision to his previous location', () => {
  it('pulls Vision from the Fate deck to the same location', () => {
    registerCards([
      makeCard({ id: 'fate-ultron-wonder-man', type: 'hero', strength: 4, cost: 0 }),
      makeCard({ id: 'fate-common-vision', type: 'hero', strength: 4, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.realm.locations[2]!.heroesPresent = [
      { instanceId: 'inst-WM', cardId: 'fate-ultron-wonder-man', strengthModifier: 0, tokens: {} },
    ];
    game.fateDeck = ['fate-common-vision'];

    const after = defeatHero(game, 'p1', 2, 'inst-WM');
    const loc = after.players.p1!.realm.locations[2]!;
    expect(loc.heroesPresent.some((h) => h.cardId === 'fate-common-vision')).toBe(true);
    expect(after.fateDeck).not.toContain('fate-common-vision');
  });

  it('also pulls Vision from the Fate discard pile if he is there', () => {
    registerCards([
      makeCard({ id: 'fate-ultron-wonder-man', type: 'hero', strength: 4, cost: 0 }),
      makeCard({ id: 'fate-common-vision', type: 'hero', strength: 4, cost: 0 }),
    ]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1'] });
    game.players.p1.realm.locations[1]!.heroesPresent = [
      { instanceId: 'inst-WM', cardId: 'fate-ultron-wonder-man', strengthModifier: 0, tokens: {} },
    ];
    game.fateDiscard = ['fate-common-vision'];

    const after = defeatHero(game, 'p1', 1, 'inst-WM');
    const loc = after.players.p1!.realm.locations[1]!;
    expect(loc.heroesPresent.some((h) => h.cardId === 'fate-common-vision')).toBe(true);
    expect(after.fateDiscard).not.toContain('fate-common-vision');
  });
});

describe("Hela's Bidding — passive +3 Power when an opponent defeats a marked Hero", () => {
  it('opponents with biddingActive flag gain 3 Power', () => {
    registerCards([makeCard({ id: 'h1', type: 'hero', strength: 3, cost: 0 })]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1', 'p2'] });
    game.players.p1.realm.locations[0]!.heroesPresent = [
      { instanceId: 'inst-H', cardId: 'h1', strengthModifier: 0, tokens: { mark: 1 }, soulMark: true },
    ];
    game.players.p2.flags['biddingActive'] = true;
    const startP2 = game.players.p2.power;

    const after = defeatHero(game, 'p1', 0, 'inst-H');
    expect(after.players.p2!.power).toBe(startP2 + 3);
  });

  it('non-marked Heroes do not trigger the Bidding bonus', () => {
    registerCards([makeCard({ id: 'h2', type: 'hero', strength: 3, cost: 0 })]);
    const game = makeGame({ phase: 'actions', playerOrder: ['p1', 'p2'] });
    game.players.p1.realm.locations[0]!.heroesPresent = [
      { instanceId: 'inst-H2', cardId: 'h2', strengthModifier: 0, tokens: {} },
    ];
    game.players.p2.flags['biddingActive'] = true;
    const startP2 = game.players.p2.power;
    const after = defeatHero(game, 'p1', 0, 'inst-H2');
    expect(after.players.p2!.power).toBe(startP2);
  });
});

describe('passive power-gain penalties', () => {
  it('Vision in your Domain reduces every Power gain by 1', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.flags['visionPowerPenalty'] = true;
    const start = game.players.p1.power;
    const after = applyGain(game, 'p1', 3);
    expect(after.players.p1!.power).toBe(start + 2);
  });

  it('Invasion of Stark Enterprises reduces Power gain by 1', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.flags['invasionStarkActive'] = true;
    const start = game.players.p1.power;
    const after = applyGain(game, 'p1', 2);
    expect(after.players.p1!.power).toBe(start + 1);
  });

  it('both passives stack — Vision + Invasion = -2 per gain', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.flags['visionPowerPenalty'] = true;
    game.players.p1.flags['invasionStarkActive'] = true;
    const start = game.players.p1.power;
    const after = applyGain(game, 'p1', 3);
    expect(after.players.p1!.power).toBe(start + 1);
  });

  it('cannot drop below the original power (penalty floors at 0 gain)', () => {
    const game = makeGame({ phase: 'actions' });
    game.players.p1.flags['visionPowerPenalty'] = true;
    const start = game.players.p1.power;
    const after = applyGain(game, 'p1', 0);
    expect(after.players.p1!.power).toBe(start);
  });
});

describe('start-of-turn drain: in-play Events log a reminder', () => {
  it('Sacrifices Must Be Made auto-pays Power per Ally on turn start', () => {
    registerCards([
      makeCard({ id: 'fate-thanos-sacrifices-must-be-made', type: 'event', strength: 7, cost: 0 }),
      makeCard({ id: 'thanos-legions-1', type: 'ally', strength: 2, cost: 1 }),
    ]);
    const game = makeGame({ phase: 'start', playerOrder: ['p1'] });
    game.globalEvent = {
      instanceId: 'inst-event',
      cardId: 'fate-thanos-sacrifices-must-be-made',
      strengthModifier: 0,
      tokens: {},
    };
    game.players.p1.power = 5;
    game.players.p1.realm.locations[0]!.alliesPresent = [
      { instanceId: 'inst-1', cardId: 'thanos-legions-1', strengthModifier: 0, tokens: {} },
      { instanceId: 'inst-2', cardId: 'thanos-legions-1', strengthModifier: 0, tokens: {} },
    ];
    const after = reduce(game, { kind: 'startTurn' });
    // Lost 2 Power (one per Ally).
    expect(after.players.p1!.power).toBe(3);
  });
});
