import { describe, expect, it } from 'vitest';
import { reduce } from '../../src/engine/state';
import { makeGame } from './fixtures';

describe('claimVictory action', () => {
  it('sets state.winner to the active player', () => {
    const game = makeGame({ phase: 'actions' });
    const next = reduce(game, { kind: 'claimVictory' });
    expect(next.winner).toBe('p1');
  });

  it('blocks further actions once a winner is set', () => {
    const game = makeGame({ phase: 'actions' });
    const won = reduce(game, { kind: 'claimVictory' });
    expect(() => reduce(won, { kind: 'endTurn' })).toThrow('over');
  });

  it('logs the winner', () => {
    const game = makeGame({ phase: 'actions' });
    const next = reduce(game, { kind: 'claimVictory' });
    expect(next.log.some((e) => e.message.includes('claimed victory'))).toBe(true);
  });
});
