// Deck composition guardrails. These lock in the rulebook-published card
// counts so a future edit to deck.ts can't silently change them.
//
// Sources: Marvel Villainous: Infinite Power rulebook (Setup §3, Components);
// per-card infoboxes from the Marvel Villainous Wiki.

import { describe, expect, it } from 'vitest';
import { thanosDeck } from '../../src/engine/villains/thanos/deck';
import { thanosFateDeck } from '../../src/engine/villains/thanos/fateDeck';
import { commonFateDeck } from '../../src/engine/villains/common/fateDeck';
import type { CardDef, CardType } from '../../src/engine/types';

function countByType(cards: CardDef[], type: CardType): number {
  return cards.filter((c) => c.type === type).length;
}

describe('Thanos villain deck (30 cards)', () => {
  it('has exactly 30 cards', () => {
    expect(thanosDeck).toHaveLength(30);
  });

  it('splits into 10 Allies, 16 Effects, 4 Items', () => {
    expect(countByType(thanosDeck, 'ally')).toBe(10);
    expect(countByType(thanosDeck, 'effect')).toBe(16);
    expect(countByType(thanosDeck, 'item')).toBe(4);
  });

  it('every card has empty `name` (project §0 — no proprietary content)', () => {
    for (const c of thanosDeck) expect(c.name).toBe('');
  });

  it('every Ally has a positive Strength', () => {
    for (const c of thanosDeck.filter((c) => c.type === 'ally')) {
      expect(typeof c.strength).toBe('number');
      expect((c.strength ?? 0) >= 1).toBe(true);
    }
  });
});

describe('Thanos villain Fate deck (11 cards)', () => {
  it('has exactly 11 cards', () => {
    expect(thanosFateDeck).toHaveLength(11);
  });

  it('splits into 4 Heroes, 6 fateEffects, 1 Event', () => {
    expect(countByType(thanosFateDeck, 'hero')).toBe(4);
    expect(countByType(thanosFateDeck, 'fateEffect')).toBe(6);
    expect(countByType(thanosFateDeck, 'event')).toBe(1);
  });

  it('every Hero has a positive Strength', () => {
    for (const c of thanosFateDeck.filter((c) => c.type === 'hero')) {
      expect((c.strength ?? 0) >= 1).toBe(true);
    }
  });

  it('every card has empty `name`', () => {
    for (const c of thanosFateDeck) expect(c.name).toBe('');
  });
});

describe('Common Fate deck (15 cards)', () => {
  it('has exactly 15 cards', () => {
    expect(commonFateDeck).toHaveLength(15);
  });

  it('splits into 11 Heroes and 4 Events', () => {
    expect(countByType(commonFateDeck, 'hero')).toBe(11);
    expect(countByType(commonFateDeck, 'event')).toBe(4);
  });

  it('every card is in the shared common pool, not a villain-specific one', () => {
    for (const c of commonFateDeck) expect(c.villain).toBe('fate-common');
  });

  it('every card has empty `name`', () => {
    for (const c of commonFateDeck) expect(c.name).toBe('');
  });
});
