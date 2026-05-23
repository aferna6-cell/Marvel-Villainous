// Deck composition guardrails. These lock in the rulebook-published card
// counts so a future edit to deck.ts can't silently change them.
//
// Sources: Marvel Villainous: Infinite Power rulebook (Setup §3, Components);
// per-card infoboxes from the Marvel Villainous Wiki.

import { describe, expect, it } from 'vitest';
import { thanosDeck } from '../../src/engine/villains/thanos/deck';
import { thanosFateDeck } from '../../src/engine/villains/thanos/fateDeck';
import { helaDeck } from '../../src/engine/villains/hela/deck';
import { helaFateDeck } from '../../src/engine/villains/hela/fateDeck';
import { killmongerDeck } from '../../src/engine/villains/killmonger/deck';
import { killmongerFateDeck } from '../../src/engine/villains/killmonger/fateDeck';
import { ultronDeck } from '../../src/engine/villains/ultron/deck';
import { ultronFateDeck } from '../../src/engine/villains/ultron/fateDeck';
import { taskmasterDeck } from '../../src/engine/villains/taskmaster/deck';
import { taskmasterFateDeck } from '../../src/engine/villains/taskmaster/fateDeck';
import { commonFateDeck } from '../../src/engine/villains/common/fateDeck';
import type { CardDef, CardType } from '../../src/engine/types';

function countByType(cards: CardDef[], type: CardType): number {
  return cards.filter((c) => c.type === type).length;
}

/** Every CardDef must keep `name: ''` and have no `text` field per §0. */
function expectNoProprietaryContent(deck: CardDef[]): void {
  for (const c of deck) {
    expect(c.name).toBe('');
    expect(c.text).toBeUndefined();
  }
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

describe('Hela villain deck (30 cards)', () => {
  it('has exactly 30 cards', () => {
    expect(helaDeck).toHaveLength(30);
  });
  it('splits into 11 Allies, 14 Effects, 2 Items, 3 Specialties', () => {
    expect(countByType(helaDeck, 'ally')).toBe(11);
    expect(countByType(helaDeck, 'effect')).toBe(14);
    expect(countByType(helaDeck, 'item')).toBe(2);
    expect(countByType(helaDeck, 'specialty')).toBe(3);
  });
  it('keeps proprietary content out of the repo', () => {
    expectNoProprietaryContent(helaDeck);
  });
});

describe('Hela villain Fate deck (11 cards)', () => {
  it('has exactly 11 cards', () => {
    expect(helaFateDeck).toHaveLength(11);
  });
  it('splits into 5 Heroes, 4 fateEffects, 1 Event, 1 Item', () => {
    expect(countByType(helaFateDeck, 'hero')).toBe(5);
    expect(countByType(helaFateDeck, 'fateEffect')).toBe(4);
    expect(countByType(helaFateDeck, 'event')).toBe(1);
    expect(countByType(helaFateDeck, 'item')).toBe(1);
  });
  it('keeps proprietary content out of the repo', () => {
    expectNoProprietaryContent(helaFateDeck);
  });
});

describe('Killmonger villain deck (30 cards)', () => {
  it('has exactly 30 cards', () => {
    expect(killmongerDeck).toHaveLength(30);
  });
  it('splits into 7 Allies, 9 Effects, 10 Items, 4 Specialties', () => {
    expect(countByType(killmongerDeck, 'ally')).toBe(7);
    expect(countByType(killmongerDeck, 'effect')).toBe(9);
    expect(countByType(killmongerDeck, 'item')).toBe(10);
    expect(countByType(killmongerDeck, 'specialty')).toBe(4);
  });
  it('keeps proprietary content out of the repo', () => {
    expectNoProprietaryContent(killmongerDeck);
  });
});

describe('Killmonger villain Fate deck (11 cards)', () => {
  it('has exactly 11 cards', () => {
    expect(killmongerFateDeck).toHaveLength(11);
  });
  it('splits into 8 Heroes, 2 fateEffects, 1 Event', () => {
    expect(countByType(killmongerFateDeck, 'hero')).toBe(8);
    expect(countByType(killmongerFateDeck, 'fateEffect')).toBe(2);
    expect(countByType(killmongerFateDeck, 'event')).toBe(1);
  });
  it('keeps proprietary content out of the repo', () => {
    expectNoProprietaryContent(killmongerFateDeck);
  });
});

describe('Ultron villain deck (30 cards)', () => {
  it('has exactly 30 cards', () => {
    expect(ultronDeck).toHaveLength(30);
  });
  it('splits into 13 Allies, 11 Effects, 6 Items', () => {
    expect(countByType(ultronDeck, 'ally')).toBe(13);
    expect(countByType(ultronDeck, 'effect')).toBe(11);
    expect(countByType(ultronDeck, 'item')).toBe(6);
  });
  it('keeps proprietary content out of the repo', () => {
    expectNoProprietaryContent(ultronDeck);
  });
});

describe('Ultron villain Fate deck (11 cards)', () => {
  it('has exactly 11 cards', () => {
    expect(ultronFateDeck).toHaveLength(11);
  });
  it('splits into 5 Heroes, 3 fateEffects, 2 Items, 1 Event', () => {
    expect(countByType(ultronFateDeck, 'hero')).toBe(5);
    expect(countByType(ultronFateDeck, 'fateEffect')).toBe(3);
    expect(countByType(ultronFateDeck, 'item')).toBe(2);
    expect(countByType(ultronFateDeck, 'event')).toBe(1);
  });
  it('keeps proprietary content out of the repo', () => {
    expectNoProprietaryContent(ultronFateDeck);
  });
});

describe('Taskmaster villain deck (30 cards)', () => {
  it('has exactly 30 cards', () => {
    expect(taskmasterDeck).toHaveLength(30);
  });
  it('splits into 10 Allies, 10 Effects, 8 Items, 2 Specialties', () => {
    expect(countByType(taskmasterDeck, 'ally')).toBe(10);
    expect(countByType(taskmasterDeck, 'effect')).toBe(10);
    expect(countByType(taskmasterDeck, 'item')).toBe(8);
    expect(countByType(taskmasterDeck, 'specialty')).toBe(2);
  });
  it('keeps proprietary content out of the repo', () => {
    expectNoProprietaryContent(taskmasterDeck);
  });
});

describe('Taskmaster villain Fate deck (11 cards)', () => {
  it('has exactly 11 cards', () => {
    expect(taskmasterFateDeck).toHaveLength(11);
  });
  it('splits into 6 Heroes, 4 fateEffects, 1 Event', () => {
    expect(countByType(taskmasterFateDeck, 'hero')).toBe(6);
    expect(countByType(taskmasterFateDeck, 'fateEffect')).toBe(4);
    expect(countByType(taskmasterFateDeck, 'event')).toBe(1);
  });
  it('keeps proprietary content out of the repo', () => {
    expectNoProprietaryContent(taskmasterFateDeck);
  });
});
