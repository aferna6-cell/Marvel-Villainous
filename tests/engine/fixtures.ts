// Shared test fixtures. Not a `.spec.ts` file, so Vitest does not collect it
// as a suite — it is imported by the engine specs.

import type {
  CardDef,
  GameState,
  InPlayCard,
  Location,
  PlayerId,
  PlayerState,
  Realm,
  VillainKey,
} from '../../src/engine/types';

export function makeLocation(idx: number, opts: Partial<Location> = {}): Location {
  return {
    id: `loc-${idx}`,
    name: `Location ${idx}`,
    topIcons: ['gainPower', 'play'],
    bottomIcons: ['move', 'fate'],
    heroesPresent: [],
    alliesPresent: [],
    itemsPresent: [],
    conditions: [],
    ...opts,
  };
}

export function makeRealm(
  villain: VillainKey,
  locations?: [Location, Location, Location, Location],
): Realm {
  return {
    villain,
    locations: locations ?? [
      makeLocation(0),
      makeLocation(1),
      makeLocation(2),
      makeLocation(3),
    ],
    villainTokenAt: 0,
  };
}

export function makePlayer(
  id: PlayerId,
  villain: VillainKey,
  overrides: Partial<PlayerState> = {},
): PlayerState {
  return {
    id,
    villain,
    power: 0,
    hand: [],
    deck: [],
    discard: [],
    realm: makeRealm(villain),
    flags: {},
    objectiveProgress: { completed: false, steps: {} },
    mustMoveDifferent: true,
    ...overrides,
  };
}

export function makeGame(overrides: Partial<GameState> = {}): GameState {
  return {
    seed: 1,
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
    log: [],
    winner: null,
    pendingPrompt: null,
    pendingTriggers: [],
    usedIcons: [],
    instanceCounter: 0,
    strictIconMode: false,
    fateDeck: [],
    fateDiscard: [],
    globalEvent: null,
    ...overrides,
  };
}

export function makeInPlay(cardId: string, instanceId = `inst-${cardId}`): InPlayCard {
  return { instanceId, cardId, strengthModifier: 0, tokens: {} };
}

export function makeCard(overrides: Partial<CardDef> & { id: string }): CardDef {
  return {
    villain: 'thanos',
    name: '',
    type: 'effect',
    cost: 0,
    effects: [],
    icons: [],
    ...overrides,
  };
}

/** Recursively freeze an object so any in-place mutation throws. */
export function deepFreeze<T>(obj: T): T {
  if (obj !== null && typeof obj === 'object') {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      deepFreeze(value);
    }
    Object.freeze(obj);
  }
  return obj;
}
