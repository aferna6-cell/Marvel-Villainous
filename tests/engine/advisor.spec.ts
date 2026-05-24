import { afterEach, describe, expect, it } from 'vitest';
import { suggestMove } from '../../src/engine/advisor/index';
import { isLegal } from '../../src/engine/validate';
import { clearRegistry, registerCards } from '../../src/engine/cards/registry';
import { makeCard, makeGame } from './fixtures';

afterEach(() => clearRegistry());

describe('AI advisor (heuristic suggestMove)', () => {
  it('returns null when there is no active turn (winner set)', () => {
    const game = makeGame({ phase: 'actions', winner: 'p1' });
    expect(suggestMove(game, 'p1')).toBeNull();
  });

  it('returns null for non-active players', () => {
    const game = makeGame({ phase: 'actions', activePlayer: 'p1' });
    expect(suggestMove(game, 'p2')).toBeNull();
  });

  it('always proposes a LEGAL action', () => {
    const variants = [
      makeGame({ phase: 'start' }),
      makeGame({ phase: 'move' }),
      makeGame({ phase: 'actions' }),
    ];
    for (const game of variants) {
      const rec = suggestMove(game, game.activePlayer);
      expect(rec).not.toBeNull();
      if (rec) expect(isLegal(game, rec.action)).toBe(true);
    }
  });

  it('suggests startTurn during the Start phase', () => {
    const rec = suggestMove(makeGame({ phase: 'start' }), 'p1');
    expect(rec?.action.kind).toBe('startTurn');
  });

  it('suggests playCard when the active player can afford a card', () => {
    registerCards([makeCard({ id: 'cheap', cost: 1 })]);
    const game = makeGame({ phase: 'actions' });
    game.players.p1.hand = ['cheap'];
    game.players.p1.power = 2;
    const rec = suggestMove(game, 'p1');
    expect(rec?.action.kind).toBe('playCard');
    if (rec?.action.kind === 'playCard') expect(rec.action.cardId).toBe('cheap');
  });

  it('falls back to endTurn when no actions look productive', () => {
    const game = makeGame({ phase: 'actions' });
    // No cards in hand, no power, no special board state — used all icons.
    game.players.p1.power = 0;
    game.players.p1.hand = [];
    game.usedIcons = [
      { location: 0, iconIndex: 0 },
      { location: 0, iconIndex: 1 },
      { location: 0, iconIndex: 2 },
      { location: 0, iconIndex: 3 },
    ];
    const rec = suggestMove(game, 'p1');
    expect(rec?.action.kind).toBe('endTurn');
  });
});
