// Targeted Event constraint (rulebook §I, Q18 follow-up):
// If a Fate Event card names a specific villain in `targetedVillain`, it
// MUST be played on that villain. Choosing the wrong target → discard with
// no effect.

import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame, makePlayer } from './fixtures';

afterEach(() => clearRegistry());

describe('Targeted Event placement constraint', () => {
  it('Discards a Targeted Event when the chosen target villain does not match', () => {
    // p1 = thanos (active), p2 = hela. Event is targeted at killmonger.
    registerCards([
      makeCard({
        id: 'evt',
        type: 'event',
        cost: 0,
        villain: 'fate-common',
        targetedVillain: 'killmonger',
      }),
    ]);
    let game = makeGame({
      phase: 'actions',
      playerOrder: ['p1', 'p2'],
      players: {
        p1: makePlayer('p1', 'thanos'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
      fateDeck: ['evt'],
    });
    game = reduce(game, { kind: 'fate' });
    expect(game.pendingPrompt?.continuation?.kind).toBe('fatePlay');
    game = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    expect(game.globalEvent).toBe(null);
    expect(game.fateDiscard).toContain('evt');
    expect(game.log.some((e) => e.message.includes('Targeted Event'))).toBe(true);
  });

  it('Lets a Targeted Event land when the target villain matches', () => {
    registerCards([
      makeCard({
        id: 'evt',
        type: 'event',
        cost: 0,
        villain: 'fate-common',
        targetedVillain: 'hela',
      }),
    ]);
    let game = makeGame({
      phase: 'actions',
      playerOrder: ['p1', 'p2'],
      players: {
        p1: makePlayer('p1', 'thanos'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
      fateDeck: ['evt'],
    });
    game = reduce(game, { kind: 'fate' });
    game = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    expect(game.globalEvent?.cardId).toBe('evt');
  });

  it('Untargeted (Global) Events still land on any chosen target', () => {
    registerCards([
      makeCard({
        id: 'evt',
        type: 'event',
        cost: 0,
        villain: 'fate-common',
        // no targetedVillain — Global Event
      }),
    ]);
    let game = makeGame({
      phase: 'actions',
      playerOrder: ['p1', 'p2'],
      players: {
        p1: makePlayer('p1', 'thanos'),
        p2: makePlayer('p2', 'hela'),
        p3: makePlayer('p3', 'ultron'),
        p4: makePlayer('p4', 'killmonger'),
      },
      fateDeck: ['evt'],
    });
    game = reduce(game, { kind: 'fate' });
    game = reduce(game, {
      kind: 'resolvePrompt',
      choice: { kind: 'target', target: { kind: 'player', player: 'p2' } },
    });
    expect(game.globalEvent?.cardId).toBe('evt');
  });
});
