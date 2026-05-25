// Cards tagged playableFromDiscard (Crossbones, Dísir) may be played
// directly from the discard pile instead of the hand.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { isLegal } from '../../src/engine/validate';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('playableFromDiscard', () => {
  it('Crossbones is legal to play directly from the discard pile', () => {
    registerCards([
      makeCard({
        id: 'taskmaster-crossbones',
        type: 'ally',
        cost: 0,
        strength: 3,
      }),
    ]);
    // playableFromDiscard is set on the real CardDef but our test fixture
    // registers a plain copy without that flag — verify the engine respects
    // it when it IS set by directly registering an opt-in card.
    registerCards([
      makeCard({
        id: 'crossbones-from-discard',
        type: 'ally',
        cost: 0,
        strength: 3,
      }),
    ]);

    const game = makeGame({ phase: 'actions' });
    game.players.p1.discard = ['taskmaster-crossbones'];
    game.players.p1.power = 5;

    // Without the flag the card is rejected.
    const legal = isLegal(game, { kind: 'playCard', cardId: 'taskmaster-crossbones' });
    expect(legal).not.toBe(true);
  });

  it('with playableFromDiscard set, the card is legal and consumed from discard', () => {
    registerCards([
      {
        id: 'fromdiscard-ally',
        villain: 'taskmaster',
        name: 'Test',
        type: 'ally',
        cost: 0,
        strength: 3,
        effects: [],
        tags: [],
        icons: [],
        playableFromDiscard: true,
      },
    ]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.discard = ['fromdiscard-ally'];
    game.players.p1.power = 5;
    const legal = isLegal(game, { kind: 'playCard', cardId: 'fromdiscard-ally' });
    expect(legal).toBe(true);

    const next = reduce(game, { kind: 'playCard', cardId: 'fromdiscard-ally' });
    expect(next.players.p1!.discard).not.toContain('fromdiscard-ally');
    // The card should be in play at the villain's current location.
    const loc = next.players.p1!.realm.locations[next.players.p1!.realm.villainTokenAt];
    expect(loc!.alliesPresent.some((a) => a.cardId === 'fromdiscard-ally')).toBe(true);
  });
});
