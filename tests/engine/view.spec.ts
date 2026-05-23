import { describe, expect, it } from 'vitest';
import { view } from '../../src/engine/view';
import type {
  GameState,
  Location,
  PlayerId,
  PlayerState,
  Realm,
  VillainKey,
} from '../../src/engine/types';

function makeLocation(idx: number): Location {
  return {
    id: `loc-${idx}`,
    name: `Location ${idx}`,
    topIcons: ['gainPower', 'play'],
    bottomIcons: ['move', 'fate'],
    heroesPresent: [],
    alliesPresent: [],
    itemsPresent: [],
    conditions: [],
  };
}

function makeRealm(villain: VillainKey): Realm {
  return {
    villain,
    locations: [makeLocation(0), makeLocation(1), makeLocation(2), makeLocation(3)],
    villainTokenAt: 0,
  };
}

function makePlayer(id: PlayerId, villain: VillainKey): PlayerState {
  return {
    id,
    villain,
    power: id === 'p1' ? 3 : 5,
    hand: [`${id}-hand-secret`],
    deck: [`${id}-deck-secret`, `${id}-deck-secret-2`],
    discard: [`${id}-discard-public`],
    realm: makeRealm(villain),
    flags: { sampleCounter: 2, sampleList: ['a', 'b'] },
    objectiveProgress: { completed: false, steps: { stones: 0 } },
    mustMoveDifferent: true,
  };
}

function makeState(): GameState {
  return {
    seed: 12345,
    rngCursor: 0,
    turn: 1,
    activePlayer: 'p1',
    phase: 'actions',
    players: {
      p1: makePlayer('p1', 'thanos'),
      p2: makePlayer('p2', 'hela'),
      p3: makePlayer('p3', 'ultron'),
      p4: makePlayer('p4', 'killmonger'),
    },
    playerOrder: ['p1', 'p2'],
    log: [{ turn: 1, player: 'p1', message: 'game started' }],
    winner: null,
    pendingPrompt: null,
    pendingTriggers: [],
    usedIcons: [],
    instanceCounter: 0,
    // Single shared Fate deck (rulebook Setup §3).
    fateDeck: ['fate-deck-secret-1', 'fate-deck-secret-2'],
    fateDiscard: ['fate-discard-public'],
    globalEvent: null,
  };
}

describe('view()', () => {
  it('round-trips public zones losslessly through JSON', () => {
    const v = view(makeState(), 'p1');
    const roundTripped = JSON.parse(JSON.stringify(v)) as unknown;
    expect(roundTripped).toEqual(v);
  });

  it("shows the viewing player's own hand", () => {
    const v = view(makeState(), 'p1');
    expect(v.self.perspective).toBe('self');
    expect(v.self.hand).toEqual(['p1-hand-secret']);
  });

  it("hides opponents' hands, exposing only a count", () => {
    const v = view(makeState(), 'p1');
    expect(v.opponents).toHaveLength(1);
    const [opp] = v.opponents;
    expect(opp).toBeDefined();
    expect(opp?.id).toBe('p2');
    expect(opp?.handCount).toBe(1);
    expect(opp).not.toHaveProperty('hand');
  });

  it('hides per-player deck order and the shared Fate-deck order, exposing only counts', () => {
    const v = view(makeState(), 'p1');
    // Per-player villain decks: counts only, no ordered arrays.
    expect(v.self).not.toHaveProperty('deck');
    expect(v.self.deckCount).toBe(2);
    const [opp] = v.opponents;
    expect(opp).not.toHaveProperty('deck');
    expect(opp?.deckCount).toBe(2);
    // Shared Fate deck (rulebook Setup §3): one count for the whole game.
    expect(v.fate.deckCount).toBe(2);
    // Per-player fields no longer expose a fate deck.
    expect(v.self).not.toHaveProperty('fateDeck');
    expect(v.self).not.toHaveProperty('fateDeckCount');
  });

  it('provably leaks no hidden card identity into the serialized view', () => {
    const serialized = JSON.stringify(view(makeState(), 'p1'));
    // Opponent's hand and every deck card (own and shared) must be absent.
    expect(serialized).not.toContain('p2-hand-secret');
    expect(serialized).not.toContain('p1-deck-secret');
    expect(serialized).not.toContain('p2-deck-secret');
    expect(serialized).not.toContain('fate-deck-secret');
    // Public information that SHOULD survive the projection.
    expect(serialized).toContain('p1-hand-secret'); // own hand
    expect(serialized).toContain('p1-discard-public'); // own discard
    expect(serialized).toContain('p2-discard-public'); // opponent discard is face-up
    expect(serialized).toContain('fate-discard-public'); // shared Fate discard is face-up
  });

  it('keeps discard pile contents visible (they are face-up at the table)', () => {
    const v = view(makeState(), 'p1');
    const [opp] = v.opponents;
    expect(opp?.discard).toEqual(['p2-discard-public']);
    expect(v.fate.discard).toEqual(['fate-discard-public']);
  });

  it('does not share mutable references with the source state', () => {
    const state = makeState();
    const v = view(state, 'p1');
    v.self.hand.push('mutated');
    v.self.realm.locations[0].name = 'mutated';
    const p1 = state.players.p1;
    expect(p1?.hand).toEqual(['p1-hand-secret']);
    expect(p1?.realm.locations[0]?.name).toBe('Location 0');
  });
});
