import { afterEach, describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';
import type { GameState } from '../../src/engine/types';

afterEach(() => clearRegistry());

// A fake card whose effect always needs a player decision.
function registerForcer(): void {
  registerCards([
    makeCard({
      id: 'forcer',
      type: 'effect',
      cost: 0,
      effects: [{ op: 'forceDiscard', player: 'opponent', n: 1 }],
    }),
  ]);
}

function gameWithForcerInHand(): GameState {
  const game = makeGame();
  game.players.p1.hand = ['forcer'];
  game.players.p2.hand = ['p2-card'];
  return game;
}

describe('pendingPrompt lifecycle', () => {
  it('a card effect that needs a choice sets a pending prompt', () => {
    registerForcer();
    const next = reduce(gameWithForcerInHand(), { kind: 'playCard', cardId: 'forcer' });
    expect(next.pendingPrompt).not.toBeNull();
    expect(next.pendingPrompt?.choices).toHaveLength(1);
  });

  it('the engine refuses other actions until the prompt is resolved', () => {
    registerForcer();
    const blocked = reduce(gameWithForcerInHand(), { kind: 'playCard', cardId: 'forcer' });
    expect(() => reduce(blocked, { kind: 'endTurn' })).toThrow('pending prompt');
    expect(() => reduce(blocked, { kind: 'useIcon', location: 0, iconIndex: 0 })).toThrow(
      'pending prompt',
    );
  });

  it('resolvePrompt with an offered choice clears the prompt', () => {
    registerForcer();
    const blocked = reduce(gameWithForcerInHand(), { kind: 'playCard', cardId: 'forcer' });
    const resolved = reduce(blocked, {
      kind: 'resolvePrompt',
      choice: { kind: 'card', cardId: 'p2-card' },
    });
    expect(resolved.pendingPrompt).toBeNull();
  });

  it('resolvePrompt with a choice the prompt did not offer is rejected', () => {
    registerForcer();
    const blocked = reduce(gameWithForcerInHand(), { kind: 'playCard', cardId: 'forcer' });
    expect(() =>
      reduce(blocked, { kind: 'resolvePrompt', choice: { kind: 'card', cardId: 'not-offered' } }),
    ).toThrow('not offered');
  });
});
